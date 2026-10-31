import type { RateLimiter } from "./rate-limit";

export const MAX_BODY_BYTES = 14 * 1024 * 1024;

export function jsonError(status: number, kind: string, message: string, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ error: { kind, message } }), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });
}

/** Rejects cross-site POSTs. Browsers send Origin on fetch POSTs; it must match the Host. */
export function checkOrigin(req: Request): Response | null {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return jsonError(403, "forbidden", "Cross-site requests are not allowed.");
  if (!origin) return site === "same-origin" ? null : jsonError(403, "forbidden", "Missing Origin header.");
  try {
    if (new URL(origin).host !== host) return jsonError(403, "forbidden", "Cross-site requests are not allowed.");
  } catch {
    return jsonError(403, "forbidden", "Invalid Origin header.");
  }
  return null;
}

export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim();
}

export function checkRate(req: Request, limiter: RateLimiter): Response | null {
  const wait = limiter.take(clientKey(req));
  if (!wait) return null;
  const seconds = Math.ceil(wait / 1000);
  return jsonError(429, "rate_limited", `Too many requests. Try again in about ${Math.ceil(seconds / 60)} minute(s).`, { "retry-after": String(seconds) });
}

/** Reads a JSON body with a hard size limit, regardless of the Content-Length header. */
export async function readJson(req: Request, maxBytes = MAX_BODY_BYTES): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false, response: jsonError(413, "too_large", "Request is too large.") };
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) {
    return { ok: false, response: jsonError(415, "unsupported", "Send JSON.") };
  }
  const reader = req.body?.getReader();
  if (!reader) return { ok: false, response: jsonError(400, "bad_request", "Empty body.") };
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return { ok: false, response: jsonError(413, "too_large", "Request is too large.") };
    }
    chunks.push(value);
  }
  try {
    return { ok: true, value: JSON.parse(Buffer.concat(chunks).toString("utf8")) };
  } catch {
    return { ok: false, response: jsonError(400, "bad_request", "Body is not valid JSON.") };
  }
}
