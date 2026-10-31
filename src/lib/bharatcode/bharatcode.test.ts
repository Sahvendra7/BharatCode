import { describe, expect, it } from "vitest";
import { z } from "zod";
import { runToolLoop, type AppTool } from "./agent";
import { readConfig, publicModelInfo } from "./config";
import { BharatCodeError } from "./errors";
import { extractJson, requestStructured } from "./structured";
import { functionCall, jsonError, message, sseResponse, streamed, testClient } from "./testing";
import type { ProgressEvent } from "./client";

describe("config", () => {
  it("returns null without a key and never exposes the key publicly", () => {
    expect(readConfig({})).toBeNull();
    const info = publicModelInfo({ BHARATCODE_API_KEY: "bc_live_secret" });
    expect(info).toEqual({ configured: true, id: "qwen-3.8-27b" });
    expect(JSON.stringify(info)).not.toContain("secret");
  });
  it("rejects non-https base URLs except localhost", () => {
    expect(() => readConfig({ BHARATCODE_API_KEY: "k", BHARATCODE_BASE_URL: "http://evil.example" })).toThrow();
    expect(readConfig({ BHARATCODE_API_KEY: "k", BHARATCODE_BASE_URL: "http://localhost:9999/v1" })?.baseUrl).toBe("http://localhost:9999/v1");
  });
});

