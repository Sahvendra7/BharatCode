import { z } from "zod";

type JsonSchema = Record<string, unknown>;

/**
 * Converts a zod schema into a JSON Schema suitable for strict structured output:
 * every object lists all its properties as required and forbids additional ones, and
 * nullable fields are expressed with anyOf. Descriptions are kept because they guide the model.
 */
export function toStrictJsonSchema(schema: z.ZodType): JsonSchema {
  const raw = z.toJSONSchema(schema, { target: "draft-7", io: "output" }) as JsonSchema;
  delete raw.$schema;
  return strictify(raw);
}

function strictify(node: unknown): JsonSchema {
  if (Array.isArray(node)) return node.map(strictify) as unknown as JsonSchema;
  if (!node || typeof node !== "object") return node as JsonSchema;
  const out: JsonSchema = {};
  for (const [key, value] of Object.entries(node as JsonSchema)) {
    out[key] = value && typeof value === "object" ? strictify(value) : value;
  }
  if (out.type === "object" && out.properties && typeof out.properties === "object") {
    out.required = Object.keys(out.properties as object);
    out.additionalProperties = false;
  }
  return out;
}

/** Throws if a schema breaks strict-mode rules. Used by tests and at startup in development. */
export function assertStrict(schema: JsonSchema, path = "$"): void {
  if (schema.type === "object") {
    const props = Object.keys((schema.properties as object) ?? {});
    const required = (schema.required as string[]) ?? [];
    const missing = props.filter((p) => !required.includes(p));
    if (missing.length) throw new Error(`${path}: properties not required: ${missing.join(", ")}`);
    if (schema.additionalProperties !== false) throw new Error(`${path}: additionalProperties must be false`);
  }
  for (const [key, value] of Object.entries(schema)) {
    if (value && typeof value === "object") {
      if (Array.isArray(value)) value.forEach((v, i) => v && typeof v === "object" && assertStrict(v as JsonSchema, `${path}.${key}[${i}]`));
      else assertStrict(value as JsonSchema, `${path}.${key}`);
    }
  }
}
