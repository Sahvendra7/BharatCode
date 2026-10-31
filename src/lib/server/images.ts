export const MAX_IMAGES = 4;
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const SIGNATURES: Array<{ mime: string; test: (b: Uint8Array) => boolean }> = [
  { mime: "image/png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: "image/webp",
    test: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
];

export type ImageCheck = { ok: true; dataUrl: string; bytes: number } | { ok: false; error: string };

/** Accepts only base64 PNG/JPEG/WebP data URLs whose bytes match the declared type and fit the size limit. */
export function validateImageDataUrl(dataUrl: string, index: number): ImageCheck {
  const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl);
  if (!m) return { ok: false, error: `Screenshot ${index + 1} must be a PNG, JPEG or WebP image.` };
  const [, mime, b64 = ""] = m;
  const clean = b64.replace(/\s/g, "");
  const bytes = Math.floor((clean.length * 3) / 4) - (clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0);
  if (bytes > MAX_IMAGE_BYTES) return { ok: false, error: `Screenshot ${index + 1} is too large (max 3 MB).` };
  const head = Buffer.from(clean.slice(0, 24), "base64");
  const sig = SIGNATURES.find((s) => s.mime === mime);
  if (!sig || !sig.test(new Uint8Array(head))) return { ok: false, error: `Screenshot ${index + 1} is not a valid ${mime?.split("/")[1]?.toUpperCase()} file.` };
  return { ok: true, dataUrl: `data:${mime};base64,${clean}`, bytes };
}
