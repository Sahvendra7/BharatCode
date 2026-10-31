"use client";

import { useState } from "react";

/** Renders generated text as a typed slip, marking [check] stamps and missing details, with copy/share/print. */
export function DocumentSlip({ title, text, sample, note }: { title: string; text: string; sample: boolean; note?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
        return;
      } catch {
        /* cancelled: fall through to WhatsApp */
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  const parts = text.split(/(\[check\]|\(not found yet: check your bank SMS or payment app\)|\[[A-Za-z][A-Za-z0-9 ]+\])/g);

  return (
    <div className="slip">
      {sample && <span className="sample-stamp">SAMPLE</span>}
      <div className="slip-head">
        <h3>{title}</h3>
        <div className="btn-row no-print">
          <button type="button" className="btn small" onClick={copy}>
            {copied ? "Copied" : "Copy text"}
          </button>
          <button type="button" className="btn small secondary" onClick={share}>
            Share
          </button>
          <button type="button" className="btn small secondary" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>
      {note && <p className="hint">{note}</p>}
      <pre>
        {parts.map((p, i) =>
          p === "[check]" ? (
            <mark key={i} className="mark-check" title="This number wasn't in your confirmed facts, so it was removed. Fill it in yourself if it's right.">
              [check]
            </mark>
          ) : /^\(not found yet|^\[[A-Za-z]/.test(p) ? (
            <mark key={i} className="mark-missing">
              {p}
            </mark>
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
      </pre>
      <span role="status" className="visually-hidden">
        {copied ? `${title} copied` : ""}
      </span>
    </div>
  );
}
