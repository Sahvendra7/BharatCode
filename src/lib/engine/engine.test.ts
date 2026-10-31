import { describe, expect, it } from "vitest";
import { emptyCase, emptyTransaction, type Case } from "@/lib/domain/case";
import { assessEntitlement } from "./entitlement";
import { buildPlan } from "./plan";
import { applyFactLock } from "./fact-lock";
import { buildCallSheet, buildComplaint, buildBankLetter } from "./documents";
import { formatInr } from "./format";

const NOW = new Date("2026-10-30T16:10:00+05:30");

function electricityCase(): Case {
  const c = emptyCase("manual");
  c.paid = "yes";
  c.pattern = "electricity_bill";
  c.channel = "phone_call";
  c.discoveredAt = "2026-10-30T15:50:00+05:30";
  c.howItHappened =
    "I got an SMS saying my electricity would be disconnected tonight. I called the number and the man told me to pay the pending bill to a UPI ID.";
  c.transactions = [
    {
      ...emptyTransaction(),
      amountInr: 48500,
      occurredAt: "2026-10-30T15:42:00+05:30",
      reference: "432109876543",
      payeeUpiId: "electricity.refund.helpdesk@ybl",
      payerBank: "State Bank of India",
      madeByVictim: "yes",
    },
  ];
  c.suspect = [{ id: "s1", kind: "phone", value: "+919812345670", source: { kind: "user", image: null, quote: null }, verification: "user_entered" }];
  c.compromise.otpOrPinShared = "no";
  c.compromise.remoteAppInstalled = "no";
  return c;
}

function unauthorisedCase(discoveredAt: string): Case {
  const c = emptyCase("manual");
  c.paid = "yes";
  c.pattern = "otp_or_card_fraud";
  c.discoveredAt = discoveredAt;
  c.transactions = [{ ...emptyTransaction(), amountInr: 18000, method: "card", madeByVictim: "no", occurredAt: discoveredAt }];
  c.compromise = { ...c.compromise, otpOrPinShared: "no", cardDetailsShared: "no", netbankingPasswordShared: "no" };
  c.victim.accountType = "savings";
  return c;
}

describe("formatInr", () => {
  it("uses Indian digit grouping", () => {
    expect(formatInr(48500)).toBe("₹48,500");
    expect(formatInr(1234567.5)).toBe("₹12,34,567.50");
    expect(formatInr(0)).toBe("₹0");
  });
});

describe("assessEntitlement (RBI 2017 circular)", () => {
  it("does not promise zero liability for payments the victim made", () => {
    const e = assessEntitlement(electricityCase(), NOW);
    expect(e.kind).toBe("authorised_payment");
    expect(e.headline).toMatch(/usually not covered/i);
    expect(e.points.join(" ")).toMatch(/1930/);
  });
  it("gives the zero-liability band within 3 working days for unauthorised transactions", () => {
    const e = assessEntitlement(unauthorisedCase("2026-10-29T10:00:00+05:30"), NOW);
    expect(e.kind).toBe("unauthorised_third_party");
    expect(e.workingDays).toBe(1);
    expect(e.band).toBe("zero");
    expect(e.points.join(" ")).toMatch(/10 working days/);
  });
  it("caps liability for 4-7 working days by account type", () => {
    const e = assessEntitlement(unauthorisedCase("2026-10-23T10:00:00+05:30"), NOW);
    // 24 (Sat, 4th) excluded, 25 Sunday excluded: 26,27,28,29,30 = 5 working days
    expect(e.workingDays).toBe(5);
    expect(e.band).toBe("capped");
    expect(e.maxLiabilityInr).toBe(10000);
  });
  it("uses the transaction value when it is lower than the cap", () => {
    const c = unauthorisedCase("2026-10-23T10:00:00+05:30");
    c.transactions[0]!.amountInr = 3000;
    expect(assessEntitlement(c, NOW).maxLiabilityInr).toBe(3000);
  });
  it("defers to bank policy beyond 7 working days", () => {
    expect(assessEntitlement(unauthorisedCase("2026-10-12T10:00:00+05:30"), NOW).band).toBe("bank_policy");
  });
  it("explains the negligence rule when credentials were shared", () => {
    const c = unauthorisedCase("2026-10-29T10:00:00+05:30");
    c.compromise.otpOrPinShared = "yes";
    const e = assessEntitlement(c, NOW);
    expect(e.kind).toBe("unauthorised_credentials_shared");
    expect(e.headline).toMatch(/until you report/i);
  });
  it("warns that an installed remote-access app may be argued as negligence", () => {
    const c = unauthorisedCase("2026-10-29T10:00:00+05:30");
    c.compromise.remoteAppInstalled = "yes";
    expect(assessEntitlement(c, NOW).points.join(" ")).toMatch(/may argue this was negligence/);
  });
  it("asks for the discovery time when it is missing", () => {
    const c = unauthorisedCase("2026-10-29T10:00:00+05:30");
    c.discoveredAt = null;
    expect(assessEntitlement(c, NOW).band).toBe("unknown");
  });
  it("returns not_applicable when nothing was paid", () => {
    const c = emptyCase();
    c.paid = "no";
    expect(assessEntitlement(c, NOW).kind).toBe("not_applicable");
  });
});

