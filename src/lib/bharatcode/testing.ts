/**
 * Test helpers that imitate BharatCode's documented wire formats (https://bharatcode.ai/build):
 * SSE events `response.created`, `response.output_text.delta`, `response.output_item.done`,
 * `response.completed` / `response.incomplete` / `response.failed`, and ":" keepalive comments.
 * These are synthetic fixtures for tests. They are never shown to users as model output.
 */
import type { OutputItem, ResponseObject } from "./types";
import { BharatCodeClient } from "./client";

export type SsePart = { comment: string } | { event: string; data: unknown };

export function sseResponse(parts: SsePart[], init: { status?: number; headers?: Record<string, string> } = {}): Response {
  const encoder = new TextEncoder();
  const chunks = parts.map((p) =>
    "comment" in p ? `: ${p.comment}\n\n` : `event: ${p.event}\ndata: ${JSON.stringify(p.data)}\n\n`,
  );
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      // Split chunks unevenly to exercise the parser's buffering.
      for (const chunk of chunks) {
        const mid = Math.floor(chunk.length / 2);
        controller.enqueue(encoder.encode(chunk.slice(0, mid)));
        controller.enqueue(encoder.encode(chunk.slice(mid)));
      }
      controller.close();
    },
  });
  return new Response(body, {
    status: init.status ?? 200,
    headers: { "content-type": "text/event-stream", "x-request-id": "req_test", ...init.headers },
  });
}

export function jsonError(status: number, message: string, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ error: { message, type: "error", code: String(status) } }), {
    status,
    headers: { "content-type": "application/json", "x-request-id": `req_${status}`, ...headers },
  });
}

export function message(text: string): OutputItem {
  return { type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text }] };
}

export function functionCall(name: string, args: unknown, callId = `call_${name}`, status: "completed" | "incomplete" = "completed"): OutputItem {
  return { type: "function_call", call_id: callId, name, arguments: typeof args === "string" ? args : JSON.stringify(args), status };
}

/** A complete streamed response in BharatCode's format. */
export function streamed(output: OutputItem[], status: ResponseObject["status"] = "completed", extra: Partial<ResponseObject> = {}): Response {
  const response: ResponseObject = { id: "resp_test", object: "response", status, output, ...extra };
  const terminal = status === "completed" ? "response.completed" : status === "failed" ? "response.failed" : "response.incomplete";
  const text = output
    .filter((o) => o.type === "message")
    .map((o) => ((o as { content: Array<{ text?: string }> }).content[0]?.text ?? ""))
    .join("");
  return sseResponse([
    { comment: "keepalive" },
    { event: "response.created", data: { type: "response.created", response: { ...response, status: "in_progress", output: [] } } },
    ...(text ? [{ event: "response.output_text.delta", data: { type: "response.output_text.delta", delta: text } }] : []),
    ...output.map((item) => ({ event: "response.output_item.done", data: { type: "response.output_item.done", item } })),
    { event: terminal, data: { type: terminal, response } },
  ]);
}

export interface FakeFetch {
  fetch: typeof fetch;
  requests: Array<{ url: string; body: Record<string, unknown>; headers: Headers }>;
}

/** A fetch that replays queued responses (or throws queued errors) and records each request. */
export function fakeFetch(queue: Array<Response | Error | (() => Response)>): FakeFetch {
  const requests: FakeFetch["requests"] = [];
  const fn = (async (url: string | URL | Request, init?: RequestInit) => {
    requests.push({ url: String(url), body: JSON.parse(String(init?.body ?? "{}")), headers: new Headers(init?.headers) });
    if (init?.signal?.aborted) throw init.signal.reason;
    const next = queue.shift();
    if (!next) throw new Error("fakeFetch: no response queued");
    if (next instanceof Error) throw next;
    return typeof next === "function" ? next() : next;
  }) as typeof fetch;
  return { fetch: fn, requests };
}

export function testClient(queue: Array<Response | Error | (() => Response)>, sleeps: number[] = []) {
  const fake = fakeFetch(queue);
  const client = new BharatCodeClient(
    { apiKey: "bc_test_key", baseUrl: "https://bharatcode.test/api/model/v1", model: "qwen-3.8-27b", timeoutMs: 5_000 },
    { fetch: fake.fetch, sleep: async (ms) => void sleeps.push(ms), random: () => 0 },
  );
  return { client, requests: fake.requests, sleeps };
}
