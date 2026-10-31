import { describe, expect, it } from "vitest";
import { checkReference } from "./reference";
import { checkUpiId } from "./upi";
import { checkIfsc } from "./ifsc";
import { checkPhone } from "./phone";
import { checkAccountNumber } from "./account";
import { checkEmail } from "./email";
import { checkIdentifier } from "./index";

describe("checkReference (UTR / RRN)", () => {
  it("accepts a 12-digit UPI/IMPS reference, ignoring spaces", () => {
    const r = checkReference("4321 0987 6543");
    expect(r.valid).toBe(true);
    expect(r.normalized).toBe("432109876543");
    expect(r.label).toMatch(/12-digit/);
  });
  it("accepts a 16-character NEFT UTR and a 22-character RTGS UTR", () => {
    expect(checkReference("SBIN226301234567").valid).toBe(true);
    expect(checkReference("hdfcr52026103000123456").valid).toBe(true);
    expect(checkReference("hdfcr52026103000123456").normalized).toBe("HDFCR52026103000123456");
  });
  it("recognises an app transaction ID and explains it is not the UTR", () => {
    const r = checkReference("T2610301542123456789012");
    expect(r.valid).toBe(false);
    expect(r.notes.join(" ")).toMatch(/not the UTR/i);
  });
  it("rejects malformed values", () => {
    expect(checkReference("12345").valid).toBe(false);
    expect(checkReference("").valid).toBe(false);
    expect(checkReference("4321098765431").valid).toBe(false);
  });
});

describe("checkUpiId", () => {
  it("accepts a well-formed UPI ID with a known handle", () => {
    const r = checkUpiId("Rahul.Sharma@oksbi");
    expect(r.valid).toBe(true);
    expect(r.normalized).toBe("rahul.sharma@oksbi");
    expect(r.notes.join(" ")).not.toMatch(/not in our list/);
  });
  it("flags official-sounding names", () => {
    const r = checkUpiId("electricity.refund.helpdesk@ybl");
    expect(r.valid).toBe(true);
    expect(r.flags).toContain("official_sounding_name");
  });
  it("notes a phone-number-based UPI ID", () => {
    expect(checkUpiId("9876543210@paytm").flags).toContain("phone_number_handle");
  });
  it("notes unknown handles without rejecting them", () => {
    const r = checkUpiId("someone@newbankpsp");
    expect(r.valid).toBe(true);
    expect(r.notes.join(" ")).toMatch(/not in our list/);
  });
  it("rejects malformed IDs", () => {
    expect(checkUpiId("no-at-sign").valid).toBe(false);
    expect(checkUpiId("a@b").valid).toBe(false);
    expect(checkUpiId("name@123").valid).toBe(false);
    expect(checkUpiId("two@@ats").valid).toBe(false);
  });
});

describe("checkIfsc", () => {
  it("accepts a valid IFSC and names known banks", () => {
    const r = checkIfsc("sbin0001234");
    expect(r.valid).toBe(true);
    expect(r.normalized).toBe("SBIN0001234");
    expect(r.label).toMatch(/State Bank of India/);
  });
  it("requires the fifth character to be zero", () => {
    expect(checkIfsc("SBIN1001234").valid).toBe(false);
  });
  it("accepts unknown bank codes with a note", () => {
    const r = checkIfsc("ZZZZ0ABC123");
    expect(r.valid).toBe(true);
    expect(r.notes.join(" ")).toMatch(/not in our list/);
  });
});

describe("checkPhone", () => {
  it("normalises Indian mobile numbers", () => {
    for (const v of ["+91 98765 43210", "09876543210", "919876543210", "98765-43210"]) {
      const r = checkPhone(v);
      expect(r.valid, v).toBe(true);
      expect(r.normalized, v).toBe("+919876543210");
    }
  });
  it("flags international numbers", () => {
    const r = checkPhone("+92 300 1234567");
    expect(r.valid).toBe(true);
    expect(r.flags).toContain("international");
    expect(r.label).toMatch(/Pakistan/);
  });
  it("recognises official helplines", () => {
    expect(checkPhone("1930").flags).toContain("official_helpline");
  });
  it("rejects impossible Indian mobiles", () => {
    expect(checkPhone("5876543210").valid).toBe(false);
    expect(checkPhone("98765").valid).toBe(false);
  });
});

describe("checkAccountNumber", () => {
  it("accepts 9-18 digits", () => {
    expect(checkAccountNumber("0012 3456 7890").valid).toBe(true);
    expect(checkAccountNumber("12345678").valid).toBe(false);
    expect(checkAccountNumber("1234567890123456789").valid).toBe(false);
    expect(checkAccountNumber("12345ABC90").valid).toBe(false);
  });
});

describe("checkEmail", () => {
  it("flags free email providers", () => {
    const r = checkEmail("hr.tcs.careers@gmail.com");
    expect(r.valid).toBe(true);
    expect(r.flags).toContain("free_email_provider");
  });
  it("rejects malformed addresses", () => {
    expect(checkEmail("not an email").valid).toBe(false);
  });
});

describe("checkIdentifier dispatcher", () => {
  it("routes by kind", () => {
    expect(checkIdentifier("upi_id", "a.b@okaxis").valid).toBe(true);
    expect(checkIdentifier("reference", "432109876543").valid).toBe(true);
    expect(checkIdentifier("ifsc", "HDFC0000123").valid).toBe(true);
    expect(checkIdentifier("phone", "9876543210").valid).toBe(true);
    expect(checkIdentifier("account_number", "123456789012").valid).toBe(true);
    expect(checkIdentifier("email", "a@b.co").valid).toBe(true);
  });
});
