/**
 * Offline benchmark of the fixed-rule floor (no API key needed). Prints per-message results and
 * precision/recall where "flagged" means verdict strong or warning.
 * Run: npm run eval:rules
 */
import { detectSignals, verdictFromSignals } from "../src/lib/engine/rules";
import { RULE_SET } from "./rules-set";

export function scoreRules() {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  const rows = RULE_SET.map((m) => {
    const signals = detectSignals(m.text);
    const verdict = verdictFromSignals(signals);
    const flagged = verdict !== "none_found";
    if (m.scam && flagged) tp++;
    else if (!m.scam && flagged) fp++;
    else if (m.scam && !flagged) fn++;
    else tn++;
    return { note: m.note, scam: m.scam, verdict, signals: signals.map((s) => s.id) };
  });
  const precision = tp / Math.max(1, tp + fp);
  const recall = tp / Math.max(1, tp + fn);
  return { rows, tp, fp, fn, tn, precision, recall, total: RULE_SET.length };
}

if (process.argv[1]?.endsWith("run-rules.ts")) {
  const r = scoreRules();
  for (const row of r.rows) {
    const ok = row.scam === (row.verdict !== "none_found");
    console.log(`${ok ? "ok  " : "MISS"} ${row.scam ? "scam  " : "benign"} ${row.verdict.padEnd(10)} ${row.note.padEnd(24)} ${row.signals.join(", ")}`);
  }
  console.log(`\n${r.total} authored messages · TP ${r.tp} · FP ${r.fp} · FN ${r.fn} · TN ${r.tn}`);
  console.log(`precision ${(r.precision * 100).toFixed(1)}% · recall ${(r.recall * 100).toFixed(1)}%`);
  console.log("Synthetic, developer-authored set: this measures rule behaviour on known patterns, not real-world accuracy.");
}
