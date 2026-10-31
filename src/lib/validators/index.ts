import { checkAccountNumber } from "./account";
import { checkEmail } from "./email";
import { checkIfsc } from "./ifsc";
import { checkPhone } from "./phone";
import { checkReference } from "./reference";
import { CheckResult, IdentifierKind } from "./types";
import { checkUpiId } from "./upi";

export * from "./types";
export { checkAccountNumber, checkEmail, checkIfsc, checkPhone, checkReference, checkUpiId };

export function checkIdentifier(kind: IdentifierKind, value: string): CheckResult {
  switch (kind) {
    case "reference":
      return checkReference(value);
    case "upi_id":
      return checkUpiId(value);
    case "ifsc":
      return checkIfsc(value);
    case "phone":
      return checkPhone(value);
    case "account_number":
      return checkAccountNumber(value);
    case "email":
      return checkEmail(value);
  }
}
