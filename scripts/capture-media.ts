/**
 * Captures README screenshots and the demo GIF. Expects `bash e2e/serve.sh` to be running
 * (port 3100: no key; port 3101: local BharatCode test stub).
 * Run: npx tsx scripts/capture-media.ts
 * AI-path media come from real runs with a BharatCode key (docs/media/ai-*.png), not from this script.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium, type Page } from "playwright";

const OUT = path.resolve("docs/media");
const NO_AI = "http://localhost:3100";

async function shot(page: Page, name: string, fullPage = false) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage });
  console.log(`docs/media/${name}.png`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  const desk = await browser.newPage({ viewport: { width: 1280, height: 860 }, reducedMotion: "reduce" });
  await desk.goto(NO_AI);
  await shot(desk, "landing");
  await desk.goto(`${NO_AI}/help?sample=electricity`);
  await shot(desk, "sample-plan");
  await desk.getByRole("tab", { name: "Complaint draft" }).click();
  await desk.getByLabel("In your words, for the complaint").fill(
    "My mother received an SMS saying our electricity would be disconnected tonight. She called the number and paid. He then asked for 12,000 more.",
  );
  await desk.locator("mark.mark-check").evaluate((el) => el.scrollIntoView({ block: "center" }));
  await shot(desk, "fact-lock");
  await desk.goto(`${NO_AI}/check`);
  await desk.getByLabel("The message").fill(
    "Dear Consumer your electricity power will be disconnected tonight at 9.30pm. Please immediately contact our electricity officer 9876543210.",
  );
  await desk.getByRole("button", { name: "Check this message" }).click();
  await desk.getByRole("heading", { name: "Strong signs of a scam" }).waitFor();
  await shot(desk, "check-rules");

  const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  await mob.goto(`${NO_AI}/help`);
  await shot(mob, "mobile-call-first");
  await mob.goto(`${NO_AI}/help?sample=digital-arrest`);
  await shot(mob, "mobile-sample");

  // Demo GIF: sample case, no AI involved.
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 700 }, recordVideo: { dir: OUT, size: { width: 1000, height: 700 } }, reducedMotion: "reduce" });
  const v = await ctx.newPage();
  await v.goto(NO_AI);
  await v.waitForTimeout(1500);
  await v.getByRole("link", { name: /Your electricity will be cut tonight/ }).click();
  await v.locator('[data-step="call_1930"]').waitFor();
  await v.waitForTimeout(1500);
  await v.getByText("Show what to read out on the call").click();
  await v.waitForTimeout(2200);
  await v.getByLabel("Amount (₹)").first().scrollIntoViewIfNeeded();
  await v.getByLabel("Amount (₹)").first().fill("52000");
  await v.waitForTimeout(800);
  await v.getByRole("heading", { name: "Ready-to-use text" }).scrollIntoViewIfNeeded();
  await v.getByRole("tab", { name: "Complaint draft" }).click();
  await v.waitForTimeout(2500);
  await v.getByRole("tab", { name: "Bank letter" }).click();
  await v.waitForTimeout(2000);
  const video = await v.video()!.path();
  await ctx.close();
  await browser.close();

  const gif = path.join(OUT, "demo-sample.gif");
  const palette = path.join(OUT, "palette.png");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", video, "-vf", "fps=6,scale=720:-1:flags=lanczos,palettegen=max_colors=96", palette]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", video, "-i", palette, "-lavfi", "fps=6,scale=720:-1:flags=lanczos [x]; [x][1:v] paletteuse=dither=none", gif]);
  fs.rmSync(palette);
  fs.rmSync(video);
  console.log("docs/media/demo-sample.gif");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
