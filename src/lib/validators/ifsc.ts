import { CheckResult, compact, result } from "./types";

/** First four characters of the IFSC identify the bank. A partial list of common banks. */
export const IFSC_BANKS: Record<string, string> = {
  SBIN: "State Bank of India",
  HDFC: "HDFC Bank",
  ICIC: "ICICI Bank",
  UTIB: "Axis Bank",
  KKBK: "Kotak Mahindra Bank",
  PUNB: "Punjab National Bank",
  BARB: "Bank of Baroda",
  CNRB: "Canara Bank",
  UBIN: "Union Bank of India",
  BKID: "Bank of India",
  IDIB: "Indian Bank",
  CBIN: "Central Bank of India",
  IOBA: "Indian Overseas Bank",
  UCBA: "UCO Bank",
  MAHB: "Bank of Maharashtra",
  PSIB: "Punjab & Sind Bank",
  YESB: "Yes Bank",
  INDB: "IndusInd Bank",
  IDFB: "IDFC First Bank",
  FDRL: "Federal Bank",
  RATN: "RBL Bank",
  AUBL: "AU Small Finance Bank",
  BDBL: "Bandhan Bank",
  KARB: "Karnataka Bank",
  KVBL: "Karur Vysya Bank",
  SIBL: "South Indian Bank",
  TMBL: "Tamilnad Mercantile Bank",
  CIUB: "City Union Bank",
  JAKA: "Jammu & Kashmir Bank",
  CSBK: "CSB Bank",
  DLXB: "Dhanlaxmi Bank",
  IBKL: "IDBI Bank",
  ESFB: "Equitas Small Finance Bank",
  USFB: "Ujjivan Small Finance Bank",
  AIRP: "Airtel Payments Bank",
  PYTM: "Paytm Payments Bank",
  FINO: "Fino Payments Bank",
  IPOS: "India Post Payments Bank",
  DBSS: "DBS Bank India",
  HSBC: "HSBC",
  SCBL: "Standard Chartered",
  CITI: "Citibank",
};

export function checkIfsc(input: string): CheckResult {
  const value = compact(input).toUpperCase();
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)) {
    return result("ifsc", input, false, null, "Not a valid IFSC format", [], [
      "An IFSC has 11 characters: 4 letters for the bank, a zero, then 6 letters or digits for the branch.",
    ]);
  }
  const bank = IFSC_BANKS[value.slice(0, 4)];
  if (bank) return result("ifsc", input, true, value, `IFSC of ${bank}`);
  return result("ifsc", input, true, value, "IFSC (bank code not in our list)", [], [
    `Bank code ${value.slice(0, 4)} is not in our list. The format is valid.`,
  ]);
}
