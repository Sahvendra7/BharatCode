import { runToolLoop } from "@/lib/bharatcode/agent";
import type { BharatCodeClient } from "@/lib/bharatcode/client";
import { requestStructured } from "@/lib/bharatcode/structured";
import type { InputContent, InputItem } from "@/lib/bharatcode/types";
import type { Case } from "@/lib/domain/case";
import type { Tri } from "@/lib/domain/enums";
import { IncidentExtraction } from "@/lib/domain/extraction";
import { allTools } from "@/lib/tools";
import { toPipelineEvent, type PipelineEvent } from "./events";
import { extractionToCase, type PostprocessWarning } from "./postprocess";
import { ANALYZE_FINAL, ANALYZE_INSTRUCTIONS, contextHeader } from "./prompts";

export interface AnalyzeInput {
  story: string;
  /** Data URLs already validated by the route. */
  images: string[];
  paid: Tri;
  discoveredAt: string | null;
}

export interface AnalyzeOutput {
  case: Case;
  warnings: PostprocessWarning[];
  model: string;
  usedFallback: boolean;
  repaired: boolean;
  toolCalls: number;
}

export function buildUserMessage(input: AnalyzeInput, now: Date): InputItem {
  const content: InputContent[] = [
    {
      type: "input_text",
      text: `${contextHeader(now, input.paid, input.discoveredAt)}\n\nThe person's story (may be empty):\n<<<\n${input.story.trim() || "(no story written)"}\n>>>\n\nNumber of screenshots: ${input.images.length}.`,
    },
  ];
  input.images.forEach((url, i) => {
    content.push({ type: "input_text", text: `Screenshot ${i + 1}:` });
    content.push({ type: "input_image", image_url: url, detail: "high" });
  });
  return { role: "user", content };
}

/** Phase A (tool-using reading) then Phase B (strict structured extraction), then deterministic post-processing. */
export async function analyzeIncident(
  client: BharatCodeClient,
  input: AnalyzeInput,
  opts: { now: Date; signal?: AbortSignal; onEvent?: (e: PipelineEvent) => void },
): Promise<AnalyzeOutput> {
  const emit = (e: PipelineEvent | null) => e && opts.onEvent?.(e);
  emit({ type: "status", message: `Reading your evidence with BharatCode (${client.model})…` });

  const loop = await runToolLoop({
    client,
    instructions: ANALYZE_INSTRUCTIONS,
    input: [buildUserMessage(input, opts.now)],
    tools: allTools(opts.now),
    maxRounds: 5,
    maxToolCalls: 16,
    maxOutputTokens: 4_000,
    signal: opts.signal,
    onProgress: (e) => emit(toPipelineEvent(e)),
  });
  if (loop.stoppedBecause === "incomplete") {
    emit({ type: "note", message: "The reading step was cut off; continuing with what was found." });
  }

  emit({ type: "status", message: "Organising the facts…" });
  const structured = await requestStructured({
    client,
    instructions: ANALYZE_INSTRUCTIONS,
    items: [...loop.items, { role: "user", content: ANALYZE_FINAL }],
    schema: IncidentExtraction,
    name: "incident_extraction",
    maxOutputTokens: 6_000,
    signal: opts.signal,
    onProgress: (e) => emit(toPipelineEvent(e)),
  });

  const { case: c, warnings } = extractionToCase(structured.data, {
    story: input.story,
    imageCount: input.images.length,
    discoveredAt: input.discoveredAt,
    requestIds: [...loop.requestIds, ...structured.requestIds],
  });
  if (input.paid !== "unknown" && c.paid === "unknown") c.paid = input.paid;
  emit({ type: "status", message: "Checking every number against your evidence…" });
  return {
    case: c,
    warnings,
    model: client.model,
    usedFallback: structured.usedFallback,
    repaired: structured.repaired,
    toolCalls: loop.traces.length,
  };
}
