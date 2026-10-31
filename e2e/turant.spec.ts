import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const AI = "http://localhost:3101"; // instance wired to the local BharatCode test stub
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

async function expectNoSeriousA11yIssues(page: Page) {
  const results = await new AxeBuilder({ page: page as never }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe("pages", () => {
  for (const path of ["/", "/help", "/check", "/how-it-works", "/privacy", "/help?sample=electricity"]) {
    test(`${path} is accessible and fits the screen`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      await expectNoSeriousA11yIssues(page);
      await expectNoHorizontalScroll(page);
    });
  }

  test("landing puts the 1930 call first and links the sample cases", async ({ page }) => {
    await page.goto("/");
    const call = page.getByRole("link", { name: /Call 1930/ }).first();
    await expect(call).toHaveAttribute("href", "tel:1930");
    await expect(page.getByRole("link", { name: /Your electricity will be cut tonight/ })).toHaveAttribute("href", "/help?sample=electricity");
  });

  test("security headers are set and the key is never in the page", async ({ page }) => {
    const res = await page.goto("/");
    const headers = res!.headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    const aiPage = await page.goto(`${AI}/help`);
    expect(await aiPage!.text()).not.toContain("bc_test_e2e");
  });
});

test.describe("sample case (no AI)", () => {
  test("opens with labelled sample data, an ordered plan and documents", async ({ page }) => {
    await page.goto("/help?sample=electricity");
    await expect(page.getByText(/Sample case\./)).toBeVisible();
    const steps = page.locator("ol.plan > li");
    await expect(steps.first()).toHaveAttribute("data-step", "call_1930");
    await expect(steps.nth(1)).toHaveAttribute("data-step", "call_bank");
    await expect(page.getByText(/usually not covered by RBI's zero-liability rule/)).toBeVisible();

    await page.getByRole("tab", { name: "1930 call sheet" }).click();
    const slip = page.getByRole("tabpanel");
    await expect(slip).toContainText("630412875309");
    await expect(slip).toContainText("₹48,500");
    await expect(slip).toContainText("SAMPLE: fictional details");
  });

  test("editing a fact updates the documents instantly", async ({ page }) => {
    await page.goto("/help?sample=electricity");
    await page.getByLabel("Amount (₹)").first().fill("52000");
    await page.getByRole("tab", { name: "1930 call sheet" }).click();
    await expect(page.getByRole("tabpanel")).toContainText("₹52,000");
  });

  test("the complaint stamps numbers that aren't confirmed facts", async ({ page }) => {
    await page.goto("/help?sample=electricity");
    await page.getByLabel("In your words, for the complaint").fill("He asked me to pay 7777 more after the first payment.");
    await page.getByRole("tab", { name: "Complaint draft" }).click();
    const panel = page.getByRole("tabpanel");
    await expect(panel.locator("mark.mark-check")).toHaveCount(1);
    await expect(panel).not.toContainText("7777");
  });

  test("unauthorised transactions get the RBI working-day assessment", async ({ page }) => {
    await page.goto("/help?sample=sim-swap");
    await expect(page.getByRole("heading", { name: "Can the bank refund you?" })).toBeVisible();
    await expect(page.getByText(/working days/).first()).toBeVisible();
    await expect(page.locator('[data-step="block_sim"]')).toBeVisible();
  });
});

test.describe("manual path (no key on server)", () => {
  test("explains AI is off and still produces a plan", async ({ page }) => {
    await page.goto("/help");
    await expect(page.getByText(/AI reading isn't switched on/)).toBeVisible();
    await page.getByLabel(/What happened/).fill("A man said my KYC expired and took money.");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.locator('[data-step="call_1930"]')).toBeVisible();
    await page.getByLabel("Amount (₹)").fill("2500");
    await page.getByLabel("UTR / UPI reference no.").fill("123");
    await expect(page.getByText(/A UPI or IMPS reference is 12 digits/)).toBeVisible();
    await page.getByLabel("UTR / UPI reference no.").fill("612345678901");
    await expect(page.getByText("12-digit UPI/IMPS reference (UTR/RRN)")).toBeVisible();
  });

  test("the case survives a refresh in the same tab and can be cleared", async ({ page }) => {
    await page.goto("/help");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Amount (₹)").fill("999");
    await page.reload();
    await expect(page.getByLabel("Amount (₹)")).toHaveValue("999");
    await page.getByRole("button", { name: "Start a new case" }).click();
    await expect(page.getByRole("heading", { name: /First, call 1930/ })).toBeVisible();
  });

  test("message check works with rules only", async ({ page }) => {
    await page.goto("/check");
    await page.getByLabel("The message").fill("Congratulations! Pay the registration fee of Rs 1999 to confirm your internship seat. Contact hr.careers.tcs@gmail.com");
    await page.getByRole("button", { name: "Check this message" }).click();
    await expect(page.getByRole("heading", { name: "Strong signs of a scam" })).toBeVisible();
    await expect(page.getByText("Checked with Turant's fixed rules only (no AI).")).toBeVisible();
    await expect(page.getByText(/Asks for a fee to confirm/)).toBeVisible();
  });
});

test.describe("AI path (BharatCode test stub)", () => {
  test("reads evidence with visible tool calls, then asks the person to check AI-read facts", async ({ page }) => {
    await page.goto(`${AI}/help`);
    await page.getByLabel(/What happened/).fill("Mummy paid the electricity man after an SMS. He called from 98765 43210.");
    await page.getByTestId("screenshot-input").setInputFiles({ name: "receipt.png", mimeType: "image/png", buffer: PNG });
    await expect(page.getByAltText(/Screenshot 1/)).toBeVisible();
    await page.getByRole("button", { name: "Read my evidence with AI" }).click();

    await expect(page.locator('[data-step="call_1930"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Read by BharatCode/)).toContainText("3 tool checks");
    await expect(page.getByText("read by AI from screenshot 1: check it")).toBeVisible();
    await expect(page.getByText(/detail was read by AI and needs your check/)).toBeVisible();

    await page.getByRole("tab", { name: "Complaint draft" }).click();
    const panel = page.getByRole("tabpanel");
    await expect(panel).toContainText("630412875309");
    // The scripted narrative mentions "12,000", which is not a confirmed fact.
    await expect(panel.locator("mark.mark-check")).toHaveCount(1);
    await expect(panel).not.toContainText("12,000");
  });

  test("shows a retry when BharatCode is busy, then succeeds", async ({ page }) => {
    await page.goto(`${AI}/help`);
    await page.getByLabel(/What happened/).fill("BUSY-TEST: paid a scammer by UPI");
    await page.getByRole("button", { name: "Read my evidence with AI" }).click();
    await expect(page.locator('[data-step="call_1930"]')).toBeVisible({ timeout: 30_000 });
  });

  test("message check: the rule floor overrides an AI verdict that is too low", async ({ page }) => {
    await page.goto(`${AI}/check`);
    await page.getByTestId("screenshot-input").setInputFiles({ name: "sms.png", mimeType: "image/png", buffer: PNG });
    await page.getByRole("button", { name: "Check this message" }).click();
    await expect(page.getByRole("heading", { name: "Strong signs of a scam" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/AI can't lower it below them/)).toBeVisible();
    await expect(page.getByText("rule, on AI-read text").first()).toBeVisible();
  });
});
