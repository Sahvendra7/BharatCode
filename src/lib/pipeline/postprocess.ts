import { newId, emptyCase, type Case, type CaseIdentifier, type CaseSource, type CaseTransaction, type Verification } from "@/lib/domain/case";
import type { IncidentExtraction, ModelIdentifier, ModelSource } from "@/lib/domain/extraction";
import { checkAccountNumber, checkEmail, checkIfsc, checkPhone, checkReference, checkUpiId } from "@/lib/validators";
import { inspectLink } from "@/lib/validators/url";

export interface PostprocessWarning {
  field: string;
  message: string;
}

const normalizeText = (s: string) => s.toLowerCase().replace(/[\s,]+/g, " ").replace(/[“”"'`]/g, "").trim();
const digits = (s: string) => s.replace(/\D/g, "");

/** A story quote counts as verified only if it really occurs in what the person wrote. */
function verify(source: ModelSource, story: string, imageCount: number): { source: CaseSource; verification: Verification } {
  if (source.kind === "image") {
    const image = source.image && source.image <= imageCount ? source.image : null;
    return { source: { kind: "image", image, quote: source.quote || null }, verification: "ai_read_image" };
  }
  const found = !!source.quote && normalizeText(story).includes(normalizeText(source.quote));
  return { source: { kind: "story", image: null, quote: source.quote || null }, verification: found ? "verified_in_story" : "unverified" };
}

/** True if a value (e.g. a UTR) visibly appears in its own quoted source text. */
function valueInQuote(value: string, quote: string | null): boolean {
  if (!quote) return false;
  const v = digits(value).length >= 6 ? digits(value) : value.toLowerCase().replace(/\s/g, "");
  const q = digits(value).length >= 6 ? digits(quote) : quote.toLowerCase().replace(/\s/g, "");
  return q.includes(v);
}

function normalizeIdentifier(id: ModelIdentifier): { value: string; valid: boolean } {
  switch (id.kind) {
    case "phone": {
      const r = checkPhone(id.value);
      return { value: r.normalized ?? id.value.trim(), valid: r.valid };
    }
    case "upi_id": {
      const r = checkUpiId(id.value);
      return { value: r.normalized ?? id.value.trim(), valid: r.valid };
    }
    case "email": {
      const r = checkEmail(id.value);
      return { value: r.normalized ?? id.value.trim(), valid: r.valid };
    }
    case "account_number": {
      const r = checkAccountNumber(id.value);
      return { value: r.normalized ?? id.value.trim(), valid: r.valid };
    }
    case "url":
      return { value: id.value.trim(), valid: inspectLink(id.value).valid };
    default:
      return { value: id.value.trim(), valid: true };
  }
}

/**
 * Turns the model's extraction into an editable Case. Deterministic: re-validates every identifier
 * (the model's own claims about validity are ignored), checks story quotes against the story, labels
 * screenshot-derived facts for human checking, and records anything suspicious as a warning.
 */
export function extractionToCase(
  x: IncidentExtraction,
  ctx: { story: string; imageCount: number; discoveredAt: string | null; requestIds: string[] },
): { case: Case; warnings: PostprocessWarning[] } {
  const warnings: PostprocessWarning[] = [];
  const c = emptyCase("ai");
  c.paid = x.paid;
  c.pattern = x.scam_type;
  c.channel = x.channel;
  c.summary = x.summary;
  c.howItHappened = x.how_it_happened;
  c.discoveredAt = ctx.discoveredAt;
  c.missingInfo = x.missing_info;
  c.requestIds = ctx.requestIds.slice(0, 10);
  c.compromise = {
    otpOrPinShared: x.compromise.otp_or_pin_shared,
    remoteAppInstalled: x.compromise.remote_app_installed,
    remoteAppName: x.compromise.remote_app_name,
    cardDetailsShared: x.compromise.card_details_shared,
    netbankingPasswordShared: x.compromise.netbanking_password_shared,
    unknownApkInstalled: x.compromise.unknown_apk_installed,
  };

  c.transactions = x.transactions.map((t, i): CaseTransaction => {
    const label = `Transaction ${i + 1}`;
    const { source, verification } = verify(t.source, ctx.story, ctx.imageCount);
    if (verification === "unverified") warnings.push({ field: label, message: "Its quoted text wasn't found in your story; it may come from a screenshot. Check every detail." });

    const rawReference = t.reference?.trim() || null;
    let reference = rawReference;
    if (rawReference) {
      const r = checkReference(rawReference);
      if (r.valid && r.normalized) reference = r.normalized;
      else warnings.push({ field: `${label} reference`, message: `"${rawReference}" is not a valid UTR/RRN format. ${r.notes[0] ?? ""}`.trim() });
      if (!valueInQuote(rawReference, source.quote) && !(source.kind === "story" && digits(ctx.story).includes(digits(rawReference)))) {
        warnings.push({ field: `${label} reference`, message: "This reference doesn't appear in the quoted text. Compare it with your screenshot." });
      }
    }

    let occurredAt = t.occurred_at;
    if (occurredAt && Number.isNaN(new Date(occurredAt).getTime())) {
      warnings.push({ field: `${label} date`, message: `Couldn't read the date "${occurredAt}". Please enter it.` });
      occurredAt = null;
    }

    // Malformed identifiers are left out rather than copied into documents; the person is told what was dropped.
    const upi = t.payee_upi_id ? checkUpiId(t.payee_upi_id) : null;
    if (upi && !upi.valid) warnings.push({ field: `${label} UPI ID`, message: `Left out "${t.payee_upi_id}": not a valid UPI ID. Add the right one if you have it.` });
    const ifsc = t.payee_ifsc ? checkIfsc(t.payee_ifsc) : null;
    if (ifsc && !ifsc.valid) warnings.push({ field: `${label} IFSC`, message: `Left out "${t.payee_ifsc}": not a valid IFSC.` });
    const account = t.payee_account ? checkAccountNumber(t.payee_account) : null;
    let payeeName = t.payee_name;
    if (account && !account.valid) {
      if (!payeeName && /^[A-Za-z][A-Za-z .&'-]+$/.test(t.payee_account!.trim())) {
        payeeName = t.payee_account!.trim();
        warnings.push({ field: `${label} account`, message: `"${payeeName}" looks like a name, not an account number, so it was used as the receiver's name.` });
      } else {
        warnings.push({ field: `${label} account`, message: `Left out "${t.payee_account}": not a valid account number.` });
      }
    }

    return {
      id: newId("tx"),
      amountInr: t.amount_inr,
      occurredAt,
      reference,
      method: t.method,
      payerBank: t.payer_bank,
      payeeUpiId: upi?.valid ? upi.normalized : null,
      payeeAccount: account?.valid ? account.normalized : null,
      payeeIfsc: ifsc?.valid ? ifsc.normalized : null,
      payeeName,
      madeByVictim: t.made_by_victim,
      source,
      verification,
    };
  });

  const seen = new Set<string>();
  c.suspect = x.suspect_identifiers.flatMap((id): CaseIdentifier[] => {
    const { value, valid } = normalizeIdentifier(id);
    const key = `${id.kind}:${value.toLowerCase()}`;
    if (seen.has(key)) return [];
    seen.add(key);
    if (!valid) {
      warnings.push({ field: "Suspect details", message: `Left out "${id.value}": not a valid ${id.kind.replace("_", " ")}.` });
      return [];
    }
    const { source, verification } = verify(id.source, ctx.story, ctx.imageCount);
    return [{ id: newId("sid"), kind: id.kind, value, source, verification }];
  });

  // A recorded payment with an amount means money left the account, whatever the model answered for "paid".
  if (c.paid !== "yes" && c.transactions.some((t) => (t.amountInr ?? 0) > 0)) {
    warnings.push({ field: "Money lost", message: "Payments were found in your evidence, so this is treated as money lost. Change it if that's wrong." });
    c.paid = "yes";
  }
  if (c.paid === "yes" && c.transactions.length === 0) {
    warnings.push({ field: "Transactions", message: "No payment details were found. Add them from your bank SMS or payment app." });
  }
  return { case: c, warnings };
}
