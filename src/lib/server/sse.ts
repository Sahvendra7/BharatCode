/**
 * Server-sent events to the browser. The work function receives `send`; when it finishes or throws,
 * the stream closes. If the browser disconnects, `signal` aborts so upstream BharatCode calls stop too.
 */
export function sseStream(
  requestSignal: AbortSignal,
  work: (send: (event: string, data: unknown) => void, signal: AbortSignal) => Promise<void>,
): Response {
  const encoder = new TextEncoder();
  const controller = new AbortController();
  requestSignal.addEventListener("abort", () => controller.abort(requestSignal.reason), { once: true });

  const stream = new ReadableStream<Uint8Array>({
    async start(c) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          c.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };
      // A heartbeat keeps proxies from closing the connection while BharatCode is queued.
      const heartbeat = setInterval(() => {
        if (!closed) {
          try {
            c.enqueue(encoder.encode(": ping\n\n"));
          } catch {
            closed = true;
          }
        }
      }, 15_000);
      try {
        await work(send, controller.signal);
      } finally {
        clearInterval(heartbeat);
        closed = true;
        try {
          c.close();
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      controller.abort();
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
