import { z } from "zod";
import { BharatCodeClient } from "@/lib/bharatcode/client";
import { publicModelInfo, readConfig } from "@/lib/bharatcode/config";
import { BharatCodeError, userMessage } from "@/lib/bharatcode/errors";
import { Tri } from "@/lib/domain/enums";
import { analyzeIncident } from "@/lib/pipeline/analyze";
import { checkMessage, checkWithRules } from "@/lib/pipeline/check";
import { validateImageDataUrl, MAX_IMAGES } from "./images";
import { checkOrigin, checkRate, jsonError, readJson } from "./guards";
import { limiterFor, type RateLimiter } from "./rate-limit";
import { logEvent } from "./log";
import { sseStream } from "./sse";

export const APP_VERSION = "0.1.0";

export interface HandlerDeps {
  getClient: () => BharatCodeClient | null;
  now: () => Date;
  limiter: (name: string) => RateLimiter;
}

export const defaultDeps: HandlerDeps = {
  getClient: () => {
    const config = readConfig();
    return config ? new BharatCodeClient(config) : null;
  },
  now: () => new Date(),
  limiter: (name) => limiterFor(name),
};

const ImageList = z.array(z.object({ dataUrl: z.string().max(5_000_000) })).max(MAX_IMAGES);

export const AnalyzeRequest = z.object({
  story: z.string().max(4_000),
  images: ImageList,
  paid: Tri,
  discoveredAt: z.string().max(40).nullable(),
});

export const CheckRequest = z.object({
  text: z.string().max(4_000),
  images: ImageList,
});

function validateImages(images: Array<{ dataUrl: string }>): { ok: true; urls: string[] } | { ok: false; response: Response } {
  const urls: string[] = [];
  for (const [i, img] of images.entries()) {
    const r = validateImageDataUrl(img.dataUrl, i);
    if (!r.ok) return { ok: false, response: jsonError(400, "bad_image", r.error) };
    urls.push(r.dataUrl);
  }
  return { ok: true, urls };
}

function zodMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue ? `${issue.path.join(".") || "body"}: ${issue.message}` : "Invalid request.";
}

function errorPayload(err: unknown) {
  if (err instanceof BharatCodeError) return { kind: err.kind, message: err.message, requestId: err.requestId, retryable: err.retryable };
  return { kind: "internal", message: "Something went wrong on our side. Your inputs are still here.", requestId: null, retryable: true };
}

export function handleHealth(): Response {
  return Response.json(
    { ok: true, version: APP_VERSION, model: publicModelInfo() },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function handleAnalyze(req: Request, deps: HandlerDeps = defaultDeps): Promise<Response> {
  const started = Date.now();
  const blocked = checkOrigin(req);
  if (blocked) return blocked;
  const body = await readJson(req);
  if (!body.ok) return body.response;
  const parsed = AnalyzeRequest.safeParse(body.value);
  if (!parsed.success) return jsonError(400, "bad_request", zodMessage(parsed.error));
  const { story, images, paid, discoveredAt } = parsed.data;
  if (!story.trim() && images.length === 0) return jsonError(400, "bad_request", "Add a short description or at least one screenshot.");
  if (discoveredAt && Number.isNaN(new Date(discoveredAt).getTime())) return jsonError(400, "bad_request", "discoveredAt is not a valid date.");
  const imgs = validateImages(images);
  if (!imgs.ok) return imgs.response;

  const client = deps.getClient();
  if (!client) return jsonError(503, "not_configured", userMessage("not_configured"));
  const limited = checkRate(req, deps.limiter("analyze"));
  if (limited) return limited;

  return sseStream(req.signal, async (send, signal) => {
    try {
      const out = await analyzeIncident(client, { story, images: imgs.urls, paid, discoveredAt }, { now: deps.now(), signal, onEvent: (e) => send("progress", e) });
      send("result", out);
      logEvent({ route: "analyze", outcome: "ok", ms: Date.now() - started, requestIds: out.case.requestIds });
    } catch (err) {
      const payload = errorPayload(err);
      send("error", payload);
      logEvent({
        route: "analyze",
        outcome: "error",
        ms: Date.now() - started,
        errorKind: payload.kind,
        status: err instanceof BharatCodeError ? err.status : null,
        requestIds: payload.requestId ? [payload.requestId] : [],
      });
    }
  });
}

export async function handleCheck(req: Request, deps: HandlerDeps = defaultDeps): Promise<Response> {
  const started = Date.now();
  const blocked = checkOrigin(req);
  if (blocked) return blocked;
  const body = await readJson(req);
  if (!body.ok) return body.response;
  const parsed = CheckRequest.safeParse(body.value);
  if (!parsed.success) return jsonError(400, "bad_request", zodMessage(parsed.error));
  const { text, images } = parsed.data;
  if (!text.trim() && images.length === 0) return jsonError(400, "bad_request", "Paste the message or add a screenshot.");
  const imgs = validateImages(images);
  if (!imgs.ok) return imgs.response;

  const client = deps.getClient();
  if (!client) {
    if (!text.trim()) return jsonError(503, "not_configured", "Reading screenshots needs AI, which isn't switched on for this server. Paste the message text instead.");
    return sseStream(req.signal, async (send) => {
      send("progress", { type: "note", message: "AI is off on this server: checked with fixed rules only." });
      send("result", checkWithRules(text));
    });
  }
  const limited = checkRate(req, deps.limiter("check"));
  if (limited) return limited;

  return sseStream(req.signal, async (send, signal) => {
    try {
      const result = await checkMessage(client, { text, images: imgs.urls }, { now: deps.now(), signal, onEvent: (e) => send("progress", e) });
      send("result", result);
      logEvent({ route: "check", outcome: "ok", ms: Date.now() - started });
    } catch (err) {
      const payload = errorPayload(err);
      // Typed text can still be checked by the rules when the model fails.
      if (text.trim()) {
        send("progress", { type: "note", message: `${payload.message} Showing the fixed-rule check instead.` });
        send("result", { ...checkWithRules(text), fallbackReason: payload.kind });
      } else {
        send("error", payload);
      }
      logEvent({ route: "check", outcome: "error", ms: Date.now() - started, errorKind: payload.kind });
    }
  });
}
