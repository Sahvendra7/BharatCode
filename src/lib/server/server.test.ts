import { describe, expect, it } from "vitest";
import { message, streamed, testClient } from "@/lib/bharatcode/testing";
import { parseSse } from "@/lib/bharatcode/sse";
import { handleAnalyze, handleCheck, handleHealth, type HandlerDeps } from "./handlers";
import { validateImageDataUrl } from "./images";
import { RateLimiter } from "./rate-limit";

const PNG_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

function post(path: string, body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(`http://localhost:3000${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3000", host: "localhost:3000", ...headers },
    body: JSON.stringify(body),
  });
}

function deps(queue: Parameters<typeof testClient>[0] | null, capacity = 10): HandlerDeps {
  const limiters = new Map<string, RateLimiter>();
  return {
    getClient: () => (queue ? testClient(queue).client : null),
    now: () => new Date("2026-10-30T16:10:00+05:30"),
    limiter: (n) => limiters.get(n) ?? (limiters.set(n, new RateLimiter(capacity, 600_000)), limiters.get(n)!),
  };
}

async function events(res: Response): Promise<Array<{ event: string | null; data: unknown }>> {
  const out: Array<{ event: string | null; data: unknown }> = [];
  for await (const item of parseSse(res.body!)) if (item.kind === "event") out.push({ event: item.event, data: JSON.parse(item.data) });
  return out;
}

const EXTRACTION = {
  paid: "yes",
  scam_type: "kyc_update",
  channel: "sms",
  summary: "s",
  how_it_happened: "h",
  transactions: [],
  suspect_identifiers: [],
  compromise: {
    otp_or_pin_shared: "unknown",
    remote_app_installed: "unknown",
    remote_app_name: null,
    card_details_shared: "unknown",
    netbanking_password_shared: "unknown",
    unknown_apk_installed: "unknown",
  },
  missing_info: ["What was the UTR?"],
};

describe("GET /api/health", () => {
  it("reports model availability without secrets", async () => {
    const prev = process.env.BHARATCODE_API_KEY;
    process.env.BHARATCODE_API_KEY = "bc_live_supersecret";
    const body = await handleHealth().json();
    process.env.BHARATCODE_API_KEY = prev;
    expect(body.model.configured).toBe(true);
    expect(JSON.stringify(body)).not.toContain("supersecret");
  });
});

describe("POST /api/analyze", () => {
  const valid = { story: "I paid 500 to a fake seller", images: [], paid: "yes", discoveredAt: null };

  it("streams progress and a result", async () => {
    const res = await handleAnalyze(post("/api/analyze", valid), deps([streamed([message("ok")]), streamed([message(JSON.stringify(EXTRACTION))])]));
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const ev = await events(res);
    expect(ev.some((e) => e.event === "progress")).toBe(true);
    const result = ev.find((e) => e.event === "result")!.data as { case: { missingInfo: string[] }; model: string };
    expect(result.case.missingInfo).toEqual(["What was the UTR?"]);
    expect(result.model).toBe("qwen-3.8-27b");
  });

  it("streams a structured error when BharatCode fails", async () => {
    const res = await handleAnalyze(post("/api/analyze", valid), deps([new Response(JSON.stringify({ error: { message: "nope" } }), { status: 401, headers: { "x-request-id": "req_x" } })]));
    const ev = await events(res);
    expect(ev.at(-1)).toEqual({ event: "error", data: expect.objectContaining({ kind: "auth", requestId: "req_x" }) });
  });

  it("returns 503 not_configured without a key", async () => {
    const res = await handleAnalyze(post("/api/analyze", valid), deps(null));
    expect(res.status).toBe(503);
    expect((await res.json()).error.kind).toBe("not_configured");
  });

  it("validates input", async () => {
    const d = deps(null);
    expect((await handleAnalyze(post("/api/analyze", { ...valid, paid: "maybe" }), d)).status).toBe(400);
    expect((await handleAnalyze(post("/api/analyze", { ...valid, story: "  " }), d)).status).toBe(400);
    expect((await handleAnalyze(post("/api/analyze", { ...valid, story: "x".repeat(4001) }), d)).status).toBe(400);
    expect((await handleAnalyze(post("/api/analyze", { ...valid, images: [{ dataUrl: "data:text/html;base64,PGh0bWw+" }] }), d)).status).toBe(400);
    expect((await handleAnalyze(post("/api/analyze", { ...valid, discoveredAt: "yesterday-ish" }), d)).status).toBe(400);
    const notJson = new Request("http://localhost:3000/api/analyze", { method: "POST", headers: { "content-type": "text/plain", origin: "http://localhost:3000", host: "localhost:3000" }, body: "x" });
    expect((await handleAnalyze(notJson, d)).status).toBe(415);
  });

  it("rejects cross-site requests", async () => {
    const res = await handleAnalyze(post("/api/analyze", valid, { origin: "https://evil.example" }), deps([]));
    expect(res.status).toBe(403);
    const res2 = await handleAnalyze(post("/api/analyze", valid, { "sec-fetch-site": "cross-site" }), deps([]));
    expect(res2.status).toBe(403);
  });

  it("rate-limits per client", async () => {
    const d = deps([streamed([message("ok")]), streamed([message(JSON.stringify(EXTRACTION))])], 1);
    const first = await handleAnalyze(post("/api/analyze", valid, { "x-forwarded-for": "1.2.3.4" }), d);
    await events(first);
    const second = await handleAnalyze(post("/api/analyze", valid, { "x-forwarded-for": "1.2.3.4" }), d);
    expect(second.status).toBe(429);
    expect(Number(second.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("rejects oversized bodies", async () => {
    const res = await handleAnalyze(post("/api/analyze", valid, { "content-length": String(20 * 1024 * 1024) }), deps(null));
    expect(res.status).toBe(413);
  });
});

describe("POST /api/check", () => {
  it("falls back to rules when no key is configured", async () => {
    const res = await handleCheck(post("/api/check", { text: "Share the OTP now or your account will be blocked today", images: [] }), deps(null));
    const ev = await events(res);
    const result = ev.find((e) => e.event === "result")!.data as { aiUsed: boolean; verdict: string };
    expect(result.aiUsed).toBe(false);
    expect(result.verdict).toBe("strong");
  });

  it("refuses screenshot-only checks without a key", async () => {
    const res = await handleCheck(post("/api/check", { text: "", images: [{ dataUrl: PNG_1PX }] }), deps(null));
    expect(res.status).toBe(503);
  });

  it("falls back to rules when the model errors and text was typed", async () => {
    const busy = () => new Response("{}", { status: 503 });
    const res = await handleCheck(post("/api/check", { text: "Install AnyDesk for refund", images: [] }), deps([busy(), busy(), busy(), busy()]));
    const ev = await events(res);
    const result = ev.find((e) => e.event === "result")!.data as { aiUsed: boolean; fallbackReason: string };
    expect(result.aiUsed).toBe(false);
    expect(result.fallbackReason).toBe("busy");
  });
});

describe("validateImageDataUrl", () => {
  it("accepts a real PNG and rejects mismatched bytes", () => {
    expect(validateImageDataUrl(PNG_1PX, 0).ok).toBe(true);
    expect(validateImageDataUrl("data:image/png;base64,/9j/4AAQSkZJRg==", 0).ok).toBe(false);
    expect(validateImageDataUrl("data:image/svg+xml;base64,PHN2Zz4=", 0).ok).toBe(false);
  });
});

describe("RateLimiter", () => {
  it("refills over time", () => {
    let t = 0;
    const l = new RateLimiter(2, 1000, () => t);
    expect(l.take("a")).toBe(0);
    expect(l.take("a")).toBe(0);
    expect(l.take("a")).toBeGreaterThan(0);
    expect(l.take("b")).toBe(0);
    t = 500;
    expect(l.take("a")).toBe(0);
  });
});
