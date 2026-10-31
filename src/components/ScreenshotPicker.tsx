"use client";

import { useId, useRef, useState } from "react";
import { prepareImage, type PreparedImage } from "@/lib/client/images";

export function ScreenshotPicker({ images, onChange, max = 4 }: { images: PreparedImage[]; onChange: (imgs: PreparedImage[]) => void; max?: number }) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy(true);
    const next = [...images];
    for (const file of Array.from(files)) {
      if (next.length >= max) {
        setError(`You can add up to ${max} screenshots.`);
        break;
      }
      try {
        next.push(await prepareImage(file));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't read that image.");
      }
    }
    onChange(next);
    setBusy(false);
  }

  return (
    <div className="field">
      <span className="label" id={`${id}-label`}>
        Screenshots (optional, up to {max})
      </span>
      <div className="dropzone">
        <p className="hint">Payment receipt, bank SMS, the scammer&apos;s messages or call log. Crop out anything you don&apos;t want to share.</p>
        <button type="button" className="btn small secondary" onClick={() => input.current?.click()} disabled={busy || images.length >= max} aria-describedby={`${id}-label`}>
          {busy ? "Preparing…" : "Add screenshots"}
        </button>
        <input
          ref={input}
          hidden
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          data-testid="screenshot-input"
          onChange={(e) => {
            void add(e.target.files);
            e.target.value = "";
          }}
        />
        {images.length > 0 && (
          <ul className="thumbs">
            {images.map((img, i) => (
              <li key={i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.dataUrl} alt={`Screenshot ${i + 1}: ${img.name}`} />
                <span className="cap">Screenshot {i + 1}</span>
                <button type="button" className="btn quiet small" onClick={() => onChange(images.filter((_, j) => j !== i))}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && (
          <p className="hint" role="alert" style={{ color: "var(--stamp)" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
