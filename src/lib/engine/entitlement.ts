import { RBI_LIABILITY_CIRCULAR } from "@/data/official-channels";
import type { AccountType } from "@/lib/domain/enums";
import type { Case } from "@/lib/domain/case";
import { workingDaysBetween } from "@/lib/time/working-days";
import { formatInr } from "./format";

/**
 * What RBI's 2017 circular on unauthorised electronic banking transactions says about this case.
 * Encodes only the circular's own text (paras 6, 7, 9 and Tables 1-2). It does not predict outcomes.
 */
export type EntitlementKind =
  | "not_applicable"
  | "authorised_payment"
  | "unauthorised_third_party"
  | "unauthorised_credentials_shared"
  | "mixed_or_unclear";

export type LiabilityBand = "zero" | "capped" | "bank_policy" | "unknown";

export interface Entitlement {
  kind: EntitlementKind;
  headline: string;
  points: string[];
  workingDays: number | null;
  band: LiabilityBand | null;
  maxLiabilityInr: number | null;
  source: typeof RBI_LIABILITY_CIRCULAR;
}

/** Table 1 of the circular: maximum customer liability for reports made in 4-7 working days. */
const TABLE_1_CAP: Record<Exclude<AccountType, "unknown">, number> = {
  bsbd: 5_000,
  savings: 10_000,
  prepaid: 10_000,
  current_small: 10_000,
  credit_card_small: 10_000,
  current_other: 25_000,
  credit_card_large: 25_000,
};

const TABLE_1_TEXT =
  "Table 1 caps: ₹5,000 for basic savings (BSBD) accounts; ₹10,000 for other savings accounts, prepaid instruments, small-business and individual current/OD accounts (average balance or limit up to ₹25 lakh) and credit cards with limit up to ₹5 lakh; ₹25,000 for other current/OD accounts and credit cards above ₹5 lakh.";

export function assessEntitlement(c: Case, now: Date): Entitlement {
  const base = { workingDays: null, band: null, maxLiabilityInr: null, source: RBI_LIABILITY_CIRCULAR };
  if (c.paid === "no" || c.transactions.length === 0) {
    return { ...base, kind: "not_applicable", headline: "No transaction recorded yet.", points: [] };
  }

  const madeByVictim = c.transactions.filter((t) => t.madeByVictim === "yes");
  const unauthorised = c.transactions.filter((t) => t.madeByVictim === "no");
  const credentialsShared = [
    c.compromise.otpOrPinShared,
    c.compromise.cardDetailsShared,
    c.compromise.netbankingPasswordShared,
  ].includes("yes");

  if (madeByVictim.length && !unauthorised.length) {
    return {
      ...base,
      kind: "authorised_payment",
      headline: "A payment you made yourself, even if you were tricked, is usually not covered by RBI's zero-liability rule.",
      points: [
        "RBI's 2017 circular limits your liability for unauthorised transactions: ones you did not make. Payments you approved yourself fall outside it in most cases.",
        "Your best chance is speed: a complaint through 1930 / cybercrime.gov.in lets banks try to hold money still sitting in the receiving account.",
        "Ask your bank to raise a fraud dispute with the receiving bank anyway, and keep the complaint reference.",
      ],
    };
  }

  if (unauthorised.length && !madeByVictim.length) {
    if (credentialsShared) {
      return {
        ...base,
        kind: "unauthorised_credentials_shared",
        headline: "Because a PIN, OTP, password or card detail was shared, the circular puts the loss on you until you report it. Report now.",
        points: [
          "Para 7(i) of the circular: where the loss is due to the customer's negligence, such as sharing payment credentials, the customer bears the loss until the unauthorised transaction is reported to the bank.",
          "Any loss that happens after you report is borne by the bank, so reporting immediately protects you from further debits.",
          "Whether the bank treats it as negligence is the bank's decision, and the circular puts the burden of proving customer liability on the bank.",
        ],
      };
    }
    const phoneCaveat =
      c.compromise.remoteAppInstalled === "yes" || c.compromise.unknownApkInstalled === "yes"
        ? ["An app was installed at the scammer's request. The bank may argue this was negligence; the circular puts the burden of proving customer liability on the bank."]
        : [];
    if (!c.discoveredAt) {
      return {
        ...base,
        kind: "unauthorised_third_party",
        band: "unknown",
        headline: "Add when you first learned of the transaction (usually the bank's SMS) to see which RBI time band applies.",
        points: [
          "RBI counts working days from the day you received the bank's communication about the transaction, excluding that day.",
        ],
      };
    }
    const days = workingDaysBetween(new Date(c.discoveredAt), now);
    const value = unauthorised.reduce((s, t) => s + (t.amountInr ?? 0), 0);
    const common = [
      "On being notified, the bank must credit the disputed amount to your account (a \"shadow reversal\") within 10 working days, value-dated to the transaction date (para 9).",
      "The bank must resolve the complaint within its board-approved timeline, not exceeding 90 days (para 10).",
      "Working days are approximated as Monday–Saturday except the 2nd and 4th Saturdays. Public holidays at your home branch are not counted here; check with the bank.",
    ];
    if (days <= 3) {
      return {
        ...base,
        kind: "unauthorised_third_party",
        workingDays: days,
        band: "zero",
        maxLiabilityInr: 0,
        headline: `Reported within 3 working days (${days} so far): the circular gives zero liability for a third-party breach.`,
        points: [
          ...phoneCaveat,
          "Para 6(ii): zero liability where the fault lies neither with the bank nor with you, and you notify the bank within three working days of receiving its communication.",
          ...common,
        ],
      };
    }
    if (days <= 7) {
      const cap = c.victim.accountType === "unknown" ? null : TABLE_1_CAP[c.victim.accountType];
      const max = cap === null ? null : Math.min(cap, value || cap);
      return {
        ...base,
        kind: "unauthorised_third_party",
        workingDays: days,
        band: "capped",
        maxLiabilityInr: max,
        headline:
          max === null
            ? `Reported in ${days} working days: your liability is capped by account type (Table 1), or the transaction value if lower.`
            : `Reported in ${days} working days: your liability is capped at ${formatInr(max)} (Table 1, or the transaction value if lower).`,
        points: [...phoneCaveat, TABLE_1_TEXT, ...common],
      };
    }
    return {
      ...base,
      kind: "unauthorised_third_party",
      workingDays: days,
      band: "bank_policy",
      headline: `More than 7 working days (${days}): liability is decided by your bank's board-approved policy.`,
      points: [...phoneCaveat, "Ask the bank for its customer-liability policy in writing; banks must share it.", ...common],
    };
  }

  return {
    ...base,
    kind: "mixed_or_unclear",
    headline: "Mark for each transaction whether you made it yourself. RBI's rules differ for payments you made and ones you didn't.",
    points: [
      "Unauthorised transactions (ones you did not make) can qualify for zero or limited liability if reported quickly.",
      "Payments you made yourself under deception usually depend on holding funds through 1930.",
    ],
  };
}
