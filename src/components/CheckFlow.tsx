"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { SCAM_PATTERN_INFO } from "@/data/scam-patterns";
import { useHealth } from "@/lib/client/health";
import type { PreparedImage } from "@/lib/client/images";
import { ApiError, postForStream, type ApiErrorInfo } from "@/lib/client/stream";
import { PATTERN_LABELS } from "@/lib/domain/enums";
import type { MessageCheckResult } from "@/lib/pipeline/check";
import type { PipelineEvent } from "@/lib/pipeline/events";
import { ScreenshotPicker } from "./ScreenshotPicker";
import { Trace } from "./Trace";

const VERDICT_TEXT = {
  strong: { title: "Strong signs of a scam", body: "Don't pay, don't share any code, and don't install anything they ask for." },
  warning: { title: "Some warning signs", body: "Don't act on this message. Check with the organisation using a number or website you find yourself." },
  none_found: {
    title: "No known scam pattern found",
    body: "That is not a guarantee it's genuine. Verify through the organisation's official app or website before paying anyone.",
  },
} as const;

type Result = MessageCheckResult & { fallbackReason?: string };

export function CheckFlow() {
  const health = useHealth();
  const aiOn = health?.model.configured ?? false;
  const [text, setText] = useState("");
  const [images, setImages] = useState<PreparedImage[]>([]);
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);

  async function run() {
    setRunning(true);
    setEvents([]);
    setResult(null);
    setError(null);
    try {
      const r = await postForStream<Result>(
        "/api/check",
        { text, images: aiOn ? images.map((i) => ({ dataUrl: i.dataUrl })) : [] },
        { onProgress: (e) => setEvents((p) => [...p, e]) },
      );
      setResult(r);
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch (e) {
      setError(e instanceof ApiError ? e.info : { kind: "internal", message: "Something went wrong. Try again." });
    } finally {
      setRunning(false);
    }
  }

  const verdict = result ? VERDICT_TEXT[result.verdict] : null;
  const pattern = result && result.pattern !== "unknown" && result.pattern !== "other" ? SCAM_PATTERN_INFO[result.pattern] : null;

  return (
    <div className="wrap flow">
      <h1 style={{ fontSize: "var(--step-3)" }}>Check a message before you pay</h1>
      <p>Paste the SMS, WhatsApp message, email or offer letter{aiOn ? ", or add a screenshot" : ""}. Turant shows the warning signs and the exact words behind each one.</p>
      <p className="hint">
        Already paid? Go to <Link href="/help">I&apos;ve lost money</Link> and call 1930.
      </p>

      <div className="results" style={{ marginTop: "1.5rem" }}>
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            void run();
          }}
        >
          <div className="field">
            <label htmlFor="msg">The message</label>
            <textarea id="msg" value={text} maxLength={4000} onChange={(e) => setText(e.target.value)} placeholder="Paste the message here" />
          </div>
          {aiOn && <ScreenshotPicker images={images} onChange={setImages} max={2} />}
          {health && !aiOn && (
            <div className="notice info">
              <p>AI is off on this server, so only typed text is checked, with fixed rules.</p>
            </div>
          )}
          <button className="btn" type="submit" disabled={running || (!text.trim() && images.length === 0)}>
            {running ? "Checking…" : "Check this message"}
          </button>
          {(running || events.length > 0) && <Trace events={events} running={running} />}
        </form>

        <section aria-live="polite">
          {error && (
            <div className="notice error" role="alert">
              <p>{error.message}</p>
              {error.requestId && <p className="hint">Reference for support: {error.requestId}</p>}
            </div>
          )}
          {result && verdict && (
            <>
              <div className={`verdict ${result.verdict}`}>
                <h2 ref={resultRef} tabIndex={-1}>
                  {verdict.title}
                </h2>
                <p>{verdict.body}</p>
                {result.explanation && <p>{result.explanation}</p>}
                <p className="hint" style={{ margin: 0 }}>
                  {result.aiUsed
                    ? `Read by BharatCode ${result.model}. Fixed rules can raise the verdict but the AI can't lower it below them.`
                    : "Checked with Turant's fixed rules only (no AI)."}
                  {result.fallbackReason && " The AI was unavailable, so this is the rules-only result."}
                </p>
              </div>

              {result.claimedSender && (
                <p>
                  <strong>Claims to be from:</strong> {result.claimedSender}
                </p>
              )}
              {pattern && (
                <div className="notice info">
                  <p>
                    <strong>Looks like: {PATTERN_LABELS[result.pattern]}.</strong> {pattern.description}
                  </p>
                  {pattern.advice[0] && <p>{pattern.advice[0]}</p>}
                </div>
              )}

              {(result.ruleSignals.length > 0 || result.aiSignals.length > 0) && (
                <>
                  <h3>Warning signs</h3>
                  <ul className="signals">
                    {result.ruleSignals.map((s) => (
                      <li key={s.id}>
                        {s.label}
                        <span className="who">{result.rulesUsedAiTranscript ? "rule, on AI-read text" : "fixed rule"}</span>
                        <q>{s.quote}</q>
                      </li>
                    ))}
                    {result.aiSignals.map((s, i) => (
                      <li key={`ai${i}`}>
                        {s.signal}
                        <span className="who">AI</span>
                        <q>{s.quote}</q>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {result.identifiers.length > 0 && (
                <>
                  <h3 style={{ marginTop: "1.5rem" }}>Numbers, IDs and links in the message</h3>
                  <ul className="signals">
                    {result.identifiers.map((id) => (
                      <li key={id.kind + id.value}>
                        <code style={{ fontFamily: "var(--typed)", overflowWrap: "anywhere" }}>{id.value}</code>
                        <span className={`src ${id.risky ? "bad" : "you"}`}>{id.label}</span>
                        {id.notes[0] && <p className="hint">{id.notes[0]}</p>}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <h3 style={{ marginTop: "1.5rem" }}>What to do</h3>
              <ul className="prose">
                <li>Don&apos;t reply, call back or tap links in the message.</li>
                <li>
                  Report the number or message on{" "}
                  <a href="https://sancharsaathi.gov.in" rel="noopener noreferrer">
                    Chakshu (Sanchar Saathi)
                  </a>
                  , and block it in WhatsApp or your SMS app.
                </li>
                <li>
                  If you already paid or shared a code: <Link href="/help">get your first-hour plan</Link> and call <a href="tel:1930">1930</a>.
                </li>
              </ul>
            </>
          )}
          {!result && !error && !running && (
            <div className="panel" style={{ background: "transparent" }}>
              <h2 style={{ fontSize: "var(--step-1)" }}>What gets checked</h2>
              <ul className="prose">
                <li>Requests for OTPs, PINs, fees, app installs or screen sharing</li>
                <li>Threats of arrest, disconnection or blocking</li>
                <li>Look-alike links, shorteners and .apk files</li>
                <li>UPI IDs with official-sounding names, free-email &quot;HR&quot; addresses, foreign numbers</li>
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
