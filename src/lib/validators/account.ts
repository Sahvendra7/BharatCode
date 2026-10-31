import { CheckResult, result } from "./types";

/** Indian bank account numbers are numeric and usually 9 to 18 digits long. */
export function checkAccountNumber(input: string): CheckResult {
  const value = input.replace(/[\s-]/g, "");
  if (/^\d{9,18}$/.test(value)) {
    return result("account_number", input, true, value, `Bank account number (${value.length} digits)`);
  }
  return result("account_number", input, false, null, "Not a valid bank account number", [], [
    "Indian bank account numbers contain only digits, usually 9 to 18 of them.",
  ]);
}
