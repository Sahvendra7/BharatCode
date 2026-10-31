"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getSample, type SampleCase } from "@/data/samples";
import { useHealth } from "@/lib/client/health";
import { urlToDataUrl, type PreparedImage } from "@/lib/client/images";
import { clearCase, loadCase, saveCase } from "@/lib/client/storage";
import { ApiError, postForStream, type ApiErrorInfo } from "@/lib/client/stream";
import { emptyCase, emptyTransaction, type Case } from "@/lib/domain/case";
import type { Tri } from "@/lib/domain/enums";
import type { PipelineEvent } from "@/lib/pipeline/events";
import { istInputToIso } from "@/lib/time/ist";
import { CallSlab } from "./CallSlab";
import { ResultsView, type ResultsWarning } from "./ResultsView";
import { ScreenshotPicker } from "./ScreenshotPicker";
import { Trace } from "./Trace";

type Stage = "tell" | "working" | "results";

interface AnalyzeResult {
  case: Case;
  warnings: ResultsWarning[];
  model: string;
  toolCalls: number;
}

const STAGES: Array<{ id: Stage; label: string }> = [
  { id: "tell", label: "Tell us what happened" },
  { id: "working", label: "AI reads your evidence" },
  { id: "results", label: "Check facts and act" },
];

export function HelpFlow() {
  const params = useSearchParams();
  const sample = getSample(params.get("sample"));
  return <HelpFlowInner key={sample?.id ?? "new"} sample={sample} />;
}

