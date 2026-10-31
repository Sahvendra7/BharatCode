export const DEFAULT_BASE_URL = "https://bharatcode.ai/api/model/v1";
export const DEFAULT_MODEL = "qwen-3.8-27b";

export interface BharatCodeConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  /** Per-request ceiling including time spent queued on shared capacity. */
  timeoutMs: number;
}

/** Reads server-side configuration. Returns null when no key is set, so callers can degrade gracefully. */
export function readConfig(env: Record<string, string | undefined> = process.env): BharatCodeConfig | null {
  const apiKey = env.BHARATCODE_API_KEY?.trim();
  if (!apiKey) return null;
  const baseUrl = (env.BHARATCODE_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");
  if (!/^https:\/\//.test(baseUrl) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(baseUrl)) {
    throw new Error("BHARATCODE_BASE_URL must be an https URL");
  }
  const timeout = Number(env.BHARATCODE_TIMEOUT_MS);
  return {
    apiKey,
    baseUrl,
    model: env.BHARATCODE_MODEL?.trim() || DEFAULT_MODEL,
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 150_000,
  };
}

/** Safe to expose: says whether AI is available and which model, never the key. */
export function publicModelInfo(env: Record<string, string | undefined> = process.env) {
  try {
    const config = readConfig(env);
    return { configured: !!config, id: config?.model ?? (env.BHARATCODE_MODEL?.trim() || DEFAULT_MODEL) };
  } catch {
    return { configured: false, id: DEFAULT_MODEL };
  }
}
