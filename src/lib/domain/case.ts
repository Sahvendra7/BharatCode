import { z } from "zod";
import { AccountType, Channel, PaymentMethod, ScamPattern, SuspectIdKind, Tri } from "./enums";

/**
 * The editable case the person reviews. Every record keeps where it came from and how much to trust it,
 * so the UI can say "read by AI from screenshot 2: check it" instead of presenting guesses as facts.
 */

export const Verification = z.enum([
  "verified_in_story", // quote found verbatim in the person's own text
  "ai_read_image", // read by the model from a screenshot; the person must check it
  "unverified", // model said it came from the story but the quote was not found
  "user_entered", // typed or edited by the person
  "sample", // hand-written sample case
]);
export type Verification = z.infer<typeof Verification>;

export const CaseSource = z.object({
  kind: z.enum(["story", "image", "user", "sample"]),
  image: z.number().int().min(1).max(4).nullable(),
  quote: z.string().max(300).nullable(),
});
export type CaseSource = z.infer<typeof CaseSource>;

export const CaseTransaction = z.object({
  id: z.string(),
  amountInr: z.number().nonnegative().nullable(),
  occurredAt: z.string().nullable(),
  reference: z.string().nullable(),
  method: PaymentMethod,
  payerBank: z.string().nullable(),
  payeeUpiId: z.string().nullable(),
  payeeAccount: z.string().nullable(),
  payeeIfsc: z.string().nullable(),
  payeeName: z.string().nullable(),
  madeByVictim: Tri,
  source: CaseSource,
  verification: Verification,
});
export type CaseTransaction = z.infer<typeof CaseTransaction>;

export const CaseIdentifier = z.object({
  id: z.string(),
  kind: SuspectIdKind,
  value: z.string(),
  source: CaseSource,
  verification: Verification,
});
export type CaseIdentifier = z.infer<typeof CaseIdentifier>;

export const Compromise = z.object({
  otpOrPinShared: Tri,
  remoteAppInstalled: Tri,
  remoteAppName: z.string().nullable(),
  cardDetailsShared: Tri,
  netbankingPasswordShared: Tri,
  unknownApkInstalled: Tri,
});
export type Compromise = z.infer<typeof Compromise>;

export const Victim = z.object({
  name: z.string().max(120),
  phone: z.string().max(20),
  email: z.string().max(120),
  address: z.string().max(300),
  bankName: z.string().max(80),
  accountLast4: z.string().max(4),
  accountType: AccountType,
});
export type Victim = z.infer<typeof Victim>;

export const Case = z.object({
  version: z.literal(1),
  origin: z.enum(["ai", "manual", "sample"]),
  sampleId: z.string().nullable(),
  paid: Tri,
  pattern: ScamPattern,
  channel: Channel,
  summary: z.string().max(400),
  howItHappened: z.string().max(1500),
  discoveredAt: z.string().nullable(),
  transactions: z.array(CaseTransaction).max(10),
  suspect: z.array(CaseIdentifier).max(20),
  compromise: Compromise,
  victim: Victim,
  missingInfo: z.array(z.string()).max(6),
  /** BharatCode request ids for support, never secret. */
  requestIds: z.array(z.string()).max(10),
});
export type Case = z.infer<typeof Case>;

export const EMPTY_VICTIM: Victim = {
  name: "",
  phone: "",
  email: "",
  address: "",
  bankName: "",
  accountLast4: "",
  accountType: "unknown",
};

export const EMPTY_COMPROMISE: Compromise = {
  otpOrPinShared: "unknown",
  remoteAppInstalled: "unknown",
  remoteAppName: null,
  cardDetailsShared: "unknown",
  netbankingPasswordShared: "unknown",
  unknownApkInstalled: "unknown",
};

let counter = 0;
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
}

export function emptyCase(origin: Case["origin"] = "manual"): Case {
  return {
    version: 1,
    origin,
    sampleId: null,
    paid: "yes",
    pattern: "unknown",
    channel: "unknown",
    summary: "",
    howItHappened: "",
    discoveredAt: null,
    transactions: [],
    suspect: [],
    compromise: { ...EMPTY_COMPROMISE },
    victim: { ...EMPTY_VICTIM },
    missingInfo: [],
    requestIds: [],
  };
}

export function emptyTransaction(): CaseTransaction {
  return {
    id: newId("tx"),
    amountInr: null,
    occurredAt: null,
    reference: null,
    method: "upi",
    payerBank: null,
    payeeUpiId: null,
    payeeAccount: null,
    payeeIfsc: null,
    payeeName: null,
    madeByVictim: "yes",
    source: { kind: "user", image: null, quote: null },
    verification: "user_entered",
  };
}