function HelpFlowInner({ sample }: { sample: SampleCase | undefined }) {
  const health = useHealth();
  const aiOn = health?.model.configured ?? false;
  const [stage, setStage] = useState<Stage>(sample ? "results" : "tell");
  const [story, setStory] = useState("");
  const [images, setImages] = useState<PreparedImage[]>([]);
  const [paid, setPaid] = useState<Tri>("yes");
  const [discovered, setDiscovered] = useState("");
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const [current, setCurrent] = useState<Case | null>(() => (sample ? structuredClone(sample.case) : null));
  const [warnings, setWarnings] = useState<ResultsWarning[]>([]);
  const [meta, setMeta] = useState<{ model: string; toolCalls: number } | null>(null);
  const [now] = useState(() => new Date());
  const abort = useRef<AbortController | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Restore the case kept in this tab's sessionStorage after a refresh. sessionStorage only exists after
  // hydration, so this has to run in an effect.
  useEffect(() => {
    if (sample) return;
    const saved = loadCase();
    if (saved && saved.origin !== "sample") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from browser storage once after mount
      setCurrent(saved);
      setStage("results");
    }
  }, [sample]);

  useEffect(() => {
    if (current && current.origin !== "sample") saveCase(current);
  }, [current]);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [stage]);

  async function analyze(input: { story: string; images: string[]; paid: Tri; discoveredAt: string | null }) {
    setStage("working");
    setEvents([]);
    setError(null);
    abort.current = new AbortController();
    try {
      const result = await postForStream<AnalyzeResult>("/api/analyze", { ...input, images: input.images.map((dataUrl) => ({ dataUrl })) }, {
        signal: abort.current.signal,
        onProgress: (e) => setEvents((prev) => [...prev, e]),
      });
      setCurrent(result.case);
      setWarnings(result.warnings);
      setMeta({ model: result.model, toolCalls: result.toolCalls });
      setStage("results");
    } catch (e) {
      if (abort.current?.signal.aborted) {
        setStage("tell");
        return;
      }
      setError(e instanceof ApiError ? e.info : { kind: "internal", message: "Something went wrong. Your inputs are still here." });
    }
  }

  function startManual() {
    const c = emptyCase("manual");
    c.paid = paid;
    c.howItHappened = story.slice(0, 1500);
    c.discoveredAt = istInputToIso(discovered);
    if (paid !== "no") c.transactions = [emptyTransaction()];
    setCurrent(c);
    setWarnings([]);
    setMeta(null);
    setStage("results");
  }

  async function runSampleLive() {
    if (!sample) return;
    const urls = await Promise.all(sample.screenshots.map(urlToDataUrl)).catch(() => []);
    await analyze({ story: sample.story, images: urls, paid: "yes", discoveredAt: sample.case.discoveredAt });
  }

  function startOver() {
    clearCase();
    setCurrent(null);
    setStory("");
    setImages([]);
    setEvents([]);
    setError(null);
    setStage("tell");
    if (sample) window.history.replaceState(null, "", "/help");
  }

  const stageIndex = STAGES.findIndex((s) => s.id === stage);

  return (
    <div className="wrap flow">
      <ol className="progress-steps" aria-label="Progress">
        {STAGES.map((s, i) => (
          <li key={s.id} aria-current={s.id === stage ? "step" : undefined} className={i < stageIndex ? "done" : undefined}>
            {i + 1}. {s.label}
          </li>
        ))}
      </ol>

      {stage === "tell" && (
        <>
          <div className="panel urgent" style={{ marginBottom: "2rem" }}>
            <h1 ref={headingRef} tabIndex={-1} style={{ fontSize: "var(--step-3)" }}>
              First, call 1930. Don&apos;t wait for this page.
            </h1>
            <p>Reporting quickly gives banks the best chance to hold money that is still in the receiving account. Fill this in while you wait on the line, or right after.</p>
            <CallSlab note="Can't get through? File at cybercrime.gov.in" />
          </div>

          <form
            className="panel"
            onSubmit={(e) => {
              e.preventDefault();
              if (aiOn) void analyze({ story, images: images.map((i) => i.dataUrl), paid, discoveredAt: istInputToIso(discovered) });
              else startManual();
            }}
          >
            <h2>Tell us what happened</h2>
            {health && !aiOn && (
              <div className="notice info">
                <p>AI reading isn&apos;t switched on for this server, so you&apos;ll enter the payment details yourself. The plan and documents work the same way.</p>
              </div>
            )}
            <fieldset>
              <legend>Has money left your account?</legend>
              <div className="choices">
                {(
                  [
                    ["yes", "Yes"],
                    ["unknown", "Not sure"],
                    ["no", "No, not yet"],
                  ] as const
                ).map(([v, l]) => (
                  <label className="choice" key={v}>
                    <input type="radio" name="paid" value={v} checked={paid === v} onChange={() => setPaid(v)} />
                    <span>{l}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {paid === "no" && (
              <div className="notice good">
                <p>
                  Good: stop all contact now. To check a suspicious message, use <Link href="/check">Check a message</Link>. You can still continue here to get a plan.
                </p>
              </div>
            )}
            <div className="field">
              <label htmlFor="story-input">What happened? Any language is fine.</label>
              <textarea
                id="story-input"
                value={story}
                maxLength={4000}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Example: Got an SMS that electricity will be cut tonight. Called the number, paid ₹48,500 by UPI to the ID he gave…"
              />
              <p className="hint">{story.length}/4000. Don&apos;t include your PIN, OTP or passwords.</p>
            </div>
            {aiOn && <ScreenshotPicker images={images} onChange={setImages} />}
            <div className="field">
              <label htmlFor="discovered-input">When did you find out? (optional)</label>
              <input id="discovered-input" type="datetime-local" value={discovered} onChange={(e) => setDiscovered(e.target.value)} />
              <p className="hint">Usually the time of the bank&apos;s debit SMS. RBI&apos;s time limits count from then.</p>
            </div>
            <div className="btn-row">
              {aiOn ? (
                <>
                  <button className="btn" type="submit" disabled={!story.trim() && images.length === 0}>
                    Read my evidence with AI
                  </button>
                  <button className="btn secondary" type="button" onClick={startManual}>
                    Enter details myself
                  </button>
                </>
              ) : (
                <button className="btn" type="submit" disabled={!health}>
                  Continue
                </button>
              )}
            </div>
            {aiOn && (
              <p className="hint" style={{ marginTop: "1rem" }}>
                Your story and screenshots are sent to BharatCode&apos;s model ({health?.model.id}) to be read, and are not stored by Turant. <Link href="/privacy">Privacy</Link>
              </p>
            )}
          </form>
        </>
      )}

      {stage === "working" && (
        <div className="panel">
          <h1 ref={headingRef} tabIndex={-1} style={{ fontSize: "var(--step-3)" }}>
            {error ? "The AI couldn't finish" : "Reading your evidence…"}
          </h1>
          {!error && <p>BharatCode&apos;s AI is reading your story and screenshots. Turant checks every number it finds. If you haven&apos;t called 1930 yet, do it now.</p>}
          <Trace events={events} running={!error} />
          {error ? (
            <div className="notice error" role="alert" style={{ marginTop: "1.25rem" }}>
              <p>{error.message}</p>
              {error.requestId && <p className="hint">Reference for support: {error.requestId}</p>}
              <div className="btn-row">
                <button className="btn" type="button" onClick={startManual}>
                  Enter details myself
                </button>
                <button className="btn secondary" type="button" onClick={() => setStage("tell")}>
                  Back to my inputs
                </button>
              </div>
            </div>
          ) : (
            <button className="btn quiet" type="button" style={{ marginTop: "1rem" }} onClick={() => abort.current?.abort()}>
              Cancel
            </button>
          )}
        </div>
      )}

      {stage === "results" && current && (
        <>
          <h1 ref={headingRef} tabIndex={-1} style={{ fontSize: "var(--step-3)", maxWidth: "26ch" }}>
            {current.summary && current.summary.length <= 140 ? current.summary : current.paid === "no" ? "You haven't lost money. Keep it that way." : "Do these in order"}
          </h1>
          {current.origin === "sample" && sample && (
            <div className="notice info">
              <p>
                <strong>Sample case.</strong> All names and numbers are made up and were filled in by hand: no AI was used. Try editing a fact to see the plan and documents change.
              </p>
              {aiOn && sample.story && (
                <button type="button" className="btn small" onClick={() => void runSampleLive()}>
                  Run this sample through BharatCode AI
                </button>
              )}
            </div>
          )}
          {meta && (
            <p className="hint">
              Read by BharatCode <strong>{meta.model}</strong> with {meta.toolCalls} tool check{meta.toolCalls === 1 ? "" : "s"}. Review every detail marked “check it”.
            </p>
          )}
          <ResultsView value={current} onChange={setCurrent} warnings={warnings} now={now} />
          <div className="btn-row no-print" style={{ marginTop: "2rem" }}>
            <button type="button" className="btn secondary" onClick={startOver}>
              Start a new case
            </button>
            <span className="hint">Starting again clears this case from the browser.</span>
          </div>
        </>
      )}
    </div>
  );
}
