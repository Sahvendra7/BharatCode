import type { Case } from "@/lib/domain/case";
import { istParts } from "@/lib/time/ist";

export interface FactLockResult {
  text: string;
  /** Number strings that were not backed by a confirmed fact and were replaced with [check]. */
  removed: string[];
}

const digitsOnly = (s: string) => s.replace(/\D/g, "");

/** Every digit string (3+ digits) that the person's confirmed facts justify. */
export function allowedNumbers(c: Case): Set<string> {
  const allowed = new Set<string>();
  const add = (value: string | null | undefined) => {
    if (!value) return;
    const d = digitsOnly(value);
    if (d.length >= 3) allowed.add(d);
    if (d.length === 12 && d.startsWith("91")) allowed.add(d.slice(2));
    if (d.length === 10) allowed.add(`91${d}`);
  };
  const addDate = (iso: string | null) => {
    if (!iso) return;
    const p = istParts(new Date(iso));
    allowed.add(String(p.year));
  };

  for (const t of c.transactions) {
    if (t.amountInr !== null) {
      allowed.add(String(Math.trunc(t.amountInr)));
      allowed.add(digitsOnly(t.amountInr.toFixed(2)));
    }
    add(t.reference);
    add(t.payeeAccount);
    add(t.payeeIfsc);
    add(t.payeeUpiId);
    addDate(t.occurredAt);
  }
  for (const s of c.suspect) add(s.value);
  add(c.victim.phone);
  add(c.victim.accountLast4.length >= 3 ? c.victim.accountLast4 : null);
  addDate(c.discoveredAt);
  const total = c.transactions.reduce((s, t) => s + (t.amountInr ?? 0), 0);
  if (total > 0) allowed.add(String(Math.trunc(total)));
  return allowed;
}

/**
 * Replaces any number of 3+ digits that is not one of the person's confirmed facts with "[check]".
 * Applied to every model-written sentence before it can appear in a document.
 */
export function applyFactLock(text: string, c: Case): FactLockResult {
  const allowed = allowedNumbers(c);
  const removed: string[] = [];
  // A "number" is a run of digits that may contain spaces or commas between groups (98123 45670, 48,500).
  const re = /\d[\d,\s]*\d|\d/g;
  const out = text.replace(re, (match) => {
    const trimmed = match.replace(/[\s,]+$/, "");
    const tail = match.slice(trimmed.length);
    const d = digitsOnly(trimmed);
    if (d.length < 3) return match;
    if (allowed.has(d)) return match;
    // A run may join two separate facts (e.g. "2026 432109876543"); accept if every part is allowed.
    const parts = trimmed.split(/\s+/).map(digitsOnly).filter(Boolean);
    if (parts.length > 1 && parts.every((p) => p.length < 3 || allowed.has(p))) return match;
    removed.push(trimmed);
    return `[check]${tail}`;
  });
  return { text: out, removed };
}
