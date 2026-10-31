export interface PreparedImage {
  name: string;
  dataUrl: string;
  bytes: number;
}

const MAX_SIDE = 1600;
const TARGET_BYTES = 2_800_000;

/** Downscales a screenshot in the browser so uploads stay small; text remains readable at 1600 px. */
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    throw new Error(`${file.name}: use a PNG, JPEG or WebP screenshot.`);
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can't process images.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.9, 0.8, 0.65]) {
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const bytes = Math.floor(((dataUrl.length - dataUrl.indexOf(",") - 1) * 3) / 4);
    if (bytes <= TARGET_BYTES) return { name: file.name, dataUrl, bytes };
  }
  throw new Error(`${file.name} is too large even after compressing. Crop it and try again.`);
}

/** Loads a same-origin image URL (sample screenshots) as a data URL. */
export async function urlToDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
