import type { z } from "zod";
import type { BharatCodeClient, ProgressEvent } from "./client";
import type { FunctionCallItem, FunctionTool, InputItem, OutputItem, ResponseObject } from "./types";
import { isFunctionCall, outputText } from "./types";

/** An application-side tool. BharatCode never executes tools: this code does, after validating arguments. */
export interface AppTool<Args = unknown> {
  name: string;
  description: string;
  args: z.ZodType<Args>;
  parameters: Record<string, unknown>;
  run(args: Args): unknown;
  /** One short line for the progress trace shown to the person, e.g. "UPI ID x@y: valid format". */
  summarize(args: Args, result: unknown): string;
}

export function toolDefinition(tool: AppTool<never>): FunctionTool {
  return { type: "function", name: tool.name, description: tool.description, parameters: tool.parameters, strict: true };
}

export interface ToolTrace {
  name: string;
  ok: boolean;
  summary: string;
}

export type LoopProgress = ProgressEvent | { type: "tool"; trace: ToolTrace } | { type: "round"; round: number };

export interface ToolLoopResult {
  /** Full replayable transcript: original input, every output item, and every function_call_output. */
  items: InputItem[];
  rounds: number;
  traces: ToolTrace[];
  finalText: string;
  requestIds: string[];
  stoppedBecause: "done" | "max_rounds" | "incomplete";
}

export interface ToolLoopOptions {
  client: BharatCodeClient;
  instructions: string;
  input: InputItem[];
  tools: Array<AppTool<never>>;
  maxRounds?: number;
  maxToolCalls?: number;
  maxOutputTokens?: number;
  signal?: AbortSignal;
  onProgress?: (e: LoopProgress) => void;
}

/**
 * Runs the model with app-side tools until it stops calling them.
 * Rules from BharatCode's docs: replay the whole history each turn (stateless, store:false),
 * resend tool definitions, answer each call with a function_call_output carrying the same call_id and
 * a string output, and never execute tool calls from an incomplete response.
 */
export async function runToolLoop(opts: ToolLoopOptions): Promise<ToolLoopResult> {
  const maxRounds = opts.maxRounds ?? 5;
  const maxToolCalls = opts.maxToolCalls ?? 16;
  const byName = new Map(opts.tools.map((t) => [t.name, t]));
  const definitions = opts.tools.map(toolDefinition);
  const items: InputItem[] = [...opts.input];
  const traces: ToolTrace[] = [];
  const requestIds: string[] = [];
  let toolCalls = 0;
  let lastText = "";

  for (let round = 1; round <= maxRounds; round++) {
    opts.onProgress?.({ type: "round", round });
    const { response, requestId } = await opts.client.createResponse(
      {
        instructions: opts.instructions,
        input: items,
        tools: definitions,
        tool_choice: "auto",
        max_output_tokens: opts.maxOutputTokens ?? 4_000,
        reasoning: { effort: "low" },
      },
      { signal: opts.signal, onProgress: opts.onProgress },
    );
    if (requestId) requestIds.push(requestId);
    lastText = outputText(response) || lastText;

    if (response.status !== "completed") {
      // Keep any text, drop every function call: an incomplete response's calls must not run.
      items.push(...withoutFunctionCalls(response.output));
      return { items, rounds: round, traces, finalText: lastText, requestIds, stoppedBecause: "incomplete" };
    }

    const calls = response.output.filter(isFunctionCall);
    const runnable = calls.filter((c) => c.status === undefined || c.status === "completed");
    // Calls that did not complete are removed from the transcript so no call is left without an output.
    items.push(...response.output.filter((o) => !isFunctionCall(o) || runnable.includes(o)));
    if (!runnable.length) {
      return { items, rounds: round, traces, finalText: lastText, requestIds, stoppedBecause: "done" };
    }

    for (const call of runnable) {
      const output = executeCall(call, byName, toolCalls >= maxToolCalls, traces);
      toolCalls++;
      items.push({ type: "function_call_output", call_id: call.call_id, output });
      opts.onProgress?.({ type: "tool", trace: traces[traces.length - 1]! });
    }
  }
  return { items, rounds: maxRounds, traces, finalText: lastText, requestIds, stoppedBecause: "max_rounds" };
}

function withoutFunctionCalls(output: OutputItem[]): OutputItem[] {
  return output.filter((o) => !isFunctionCall(o));
}

function executeCall(
  call: FunctionCallItem,
  tools: Map<string, AppTool<never>>,
  overBudget: boolean,
  traces: ToolTrace[],
): string {
  const fail = (message: string) => {
    traces.push({ name: call.name, ok: false, summary: message });
    return JSON.stringify({ error: message });
  };
  if (overBudget) return fail("Tool budget for this request is used up. Continue with what you have.");
  const tool = tools.get(call.name);
  if (!tool) return fail(`Unknown tool "${call.name}".`);
  let raw: unknown;
  try {
    raw = JSON.parse(call.arguments || "{}");
  } catch {
    return fail(`Arguments for ${call.name} were not valid JSON.`);
  }
  const parsed = tool.args.safeParse(raw);
  if (!parsed.success) {
    return fail(`Invalid arguments for ${call.name}: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
  }
  try {
    const result = tool.run(parsed.data as never);
    traces.push({ name: call.name, ok: true, summary: tool.summarize(parsed.data as never, result) });
    return JSON.stringify(result);
  } catch (err) {
    return fail(`${call.name} failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export type { ResponseObject };
