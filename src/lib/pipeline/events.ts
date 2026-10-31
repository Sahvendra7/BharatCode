import type { LoopProgress } from "@/lib/bharatcode/agent";

/** Progress events streamed to the browser while BharatCode works. Plain data only, no model internals. */
export type PipelineEvent =
  | { type: "status"; message: string }
  | { type: "queued" }
  | { type: "retry"; message: string }
  | { type: "tool"; name: string; ok: boolean; summary: string }
  | { type: "note"; message: string };

export function toPipelineEvent(e: LoopProgress | { type: "structured"; note: string }): PipelineEvent | null {
  switch (e.type) {
    case "queued":
      return { type: "queued" };
    case "retry": {
      const why = e.reason === "busy" ? "BharatCode is busy" : e.reason === "rate_limited" ? "Rate limited" : e.reason === "network" ? "Connection problem" : "Server problem";
      return { type: "retry", message: `${why}. Retrying in ${Math.round(e.waitMs / 1000)} s.` };
    }
    case "tool":
      return { type: "tool", name: e.trace.name, ok: e.trace.ok, summary: e.trace.summary };
    case "structured":
      return { type: "note", message: e.note };
    default:
      return null;
  }
}
