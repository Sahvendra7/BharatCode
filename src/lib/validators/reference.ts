import { CheckResult, compact, result } from "./types";

/**
 * Transaction references as banks and the 1930 helpline ask for them:
 * - UPI and IMPS: a 12-digit RRN (shown as "UTR", "UPI Ref No." or "RRN" in apps and bank SMS)
 * - NEFT: a 16-character UTR starting with the 4-letter bank code
 * - RTGS: a 22-character UTR starting with the 4-letter bank code
 * Payment apps also show their own transaction IDs, which are not what the bank needs.
 */
export function checkReference(input: string): CheckResult {
  const value = compact(input).toUpperCase();
  if (/^\d{12}$/.test(value)) {
    return result("reference", input, true, value, "12-digit UPI/IMPS reference (UTR/RRN)");
  }
  if (/^[A-Z]{4}[A-Z0-9]{12}$/.test(value)) {
    return result("reference", input, true, value, "16-character NEFT UTR");
  }
  if (/^[A-Z]{4}[A-Z0-9]{18}$/.test(value)) {
    return result("reference", input, true, value, "22-character RTGS UTR");
  }
  if (/^T\d{18,}$/.test(value)) {
    return result("reference", input, false, null, "Payment-app transaction ID", ["app_transaction_id"], [
      "This looks like the payment app's own transaction ID, not the UTR. Open the transaction in the app or your bank SMS and look for the 12-digit UTR / UPI Ref No.",
    ]);
  }
  return result("reference", input, false, null, "Unrecognised reference format", [], [
    "A UPI or IMPS reference is 12 digits. NEFT is 16 characters and RTGS 22, both starting with the bank's 4-letter code.",
  ]);
}
