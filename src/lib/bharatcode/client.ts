import type { BharatCodeConfig } from "./config";
import { BharatCodeError } from "./errors";
import { parseSse } from "./sse";
import type { CreateResponseRequest, OutputItem, ResponseObject } from "./types";

export type ProgressEvent =
  | { type: "queued" } // keepalive while waiting for shared capacity
  | { type: "started" } // response.created / in_progress
  | { type: "retry"; reason: "busy" | "server" | "network" | "rate_limited"; attempt: number; waitMs: number }
  | { type: "text_delta"; chars: number };

export interface CallResult {
  response: ResponseObject;
  requestId: string | null;
}

export interface ClientDeps {
  fetch?: typeof fetch;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  random?: () => number;
}

const BUSY_BACKOFF_MS = [2_000, 4_000, 8_000];
const MAX_RETRY_AFTER_MS = 20_000;

const defaultSleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(signal.reason);
    }, { once: true });
  });

function retryAfterMs(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS);
  const date = Date.parse(header);
  if (!Number.isNaN(date)) return Math.min(Math.max(0, date - Date.now()), MAX_RETRY_AFTER_MS);
  return null;
}

async function errorDetail(res: Response): Promise<string> {
  try {
    const text = await res.text();
    try {
      const json = JSON.parse(text) as { error?: { message?: string; code?: string } | string; message?: string };
      if (typeof json.error === "string") return json.error;
      return json.error?.message ?? json.message ?? text.slice(0, 500);
    } catch {
      return text.slice(0, 500);
    }
  } catch {
    return "";
  }
}

/**
 * Thin client for BharatCode's Responses API.
 * - Always sends store:false and streams, so queue keepalives are visible.
 * - Retries 503 (busy) up to 3 times with backoff, honouring Retry-After; 429 once; network errors once.
 * - Never retries 400/401/403, and never retries an incomplete response (the caller decides budgets).
 */
