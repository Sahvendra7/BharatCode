import type { Case, CaseTransaction } from "@/lib/domain/case";
import { CHANNEL_LABELS, METHOD_LABELS, PATTERN_LABELS } from "@/lib/domain/enums";
import { formatIst } from "@/lib/time/datetime";
import { assessEntitlement } from "./entitlement";
import { applyFactLock } from "./fact-lock";
import { formatInr, totalLost } from "./format";

const MISSING = "(not found yet: check your bank SMS or payment app)";
const SAMPLE_BANNER = "*** SAMPLE: fictional details for demonstration. Do not submit. ***";

function orMissing(value: string | null | undefined): string {
  return value && value.trim() ? value.trim() : MISSING;
}

function placeholder(value: string, label: string): string {
  return value.trim() ? value.trim() : `[${label}]`;
}

function txLines(t: CaseTransaction, i: number, bilingual: boolean): string[] {
  const L = (en: string, hi: string) => (bilingual ? `${en} / ${hi}` : en);
  const lines = [
    `${L("Transaction", "लेन-देन")} ${i + 1}`,
    `  ${L("Amount", "राशि")}: ${t.amountInr === null ? MISSING : formatInr(t.amountInr)}`,
    `  ${L("Date & time", "तारीख और समय")}: ${t.occurredAt ? formatIst(t.occurredAt) : MISSING}`,
    `  ${L("Method", "तरीका")}: ${METHOD_LABELS[t.method]}`,
    `  ${L("UTR / reference no.", "UTR / संदर्भ संख्या")}: ${orMissing(t.reference)}`,
  ];
  if (t.payeeUpiId) lines.push(`  ${L("Paid to UPI ID", "किस UPI ID पर भेजा")}: ${t.payeeUpiId}`);
  if (t.payeeAccount) lines.push(`  ${L("Paid to account no.", "किस खाते में भेजा")}: ${t.payeeAccount}`);
  if (t.payeeIfsc) lines.push(`  IFSC: ${t.payeeIfsc}`);
  if (t.payeeName) lines.push(`  ${L("Name shown for receiver", "पाने वाले का नाम")}: ${t.payeeName}`);
  if (!t.payeeUpiId && !t.payeeAccount) lines.push(`  ${L("Paid to", "किसको भेजा")}: ${MISSING}`);
  if (t.payerBank) lines.push(`  ${L("From my bank", "मेरा बैंक")}: ${t.payerBank}`);
  lines.push(
    `  ${L("Made by me?", "क्या मैंने किया?")}: ${t.madeByVictim === "yes" ? "Yes, I was tricked into paying" : t.madeByVictim === "no" ? "No, I did not make this transaction" : "Not sure"}`,
  );
  return lines;
}

function suspectLines(c: Case): string[] {
  const label: Record<string, string> = {
    phone: "Phone number",
    upi_id: "UPI ID",
    url: "Website / link",
    account_number: "Bank account",
    email: "Email",
    other: "Other",
  };
  return c.suspect.map((s) => `  ${label[s.kind] ?? s.kind}: ${s.value}`);
}

/** What to read out on the 1930 call. Short lines, English with Hindi labels. */
export function buildCallSheet(c: Case): string {
  const lines: string[] = [];
  if (c.origin === "sample") lines.push(SAMPLE_BANNER, "");
  lines.push(
    "1930 CALL SHEET / 1930 कॉल शीट",
    "",
    "Say: \"I want to report an online financial fraud.\"",
    "बोलें: \"मुझे ऑनलाइन वित्तीय धोखाधड़ी की शिकायत दर्ज करनी है।\"",
    "",
    `My name / मेरा नाम: ${placeholder(c.victim.name, "your name")}`,
    `My mobile / मेरा मोबाइल: ${placeholder(c.victim.phone, "your mobile number")}`,
    `My bank / मेरा बैंक: ${placeholder(c.victim.bankName || c.transactions[0]?.payerBank || "", "your bank")}${c.victim.accountLast4 ? ` (account ending ${c.victim.accountLast4})` : ""}`,
    `Type of fraud / धोखाधड़ी का प्रकार: ${PATTERN_LABELS[c.pattern]}`,
    "",
  );
  c.transactions.forEach((t, i) => lines.push(...txLines(t, i, true), ""));
  if (c.transactions.length > 1) {
    lines.push(`Total lost / कुल नुकसान: ${formatInr(totalLost(c.transactions.map((t) => t.amountInr)))}`, "");
  }
  if (c.suspect.length) lines.push("Fraudster's details / ठग की जानकारी:", ...suspectLines(c), "");
  lines.push(
    "Ask: \"Please give me the acknowledgement number.\"",
    "पूछें: \"कृपया मुझे शिकायत की पावती संख्या (acknowledgement number) दीजिए।\"",
    "Acknowledgement no. / पावती संख्या: ____________________",
  );
  return lines.join("\n");
}

export interface ComplaintDraft {
  text: string;
  removed: string[];
}

