import { describe, expect, it } from "vitest";
import { inspectLink } from "./url";

describe("inspectLink", () => {
  it("recognises government domains", () => {
    const r = inspectLink("https://www.cybercrime.gov.in/Webform/Index.aspx");
    expect(r.valid).toBe(true);
    expect(r.registrableDomain).toBe("cybercrime.gov.in");
    expect(r.flags).toContain("government_domain");
    expect(r.risk).toBe("low");
  });
  it("recognises the reserved .bank.in space", () => {
    expect(inspectLink("https://netbanking.example.bank.in/login").flags).toContain("bank_in_domain");
  });
  it("flags brand look-alikes that are not official", () => {
    const r = inspectLink("http://sbi-kyc-update.in/verify");
    expect(r.flags).toContain("brand_lookalike");
    expect(r.flags).toContain("not_https");
    expect(r.risk).toBe("high");
    expect(r.notes.join(" ")).toMatch(/sbi/i);
  });
  it("catches digit-for-letter substitutions", () => {
    expect(inspectLink("https://hdfc-netbank1ng.xyz").flags).toContain("brand_lookalike");
    expect(inspectLink("https://paytm-rewards.top").flags).toContain("risky_tld");
  });
  it("does not flag the brand's own domain", () => {
    expect(inspectLink("https://www.onlinesbi.sbi/").flags).not.toContain("brand_lookalike");
    expect(inspectLink("https://www.irctc.co.in").flags).not.toContain("brand_lookalike");
  });
  it("flags shorteners, IP hosts, punycode and APK downloads", () => {
    expect(inspectLink("https://bit.ly/3abcd").flags).toContain("url_shortener");
    expect(inspectLink("http://103.21.44.5/pay").flags).toContain("ip_address_host");
    expect(inspectLink("https://xn--sbi-qpa.com").flags).toContain("punycode");
    const apk = inspectLink("https://example.com/files/Electricity_Bill_Update.apk");
    expect(apk.flags).toContain("apk_download");
    expect(apk.risk).toBe("high");
  });
  it("accepts bare domains and multi-part public suffixes", () => {
    const r = inspectLink("bescom-bill-pay.co.in/pay");
    expect(r.valid).toBe(true);
    expect(r.registrableDomain).toBe("bescom-bill-pay.co.in");
  });
  it("rejects non-URLs", () => {
    expect(inspectLink("call me now").valid).toBe(false);
    expect(inspectLink("javascript:alert(1)").valid).toBe(false);
  });
});
