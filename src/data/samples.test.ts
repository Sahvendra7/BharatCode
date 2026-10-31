import { describe, expect, it } from "vitest";
import { Case } from "@/lib/domain/case";
import { buildBankLetter, buildCallSheet, buildComplaint } from "@/lib/engine/documents";
import { buildPlan } from "@/lib/engine/plan";
import { SAMPLES } from "./samples";

describe("sample cases", () => {
  it.each(SAMPLES.map((s) => [s.id, s] as const))("%s is a valid, clearly labelled sample", (_id, s) => {
    expect(Case.safeParse(s.case).success).toBe(true);
    expect(s.case.origin).toBe("sample");
    expect(s.case.transactions.every((t) => t.verification === "sample")).toBe(true);
    const now = new Date("2026-10-30T16:10:00+05:30");
    expect(buildPlan(s.case)[0]!.id).toBe("call_1930");
    for (const doc of [buildCallSheet(s.case), buildComplaint(s.case).text, buildBankLetter(s.case, now)]) {
      expect(doc).toMatch(/SAMPLE: fictional details/);
    }
    // The hand-written narratives contain no numbers, so nothing is stamped.
    expect(buildComplaint(s.case).removed).toEqual([]);
  });
});
