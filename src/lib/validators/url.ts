/**
 * Deterministic link inspection. It looks only at the URL text: it never fetches the page.
 * "No signals" never means "safe"; it means nothing in the address itself looks wrong.
 */

export type LinkRisk = "high" | "medium" | "low" | "none_found";

export interface LinkInspection {
  input: string;
  valid: boolean;
  host: string | null;
  registrableDomain: string | null;
  flags: string[];
  notes: string[];
  risk: LinkRisk;
}

/** Second-level suffixes under which registrations happen (a tiny public-suffix subset relevant to India). */
const MULTI_PART_SUFFIXES = [
  "co.in", "gov.in", "nic.in", "org.in", "ac.in", "net.in", "edu.in", "firm.in", "gen.in", "ind.in", "res.in",
  "bank.in", "co.uk", "org.uk", "com.au",
];

const SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "rb.gy", "shorturl.at", "tiny.cc", "ow.ly", "goo.gl",
  "rebrand.ly", "t.ly", "s.id", "v.gd", "shorte.st", "bitly.ws",
]);

/** Cheap top-level domains that phishing reports list disproportionately often. A soft signal only. */
const RISKY_TLDS = new Set([
  "xyz", "top", "click", "live", "online", "site", "shop", "icu", "buzz", "cyou", "vip", "rest", "monster",
  "cfd", "sbs", "lol", "quest", "fun", "info", "support", "work", "loan", "win",
]);

/**
 * Brand names that scams imitate, with domains the brand is known to use. Anything under *.gov.in, *.nic.in
 * or *.bank.in is treated separately because those spaces are reserved for government bodies and banks.
 */
const BRANDS: Array<{ token: string; name: string; official: string[] }> = [
  { token: "sbi", name: "SBI", official: ["sbi.co.in", "onlinesbi.sbi", "sbicard.com", "sbi"] },
  { token: "hdfc", name: "HDFC Bank", official: ["hdfcbank.com", "hdfc.com"] },
  { token: "icici", name: "ICICI Bank", official: ["icicibank.com", "icicidirect.com"] },
  { token: "axis", name: "Axis Bank", official: ["axisbank.com"] },
  { token: "kotak", name: "Kotak Mahindra Bank", official: ["kotak.com"] },
  { token: "paytm", name: "Paytm", official: ["paytm.com", "paytmbank.com"] },
  { token: "phonepe", name: "PhonePe", official: ["phonepe.com"] },
  { token: "amazon", name: "Amazon", official: ["amazon.in", "amazon.com", "amazonaws.com", "amazonpay.in"] },
  { token: "flipkart", name: "Flipkart", official: ["flipkart.com"] },
  { token: "irctc", name: "IRCTC", official: ["irctc.co.in"] },
  { token: "rbi", name: "Reserve Bank of India", official: ["rbi.org.in"] },
  { token: "npci", name: "NPCI", official: ["npci.org.in"] },
  { token: "uidai", name: "UIDAI (Aadhaar)", official: [] },
  { token: "aadhaar", name: "Aadhaar", official: [] },
  { token: "incometax", name: "Income Tax Department", official: [] },
  { token: "epfo", name: "EPFO", official: [] },
  { token: "indiapost", name: "India Post", official: [] },
  { token: "trai", name: "TRAI", official: [] },
  { token: "fedex", name: "FedEx", official: ["fedex.com"] },
  { token: "dhl", name: "DHL", official: ["dhl.com", "dhl.co.in"] },
  { token: "bses", name: "BSES", official: ["bsesdelhi.com"] },
  { token: "bescom", name: "BESCOM", official: [] },
  { token: "mahadiscom", name: "MSEDCL", official: ["mahadiscom.in"] },
];

const HOMOGLYPHS: Array<[RegExp, string]> = [
  [/0/g, "o"],
  [/1/g, "i"],
  [/3/g, "e"],
  [/4/g, "a"],
  [/5/g, "s"],
  [/rn/g, "m"],
  [/vv/g, "w"],
];

function unconfuse(label: string): string {
  return HOMOGLYPHS.reduce((s, [re, to]) => s.replace(re, to), label);
}

