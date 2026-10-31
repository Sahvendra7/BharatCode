/**
 * Renders the synthetic screenshots used by the "electricity" sample case.
 * All content is fictional, no real app or bank branding is imitated, and each image carries a
 * visible "Sample · fictional" label. Run: npm run screenshots
 */
import { chromium } from "playwright";
import path from "node:path";

const OUT = path.resolve(process.cwd(), "public/samples");

const frame = (body: string) => `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#eef0f3;color:#1d1d1f}
  .phone{width:390px;min-height:700px;background:#fff;position:relative}
  .bar{height:28px;display:flex;justify-content:space-between;padding:4px 16px;font-size:13px;color:#333}
  .tag{position:absolute;right:10px;bottom:10px;font-size:11px;color:#a33;border:1px solid #a33;padding:1px 6px;border-radius:4px}
</style></head><body><div class="phone"><div class="bar"><span>3:47</span><span>4G ▮▮▮</span></div>${body}<span class="tag">Sample · fictional</span></div></body></html>`;

const sms = frame(`
  <div style="padding:10px 16px;border-bottom:1px solid #ddd;font-weight:600">VM-ELCTRC <span style="font-weight:400;color:#777;font-size:13px">· SMS</span></div>
  <div style="padding:16px">
    <div style="text-align:center;color:#888;font-size:12px;margin:8px 0 14px">Today 3:31 PM</div>
    <div style="background:#f0f0f2;border-radius:16px;padding:12px 14px;font-size:15px;line-height:1.45;max-width:300px">
      Dear Consumer your electricity power will be disconnected tonight at 9.30 pm because your previous month bill was not update. Please immediately contact our electricity officer 98765 43210. Thank you
    </div>
  </div>`);

const receipt = frame(`
  <div style="padding:28px 20px;text-align:center">
    <div style="width:64px;height:64px;border-radius:50%;background:#1f9d55;color:#fff;font-size:38px;line-height:64px;margin:0 auto">✓</div>
    <div style="font-size:18px;margin-top:14px;font-weight:600">Payment successful</div>
    <div style="font-size:40px;font-weight:700;margin:10px 0">₹48,500.00</div>
    <div style="font-size:15px;color:#444">Paid to <b>R K TRADERS</b></div>
    <div style="font-size:14px;color:#666">elec.bill.update.desk@ybl</div>
  </div>
  <div style="margin:0 20px;border-top:1px solid #e3e3e3;padding-top:14px;font-size:14px;line-height:2">
    <div style="display:flex;justify-content:space-between"><span style="color:#777">Date &amp; time</span><span>30 Oct 2026, 03:42 PM</span></div>
    <div style="display:flex;justify-content:space-between"><span style="color:#777">UPI Ref No.</span><span>630412875309</span></div>
    <div style="display:flex;justify-content:space-between"><span style="color:#777">Transaction ID</span><span>T2610301542123456789012</span></div>
    <div style="display:flex;justify-content:space-between"><span style="color:#777">Debited from</span><span>State Bank of India ••4417</span></div>
  </div>`);

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 700 }, deviceScaleFactor: 2 });
  for (const [name, html] of [
    ["electricity-sms", sms],
    ["electricity-receipt", receipt],
  ] as const) {
    await page.setContent(html);
    await page.locator(".phone").screenshot({ path: path.join(OUT, `${name}.png`) });
    console.log(`wrote public/samples/${name}.png`);
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
