/**
 * Minimal server-sent-events parser for BharatCode streams.
 * Comment lines (starting with ":") are queue keepalives, not model output: they are reported
 * separately so the UI can show "queued" without treating them as text.
 */
export type SseItem = { kind: "comment"; text: string } | { kind: "event"; event: string | null; data: string };

export async function* parseSse(body: ReadableStream<Uint8Array>): AsyncGenerator<SseItem> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let event: string | null = null;
  let data: string[] = [];

  const flush = (): SseItem | null => {
    if (!data.length && event === null) return null;
    const item: SseItem = { kind: "event", event, data: data.join("\n") };
    event = null;
    data = [];
    return item;
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline: number;
      while ((newline = buffer.search(/\r?\n/)) !== -1) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + (buffer[newline] === "\r" ? 2 : 1));
        if (line === "") {
          const item = flush();
          if (item) yield item;
        } else if (line.startsWith(":")) {
          yield { kind: "comment", text: line.slice(1).trim() };
        } else {
          const colon = line.indexOf(":");
          const field = colon === -1 ? line : line.slice(0, colon);
          const val = colon === -1 ? "" : line.slice(colon + 1).replace(/^ /, "");
          if (field === "event") event = val;
          else if (field === "data") data.push(val);
        }
      }
    }
    buffer += decoder.decode();
    if (buffer.trim() && !buffer.startsWith(":")) {
      const colon = buffer.indexOf(":");
      if (buffer.slice(0, colon) === "data") data.push(buffer.slice(colon + 1).replace(/^ /, ""));
    }
    const last = flush();
    if (last) yield last;
  } finally {
    reader.releaseLock();
  }
}
