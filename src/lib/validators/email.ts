import { CheckResult, result } from "./types";

const FREE_PROVIDERS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.in", "yahoo.in", "outlook.com", "hotmail.com",
  "live.com", "rediffmail.com", "proton.me", "protonmail.com", "icloud.com", "aol.com", "zoho.com", "ymail.com",
]);

export function checkEmail(input: string): CheckResult {
  const value = input.trim().toLowerCase();
  const match = /^[a-z0-9._%+-]+@([a-z0-9-]+(?:\.[a-z0-9-]+)+)$/.exec(value);
  if (!match) return result("email", input, false, null, "Not a valid email address");
  const domain = match[1] ?? "";
  if (FREE_PROVIDERS.has(domain)) {
    return result("email", input, true, value, `Email on a free provider (${domain})`, ["free_email_provider"], [
      "Companies and government offices send official offers and notices from their own domain, not from free email accounts.",
    ]);
  }
  return result("email", input, true, value, `Email at ${domain}`);
}