describe("BharatCodeClient", () => {
  it("sends store:false + stream:true and reads a streamed response", async () => {
    const { client, requests } = testClient([streamed([message("Hello")])]);
    const progress: ProgressEvent[] = [];
    const { response, requestId } = await client.createResponse({ input: "Say hello" }, { onProgress: (e) => progress.push(e) });
    expect(response.status).toBe("completed");
    expect(requestId).toBe("req_test");
    expect(requests[0]!.url).toBe("https://bharatcode.test/api/model/v1/responses");
    expect(requests[0]!.body).toMatchObject({ model: "qwen-3.8-27b", store: false, stream: true, input: "Say hello" });
    expect(requests[0]!.headers.get("authorization")).toBe("Bearer bc_test_key");
    expect(progress.map((p) => p.type)).toEqual(["queued", "started", "text_delta"]);
  });

  it("treats keepalive comments as queue status, never as text", async () => {
    const { client } = testClient([
      sseResponse([
        { comment: "queued" },
        { comment: "queued" },
        { event: "response.completed", data: { type: "response.completed", response: { status: "completed", output: [message("ok")] } } },
      ]),
    ]);
    const progress: ProgressEvent[] = [];
    const { response } = await client.createResponse({ input: "x" }, { onProgress: (e) => progress.push(e) });
    expect(progress.filter((p) => p.type === "queued")).toHaveLength(2);
    expect(JSON.stringify(response.output)).not.toContain("queued");
  });

  it("retries 503 with backoff and honours Retry-After", async () => {
    const { client, requests, sleeps } = testClient([
      jsonError(503, "busy", { "retry-after": "3" }),
      jsonError(503, "busy"),
      streamed([message("done")]),
    ]);
    const { response } = await client.createResponse({ input: "x" });
    expect(response.status).toBe("completed");
    expect(requests).toHaveLength(3);
    expect(sleeps).toEqual([3_000, 4_000]);
  });

  it("gives up after three 503 retries and preserves the request id", async () => {
    const { client, requests } = testClient([jsonError(503, "busy"), jsonError(503, "busy"), jsonError(503, "busy"), jsonError(503, "still busy")]);
    const err = await client.createResponse({ input: "x" }).catch((e) => e);
    expect(err).toBeInstanceOf(BharatCodeError);
    expect(err.kind).toBe("busy");
    expect(err.requestId).toBe("req_503");
    expect(err.retryable).toBe(true);
    expect(requests).toHaveLength(4);
  });

  it("does not retry auth or bad-request errors", async () => {
    const auth = testClient([jsonError(401, "Missing BharatCode bearer token.")]);
    const e1 = await auth.client.createResponse({ input: "x" }).catch((e) => e);
    expect(e1.kind).toBe("auth");
    expect(auth.requests).toHaveLength(1);

    const bad = testClient([jsonError(400, "previous_response_id is not supported")]);
    const e2 = await bad.client.createResponse({ input: "x" }).catch((e) => e);
    expect(e2.kind).toBe("bad_request");
    expect(e2.detail).toContain("previous_response_id");
    expect(bad.requests).toHaveLength(1);
  });

  it("reports a missing API plan (402) without retrying", async () => {
    const { client, requests } = testClient([
      new Response(JSON.stringify({ error: { message: "Coding and API use need BharatCode Lite or Pro", type: "subscription_required", code: "subscription_required" } }), {
        status: 402,
        headers: { "content-type": "application/json", "x-request-id": "req_402" },
      }),
    ]);
    const err = await client.createResponse({ input: "x" }).catch((e) => e);
    expect(err.kind).toBe("subscription_required");
    expect(err.retryable).toBe(false);
    expect(err.message).toMatch(/doesn't include API access/);
    expect(requests).toHaveLength(1);
  });

  const failedBeforeOutput = () =>
    sseResponse([
      { comment: "queued" },
      { event: "response.failed", data: { type: "response.failed", response: { status: "failed", output: [], error: { message: "Model unavailable." } } } },
    ]);

  it("retries response.failed that arrives before any output, like a 503", async () => {
    const { client, requests, sleeps } = testClient([failedBeforeOutput(), streamed([message("ok")])]);
    const { response } = await client.createResponse({ input: "x" });
    expect(response.status).toBe("completed");
    expect(requests).toHaveLength(2);
    expect(sleeps).toEqual([2_000]);
  });

  it("gives up on repeated response.failed and reports it", async () => {
    const { client, requests } = testClient([failedBeforeOutput(), failedBeforeOutput(), failedBeforeOutput(), failedBeforeOutput()]);
    const err = await client.createResponse({ input: "x" }).catch((e) => e);
    expect(err.kind).toBe("failed");
    expect(err.detail).toBe("Model unavailable.");
    expect(requests).toHaveLength(4);
  });

  it("does not retry response.failed after output has started", async () => {
    const { client, requests } = testClient([
      sseResponse([
        { event: "response.output_text.delta", data: { type: "response.output_text.delta", delta: "Partial" } },
        { event: "response.failed", data: { type: "response.failed", response: { status: "failed", output: [], error: { message: "model crashed" } } } },
      ]),
    ]);
    const err = await client.createResponse({ input: "x" }).catch((e) => e);
    expect(err.kind).toBe("failed");
    expect(err.detail).toBe("model crashed");
    expect(requests).toHaveLength(1);
  });

  it("retries one network failure", async () => {
    const { client, requests } = testClient([new TypeError("fetch failed"), streamed([message("ok")])]);
    await client.createResponse({ input: "x" });
    expect(requests).toHaveLength(2);
  });

  it("reports a stream that ends without a terminal event", async () => {
    const { client } = testClient([sseResponse([{ event: "response.created", data: { type: "response.created" } }])]);
    const err = await client.createResponse({ input: "x" }).catch((e) => e);
    expect(err.kind).toBe("network");
  });

  it("accepts a plain JSON response when the server does not stream", async () => {
    const { client } = testClient([
      new Response(JSON.stringify({ status: "completed", output: [message("plain")] }), { headers: { "content-type": "application/json" } }),
    ]);
    const { response } = await client.createResponse({ input: "x" });
    expect(response.output).toHaveLength(1);
  });

  it("returns incomplete responses to the caller without retrying", async () => {
    const { client, requests } = testClient([streamed([message("partial")], "incomplete", { incomplete_details: { reason: "max_output_tokens" } })]);
    const { response } = await client.createResponse({ input: "x" });
    expect(response.status).toBe("incomplete");
    expect(requests).toHaveLength(1);
  });

  it("reports abort as aborted", async () => {
    const { client } = testClient([streamed([message("x")])]);
    const ctl = new AbortController();
    ctl.abort();
    const err = await client.createResponse({ input: "x" }, { signal: ctl.signal }).catch((e) => e);
    expect(err.kind).toBe("aborted");
  });
});

const echoTool: AppTool<{ value: string }> = {
  name: "echo",
  description: "Echo a value",
  args: z.object({ value: z.string().min(1) }),
  parameters: { type: "object", properties: { value: { type: "string" } }, required: ["value"], additionalProperties: false },
  run: ({ value }) => ({ echoed: value.toUpperCase() }),
  summarize: ({ value }) => `echoed ${value}`,
};

describe("runToolLoop", () => {
  it("executes tool calls app-side and replays the full history with function_call_output", async () => {
    const { client, requests } = testClient([
      streamed([functionCall("echo", { value: "upi" }, "call_1")]),
      streamed([message("All checked.")]),
    ]);
    const result = await runToolLoop({ client, instructions: "be careful", input: [{ role: "user", content: "hi" }], tools: [echoTool as never] });
    expect(result.stoppedBecause).toBe("done");
    expect(result.traces).toEqual([{ name: "echo", ok: true, summary: "echoed upi" }]);
    const second = requests[1]!.body as { input: Array<Record<string, unknown>>; tools: unknown[]; store: boolean };
    expect(second.store).toBe(false);
    expect(second.tools).toHaveLength(1);
    expect(second.input.map((i) => i.type ?? i.role)).toEqual(["user", "function_call", "function_call_output"]);
    const out = second.input[2]!;
    expect(out.call_id).toBe("call_1");
    expect(typeof out.output).toBe("string");
    expect(JSON.parse(out.output as string)).toEqual({ echoed: "UPI" });
  });

  it("never executes tool calls from an incomplete response", async () => {
    const { client, requests } = testClient([
      streamed([functionCall("echo", { value: "x" })], "incomplete", { incomplete_details: { reason: "max_output_tokens" } }),
    ]);
    let ran = false;
    const tool = { ...echoTool, run: () => ((ran = true), {}) };
    const result = await runToolLoop({ client, instructions: "", input: [{ role: "user", content: "hi" }], tools: [tool as never] });
    expect(ran).toBe(false);
    expect(result.stoppedBecause).toBe("incomplete");
    expect(result.items.some((i) => i.type === "function_call")).toBe(false);
    expect(requests).toHaveLength(1);
  });

  it("skips individual calls marked incomplete inside a completed response", async () => {
    const { client } = testClient([
      streamed([functionCall("echo", { value: "a" }, "c1"), functionCall("echo", '{"value":', "c2", "incomplete")]),
      streamed([message("done")]),
    ]);
    const result = await runToolLoop({ client, instructions: "", input: [{ role: "user", content: "hi" }], tools: [echoTool as never] });
    expect(result.traces).toHaveLength(1);
    expect(result.items.filter((i) => i.type === "function_call")).toHaveLength(1);
  });

  it("returns validation errors to the model instead of throwing", async () => {
    const { client, requests } = testClient([
      streamed([functionCall("echo", { value: "" }, "c1"), functionCall("nope", {}, "c2"), functionCall("echo", "not json", "c3")]),
      streamed([message("ok")]),
    ]);
    const result = await runToolLoop({ client, instructions: "", input: [{ role: "user", content: "hi" }], tools: [echoTool as never] });
    expect(result.traces.map((t) => t.ok)).toEqual([false, false, false]);
    const outputs = (requests[1]!.body.input as Array<{ type?: string; output?: string }>).filter((i) => i.type === "function_call_output");
    expect(outputs).toHaveLength(3);
    for (const o of outputs) expect(JSON.parse(o.output!)).toHaveProperty("error");
  });

  it("enforces the tool-call budget", async () => {
    const { client } = testClient([
      streamed([functionCall("echo", { value: "a" }, "c1"), functionCall("echo", { value: "b" }, "c2")]),
      streamed([message("ok")]),
    ]);
    const result = await runToolLoop({ client, instructions: "", input: [{ role: "user", content: "hi" }], tools: [echoTool as never], maxToolCalls: 1 });
    expect(result.traces.map((t) => t.ok)).toEqual([true, false]);
  });

  it("stops after maxRounds", async () => {
    const { client } = testClient([streamed([functionCall("echo", { value: "a" }, "c1")]), streamed([functionCall("echo", { value: "b" }, "c2")])]);
    const result = await runToolLoop({ client, instructions: "", input: [{ role: "user", content: "hi" }], tools: [echoTool as never], maxRounds: 2 });
    expect(result.stoppedBecause).toBe("max_rounds");
  });
});

const Schema = z.object({ name: z.string(), count: z.number().int() });

describe("requestStructured", () => {
  it("sends a strict json_schema text.format and validates the result", async () => {
    const { client, requests } = testClient([streamed([message('{"name":"a","count":2}')])]);
    const r = await requestStructured({ client, instructions: "x", items: [{ role: "user", content: "go" }], schema: Schema, name: "thing" });
    expect(r.data).toEqual({ name: "a", count: 2 });
    const format = (requests[0]!.body.text as { format: Record<string, unknown> }).format;
    expect(format).toMatchObject({ type: "json_schema", name: "thing", strict: true });
    expect((format.schema as { additionalProperties: boolean }).additionalProperties).toBe(false);
  });

  it("falls back to plain JSON when text.format is rejected", async () => {
    const { client, requests } = testClient([jsonError(400, "text.format not supported"), streamed([message('Here:\n```json\n{"name":"b","count":1}\n```')])]);
    const r = await requestStructured({ client, instructions: "x", items: [{ role: "user", content: "go" }], schema: Schema, name: "thing" });
    expect(r.usedFallback).toBe(true);
    expect(requests[1]!.body.text).toBeUndefined();
    expect(String(requests[1]!.body.instructions)).toContain("JSON Schema");
  });

  it("repairs once, then gives up with the partial text kept", async () => {
    const ok = testClient([streamed([message('{"name":"a","count":"two"}')]), streamed([message('{"name":"a","count":2}')])]);
    const r = await requestStructured({ client: ok.client, instructions: "x", items: [{ role: "user", content: "go" }], schema: Schema, name: "t" });
    expect(r.repaired).toBe(true);
    const repairInput = ok.requests[1]!.body.input as Array<{ role?: string; content?: string }>;
    expect(repairInput.at(-1)!.content).toContain("did not pass validation");

    const bad = testClient([streamed([message("nonsense")]), streamed([message("still nonsense")])]);
    const err = await requestStructured({ client: bad.client, instructions: "x", items: [], schema: Schema, name: "t" }).catch((e) => e);
    expect(err.kind).toBe("invalid_output");
    expect(err.partial).toBe("still nonsense");
  });

  it("retries a cut-off answer once with a doubled budget, never the same budget", async () => {
    const { client, requests } = testClient([
      streamed([message('{"name":')], "incomplete", { incomplete_details: { reason: "max_output_tokens" } }),
      streamed([message('{"name":"a","count":1}')]),
    ]);
    await requestStructured({ client, instructions: "x", items: [], schema: Schema, name: "t", maxOutputTokens: 3000 });
    expect(requests.map((r) => r.body.max_output_tokens)).toEqual([3000, 6000]);

    const twice = testClient([
      streamed([message("{")], "incomplete", { incomplete_details: { reason: "max_output_tokens" } }),
      streamed([message("{")], "incomplete", { incomplete_details: { reason: "max_output_tokens" } }),
    ]);
    const err = await requestStructured({ client: twice.client, instructions: "x", items: [], schema: Schema, name: "t" }).catch((e) => e);
    expect(err.kind).toBe("incomplete");
    expect(twice.requests).toHaveLength(2);
  });

  it("extractJson tolerates prose and nested braces in strings", () => {
    expect(extractJson('Sure! {"a":"x}y","b":{"c":1}} trailing')).toEqual({ a: "x}y", b: { c: 1 } });
    expect(() => extractJson("no json here")).toThrow();
  });
});
