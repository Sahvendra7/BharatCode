import { describe, expect, it } from "vitest";
import { IncidentExtraction, MessageCheckExtraction } from "./extraction";
import { assertStrict, toStrictJsonSchema } from "./json-schema";

describe("structured-output JSON Schemas", () => {
  it.each([
    ["IncidentExtraction", IncidentExtraction],
    ["MessageCheckExtraction", MessageCheckExtraction],
  ])("%s converts to a strict-mode schema", (_name, schema) => {
    const json = toStrictJsonSchema(schema);
    expect(json.type).toBe("object");
    expect(() => assertStrict(json)).not.toThrow();
    expect(JSON.stringify(json)).not.toContain("$schema");
  });

  it("keeps nullability and descriptions", () => {
    const json = toStrictJsonSchema(IncidentExtraction) as {
      properties: Record<string, { properties?: Record<string, unknown>; items?: { properties: Record<string, unknown> } }>;
    };
    const tx = json.properties.transactions!.items!.properties;
    expect(JSON.stringify(tx.reference)).toContain("null");
    expect(JSON.stringify(json.properties.how_it_happened)).toContain("No amounts");
  });

  it("never sends a key named \"pattern\" (BharatCode rejects it as regex structured output)", () => {
    for (const schema of [IncidentExtraction, MessageCheckExtraction]) {
      expect(JSON.stringify(toStrictJsonSchema(schema))).not.toContain('"pattern"');
    }
  });

  it("assertStrict detects violations", () => {
    expect(() => assertStrict({ type: "object", properties: { a: { type: "string" } }, required: [] })).toThrow();
    expect(() =>
      assertStrict({ type: "object", properties: { a: { type: "string" } }, required: ["a"], additionalProperties: true }),
    ).toThrow();
  });
});
