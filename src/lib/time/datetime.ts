import { fromIst, istParts, toIstIso } from "./ist";

export interface ParsedDateTime {
  input: string;
  /** ISO 8601 with +05:30, or null when the text could not be read unambiguously. */
  iso: string | null;
  hasTime: boolean;
  reason?: string;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_RE = "(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?";

function fullYear(y: string): number {
  const n = Number(y);
  return y.length === 2 ? 2000 + n : n;
}

/**
 * Reads the date/time formats found on Indian bank SMS, UPI receipts and chat screenshots.
 * Numeric dates are read day-first (30/10/2026), as Indian banks print them.
 */
export function parseIndianDateTime(input: string, now: Date = new Date()): ParsedDateTime {
  const fail = (reason: string): ParsedDateTime => ({ input, iso: null, hasTime: false, reason });
  let text = input.toLowerCase().replace(/,/g, " ").replace(/\b(at|on|ist|hrs)\b/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return fail("empty");

  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[t ](\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?)?(z|[+-]\d{2}:?\d{2})?$/.exec(text);
  if (iso) {
    const [, y, m, d, hh, mm, zone] = iso;
    if (zone) {
      const date = new Date(input.trim());
      if (Number.isNaN(date.getTime())) return fail("invalid ISO date");
      return finish(input, date, hh !== undefined, now);
    }
    const date = fromIst(Number(y), Number(m), Number(d), Number(hh ?? 0), Number(mm ?? 0));
    return date ? finish(input, date, hh !== undefined, now) : fail("date does not exist");
  }

  let hour: number | null = null;
  let minute = 0;
  const ampm = /\b(\d{1,2})(?:[:.](\d{2}))?(?::\d{2})?\s*(am|pm)\b/.exec(text);
  const clock = ampm ? null : /\b(\d{1,2}):(\d{2})(?::\d{2})?\b/.exec(text);
  if (ampm) {
    const h = Number(ampm[1]);
    if (h < 1 || h > 12) return fail("invalid hour");
    hour = (h % 12) + (ampm[3] === "pm" ? 12 : 0);
    minute = Number(ampm[2] ?? 0);
    text = text.replace(ampm[0], " ").trim();
  } else if (clock) {
    hour = Number(clock[1]);
    minute = Number(clock[2]);
    if (hour > 23) return fail("invalid hour");
    text = text.replace(clock[0], " ").trim();
  }
  if (minute > 59) return fail("invalid minute");

  let ymd: [number, number, number] | null = null;
  const today = istParts(now);
  if (/\btoday\b/.test(text)) {
    ymd = [today.year, today.month, today.day];
  } else if (/\byesterday\b/.test(text)) {
    const y = istParts(new Date(now.getTime() - 86_400_000));
    ymd = [y.year, y.month, y.day];
  } else {
    const numeric = /\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})\b/.exec(text);
    const dayFirst = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?[\\s-]*${MONTH_RE}[\\s-]*(\\d{2}|\\d{4})\\b`).exec(text);
    const monthFirst = new RegExp(`\\b${MONTH_RE}\\s*(\\d{1,2})(?:st|nd|rd|th)?\\s+(\\d{4})\\b`).exec(text);
    if (numeric) ymd = [fullYear(numeric[3]!), Number(numeric[2]), Number(numeric[1])];
    else if (dayFirst) ymd = [fullYear(dayFirst[3]!), MONTHS.indexOf(dayFirst[2]!) + 1, Number(dayFirst[1])];
    else if (monthFirst) ymd = [fullYear(monthFirst[3]!), MONTHS.indexOf(monthFirst[1]!) + 1, Number(monthFirst[2])];
  }
  if (!ymd) return fail("no recognisable date");

  const date = fromIst(ymd[0], ymd[1], ymd[2], hour ?? 0, minute);
  if (!date) return fail("date does not exist");
  return finish(input, date, hour !== null, now);
}

function finish(input: string, date: Date, hasTime: boolean, now: Date): ParsedDateTime {
  if (date.getTime() > now.getTime() + 86_400_000) {
    return { input, iso: null, hasTime, reason: "date is in the future" };
  }
  return { input, iso: toIstIso(date), hasTime };
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "30 Oct 2026, 3:42 PM IST". Deterministic, independent of the runtime's locale data. */
export function formatIst(isoOrDate: string | Date, withTime = true): string {
  const p = istParts(typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate);
  const date = `${p.day} ${MONTH_NAMES[p.month - 1]} ${p.year}`;
  if (!withTime) return date;
  const h12 = p.hour % 12 === 0 ? 12 : p.hour % 12;
  return `${date}, ${h12}:${String(p.minute).padStart(2, "0")} ${p.hour < 12 ? "AM" : "PM"} IST`;
}