export class BharatCodeClient {
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number, signal?: AbortSignal) => Promise<void>;
  private readonly random: () => number;

  constructor(
    private readonly config: BharatCodeConfig,
    deps: ClientDeps = {},
  ) {
    this.fetchImpl = deps.fetch ?? fetch;
    this.sleep = deps.sleep ?? defaultSleep;
    this.random = deps.random ?? Math.random;
  }

  get model(): string {
    return this.config.model;
  }

  async createResponse(
    request: Omit<CreateResponseRequest, "store" | "stream" | "model"> & { model?: string },
    opts: { signal?: AbortSignal; onProgress?: (e: ProgressEvent) => void } = {},
  ): Promise<CallResult> {
    const body: CreateResponseRequest = { ...request, model: request.model ?? this.config.model, store: false, stream: true };
    let busyRetries = 0;
    let networkRetries = 0;
    let rateRetries = 0;
    let serverRetries = 0;

    for (let attempt = 1; ; attempt++) {
      const signal = opts.signal
        ? AbortSignal.any([opts.signal, AbortSignal.timeout(this.config.timeoutMs)])
        : AbortSignal.timeout(this.config.timeoutMs);
      let res: Response;
      try {
        res = await this.fetchImpl(`${this.config.baseUrl}/responses`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify(body),
          signal,
        });
      } catch (cause) {
        if (opts.signal?.aborted) throw new BharatCodeError("aborted", { cause });
        if (signal.aborted) throw new BharatCodeError("timeout", { cause });
        if (networkRetries < 1) {
          networkRetries++;
          const waitMs = 1_000;
          opts.onProgress?.({ type: "retry", reason: "network", attempt, waitMs });
          await this.sleep(waitMs, opts.signal);
          continue;
        }
        throw new BharatCodeError("network", { cause, detail: String(cause) });
      }

      const requestId = res.headers.get("x-request-id");
      if (!res.ok) {
        const detail = await errorDetail(res);
        const status = res.status;
        if (status === 503 && busyRetries < BUSY_BACKOFF_MS.length) {
          const waitMs = retryAfterMs(res.headers.get("retry-after")) ?? BUSY_BACKOFF_MS[busyRetries]! + Math.floor(this.random() * 500);
          busyRetries++;
          opts.onProgress?.({ type: "retry", reason: "busy", attempt, waitMs });
          await this.sleep(waitMs, opts.signal);
          continue;
        }
        if (status === 429 && rateRetries < 1) {
          const waitMs = retryAfterMs(res.headers.get("retry-after")) ?? 5_000;
          rateRetries++;
          opts.onProgress?.({ type: "retry", reason: "rate_limited", attempt, waitMs });
          await this.sleep(waitMs, opts.signal);
          continue;
        }
        if (status >= 500 && status !== 503 && serverRetries < 1) {
          serverRetries++;
          opts.onProgress?.({ type: "retry", reason: "server", attempt, waitMs: 2_000 });
          await this.sleep(2_000, opts.signal);
          continue;
        }
        const kind =
          status === 401 || status === 403
            ? "auth"
            : status === 402
              ? "subscription_required"
            : status === 400 || status === 404 || status === 422
              ? "bad_request"
              : status === 429
                ? "rate_limited"
                : status === 503
                  ? "busy"
                  : "server";
        throw new BharatCodeError(kind, { status, requestId, detail });
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("text/event-stream")) {
        // A server that ignores stream:true still returns a valid response object.
        const json = (await res.json()) as ResponseObject;
        return { response: checkTerminal(json, requestId), requestId };
      }
      if (!res.body) throw new BharatCodeError("network", { requestId, detail: "empty stream" });

      try {
        const response = await this.readStream(res.body, requestId, opts.onProgress);
        return { response, requestId };
      } catch (err) {
        // BharatCode ends an already-open stream with response.failed when the model is busy ("Model unavailable").
        // Before any output that is as safe to retry as a 503.
        if (err instanceof BharatCodeError && err.kind === "failed" && err.beforeOutput && busyRetries < BUSY_BACKOFF_MS.length) {
          const waitMs = BUSY_BACKOFF_MS[busyRetries]! + Math.floor(this.random() * 500);
          busyRetries++;
          opts.onProgress?.({ type: "retry", reason: "busy", attempt, waitMs });
          await this.sleep(waitMs, opts.signal);
          continue;
        }
        if (err instanceof BharatCodeError) throw err;
        if (opts.signal?.aborted) throw new BharatCodeError("aborted", { requestId, cause: err });
        if (signal.aborted) throw new BharatCodeError("timeout", { requestId, cause: err });
        throw new BharatCodeError("network", { requestId, cause: err, detail: "stream interrupted" });
      }
    }
  }

  private async readStream(
    body: ReadableStream<Uint8Array>,
    requestId: string | null,
    onProgress?: (e: ProgressEvent) => void,
  ): Promise<ResponseObject> {
    const items: OutputItem[] = [];
    let started = false;
    let produced = false;
    for await (const item of parseSse(body)) {
      if (item.kind === "comment") {
        if (!started) onProgress?.({ type: "queued" });
        continue;
      }
      if (!item.data || item.data === "[DONE]") continue;
      let payload: { type?: string; response?: ResponseObject; item?: OutputItem; delta?: string; message?: string; error?: { message?: string } };
      try {
        payload = JSON.parse(item.data);
      } catch {
        continue;
      }
      const type = payload.type ?? item.event ?? "";
      switch (type) {
        case "response.created":
        case "response.in_progress":
          if (!started) {
            started = true;
            onProgress?.({ type: "started" });
          }
          break;
        case "response.output_text.delta":
          produced = true;
          onProgress?.({ type: "text_delta", chars: payload.delta?.length ?? 0 });
          break;
        case "response.output_item.done":
          produced = true;
          if (payload.item) items.push(payload.item);
          break;
        case "response.completed":
        case "response.incomplete": {
          const response = payload.response ?? { status: type === "response.completed" ? "completed" : "incomplete", output: items };
          if (!response.output?.length && items.length) response.output = items;
          return checkTerminal(response, requestId);
        }
        case "response.failed":
          throw new BharatCodeError("failed", {
            requestId,
            detail: payload.response?.error?.message ?? payload.error?.message ?? "response.failed",
            beforeOutput: !produced,
          });
        case "error":
          throw new BharatCodeError("failed", { requestId, detail: payload.error?.message ?? payload.message ?? "stream error", beforeOutput: !produced });
        default:
          break;
      }
    }
    throw new BharatCodeError("network", { requestId, detail: "stream ended without a final event" });
  }
}

function checkTerminal(response: ResponseObject, requestId: string | null): ResponseObject {
  if (response.status === "failed") {
    throw new BharatCodeError("failed", { requestId, detail: response.error?.message ?? "failed" });
  }
  return { ...response, output: response.output ?? [] };
}
