import { parseSse } from "@/lib/bharatcode/sse";
import type { PipelineEvent } from "@/lib/pipeline/events";

export interface ApiErrorInfo {
  kind: string;
  message: string;
  requestId?: string | null;
  retryable?: boolean;
}

export class ApiError extends Error {
  constructor(readonly info: ApiErrorInfo) {
    super(info.message);
  }
}

/** POSTs JSON and reads the server-sent events Turant's API streams back. Resolves with the result event. */
export async function postForStream<T>(
  url: string,
  body: unknown,
  opts: { signal?: AbortSignal; onProgress?: (e: PipelineEvent) => void } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
  } catch {
    throw new ApiError({ kind: "network", message: "Couldn't reach the server. Check your connection and try again.", retryable: true });
  }
  if (!res.ok || !(res.headers.get("content-type") ?? "").includes("text/event-stream")) {
    const json = (await res.json().catch(() => null)) as { error?: ApiErrorInfo } | null;
    throw new ApiError(json?.error ?? { kind: "http", message: `Request failed (${res.status}).` });
  }
  for await (const item of parseSse(res.body!)) {
    if (item.kind !== "event" || !item.data) continue;
    const data = JSON.parse(item.data);
    if (item.event === "progress") opts.onProgress?.(data as PipelineEvent);
    else if (item.event === "result") return data as T;
    else if (item.event === "error") throw new ApiError(data as ApiErrorInfo);
  }
  throw new ApiError({ kind: "network", message: "The connection closed before the answer arrived. Try again.", retryable: true });
}
