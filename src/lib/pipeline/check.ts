import { runToolLoop } from "@/lib/bharatcode/agent";
import type { BharatCodeClient } from "@/lib/bharatcode/client";
import { requestStructured } from "@/lib/bharatcode/structured";
import type { InputContent } from "@/lib/bharatcode/types";
import type { ScamPattern } from "@/lib/domain/enums";
import { MessageCheckExtraction } from "@/lib/domain/extraction";
import { combineVerdicts, detectSignals, verdictFromSignals, type RuleSignal, type Verdict } from "@/lib/engine/rules";
import { allTools } from "@/lib/tools";
import { checkEmail, checkPhone, checkUpiId } from "@/lib/validators";
import { inspectLink } from "@/lib/validators/url";
import { toPipelineEvent, type PipelineEvent } from "./events";
import { CHECK_FINAL, CHECK_INSTRUCTIONS } from "./prompts";

export interface CheckInput {
  text: string;
  images: string[];
}

export interface IdentifierFinding {
  kind: string;
  value: string;
  label: string;
  notes: string[];
  risky: boolean;
}

export interface MessageCheckResult {
  verdict: Verdict;
  ruleVerdict: Verdict;
  aiVerdict: Verdict | null;
  aiUsed: boolean;
  ruleSignals: RuleSignal[];
  aiSignals: Array<{ signal: string; quote: string }>;
  pattern: ScamPattern;
  claimedSender: string | null;
  transcript: string;
  explanation: string | null;
  identifiers: IdentifierFinding[];
  model: string | null;
  /** True when the rule signals were found in the AI's transcript of a screenshot, not in typed text. */
  rulesUsedAiTranscript: boolean;
}

function inspectIdentifiers(list: Array<{ kind: string; value: string }>): IdentifierFinding[] {
  const seen = new Set<string>();
  const out: IdentifierFinding[] = [];
  for (const { kind, value } of list) {
    const key = `${kind}:${value.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (kind === "url") {
      const r = inspectLink(value);
      out.push({ kind, value, label: r.valid ? `Link to ${r.registrableDomain}` : "Not a valid link", notes: r.notes, risky: r.risk === "high" || r.risk === "medium" });
    } else if (kind === "upi_id") {
      const r = checkUpiId(value);
      out.push({ kind, value, label: r.label, notes: r.notes, risky: r.flags.length > 0 });
    } else if (kind === "phone") {
      const r = checkPhone(value);
      out.push({ kind, value, label: r.label, notes: r.notes, risky: r.flags.includes("international") });
    } else if (kind === "email") {
      const r = checkEmail(value);
      out.push({ kind, value, label: r.label, notes: r.notes, risky: r.flags.length > 0 });
    }
  }
  return out;
}

/** Rules only: works with no API key, on typed text. */
export function checkWithRules(text: string): MessageCheckResult {
  const ruleSignals = detectSignals(text);
  const ruleVerdict = verdictFromSignals(ruleSignals);
  const ids = [
    ...Array.from(text.matchAll(/\b[a-z0-9._-]{2,256}@[a-z][a-z0-9.]{1,63}\b/gi), (m) => ({ kind: /\.[a-z]{2,}$/i.test(m[0]) ? "email" : "upi_id", value: m[0] })),
    ...Array.from(text.matchAll(/https?:\/\/\S+/gi), (m) => ({ kind: "url", value: m[0].replace(/[).,]+$/, "") })),
  ];
  return {
    verdict: ruleVerdict,
    ruleVerdict,
    aiVerdict: null,
    aiUsed: false,
    ruleSignals,
    aiSignals: [],
    pattern: "unknown",
    claimedSender: null,
    transcript: text,
    explanation: null,
    identifiers: inspectIdentifiers(ids),
    model: null,
    rulesUsedAiTranscript: false,
  };
}

export async function checkMessage(
  client: BharatCodeClient,
  input: CheckInput,
  opts: { now: Date; signal?: AbortSignal; onEvent?: (e: PipelineEvent) => void },
): Promise<MessageCheckResult> {
  const emit = (e: PipelineEvent | null) => e && opts.onEvent?.(e);
  emit({ type: "status", message: `Reading the message with BharatCode (${client.model})…` });

  const content: InputContent[] = [
    { type: "input_text", text: `Suspicious message as pasted by the person (may be empty):\n<<<\n${input.text.trim() || "(none)"}\n>>>\nScreenshots: ${input.images.length}.` },
  ];
  input.images.forEach((url, i) => {
    content.push({ type: "input_text", text: `Screenshot ${i + 1}:` });
    content.push({ type: "input_image", image_url: url, detail: "high" });
  });

  const loop = await runToolLoop({
    client,
    instructions: CHECK_INSTRUCTIONS,
    input: [{ role: "user", content }],
    tools: allTools(opts.now),
    maxRounds: 4,
    maxToolCalls: 12,
    maxOutputTokens: 3_000,
    signal: opts.signal,
    onProgress: (e) => emit(toPipelineEvent(e)),
  });
  const { data } = await requestStructured({
    client,
    instructions: CHECK_INSTRUCTIONS,
    items: [...loop.items, { role: "user", content: CHECK_FINAL }],
    schema: MessageCheckExtraction,
    name: "message_check",
    maxOutputTokens: 4_000,
    signal: opts.signal,
    onProgress: (e) => emit(toPipelineEvent(e)),
  });

  // Rules run on what the person typed plus the AI's transcript of any screenshot.
  const typed = input.text.trim();
  const ruleText = [typed, data.transcript].filter(Boolean).join("\n");
  const ruleSignals = detectSignals(ruleText);
  const ruleVerdict = verdictFromSignals(ruleSignals);
  const typedSignals = typed ? detectSignals(typed).map((s) => s.id) : [];
  return {
    verdict: combineVerdicts(ruleVerdict, data.verdict),
    ruleVerdict,
    aiVerdict: data.verdict,
    aiUsed: true,
    ruleSignals,
    aiSignals: data.signals,
    pattern: data.scam_type,
    claimedSender: data.claimed_sender,
    transcript: data.transcript,
    explanation: data.explanation,
    identifiers: inspectIdentifiers(data.suspect_identifiers.map((i) => ({ kind: i.kind, value: i.value }))),
    model: client.model,
    rulesUsedAiTranscript: ruleSignals.some((s) => !typedSignals.includes(s.id)),
  };
}
