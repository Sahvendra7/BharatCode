import { fromIst, istParts } from "./ist";

/**
 * Bank working day, approximated as: not a Sunday and not the 2nd or 4th Saturday of the month.
 * Public and state holidays are not known here; callers must say so to the person.
 */
export function isBankWorkingDay(date: Date): boolean {
  const p = istParts(date);
  if (p.weekday === 0) return false;
  if (p.weekday === 6) {
    const nth = Math.ceil(p.day / 7);
    if (nth === 2 || nth === 4) return false;
  }
  return true;
}

/**
 * Working days after `from` up to and including `to`, counted on IST calendar dates and excluding the
 * date of `from` itself, as RBI's 2017 circular (Table 2) counts "time taken to report ... excluding
 * the date of receiving the communication".
 */
export function workingDaysBetween(from: Date, to: Date): number {
  if (to.getTime() <= from.getTime()) return 0;
  const start = istParts(from);
  const end = istParts(to);
  let cursor = fromIst(start.year, start.month, start.day, 12)!;
  const last = fromIst(end.year, end.month, end.day, 12)!;
  let count = 0;
  while (true) {
    cursor = new Date(cursor.getTime() + 86_400_000);
    if (cursor.getTime() > last.getTime()) break;
    if (isBankWorkingDay(cursor)) count++;
  }
  return count;
}
