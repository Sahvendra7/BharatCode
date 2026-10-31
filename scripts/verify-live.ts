/**
 * Checks Turant's integration against the LIVE BharatCode API. Needs BHARATCODE_API_KEY.
 * Run: BHARATCODE_API_KEY=... npm run verify:live
 *
 * 1. GET /models lists the configured model with tool calling and image input
 * 2. A plain streamed response (store:false) completes
 * 3. Structured output via text.format returns schema-valid JSON (or reports that the fallback was needed)
 * 4. A tool round-trip: the model calls check_identifier, Turant runs it, the model continues
 * 5. Image input: the model reads the UPI reference from the sample receipt
 */
import fs from "node:fs";
import { z } from "zod";
import { runToolLoop } from "../src/lib/bharatcode/agent";
import { BharatCodeClient } from "../src/lib/bharatcode/client";
import { readConfig } from "../src/lib/bharatcode/config";
import { requestStructured } from "../src/lib/bharatcode/structured";
import { outputText } from "../src/lib/bharatcode/types";
import { allTools } from "../src/lib/tools";

type Check = { name: string; ok: boolean; detail: string };

async function main() {
  const config = readConfig();
  if (!config) {
    console.error("BHARATCODE_API_KEY is not set. Live verification needs a key from https://bharatcode.ai/account.");
    process.exit(2);
  }
  const client = new BharatCodeClient(config);
  const checks: Check[] = [];
  let noPlan = false;
  const run = async (name: string, fn: () => Promise<string>) => {
    if (noPlan) {
      checks.push({ name, ok: false, detail: "skipped: account has no API plan (see above)" });
      console.log(`SKIP  ${name}`);
      return;
    }
    const t = Date.now();
    try {
      const detail = await fn();
      checks.push({ name, ok: true, detail: `${detail} (${((Date.now() - t) / 1000).toFixed(1)} s)` });
    } catch (e) {
      const err = e as { kind?: string; detail?: string; message?: string; requestId?: string };
      checks.push({ name, ok: false, detail: `${err.kind ?? "error"}: ${err.detail ?? err.message}${err.requestId ? ` [x-request-id ${err.requestId}]` : ""}` });
      if (err.kind === "subscription_required") {
        noPlan = true;
        console.log("HINT  HTTP 402: the key is valid but its account has no API access. Activate verified student access, Lite or Pro at https://bharatcode.ai/account, then run this again.");
      }
    }
    const last = checks.at(-1)!;
    console.log(`${last.ok ? "PASS" : "FAIL"}  ${name}: ${last.detail}`);
  };

  await run("GET /models", async () => {
    const res = await fetch(`${config.baseUrl}/models`, { headers: { Authorization: `Bearer ${config.apiKey}` } });
    const json = (await res.json()) as { data: Array<{ id: string; metadata?: { input?: string[]; toolCalling?: boolean } }> };
    const m = json.data.find((d) => d.id === config.model);
    if (!m) throw { detail: `${config.model} not in catalogue: ${json.data.map((d) => d.id).join(", ")}` };
    return `${m.id} input=${m.metadata?.input?.join("+")} tools=${m.metadata?.toolCalling}`;
  });

  await run("Streamed response, store:false", async () => {
    const { response, requestId } = await client.createResponse({ input: "Reply with the single word: ready", max_output_tokens: 200, reasoning: { effort: "none" } });
    return `status=${response.status} text="${outputText(response).trim().slice(0, 40)}" request=${requestId}`;
  });

  await run("Structured output (text.format)", async () => {
    const r = await requestStructured({
      client,
      instructions: "Extract the fields.",
      items: [{ role: "user", content: "Paid ₹1,250 to shop.owner@oksbi, ref 612345678901." }],
      schema: z.object({ amount_inr: z.number(), upi_id: z.string(), reference: z.string() }),
      name: "probe",
      maxOutputTokens: 800,
    });
    return `${JSON.stringify(r.data)} fallback=${r.usedFallback} repaired=${r.repaired}`;
  });

  await run("Tool round-trip", async () => {
    const r = await runToolLoop({
      client,
      instructions: "Use check_identifier to validate the UPI reference, then say whether it is valid.",
      input: [{ role: "user", content: "Is 612345678901 a valid UPI reference?" }],
      tools: allTools(new Date()),
      maxRounds: 3,
      maxOutputTokens: 1_500,
    });
    if (!r.traces.length) throw { detail: "model did not call a tool" };
    return `${r.traces.map((t) => t.summary).join(" | ")} → "${r.finalText.trim().slice(0, 60)}"`;
  });

  await run("Image input", async () => {
    const png = fs.readFileSync("public/samples/electricity-receipt.png").toString("base64");
    const { response } = await client.createResponse({
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "What is the 12-digit UPI Ref No. on this receipt? Reply with digits only." },
            { type: "input_image", image_url: `data:image/png;base64,${png}` },
          ],
        },
      ],
      max_output_tokens: 1_000,
    });
    const text = outputText(response);
    if (!text.includes("630412875309")) throw { detail: `unexpected answer "${text.slice(0, 80)}"` };
    return `read ${text.trim()}`;
  });

  const passed = checks.filter((c) => c.ok).length;
  console.log(`\n${passed}/${checks.length} live checks passed against ${config.baseUrl} with ${config.model}.`);
  process.exit(passed === checks.length ? 0 : 1);
}

void main();
