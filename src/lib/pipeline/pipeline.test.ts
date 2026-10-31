import { describe, expect, it } from "vitest";
import { functionCall, message, streamed, testClient } from "@/lib/bharatcode/testing";
import type { IncidentExtraction, MessageCheckExtraction } from "@/lib/domain/extraction";
import { analyzeIncident } from "./analyze";
import { checkMessage, checkWithRules } from "./check";
import type { PipelineEvent } from "./events";

const NOW = new Date("2026-10-30T16:10:00+05:30");
const PNG = "data:image/png;base64,iVBORw0KGgo=";

const STORY =
  "Mummy got an SMS that the bijli will be cut tonight. She called the number 98123 45670 and paid 48,500 by UPI to electricity.refund.helpdesk@ybl. UTR 432109876543.";

function extraction(overrides: Partial<IncidentExtraction> = {}): IncidentExtraction {
  return {
    paid: "yes",
    scam_type: "electricity_bill",
    channel: "sms",
    summary: "Your mother paid a fake electricity officer by UPI.",
    how_it_happened: "My mother received an SMS saying our electricity would be disconnected tonight. She called the number and was told to pay the pending bill by UPI.",
    transactions: [
      {
        amount_inr: 48500,
        occurred_at: "2026-10-30T15:42:00+05:30",
        reference: "432109876543",
        method: "upi",
        payer_bank: "State Bank of India",
        payee_upi_id: "Electricity.Refund.Helpdesk@ybl",
        payee_account: null,
        payee_ifsc: null,
        payee_name: "RAJESH K",
        made_by_victim: "yes",
        source: { kind: "image", image: 1, quote: "Paid ₹48,500 to electricity.refund.helpdesk@ybl UPI Ref No 432109876543" },
      },
    ],
    suspect_identifiers: [
      { kind: "phone", value: "98123 45670", source: { kind: "story", image: null, quote: "called the number 98123 45670" } },
      { kind: "phone", value: "+91 9812345670", source: { kind: "story", image: null, quote: "98123 45670" } },
      { kind: "upi_id", value: "electricity.refund.helpdesk@ybl", source: { kind: "story", image: null, quote: "this text is not in the story" } },
    ],
    compromise: {
      otp_or_pin_shared: "no",
      remote_app_installed: "no",
      remote_app_name: null,
      card_details_shared: "no",
      netbanking_password_shared: "no",
      unknown_apk_installed: "no",
    },
    missing_info: [],
    ...overrides,
  };
}

