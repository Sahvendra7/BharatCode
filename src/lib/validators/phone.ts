import { CheckResult, result } from "./types";

/** Official numbers a person may see or need. Kept small and sourced (see src/data/official-channels.ts). */
const OFFICIAL_HELPLINES: Record<string, string> = {
  "1930": "National Cyber Crime Helpline (I4C)",
  "14448": "RBI Complaint Management System contact centre",
  "1915": "National Consumer Helpline",
};

/** Country codes worth naming because they show up often in scam calls and chats received in India. */
const COUNTRY_CODES: Array<[string, string]> = [
  ["92", "Pakistan"],
  ["880", "Bangladesh"],
  ["977", "Nepal"],
  ["855", "Cambodia"],
  ["856", "Laos"],
  ["95", "Myanmar"],
  ["84", "Vietnam"],
  ["971", "United Arab Emirates"],
  ["966", "Saudi Arabia"],
  ["62", "Indonesia"],
  ["60", "Malaysia"],
  ["63", "Philippines"],
  ["1", "USA/Canada"],
  ["44", "United Kingdom"],
];

export function checkPhone(input: string): CheckResult {
  const raw = input.trim();
  const digits = raw.replace(/[^\d+]/g, "");

  const helpline = OFFICIAL_HELPLINES[digits];
  if (helpline) {
    return result("phone", input, true, digits, helpline, ["official_helpline"]);
  }

  let national: string | null = null;
  if (/^\+91\d{10}$/.test(digits)) national = digits.slice(3);
  else if (/^91\d{10}$/.test(digits)) national = digits.slice(2);
  else if (/^0\d{10}$/.test(digits)) national = digits.slice(1);
  else if (/^\d{10}$/.test(digits)) national = digits;

  if (national !== null) {
    if (/^[6-9]\d{9}$/.test(national)) {
      return result("phone", input, true, `+91${national}`, "Indian mobile number", [], [
        "Caller ID and WhatsApp names can be faked. A real-looking number does not mean a real official.",
      ]);
    }
    return result("phone", input, false, null, "Not a valid Indian mobile number", [], [
      "Indian mobile numbers have 10 digits and start with 6, 7, 8 or 9.",
    ]);
  }

  if (digits.startsWith("+") || digits.startsWith("00")) {
    const intl = digits.replace(/^(\+|00)/, "");
    if (/^\d{7,15}$/.test(intl)) {
      const country = COUNTRY_CODES.find(([code]) => intl.startsWith(code));
      const label = country ? `International number (${country[1]}, +${country[0]})` : "International number";
      return result("phone", input, true, `+${intl}`, label, ["international"], [
        "Indian banks, police and government offices do not contact you from foreign numbers.",
      ]);
    }
  }
  return result("phone", input, false, null, "Unrecognised phone number", [], []);
}
