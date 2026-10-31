import { z } from "zod";
import { SCAM_PATTERN_INFO } from "@/data/scam-patterns";
import type { AppTool } from "@/lib/bharatcode/agent";
import { SCAM_PATTERNS } from "@/lib/domain/enums";
import { toStrictJsonSchema } from "@/lib/domain/json-schema";
import { parseIndianDateTime } from "@/lib/time/datetime";
import { checkIdentifier, IDENTIFIER_KINDS, type IdentifierKind } from "@/lib/validators";
import { inspectLink } from "@/lib/validators/url";

/**
 * Tools the model may call. All are pure and read-only: no network access, no side effects,
 * so text injected into a screenshot cannot make them do anything harmful.
 */

const CheckIdentifierArgs = z.object({
  kind: z.enum(IDENTIFIER_KINDS as unknown as [IdentifierKind, ...IdentifierKind[]]).describe("reference = UTR/RRN/UPI Ref No."),
  value: z.string().min(1).max(300),
});

const checkIdentifierTool: AppTool<z.infer<typeof CheckIdentifierArgs>> = {
  name: "check_identifier",
  description:
    "Validate and normalise an identifier you read: a transaction reference (UTR/RRN), UPI ID, IFSC, phone number, bank account number or email. Call it for every identifier before you report it. Returns whether the format is valid, the normalised value and notes.",
  args: CheckIdentifierArgs,
  parameters: toStrictJsonSchema(CheckIdentifierArgs),
  run: ({ kind, value }) => {
    const r = checkIdentifier(kind, value);
    return { valid: r.valid, normalized: r.normalized, label: r.label, flags: r.flags, notes: r.notes };
  },
  summarize: ({ kind, value }, result) => {
    const r = result as { valid: boolean; label: string };
    const names: Record<IdentifierKind, string> = {
      reference: "Reference",
      upi_id: "UPI ID",
      ifsc: "IFSC",
      phone: "Phone",
      account_number: "Account no.",
      email: "Email",
    };
    return `${names[kind]} ${value.slice(0, 48)}: ${r.valid ? r.label : `not valid (${r.label})`}`;
  },
};

const InspectLinkArgs = z.object({ url: z.string().min(1).max(500) });

const inspectLinkTool: AppTool<z.infer<typeof InspectLinkArgs>> = {
  name: "inspect_link",
  description:
    "Inspect a web link from the evidence without opening it: domain, government/bank domain check, brand look-alikes, shorteners, IP hosts, punycode and .apk downloads.",
  args: InspectLinkArgs,
  parameters: toStrictJsonSchema(InspectLinkArgs),
  run: ({ url }) => {
    const r = inspectLink(url);
    return { valid: r.valid, host: r.host, domain: r.registrableDomain, risk: r.risk, flags: r.flags, notes: r.notes };
  },
  summarize: ({ url }, result) => {
    const r = result as { valid: boolean; risk: string; domain: string | null };
    return r.valid ? `Link ${r.domain}: ${r.risk === "none_found" ? "no warning signs in the address" : `${r.risk} risk`}` : `Link ${url.slice(0, 40)}: not a valid address`;
  },
};

const ParseDateTimeArgs = z.object({ text: z.string().min(1).max(80).describe("Date/time exactly as written, e.g. '30/10/26 03:42 PM' or 'today 3:42 pm'.") });

export function parseDateTimeTool(now: Date): AppTool<z.infer<typeof ParseDateTimeArgs>> {
  return {
    name: "parse_datetime",
    description:
      "Convert a date/time as written on an Indian receipt, bank SMS or chat into ISO 8601 India time (+05:30). Numeric dates are day-first. Use the returned iso value for occurred_at.",
    args: ParseDateTimeArgs,
    parameters: toStrictJsonSchema(ParseDateTimeArgs),
    run: ({ text }) => parseIndianDateTime(text, now),
    summarize: ({ text }, result) => {
      const r = result as { iso: string | null; reason?: string };
      return r.iso ? `Date "${text}" → ${r.iso}` : `Date "${text}": couldn't read (${r.reason ?? "unknown"})`;
    },
  };
}

const LookupPatternArgs = z.object({ scam_type: z.enum(SCAM_PATTERNS) });

const lookupPatternTool: AppTool<z.infer<typeof LookupPatternArgs>> = {
  name: "lookup_scam_pattern",
  description: "Get the curated description and typical signs of a fraud pattern, to confirm a classification.",
  args: LookupPatternArgs,
  parameters: toStrictJsonSchema(LookupPatternArgs),
  run: ({ scam_type }) => SCAM_PATTERN_INFO[scam_type],
  summarize: ({ scam_type }) => `Compared with known pattern: ${scam_type.replace(/_/g, " ")}`,
};

export function allTools(now: Date): Array<AppTool<never>> {
  return [checkIdentifierTool, inspectLinkTool, parseDateTimeTool(now), lookupPatternTool] as Array<AppTool<never>>;
}
