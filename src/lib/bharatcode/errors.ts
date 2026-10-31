export type BharatCodeErrorKind =
  | "not_configured" // no API key on the server
  | "auth" // 401/403
  | "subscription_required" // 402: the key's account has no API plan (Lite, Pro or verified student)
  | "bad_request" // 400, e.g. an unsupported parameter
  | "rate_limited" // 429
  | "busy" // 503 after retries
  | "server" // other 5xx after retries
  | "network" // fetch failed or the stream broke
  | "timeout"
  | "aborted" // the person closed the page
  | "failed" // response.failed
  | "incomplete" // output budget exhausted and not recoverable
  | "invalid_output"; // the model's JSON did not validate after repair

const USER_MESSAGES: Record<BharatCodeErrorKind, string> = {
  not_configured: "AI reading isn't switched on for this server. You can still enter the details yourself.",
  auth: "The server's BharatCode key was rejected. You can still enter the details yourself.",
  subscription_required: "AI reading isn't available: this server's BharatCode account doesn't include API access. You can still enter the details yourself.",
  bad_request: "BharatCode couldn't process this request.",
  rate_limited: "Too many requests right now. Please wait a minute and try again.",
  busy: "BharatCode's shared capacity is busy right now. Try again in a minute, or enter the details yourself.",
  server: "BharatCode had a problem. Try again in a minute, or enter the details yourself.",
  network: "We couldn't reach BharatCode. Check your connection and try again.",
  timeout: "BharatCode took too long. Try again, or enter the details yourself.",
  aborted: "The request was cancelled.",
  failed: "The AI couldn't finish reading your evidence. Try again, or enter the details yourself.",
  incomplete: "The AI's answer was cut off. Try with fewer screenshots, or enter the details yourself.",
  invalid_output: "The AI's answer wasn't usable. Your evidence is still here: enter the details yourself or try again.",
};

export class BharatCodeError extends Error {
  readonly kind: BharatCodeErrorKind;
  readonly status: number | null;
  readonly requestId: string | null;
  readonly retryable: boolean;
  /** Raw detail from BharatCode, for logs and operators. Not shown to end users. */
  readonly detail: string | null;
  /** Partial model text kept when a response was incomplete or invalid. */
  readonly partial: string | null;
  /** True when a stream failed before producing any output, so the request can be retried safely. */
  readonly beforeOutput: boolean;

  constructor(
    kind: BharatCodeErrorKind,
    opts: { status?: number | null; requestId?: string | null; detail?: string | null; partial?: string | null; beforeOutput?: boolean; cause?: unknown } = {},
  ) {
    super(USER_MESSAGES[kind], { cause: opts.cause });
    this.name = "BharatCodeError";
    this.kind = kind;
    this.status = opts.status ?? null;
    this.requestId = opts.requestId ?? null;
    this.detail = opts.detail ?? null;
    this.partial = opts.partial ?? null;
    this.beforeOutput = opts.beforeOutput ?? false;
    this.retryable = ["busy", "server", "network", "timeout", "rate_limited"].includes(kind);
  }

  toJSON() {
    return { kind: this.kind, message: this.message, status: this.status, requestId: this.requestId, retryable: this.retryable };
  }
}

export function userMessage(kind: BharatCodeErrorKind): string {
  return USER_MESSAGES[kind];
}