function registrableDomainOf(host: string): string {
  const labels = host.split(".");
  const lastTwo = labels.slice(-2).join(".");
  const take = MULTI_PART_SUFFIXES.includes(lastTwo) ? 3 : 2;
  return labels.slice(-take).join(".");
}

function mentionsBrand(registrable: string, token: string): boolean {
  const name = registrable.split(".")[0] ?? "";
  for (const candidate of [name, unconfuse(name), unconfuse(name.replace(/1/g, "l"))]) {
    const parts = candidate.split(/[-_]/);
    for (const part of parts) {
      if (part === token) return true;
      if (token.length >= 4 && part.includes(token)) return true;
      if (token.length < 4 && part.startsWith(token) && part.length - token.length >= 3) return true;
    }
  }
  return false;
}

export function inspectLink(input: string): LinkInspection {
  const raw = input.trim();
  const invalid: LinkInspection = {
    input,
    valid: false,
    host: null,
    registrableDomain: null,
    flags: [],
    notes: ["This does not look like a web address."],
    risk: "none_found",
  };
  if (!raw || /\s/.test(raw)) return invalid;

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw);
  let url: URL;
  try {
    url = new URL(hasScheme ? raw : `https://${raw}`);
  } catch {
    return invalid;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return invalid;
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[");
  if (!isIp && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) return invalid;

  const flags: string[] = [];
  const notes: string[] = [];
  const registrable = isIp ? host : registrableDomainOf(host);
  const tld = host.split(".").pop() ?? "";

  if (hasScheme && url.protocol === "http:") {
    flags.push("not_https");
    notes.push("The link is not https, so anything typed into it can be read in transit.");
  }
  if (isIp) {
    flags.push("ip_address_host");
    notes.push("The link points to a bare IP address instead of a named website. Genuine organisations do not do this.");
  }
  if (host.split(".").some((l) => l.startsWith("xn--"))) {
    flags.push("punycode");
    notes.push("The address uses look-alike international characters (punycode), a common trick to imitate real sites.");
  }
  if (SHORTENERS.has(registrable)) {
    flags.push("url_shortener");
    notes.push("This is a link shortener, which hides the real destination.");
  }
  if (/\.apk($|[?#])/i.test(url.pathname + url.search)) {
    flags.push("apk_download");
    notes.push("The link downloads an Android app file (.apk). Installing apps from links is how many scams take over phones.");
  }
  if (!isIp && RISKY_TLDS.has(tld)) {
    flags.push("risky_tld");
    notes.push(`The ".${tld}" ending is cheap to register and is common in scam links. Not proof on its own.`);
  }

  const isGov = !isIp && (host.endsWith(".gov.in") || host.endsWith(".nic.in"));
  const isBankIn = !isIp && host.endsWith(".bank.in");
  if (isGov) {
    flags.push("government_domain");
    notes.push("Addresses ending in .gov.in or .nic.in can only be registered by government bodies.");
  }
  if (isBankIn) {
    flags.push("bank_in_domain");
    notes.push("Addresses ending in .bank.in are reserved for banks regulated in India.");
  }

  if (!isIp && !isGov && !isBankIn) {
    for (const brand of BRANDS) {
      const official = brand.official.some((d) => registrable === d || host === d || host.endsWith(`.${d}`));
      if (!official && mentionsBrand(registrable, brand.token)) {
        flags.push("brand_lookalike");
        notes.push(
          `The address uses the name "${brand.token}" but is not a domain ${brand.name} is known to use. Type the official address yourself instead of tapping links.`,
        );
        break;
      }
    }
  }

  const high = ["brand_lookalike", "apk_download", "ip_address_host", "punycode"];
  const medium = ["url_shortener", "risky_tld", "not_https"];
  let risk: LinkRisk = "none_found";
  if (flags.some((f) => high.includes(f))) risk = "high";
  else if (flags.some((f) => medium.includes(f))) risk = "medium";
  else if (isGov || isBankIn) risk = "low";

  if (risk === "none_found") {
    notes.push("Nothing in the address itself looks wrong. A normal-looking link can still lead to a scam.");
  }

  return { input, valid: true, host, registrableDomain: registrable, flags, notes, risk };
}