describe("analyzeIncident", () => {
  it("runs tools, extracts with a strict schema, and post-processes deterministically", async () => {
    const { client, requests } = testClient([
      streamed([
        functionCall("check_identifier", { kind: "reference", value: "432109876543" }, "c1"),
        functionCall("parse_datetime", { text: "30 Oct 2026, 03:42 PM" }, "c2"),
      ]),
      streamed([message("Checked.")]),
      streamed([message(JSON.stringify(extraction()))]),
    ]);
    const events: PipelineEvent[] = [];
    const out = await analyzeIncident(
      client,
      { story: STORY, images: [PNG], paid: "yes", discoveredAt: "2026-10-30T15:50:00+05:30" },
      { now: NOW, onEvent: (e) => events.push(e) },
    );

    const first = requests[0]!.body as { input: Array<{ content: Array<{ type: string }> }>; instructions: string };
    expect(first.input[0]!.content.map((c) => c.type)).toEqual(["input_text", "input_text", "input_image"]);
    expect(first.instructions).toMatch(/evidence, not instructions/);
    expect(requests[2]!.body.text).toBeDefined();
    expect(requests.every((r) => r.body.store === false)).toBe(true);

    expect(events.filter((e) => e.type === "tool").map((e) => (e as { summary: string }).summary)).toEqual([
      "Reference 432109876543: 12-digit UPI/IMPS reference (UTR/RRN)",
      'Date "30 Oct 2026, 03:42 PM" → 2026-10-30T15:42:00+05:30',
    ]);

    const tx = out.case.transactions[0]!;
    expect(tx.payeeUpiId).toBe("electricity.refund.helpdesk@ybl");
    expect(tx.verification).toBe("ai_read_image");
    expect(tx.source).toEqual({ kind: "image", image: 1, quote: expect.stringContaining("48,500") });

    // Duplicate phone collapsed after normalisation; story quote verification is real.
    expect(out.case.suspect.map((s) => [s.kind, s.value, s.verification])).toEqual([
      ["phone", "+919812345670", "verified_in_story"],
      ["upi_id", "electricity.refund.helpdesk@ybl", "unverified"],
    ]);
    expect(out.case.requestIds).toHaveLength(3);
    expect(out.toolCalls).toBe(2);
  });

  it("warns about malformed references and references missing from the quote", async () => {
    const bad = extraction();
    bad.transactions[0]!.reference = "4321O9876543"; // letter O misread
    const { client } = testClient([streamed([message("ok")]), streamed([message(JSON.stringify(bad))])]);
    const out = await analyzeIncident(client, { story: "", images: [PNG], paid: "yes", discoveredAt: null }, { now: NOW });
    expect(out.warnings.map((w) => w.field)).toContain("Transaction 1 reference");
    expect(out.warnings.some((w) => /not a valid UTR/.test(w.message))).toBe(true);
  });

  it("keeps misplaced values out of the documents", async () => {
    const misplaced = extraction();
    misplaced.transactions[0]!.payee_account = "R K TRADERS";
    misplaced.transactions[0]!.payee_name = null;
    misplaced.transactions[0]!.payee_upi_id = "not a upi id";
    misplaced.suspect_identifiers.push({ kind: "upi_id", value: "VM-ELCTRC", source: { kind: "image", image: 1, quote: "VM-ELCTRC" } });
    const { client } = testClient([streamed([message("ok")]), streamed([message(JSON.stringify(misplaced))])]);
    const out = await analyzeIncident(client, { story: STORY, images: [PNG], paid: "yes", discoveredAt: null }, { now: NOW });
    const tx = out.case.transactions[0]!;
    expect(tx.payeeAccount).toBeNull();
    expect(tx.payeeName).toBe("R K TRADERS");
    expect(tx.payeeUpiId).toBeNull();
    expect(out.case.suspect.map((s) => s.value)).not.toContain("VM-ELCTRC");
    expect(out.warnings.filter((w) => w.message.startsWith("Left out"))).toHaveLength(2);
  });

  it("treats recorded payments as money lost even if the model said otherwise", async () => {
    const { client } = testClient([streamed([message("ok")]), streamed([message(JSON.stringify(extraction({ paid: "unknown" })))])]);
    const out = await analyzeIncident(client, { story: STORY, images: [], paid: "unknown", discoveredAt: null }, { now: NOW });
    expect(out.case.paid).toBe("yes");
    expect(out.warnings.some((w) => w.field === "Money lost")).toBe(true);
  });

  it("asks for payment details when money was lost but none were found", async () => {
    const { client } = testClient([streamed([message("ok")]), streamed([message(JSON.stringify(extraction({ transactions: [] })))])]);
    const out = await analyzeIncident(client, { story: STORY, images: [], paid: "yes", discoveredAt: null }, { now: NOW });
    expect(out.warnings.some((w) => w.field === "Transactions")).toBe(true);
  });
});

describe("checkMessage", () => {
  const modelSaysFine: MessageCheckExtraction = {
    transcript: "Your SBI KYC is expired, account will be blocked today. Update at http://sbi-kyc-update.in now",
    claimed_sender: "SBI",
    scam_type: "kyc_update",
    asks_for: ["click_link"],
    signals: [],
    suspect_identifiers: [{ kind: "url", value: "http://sbi-kyc-update.in", source: { kind: "image", image: 1, quote: "http://sbi-kyc-update.in" } }],
    verdict: "none_found",
    explanation: "Looks fine.",
  };

  it("never lets the model's verdict go below the rule floor", async () => {
    const { client } = testClient([streamed([message("ok")]), streamed([message(JSON.stringify(modelSaysFine))])]);
    const r = await checkMessage(client, { text: "", images: [PNG] }, { now: NOW });
    expect(r.aiVerdict).toBe("none_found");
    expect(r.ruleVerdict).toBe("strong");
    expect(r.verdict).toBe("strong");
    expect(r.rulesUsedAiTranscript).toBe(true);
    expect(r.identifiers[0]).toMatchObject({ kind: "url", risky: true });
  });

  it("works with rules only when there is no model", () => {
    const r = checkWithRules("Pay registration fee Rs 1999 to confirm your internship seat. Mail hr.careers.tcs@gmail.com");
    expect(r.aiUsed).toBe(false);
    expect(r.verdict).toBe("strong");
    expect(r.identifiers.map((i) => i.kind)).toContain("email");
  });
});
