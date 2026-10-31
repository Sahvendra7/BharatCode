// TEST FIXTURE ONLY. A stand-in for BharatCode's /responses endpoint that speaks the documented
// SSE format (https://bharatcode.ai/build) so the E2E suite can exercise the AI path without a key.
// Its answers are scripted, not model output, and are never used outside tests.
import http from "node:http";

const port = Number(process.env.MOCK_PORT || 3199);
let busyServed = false;

const extraction = {
  paid: "yes",
  scam_type: "electricity_bill",
  channel: "sms",
  summary: "Your mother paid ₹48,500 by UPI to someone posing as an electricity officer.",
  how_it_happened:
    "My mother received an SMS saying the electricity would be disconnected tonight. She called the number in the SMS and was told to pay the pending bill by UPI. Later he asked for 12,000 more.",
  transactions: [
    {
      amount_inr: 48500,
      occurred_at: "2026-10-30T15:42:00+05:30",
      reference: "630412875309",
      method: "upi",
      payer_bank: "State Bank of India",
      payee_upi_id: "elec.bill.update.desk@ybl",
      payee_account: null,
      payee_ifsc: null,
      payee_name: "R K TRADERS",
      made_by_victim: "yes",
      source: { kind: "image", image: 1, quote: "Paid ₹48,500.00 to elec.bill.update.desk@ybl UPI Ref No. 630412875309" },
    },
  ],
  suspect_identifiers: [{ kind: "phone", value: "98765 43210", source: { kind: "story", image: null, quote: "98765 43210" } }],
  compromise: {
    otp_or_pin_shared: "no",
    remote_app_installed: "no",
    remote_app_name: null,
    card_details_shared: "no",
    netbanking_password_shared: "no",
    unknown_apk_installed: "no",
  },
  missing_info: [],
};

const check = {
  transcript: "Dear customer your SBI KYC is expired and account will be blocked today. Update now at http://sbi-kyc-update.in",
  claimed_sender: "SBI",
  scam_type: "kyc_update",
  asks_for: ["click_link"],
  signals: [],
  suspect_identifiers: [{ kind: "url", value: "http://sbi-kyc-update.in", source: { kind: "image", image: 1, quote: "http://sbi-kyc-update.in" } }],
  verdict: "none_found",
  explanation: "Scripted test answer that deliberately under-rates the risk.",
};

const message = (text) => ({ type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text }] });
const call = (name, args, id) => ({ type: "function_call", call_id: id, name, arguments: JSON.stringify(args), status: "completed" });

function respond(res, output) {
  res.writeHead(200, { "content-type": "text/event-stream", "x-request-id": `req_mock_${Date.now()}` });
  const response = { id: "resp_mock", object: "response", status: "completed", output };
  res.write(": queued\n\n");
  res.write(`event: response.created\ndata: ${JSON.stringify({ type: "response.created", response: { ...response, status: "in_progress", output: [] } })}\n\n`);
  for (const item of output) res.write(`event: response.output_item.done\ndata: ${JSON.stringify({ type: "response.output_item.done", item })}\n\n`);
  res.write(`event: response.completed\ndata: ${JSON.stringify({ type: "response.completed", response })}\n\n`);
  res.end();
}

http
  .createServer((req, res) => {
    if (req.method !== "POST" || !req.url?.endsWith("/responses")) {
      res.writeHead(404).end();
      return;
    }
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const body = JSON.parse(raw);
      if (body.store !== false || req.headers.authorization !== "Bearer bc_test_e2e") {
        res.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: { message: "store:false and auth required" } }));
        return;
      }
      const text = JSON.stringify(body.input);
      if (text.includes("BUSY-TEST") && !busyServed) {
        busyServed = true;
        res.writeHead(503, { "content-type": "application/json", "retry-after": "0" }).end(JSON.stringify({ error: { message: "busy" } }));
        return;
      }
      const isCheck = String(body.instructions).includes("BEFORE they pay");
      if (body.text?.format || String(body.instructions).includes("JSON Schema")) {
        return respond(res, [message(JSON.stringify(isCheck ? check : extraction))]);
      }
      if (text.includes("function_call_output")) return respond(res, [message("Checked.")]);
      if (isCheck) return respond(res, [call("inspect_link", { url: "http://sbi-kyc-update.in" }, "c1")]);
      return respond(res, [
        call("check_identifier", { kind: "reference", value: "630412875309" }, "c1"),
        call("check_identifier", { kind: "upi_id", value: "elec.bill.update.desk@ybl" }, "c2"),
        call("parse_datetime", { text: "30 Oct 2026, 03:42 PM" }, "c3"),
      ]);
    });
  })
  .listen(port, () => console.log(`mock BharatCode on ${port}`));
