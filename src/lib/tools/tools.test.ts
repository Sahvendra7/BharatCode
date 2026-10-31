import { describe, expect, it } from "vitest";
import { allTools } from "./index";

describe("tool definitions", () => {
  it("never use a parameter key named \"pattern\" (rejected by BharatCode's schema validator)", () => {
    for (const tool of allTools(new Date())) expect(JSON.stringify(tool.parameters)).not.toContain('"pattern"');
  });
});