/** Draft for the cybercrime.gov.in financial-fraud complaint, in the order the portal asks. */
export function buildComplaint(c: Case): ComplaintDraft {
  const story = applyFactLock(c.howItHappened.trim(), c);
  const total = totalLost(c.transactions.map((t) => t.amountInr));
  const first = c.transactions
    .map((t) => t.occurredAt)
    .filter((d): d is string => !!d)
    .sort()[0];

  const facts: string[] = [];
  if (c.transactions.length) {
    const parts = c.transactions.map((t) => {
      const bits = [t.amountInr === null ? "an amount I am confirming" : formatInr(t.amountInr)];
      if (t.occurredAt) bits.push(`on ${formatIst(t.occurredAt)}`);
      if (t.payeeUpiId) bits.push(`to UPI ID ${t.payeeUpiId}`);
      else if (t.payeeAccount) bits.push(`to account ${t.payeeAccount}${t.payeeIfsc ? ` (IFSC ${t.payeeIfsc})` : ""}`);
      if (t.reference) bits.push(`(UTR/reference ${t.reference})`);
      return bits.join(" ");
    });
    const verb = c.transactions.every((t) => t.madeByVictim === "no") ? "The following unauthorised transactions were made from my account:" : "As a result I transferred:";
    facts.push(`${verb} ${parts.join("; ")}.`);
    if (c.transactions.length > 1) facts.push(`Total loss: ${formatInr(total)}.`);
  }
  const phones = c.suspect.filter((s) => s.kind === "phone").map((s) => s.value);
  if (phones.length) facts.push(`The fraudster used the phone number(s) ${phones.join(", ")}.`);
  if (c.compromise.remoteAppInstalled === "yes") {
    facts.push(`I was asked to install ${c.compromise.remoteAppName || "a remote-access app"} on my phone.`);
  }
  if (c.compromise.otpOrPinShared === "yes") facts.push("I was manipulated into sharing an OTP/PIN.");
  facts.push("I request that the beneficiary accounts be frozen and the amount be recovered and returned to me.");

  const lines: string[] = [];
  if (c.origin === "sample") lines.push(SAMPLE_BANNER, "");
  lines.push(
    "COMPLAINT DRAFT: cybercrime.gov.in → Report Cyber Crime → Financial Fraud",
    "",
    "Category: Online Financial Fraud",
    `Type: ${PATTERN_LABELS[c.pattern]}`,
    `Approximate date and time of incident: ${first ? formatIst(first) : MISSING}`,
    `Where it happened: ${CHANNEL_LABELS[c.channel]}`,
    "",
    "Incident details:",
    [story.text, ...facts].filter(Boolean).join(" "),
    "",
  );
  if (c.transactions.length) {
    lines.push("Transaction details (enter each in the portal's transaction section):");
    c.transactions.forEach((t, i) => lines.push(...txLines(t, i, false)));
    lines.push("");
  }
  if (c.suspect.length) lines.push("Suspect details:", ...suspectLines(c), "");
  lines.push(
    "Evidence to upload: screenshots of the payment(s) and bank SMS, the messages/chats with the fraudster, and call logs showing the numbers.",
    "1930 acknowledgement number (if you called): ____________________",
  );
  return { text: lines.join("\n"), removed: story.removed };
}

/** Written complaint to the person's bank. */
export function buildBankLetter(c: Case, now: Date): string {
  const entitlement = assessEntitlement(c, now);
  const bank = c.victim.bankName || c.transactions[0]?.payerBank || "";
  const lines: string[] = [];
  if (c.origin === "sample") lines.push(SAMPLE_BANNER, "");
  lines.push(
    `Date: ${formatIst(now, false)}`,
    "",
    "To,",
    "The Branch Manager / Grievance Redressal Officer,",
    placeholder(bank, "Bank name and branch"),
    "",
    "Subject: Report of fraudulent transaction(s): request to block, dispute and recover",
    "",
    "Dear Sir/Madam,",
    "",
    `I, ${placeholder(c.victim.name, "your name")}, holder of account ending ${placeholder(c.victim.accountLast4, "last 4 digits")}, report the following transaction(s) as fraud:`,
    "",
  );
  c.transactions.forEach((t, i) => lines.push(...txLines(t, i, false), ""));
  if (c.discoveredAt) lines.push(`I first learned of this on ${formatIst(c.discoveredAt)}.`);
  lines.push(
    "I request you to:",
    "1. Block the debit card / UPI / net banking linked to my account as needed to prevent further loss.",
    "2. Raise a fraud dispute with the beneficiary bank(s) and request them to hold the credited funds.",
    "3. Give me a written acknowledgement with a complaint reference number.",
  );
  if (entitlement.kind === "unauthorised_third_party" || entitlement.kind === "unauthorised_credentials_shared") {
    lines.push(
      "4. As these are unauthorised electronic banking transactions, credit the amount to my account (shadow reversal) within 10 working days as required by RBI circular DBR.No.Leg.BC.78/09.07.005/2017-18 dated 6 July 2017, and share the bank's customer-liability policy with me.",
    );
  }
  lines.push(
    "",
    "I have also reported this on the National Cyber Crime Helpline 1930 / cybercrime.gov.in. Acknowledgement number: ____________________",
    "",
    "Yours faithfully,",
    placeholder(c.victim.name, "your name"),
    placeholder(c.victim.phone, "your mobile number"),
    c.victim.email || "[your registered email]",
  );
  return lines.join("\n");
}
