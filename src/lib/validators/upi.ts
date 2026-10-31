import { CheckResult, result } from "./types";

/**
 * UPI handles (the part after "@") we recognise. Not exhaustive: new handles appear regularly,
 * so an unknown handle is noted, never rejected.
 */
const KNOWN_HANDLES = new Set([
  "upi", "ybl", "ibl", "axl", "okaxis", "okhdfcbank", "okicici", "oksbi", "paytm", "ptyes", "ptaxis",
  "pthdfc", "ptsbi", "apl", "yapl", "rapl", "axisbank", "axisb", "icici", "sbi", "hdfcbank", "kotak",
  "kmbl", "yesbank", "yesbankltd", "idfcfirst", "idfcbank", "indus", "federal", "fbl", "pnb", "barodampay",
  "unionbank", "uboi", "cnrb", "boi", "aubank", "rbl", "jupiteraxis", "fam", "freecharge", "airtel",
  "postbank", "jio", "slice", "naviaxis", "superyes", "waicici", "waaxis", "wahdfcbank", "wasbi", "abfspay",
  "dbs", "citi", "hsbc", "sc", "kvb", "kbl", "equitas", "ujjivan", "bandhan", "dlb", "cub", "tmb", "sib",
  "csbpay", "jkb", "idbi", "mahb", "iob", "ucobank", "centralbank", "psb", "indianbank", "allbank",
]);

/** Words that make a personal UPI ID look like an official collection account. */
const OFFICIAL_SOUNDING = [
  "refund", "helpdesk", "support", "customercare", "care", "govt", "gov", "rbi", "police", "cyber", "kyc",
  "electricity", "bijli", "power", "customs", "court", "income", "tax", "bank", "official", "verify",
  "service", "department", "ministry", "trai", "npci", "sbi", "hdfc", "icici", "axis",
];

export function checkUpiId(input: string): CheckResult {
  const value = input.trim().toLowerCase();
  const match = /^([a-z0-9._-]{2,256})@([a-z][a-z0-9]{1,63})$/.exec(value);
  if (!match) {
    return result("upi_id", input, false, null, "Not a valid UPI ID format", [], [
      "A UPI ID looks like name@handle, for example rahul.sharma@oksbi.",
    ]);
  }
  const [, user = "", handle = ""] = match;
  const flags: string[] = [];
  const notes: string[] = [];

  if (/^[6-9]\d{9}$/.test(user)) {
    flags.push("phone_number_handle");
    notes.push("This UPI ID is built from a mobile number. Note that number as well.");
  }
  const officialWord = OFFICIAL_SOUNDING.find((w) => user.includes(w));
  if (officialWord) {
    flags.push("official_sounding_name");
    notes.push(
      `The name contains "${officialWord}". Anyone can create a UPI ID with an official-sounding name; it proves nothing about who receives the money.`,
    );
  }
  if (!KNOWN_HANDLES.has(handle)) {
    notes.push(`The handle "@${handle}" is not in our list of common handles. It may still be valid.`);
  }
  return result("upi_id", input, true, value, `UPI ID (handle @${handle})`, flags, notes);
}
