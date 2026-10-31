"use client";

import { useMemo, useState } from "react";
import type { Case } from "@/lib/domain/case";
import { PATTERN_LABELS } from "@/lib/domain/enums";
import { buildBankLetter, buildCallSheet, buildComplaint } from "@/lib/engine/documents";
import { assessEntitlement } from "@/lib/engine/entitlement";
import { formatInr, totalLost } from "@/lib/engine/format";
import { buildPlan, URGENCY_LABELS } from "@/lib/engine/plan";
import { DocumentSlip } from "./DocumentSlip";
import { FactsEditor } from "./FactsEditor";

type DocTab = "call" | "complaint" | "bank";

export interface ResultsWarning {
  field: string;
  message: string;
}

export function ResultsView({
  value,
  onChange,
  warnings,
  now,
}: {
  value: Case;
  onChange: (c: Case) => void;
  warnings: ResultsWarning[];
  now: Date;
}) {
  const [tab, setTab] = useState<DocTab>("call");
  const plan = useMemo(() => buildPlan(value), [value]);
  const entitlement = useMemo(() => assessEntitlement(value, now), [value, now]);
  const callSheet = useMemo(() => buildCallSheet(value), [value]);
  const complaint = useMemo(() => buildComplaint(value), [value]);
  const bankLetter = useMemo(() => buildBankLetter(value, now), [value, now]);
  const sample = value.origin === "sample";
  const needsChecking = value.transactions.filter((t) => t.verification === "ai_read_image" || t.verification === "unverified").length +
    value.suspect.filter((s) => s.verification === "ai_read_image" || s.verification === "unverified").length;
  const total = totalLost(value.transactions.map((t) => t.amountInr));
  const lost = value.paid !== "no";

  const tabs: Array<{ id: DocTab; label: string; show: boolean }> = [
    { id: "call", label: "1930 call sheet", show: lost },
    { id: "complaint", label: "Complaint draft", show: lost },
    { id: "bank", label: "Bank letter", show: lost },
  ];

  return (
    <div>
      {value.summary.length > 140 && <p style={{ maxWidth: "70ch" }}>{value.summary}</p>}
      <p className="hint" style={{ marginBottom: "1.5rem" }}>
        {PATTERN_LABELS[value.pattern]}
        {lost && total > 0 ? `: ${formatInr(total)} across ${value.transactions.length} payment${value.transactions.length === 1 ? "" : "s"}` : ""}.
      </p>

      {(warnings.length > 0 || needsChecking > 0 || value.missingInfo.length > 0) && (
        <div className="notice warn" role="region" aria-label="Things to check">
          {needsChecking > 0 && (
            <p>
              <strong>
                {needsChecking} detail{needsChecking === 1 ? " was" : "s were"} read by AI and need{needsChecking === 1 ? "s" : ""} your check
              </strong>{" "}
              against your screenshots before you use the documents.
            </p>
          )}
          {(warnings.length > 0 || value.missingInfo.length > 0) && (
            <ul>
              {warnings.map((w, i) => (
                <li key={`w${i}`}>
                  <strong>{w.field}:</strong> {w.message}
                </li>
              ))}
              {value.missingInfo.map((q, i) => (
                <li key={`m${i}`}>{q}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="results">
        <section aria-labelledby="plan-title">
          <h2 id="plan-title">Your plan</h2>
          <ol className="plan">
            {plan.map((step) => (
              <li key={step.id} data-step={step.id}>
                <div>
                  <span className={`urgency ${step.urgency}`}>{URGENCY_LABELS[step.urgency]}</span>
                  <h3>{step.title}</h3>
                  <p>{step.detail}</p>
                  <p className="why">{step.why}</p>
                  {step.id === "call_1930" && (
                    <details className="no-print" style={{ margin: "0.25rem 0 0.75rem" }}>
                      <summary>Show what to read out on the call</summary>
                      <div style={{ marginTop: "0.75rem" }}>
                        <DocumentSlip title="1930 call sheet" text={callSheet} sample={sample} />
                      </div>
                    </details>
                  )}
                  {step.actions.length > 0 && (
                    <div className="btn-row">
                      {step.actions.map((a) => (
                        <a key={a.href + a.label} className={a.href.startsWith("tel:") ? "btn small" : "btn small secondary"} href={a.href} rel="noopener noreferrer">
                          {a.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {entitlement.kind !== "not_applicable" && (
            <div className="notice info" style={{ marginTop: "1.5rem" }} aria-labelledby="ent-title">
              <h3 id="ent-title" style={{ marginTop: 0 }}>
                Can the bank refund you?
              </h3>
              <p>
                <strong>{entitlement.headline}</strong>
              </p>
              <ul>
                {entitlement.points.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
              <p className="hint" style={{ marginTop: "0.75rem" }}>
                Source:{" "}
                <a href={entitlement.source.url} rel="noopener noreferrer">
                  RBI, {entitlement.source.title}
                </a>{" "}
                ({entitlement.source.reference}). This is general information, not legal advice; your bank decides.
              </p>
            </div>
          )}
        </section>

        <section aria-labelledby="facts-title" className="panel">
          <FactsEditor value={value} onChange={onChange} />
        </section>
      </div>

      {lost && (
        <section aria-labelledby="docs-title" style={{ marginTop: "2.5rem" }}>
          <h2 id="docs-title">Ready-to-use text</h2>
          <div className="tabs" role="tablist" aria-label="Documents">
            {tabs
              .filter((t) => t.show)
              .map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`tab-${t.id}`}
                  aria-selected={tab === t.id}
                  aria-controls={`panel-${t.id}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
          </div>
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
            {tab === "call" && <DocumentSlip title="1930 call sheet" text={callSheet} sample={sample} note="Keep this open while you're on the call and read the details out." />}
            {tab === "complaint" && (
              <DocumentSlip
                title="cybercrime.gov.in complaint draft"
                text={complaint.text}
                sample={sample}
                note={
                  complaint.removed.length
                    ? `${complaint.removed.length} number${complaint.removed.length === 1 ? "" : "s"} in the description didn't match your confirmed facts and ${complaint.removed.length === 1 ? "was" : "were"} replaced with [check].`
                    : "Copy each part into the matching section of the portal's financial-fraud form."
                }
              />
            )}
            {tab === "bank" && <DocumentSlip title="Letter to your bank" text={bankLetter} sample={sample} note="Send from your registered email or hand it in at the branch, and ask for a dated acknowledgement." />}
          </div>
        </section>
      )}
    </div>
  );
}
