/**
 * Live benchmark of Turant's extraction on BharatCode (needs BHARATCODE_API_KEY).
 * Run: BHARATCODE_API_KEY=... npm run eval
 *
 * Factual metrics (exact match after normalisation, computed by code):
 *   - amount / reference / payee field accuracy over gold transactions
 *   - transaction count match, paid match
 *   - suspect identifier recall
 *   - invented numbers: digit runs (3+) in the model's how_it_happened that are not in the gold facts,
 *     counted BEFORE the fact lock, plus how many survive AFTER it (should be 0)
 * Subjective output (summary wording, pattern choice) is reported separately and never scored as fact,
 * except pattern match which is listed as an indicator.
 */
import fs from "node:fs";
import path from "node:path";
import { BharatCodeClient } from "../src/lib/bharatcode/client";
import { readConfig } from "../src/lib/bharatcode/config";
import { BharatCodeError } from "../src/lib/bharatcode/errors";
import { applyFactLock } from "../src/lib/engine/fact-lock";
import { analyzeIncident } from "../src/lib/pipeline/analyze";
import { GOLD, type GoldCase } from "./cases";

const digits = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");

function toDataUrl(file: string): string {
  const buf = fs.readFileSync(path.resolve(file));
  return `data:image/png;base64,${buf.toString("base64")}`;
}

function payeeOf(t: { payeeUpiId: string | null; payeeAccount: string | null }) {
  return (t.payeeUpiId ?? t.payeeAccount ?? "").toLowerCase();
}

async function runCase(client: BharatCodeClient, g: GoldCase) {
  const started = Date.now();
  const out = await analyzeIncident(
    client,
    { story: g.story, images: g.screenshots.map(toDataUrl), paid: "unknown", discoveredAt: null },
    { now: new Date() },
  );
  const c = out.case;
  const fields: Record<"amount" | "reference" | "payee", [number, number]> = { amount: [0, 0], reference: [0, 0], payee: [0, 0] };
  for (const gt of g.transactions) {
    const match = c.transactions.find((t) => t.amountInr === gt.amountInr) ?? null;
    fields.amount[1]++;
    if (match) fields.amount[0]++;
    if (gt.reference) {
      fields.reference[1]++;
      if (match && digits(match.reference) === digits(gt.reference)) fields.reference[0]++;
    }
    if (gt.payee) {
      fields.payee[1]++;
      if (match && payeeOf(match) === gt.payee.toLowerCase()) fields.payee[0]++;
    }
  }
  const found = new Set(c.suspect.map((s) => s.value.toLowerCase()));
  const suspectHits = g.suspectValues.filter((v) => found.has(v.toLowerCase())).length;

  const goldNumbers = new Set<string>();
  for (const t of g.transactions) {
    goldNumbers.add(String(t.amountInr));
    if (t.reference) goldNumbers.add(digits(t.reference));
    if (t.payee) goldNumbers.add(digits(t.payee));
  }
  for (const v of g.suspectValues) {
    goldNumbers.add(digits(v));
    if (digits(v).startsWith("91")) goldNumbers.add(digits(v).slice(2));
  }
  const runs = (c.howItHappened.match(/\d[\d,\s]*\d/g) ?? []).map((r) => digits(r)).filter((d) => d.length >= 3);
  const inventedBefore = runs.filter((d) => !goldNumbers.has(d)).length;
  const after = applyFactLock(c.howItHappened, c);
  const inventedAfter = (after.text.match(/\d[\d,\s]*\d/g) ?? []).map(digits).filter((d) => d.length >= 3 && !goldNumbers.has(d)).length;

  return {
    id: g.id,
    ms: Date.now() - started,
    paidOk: g.paid === c.paid,
    patternOk: g.pattern === c.pattern,
    txCountOk: g.transactions.length === c.transactions.length,
    fields,
    suspect: [suspectHits, g.suspectValues.length] as [number, number],
    inventedBefore,
    inventedAfter,
    toolCalls: out.toolCalls,
    usedFallback: out.usedFallback,
    repaired: out.repaired,
    warnings: out.warnings.length,
    requestIds: c.requestIds,
  };
}

async function main() {
  const config = readConfig();
  if (!config) {
    console.error("BHARATCODE_API_KEY is not set. This benchmark calls the live API and cannot run without a key.");
    process.exit(2);
  }
  const client = new BharatCodeClient(config);
  const results: Array<Awaited<ReturnType<typeof runCase>> | { id: string; error: string; requestId: string | null }> = [];
  for (const g of GOLD) {
    process.stdout.write(`${g.id} … `);
    try {
      const r = await runCase(client, g);
      results.push(r);
      console.log(`ok (${(r.ms / 1000).toFixed(1)} s)`);
    } catch (e) {
      const err = e instanceof BharatCodeError ? e : null;
      results.push({ id: g.id, error: err ? `${err.kind}: ${err.detail ?? err.message}` : String(e), requestId: err?.requestId ?? null });
      console.log(`error ${err?.kind ?? ""}`);
    }
  }

  const ok = results.filter((r): r is Awaited<ReturnType<typeof runCase>> => !("error" in r));
  const sum = (f: (r: (typeof ok)[number]) => [number, number]) =>
    ok.reduce<[number, number]>((a, r) => [a[0] + f(r)[0], a[1] + f(r)[1]], [0, 0]);
  const pct = ([a, b]: [number, number]) => (b ? `${((100 * a) / b).toFixed(1)}% (${a}/${b})` : "n/a");
  const summary = {
    model: config.model,
    ranAt: new Date().toISOString(),
    cases: GOLD.length,
    errors: results.length - ok.length,
    amount: pct(sum((r) => r.fields.amount)),
    reference: pct(sum((r) => r.fields.reference)),
    payee: pct(sum((r) => r.fields.payee)),
    suspectRecall: pct(sum((r) => r.suspect)),
    paidMatch: pct([ok.filter((r) => r.paidOk).length, ok.length]),
    txCountMatch: pct([ok.filter((r) => r.txCountOk).length, ok.length]),
    patternMatch: pct([ok.filter((r) => r.patternOk).length, ok.length]),
    inventedNumbersBeforeLock: ok.reduce((a, r) => a + r.inventedBefore, 0),
    inventedNumbersAfterLock: ok.reduce((a, r) => a + r.inventedAfter, 0),
    medianSeconds: ok.length ? Number((ok.map((r) => r.ms).sort((a, b) => a - b)[Math.floor(ok.length / 2)]! / 1000).toFixed(1)) : null,
  };
  console.table(summary);
  const dir = path.resolve("eval/results");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `extraction-${summary.ranAt.replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(file, JSON.stringify({ summary, results }, null, 2));
  console.log(`Full results: ${path.relative(process.cwd(), file)}`);
}

void main();