describe("buildPlan", () => {
  it("puts 1930 first, then the bank, for any money lost", () => {
    const steps = buildPlan(electricityCase());
    expect(steps[0]!.id).toBe("call_1930");
    expect(steps[0]!.urgency).toBe("now");
    expect(steps[1]!.id).toBe("call_bank");
    expect(steps.map((s) => s.id)).toContain("ncrp_complaint");
    expect(steps.map((s) => s.id)).toContain("bank_letter");
    expect(steps.map((s) => s.id)).not.toContain("chakshu");
  });
  it("adds lock-down steps only when evidence shows compromise", () => {
    const c = electricityCase();
    expect(buildPlan(c).map((s) => s.id)).not.toContain("secure_phone");
    c.compromise.remoteAppInstalled = "yes";
    c.compromise.remoteAppName = "AnyDesk";
    c.compromise.otpOrPinShared = "yes";
    const ids = buildPlan(c).map((s) => s.id);
    expect(ids).toContain("secure_phone");
    expect(ids).toContain("secure_credentials");
    const phone = buildPlan(c).find((s) => s.id === "secure_phone")!;
    expect(phone.detail).toMatch(/AnyDesk/);
  });
  it("adds SIM blocking for SIM-swap cases", () => {
    const c = electricityCase();
    c.pattern = "sim_swap";
    expect(buildPlan(c).map((s) => s.id)).toContain("block_sim");
  });
  it("for no loss: stop, report on Chakshu, never 1930", () => {
    const c = emptyCase();
    c.paid = "no";
    const ids = buildPlan(c).map((s) => s.id);
    expect(ids[0]).toBe("stop_contact");
    expect(ids).toContain("chakshu");
    expect(ids).not.toContain("call_1930");
  });
  it("for unsure: check the bank first, then treat as a loss", () => {
    const c = electricityCase();
    c.paid = "unknown";
    const ids = buildPlan(c).map((s) => s.id);
    expect(ids[0]).toBe("check_debits");
    expect(ids).toContain("call_1930");
  });
  it("mentions e-Zero FIR only for large losses", () => {
    const c = electricityCase();
    expect(buildPlan(c).map((s) => s.id)).not.toContain("e_zero_fir");
    c.transactions[0]!.amountInr = 1_500_000;
    expect(buildPlan(c).map((s) => s.id)).toContain("e_zero_fir");
  });
});

describe("applyFactLock", () => {
  it("keeps numbers that are confirmed facts and replaces the rest", () => {
    const c = electricityCase();
    const r = applyFactLock(
      "I paid Rs 48,500 at 3:42 pm on 30 October 2026 (UTR 432109876543). He also took 12,000 and called from 9999988888.",
      c,
    );
    expect(r.text).toContain("48,500");
    expect(r.text).toContain("432109876543");
    expect(r.text).toContain("2026");
    expect(r.text).not.toContain("12,000");
    expect(r.text).not.toContain("9999988888");
    expect(r.removed).toEqual(["12,000", "9999988888"]);
  });
  it("accepts phone numbers in national or +91 form", () => {
    const r = applyFactLock("They called from 98123 45670.", electricityCase());
    expect(r.removed).toEqual([]);
  });
});

describe("documents", () => {
  it("call sheet lists every transaction detail and asks for the acknowledgement number", () => {
    const sheet = buildCallSheet(electricityCase());
    expect(sheet).toContain("₹48,500");
    expect(sheet).toContain("432109876543");
    expect(sheet).toContain("electricity.refund.helpdesk@ybl");
    expect(sheet).toContain("30 Oct 2026, 3:42 PM IST");
    expect(sheet).toMatch(/acknowledgement number/i);
    expect(sheet).toContain("राशि");
  });
  it("marks missing details instead of inventing them", () => {
    const c = electricityCase();
    c.transactions[0]!.reference = null;
    expect(buildCallSheet(c)).toMatch(/UTR.*not found yet/i);
  });
  it("complaint draft includes suspect details and fact-locked narrative", () => {
    const c = electricityCase();
    c.howItHappened += " He said the pending amount was 7777.";
    const complaint = buildComplaint(c);
    expect(complaint.text).toContain("+919812345670");
    expect(complaint.text).toContain("[check]");
    expect(complaint.removed).toContain("7777");
  });
  it("bank letter requests shadow reversal only for unauthorised transactions", () => {
    expect(buildBankLetter(electricityCase(), NOW)).not.toMatch(/shadow reversal/i);
    expect(buildBankLetter(unauthorisedCase("2026-10-29T10:00:00+05:30"), NOW)).toMatch(/shadow reversal/i);
  });
  it("watermarks sample cases", () => {
    const c = electricityCase();
    c.origin = "sample";
    expect(buildCallSheet(c)).toMatch(/SAMPLE/);
    expect(buildComplaint(c).text).toMatch(/SAMPLE/);
  });
});
