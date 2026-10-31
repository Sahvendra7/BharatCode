import { describe, expect, it } from "vitest";
import { combineVerdicts, detectSignals, verdictFromSignals } from "./rules";

const ids = (text: string) => detectSignals(text).map((s) => s.id);

describe("detectSignals", () => {
  it("catches the electricity-disconnection SMS", () => {
    const text =
      "Dear Consumer your electricity power will be disconnected tonight at 9.30 pm because your previous month bill was not update. Please immediately contact our electricity officer 9812345670.";
    const found = ids(text);
    expect(found).toEqual(expect.arrayContaining(["disconnection_threat", "urgency", "call_this_number"]));
    expect(verdictFromSignals(detectSignals(text))).toBe("strong");
  });
  it("catches OTP requests in English and Hinglish", () => {
    expect(ids("Please share the OTP you received to verify")).toContain("asks_otp");
    expect(ids("sir jo OTP aaya hai woh batao jaldi")).toContain("asks_otp");
  });
  it("catches fake internship fees and free email recruiters", () => {
    const text =
      "Congratulations! You are selected for the Data Science internship. Pay the refundable registration fee of Rs 1999 to confirm your seat. Contact hr.infosys.careers@gmail.com";
    const found = ids(text);
    expect(found).toContain("job_fee");
    expect(found).toContain("email:hr.infosys.careers@gmail.com");
    expect(found.some((i) => i.startsWith("link:"))).toBe(false);
  });
  it("catches digital-arrest scripts and remote-access apps", () => {
    expect(ids("This is CBI. A parcel with drugs in your name was seized, you are under digital arrest.")).toContain("digital_arrest");
    expect(ids("Install AnyDesk so our team can help with your refund")).toContain("remote_access_app");
  });
  it("flags risky links and official-sounding UPI IDs", () => {
    const found = ids("Update KYC at http://sbi-kyc-update.in/verify or pay to kyc.helpdesk@ybl");
    expect(found).toContain("kyc_update");
    expect(found.some((i) => i.startsWith("link:"))).toBe(true);
    expect(found).toContain("upi:kyc.helpdesk@ybl");
  });
  it("flags international numbers", () => {
    expect(ids("WhatsApp me at +92 300 1234567").some((i) => i.startsWith("phone:"))).toBe(true);
  });
  it("does not treat a postal PIN code as a PIN request", () => {
    expect(ids("Deliver to Flat 4, MG Road, Bengaluru, PIN code 560001")).not.toContain("asks_pin_password");
    expect(ids("Enter your UPI PIN to complete")).toContain("asks_pin_password");
  });
  it("stays quiet on an ordinary message", () => {
    const text = "Hi, are we still meeting for lunch on Sunday at 1? I'll book a table at the usual place.";
    expect(detectSignals(text)).toEqual([]);
    expect(verdictFromSignals([])).toBe("none_found");
  });
});

describe("combineVerdicts", () => {
  it("never lets the model lower the rule floor", () => {
    expect(combineVerdicts("strong", "none_found")).toBe("strong");
    expect(combineVerdicts("warning", "none_found")).toBe("warning");
    expect(combineVerdicts("none_found", "strong")).toBe("strong");
    expect(combineVerdicts("warning", null)).toBe("warning");
  });
});
