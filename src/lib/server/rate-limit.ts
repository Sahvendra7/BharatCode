/**
 * In-memory token bucket per client key. Good for a single instance; for several instances,
 * replace with a shared store behind the same interface.
 */
export class RateLimiter {
  private readonly buckets = new Map<string, { tokens: number; updated: number }>();

  constructor(
    private readonly capacity: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** Returns 0 if allowed, otherwise the milliseconds until one token is available. */
  take(key: string): number {
    const t = this.now();
    const refillPerMs = this.capacity / this.windowMs;
    const bucket = this.buckets.get(key) ?? { tokens: this.capacity, updated: t };
    bucket.tokens = Math.min(this.capacity, bucket.tokens + (t - bucket.updated) * refillPerMs);
    bucket.updated = t;
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      this.buckets.set(key, bucket);
      this.prune(t);
      return 0;
    }
    this.buckets.set(key, bucket);
    return Math.ceil((1 - bucket.tokens) / refillPerMs);
  }

  private prune(t: number) {
    if (this.buckets.size < 5_000) return;
    for (const [k, b] of this.buckets) if (t - b.updated > this.windowMs) this.buckets.delete(k);
  }
}

const limiters = new Map<string, RateLimiter>();

export function limiterFor(name: string, env: Record<string, string | undefined> = process.env): RateLimiter {
  let l = limiters.get(name);
  if (!l) {
    const n = Number(env.TURANT_RATE_LIMIT_PER_10_MIN);
    l = new RateLimiter(Number.isFinite(n) && n > 0 ? n : 8, 10 * 60_000);
    limiters.set(name, l);
  }
  return l;
}
