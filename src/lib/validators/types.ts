export type IdentifierKind = "reference" | "upi_id" | "ifsc" | "phone" | "account_number" | "email";

export const IDENTIFIER_KINDS: readonly IdentifierKind[] = [
  "reference",
  "upi_id",
  "ifsc",
  "phone",
  "account_number",
  "email",
] as const;

/** Result of a deterministic format check. `valid` means "well-formed", never "safe" or "genuine". */
export interface CheckResult {
  kind: IdentifierKind;
  input: string;
  valid: boolean;
  /** Canonical form used for comparisons and documents, or null when the input is not well-formed. */
  normalized: string | null;
  /** Short human description, e.g. "12-digit UPI/IMPS reference". */
  label: string;
  /** Machine-readable signals, e.g. "official_sounding_name". */
  flags: string[];
  /** Plain-language notes for the person. */
  notes: string[];
}

export function result(
  kind: IdentifierKind,
  input: string,
  valid: boolean,
  normalized: string | null,
  label: string,
  flags: string[] = [],
  notes: string[] = [],
): CheckResult {
  return { kind, input, valid, normalized, label, flags, notes };
}

/** Removes whitespace and common separators people type or copy from receipts. */
export function compact(value: string): string {
  return value.replace(/[\s\-–—_.:/]/g, "");
}
