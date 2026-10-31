import type { z } from "zod";
import { toStrictJsonSchema } from "@/lib/domain/json-schema";
import type { BharatCodeClient, ProgressEvent } from "./client";
import { BharatCodeError } from "./errors";
import type { InputItem } from "./types";
import { outputText } from "./types";

export interface StructuredOptions<T> {
  client: BharatCodeClient;
  instructions: string;
  /** Replayed transcript (e.g. from runToolLoop) plus the final request message. */
  items: InputItem[];
  schema: z.ZodType<T>;
  name: string;
  maxOutputTokens?: number;
  signal?: AbortSignal;
  onProgress?: (e: ProgressEvent | { type: "structured"; note: string }) => void;
}

export interface StructuredResult<T> {
  data: T;
  requestIds: string[];
  /** True if the API rejected text.format and JSON had to be requested in plain text. */
  usedFallback: boolean;
  /** True if a repair round was needed to fix validation errors. */
  repaired: boolean;
}

const MAX_BUDGET = 16_000;

/** Pulls the first JSON object out of model text, tolerating ```json fences and surrounding prose. */
export function extractJson(text: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const candidate = fenced ? fenced[1]! : text;
  const start = candidate.indexOf("{");
  if (start === -1) throw new Error("no JSON object found");
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return JSON.parse(candidate.slice(start, i + 1));
  }
  throw new Error("unterminated JSON object");
}

/**
 * Asks for output matching a zod schema using `text.format` (strict JSON Schema).
 * Falls back to plain-text JSON if the API rejects text.format with a 400, retries an
 * output-budget cut-off once with a doubled budget (never the same budget), and runs at most
 * one repair round when the JSON fails validation.
 */
export async function requestStructured<T>(opts: StructuredOptions<T>): Promise<StructuredResult<T>> {
  const jsonSchema = toStrictJsonSchema(opts.schema);
  const requestIds: string[] = [];
  let usedFallback = false;
  let repaired = false;
  let budget = opts.maxOutputTokens ?? 6_000;
  let items = [...opts.items];

  const call = async (): Promise<string> => {
    for (let budgetRetry = 0; ; budgetRetry++) {
      const fallbackNote = `Respond with exactly one JSON object and nothing else. It must match this JSON Schema:\n${JSON.stringify(jsonSchema)}`;
      try {
        const { response, requestId } = await opts.client.createResponse(
          {
            instructions: usedFallback ? `${opts.instructions}\n\n${fallbackNote}` : opts.instructions,
            input: items,
            ...(usedFallback ? {} : { text: { format: { type: "json_schema", name: opts.name, schema: jsonSchema, strict: true } } }),
            max_output_tokens: budget,
            reasoning: { effort: "low" },
          },
          { signal: opts.signal, onProgress: opts.onProgress },
        );
        if (requestId) requestIds.push(requestId);
        const text = outputText(response);
        if (response.status === "incomplete") {
          const reason = response.incomplete_details?.reason ?? "unknown";
          if (reason === "max_output_tokens" && budgetRetry === 0 && budget < MAX_BUDGET) {
            budget = Math.min(budget * 2, MAX_BUDGET);
            opts.onProgress?.({ type: "structured", note: `Answer was cut off; retrying once with a larger budget (${budget} tokens).` });
            continue;
          }
          throw new BharatCodeError("incomplete", { requestId, detail: `incomplete: ${reason}`, partial: text });
        }
        return text;
      } catch (err) {
        if (err instanceof BharatCodeError && err.kind === "bad_request" && !usedFallback) {
          usedFallback = true;
          opts.onProgress?.({ type: "structured", note: "Structured output not accepted; asking for plain JSON instead." });
          continue;
        }
        throw err;
      }
    }
  };

  let text = await call();
  for (let attempt = 0; attempt < 2; attempt++) {
    let issues: string;
    try {
      const parsed = opts.schema.safeParse(extractJson(text));
      if (parsed.success) return { data: parsed.data, requestIds, usedFallback, repaired };
      issues = parsed.error.issues
        .slice(0, 12)
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("\n");
    } catch (e) {
      issues = e instanceof Error ? e.message : "could not parse JSON";
    }
    if (attempt === 1) {
      throw new BharatCodeError("invalid_output", { requestId: requestIds.at(-1) ?? null, detail: issues, partial: text });
    }
    repaired = true;
    opts.onProgress?.({ type: "structured", note: "Fixing the answer's format." });
    items = [
      ...items,
      { role: "assistant", content: text.slice(0, 20_000) },
      { role: "user", content: `That JSON did not pass validation:\n${issues}\nReply with the corrected JSON object only.` },
    ];
    text = await call();
  }
  throw new BharatCodeError("invalid_output", { detail: "unreachable" });
}
