import type { PipelineEvent } from "@/lib/pipeline/events";

/** Live view of what BharatCode and Turant's tools are doing. Makes the AI's work visible and checkable. */
export function Trace({ events, running }: { events: PipelineEvent[]; running: boolean }) {
  const queued = events.some((e) => e.type === "queued");
  const visible = events.filter((e) => e.type !== "queued");
  return (
    <div aria-live="polite">
      {queued && running && (
        <p className="hint">
          <span className="pulse">●</span> Waiting in BharatCode&apos;s shared queue. Busy times can take a minute.
        </p>
      )}
      <ul className="trace">
        {visible.map((e, i) => {
          if (e.type === "tool") {
            return (
              <li key={i} className={e.ok ? "tool" : "bad"}>
                <span className="dot" aria-hidden="true" />
                <span>
                  <span className="visually-hidden">{e.ok ? "Tool check: " : "Tool problem: "}</span>
                  <code>{e.summary}</code>
                </span>
              </li>
            );
          }
          return (
            <li key={i} className={e.type === "retry" ? "wait" : ""}>
              <span className="dot" aria-hidden="true" />
              <span>{e.message}</span>
            </li>
          );
        })}
        {running && (
          <li className="wait">
            <span className="dot pulse" aria-hidden="true" />
            <span>Working…</span>
          </li>
        )}
      </ul>
    </div>
  );
}
