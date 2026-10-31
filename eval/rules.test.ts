import { describe, expect, it } from "vitest";
import { scoreRules } from "./run-rules";

// Regression guard on the developer-authored set. It is not a measure of real-world accuracy.
describe("rule floor on the authored set", () => {
  it("keeps every labelled message on the right side", () => {
    const r = scoreRules();
    expect(r.rows.filter((row) => row.scam !== (row.verdict !== "none_found"))).toEqual([]);
  });
});
