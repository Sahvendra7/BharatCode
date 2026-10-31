import { z } from "zod";
import { Channel, PaymentMethod, ScamPattern, SuspectIdKind, Tri } from "./enums";

/**
 * Schemas for what the MODEL returns. Flat, every property required, nullable instead of optional,
 * so they convert to a strict-mode JSON Schema for `text.format`. Lengths are bounded so a runaway
 * response cannot produce unbounded documents.
 */

export const ModelSource = z.object({
  kind: z.enum(["story", "image"]).describe("Where the fact was seen: the person's written story, or a screenshot."),
  image: z.number().int().min(1).max(4).nullable().describe("Screenshot number (1-4) when kind is image, else null."),
  quote: z.string().max(300).describe("The exact words or digits as they appear in the source."),
});
export type ModelSource = z.infer<typeof ModelSource>;

export const ModelTransaction = z.object({
  amount_inr: z.number().nonnegative().max(1_000_000_000).nullable(),
  occurred_at: z.string().max(40).nullable().describe("ISO 8601 with +05:30 offset, from the parse_datetime tool. Null if unknown."),
  reference: z.string().max(40).nullable().describe("UTR / RRN / UPI Ref No. exactly as shown. Null if not visible."),
  method: PaymentMethod,
  payer_bank: z.string().max(80).nullable(),
  payee_upi_id: z.string().max(120).nullable(),
  payee_account: z.string().max(30).nullable(),
  payee_ifsc: z.string().max(15).nullable(),
  payee_name: z.string().max(120).nullable(),
  made_by_victim: Tri.describe("yes if the person made this payment themselves (even if tricked); no if it happened without them."),
  source: ModelSource,
});
export type ModelTransaction = z.infer<typeof ModelTransaction>;

export const ModelIdentifier = z.object({
  kind: SuspectIdKind,
  value: z.string().max(300),
  source: ModelSource,
});
export type ModelIdentifier = z.infer<typeof ModelIdentifier>;

export const ModelCompromise = z.object({
  otp_or_pin_shared: Tri,
  remote_app_installed: Tri,
  remote_app_name: z.string().max(60).nullable(),
  card_details_shared: Tri,
  netbanking_password_shared: Tri,
  unknown_apk_installed: Tri,
});

export const IncidentExtraction = z.object({
  paid: Tri.describe("Did money leave the person's account?"),
  // Named scam_type, not "pattern": BharatCode's structured-output validator rejects any schema key called "pattern".
  scam_type: ScamPattern,
  channel: Channel,
  summary: z.string().max(200).describe("One short sentence (at most 25 words) addressed to the person, e.g. \"Your mother paid ₹48,500 to a fake electricity officer.\""),
  how_it_happened: z
    .string()
    .max(1500)
    .describe("First-person account for a police complaint. No amounts, references, phone numbers, UPI IDs or account numbers: those are added from confirmed facts."),
  transactions: z.array(ModelTransaction).max(10),
  suspect_identifiers: z.array(ModelIdentifier).max(20),
  compromise: ModelCompromise,
  missing_info: z.array(z.string().max(200)).max(6).describe("Short questions about facts needed for the complaint that are not in the evidence."),
});
export type IncidentExtraction = z.infer<typeof IncidentExtraction>;

export const ASKS_FOR = [
  "otp",
  "pin_or_password",
  "card_details",
  "money_upfront",
  "fee_for_job",
  "install_app",
  "screen_share",
  "click_link",
  "scan_qr",
  "personal_documents",
  "video_call",
  "keep_secret",
  "urgent_action",
] as const;
export const AsksFor = z.enum(ASKS_FOR);
export type AsksFor = z.infer<typeof AsksFor>;

export const MessageCheckExtraction = z.object({
  transcript: z.string().max(3000).describe("The suspicious message as written (from the text or screenshots), verbatim where possible."),
  claimed_sender: z.string().max(120).nullable().describe("Who the message claims to be from."),
  scam_type: ScamPattern,
  asks_for: z.array(AsksFor).max(13),
  signals: z
    .array(z.object({ signal: z.string().max(160), quote: z.string().max(300) }))
    .max(10)
    .describe("Warning signs, each with the exact words that show it."),
  suspect_identifiers: z.array(ModelIdentifier).max(20),
  verdict: z.enum(["strong", "warning", "none_found"]),
  explanation: z.string().max(800).describe("Two to four plain sentences for the person."),
});
export type MessageCheckExtraction = z.infer<typeof MessageCheckExtraction>;
