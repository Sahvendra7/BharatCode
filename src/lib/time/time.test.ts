import { describe, expect, it } from "vitest";
import { parseIndianDateTime, formatIst } from "./datetime";
import { workingDaysBetween, isBankWorkingDay } from "./working-days";

const NOW = new Date("2026-10-30T16:10:00+05:30");

describe("parseIndianDateTime", () => {
  it.each([
    ["30 Oct 2026, 03:42 PM", "2026-10-30T15:42:00+05:30"],
    ["30/10/2026 15:42", "2026-10-30T15:42:00+05:30"],
    ["30-10-26 3:42 pm", "2026-10-30T15:42:00+05:30"],
    ["Oct 30, 2026 3:42 PM", "2026-10-30T15:42:00+05:30"],
    ["2026-10-30T15:42", "2026-10-30T15:42:00+05:30"],
    ["30 October 2026 at 9:05 am", "2026-10-30T09:05:00+05:30"],
    ["today 3:42 pm", "2026-10-30T15:42:00+05:30"],
    ["yesterday 9 pm", "2026-10-29T21:00:00+05:30"],
    ["30 Oct 2026", "2026-10-30T00:00:00+05:30"],
    ["12:00 AM 30 Oct 2026", "2026-10-30T00:00:00+05:30"],
    ["12:30 PM 29-Oct-2026", "2026-10-29T12:30:00+05:30"],
  ])("parses %s", (text, iso) => {
    const r = parseIndianDateTime(text, NOW);
    expect(r.iso).toBe(iso);
  });
  it("marks date-only input", () => {
    expect(parseIndianDateTime("30 Oct 2026", NOW).hasTime).toBe(false);
  });
  it("rejects impossible dates and nonsense", () => {
    expect(parseIndianDateTime("31/02/2026 10:00", NOW).iso).toBeNull();
    expect(parseIndianDateTime("sometime last week", NOW).iso).toBeNull();
    expect(parseIndianDateTime("30/10/2026 25:10", NOW).iso).toBeNull();
  });
  it("refuses future times more than a day ahead", () => {
    const r = parseIndianDateTime("30 Dec 2026 10:00 AM", NOW);
    expect(r.iso).toBeNull();
    expect(r.reason).toMatch(/future/);
  });
  it("formats in IST", () => {
    expect(formatIst("2026-10-30T15:42:00+05:30")).toBe("30 Oct 2026, 3:42 PM IST");
    expect(formatIst("2026-10-30T10:12:00Z")).toBe("30 Oct 2026, 3:42 PM IST");
  });
});

describe("bank working days (RBI 2017 circular Table 2 counting)", () => {
  it("treats Sundays and 2nd/4th Saturdays as non-working", () => {
    expect(isBankWorkingDay(new Date("2026-11-01T12:00:00+05:30"))).toBe(false); // Sunday
    expect(isBankWorkingDay(new Date("2026-11-14T12:00:00+05:30"))).toBe(false); // 2nd Saturday
    expect(isBankWorkingDay(new Date("2026-11-07T12:00:00+05:30"))).toBe(true); // 1st Saturday
    expect(isBankWorkingDay(new Date("2026-11-28T12:00:00+05:30"))).toBe(false); // 4th Saturday
    expect(isBankWorkingDay(new Date("2026-10-30T12:00:00+05:30"))).toBe(true); // Friday
  });
  it("excludes the day the communication was received", () => {
    const from = new Date("2026-10-30T09:00:00+05:30"); // Friday
    expect(workingDaysBetween(from, new Date("2026-10-30T20:00:00+05:30"))).toBe(0);
    expect(workingDaysBetween(from, new Date("2026-10-31T10:00:00+05:30"))).toBe(1); // 5th Saturday is working
    expect(workingDaysBetween(from, new Date("2026-11-02T10:00:00+05:30"))).toBe(2); // Sunday skipped
  });
  it("counts across IST day boundaries, not UTC", () => {
    const from = new Date("2026-10-30T23:30:00+05:30"); // 18:00Z, still Friday in IST
    const to = new Date("2026-10-31T00:30:00+05:30");
    expect(workingDaysBetween(from, to)).toBe(1);
  });
});
