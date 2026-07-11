import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.SAAJUU_QA_URL ?? "https://lee9387-hm.github.io/Saajuu/";
const outputDir = path.resolve("output/playwright");

function makeUrl(hash = "") {
  const url = new URL(baseUrl);
  url.hash = hash;
  return url.toString();
}

async function assert(condition, message, page) {
  if (condition) return;
  await mkdir(outputDir, { recursive: true });
  const screenshotPath = path.join(outputDir, `smoke-failure-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  throw new Error(`${message}\nScreenshot: ${screenshotPath}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const consoleErrors = [];
const pageErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(error.message));

try {
  await page.goto(makeUrl("consult"), { waitUntil: "networkidle" });

  await assert(await page.locator("#consult").isVisible(), "Consult section should be visible.", page);
  await assert(await page.locator("#trial-session-start").isEnabled(), "Trial session button should be enabled.", page);

  const authStatus = (await page.locator("#auth-status").textContent())?.trim() ?? "";
  await assert(
    !authStatus.includes("Supabase 공개 URL과 publishable/anon key가 필요합니다"),
    "Live build should include Supabase public configuration.",
    page,
  );

  await page.locator("#trial-session-start").click();
  await page.waitForFunction(() => window.location.hash === "#my-page", null, { timeout: 5000 });
  const trialNote = (await page.locator("#trial-session-note").textContent())?.trim() ?? "";
  await assert(trialNote.includes("로그인 후"), "Unauthenticated trial click should explain login requirement.", page);

  for (const hash of ["today", "saju", "relationship", "consult", "my-page"]) {
    await page.goto(makeUrl(hash), { waitUntil: "networkidle" });
    await assert(await page.locator(`#${hash}`).isVisible(), `Section #${hash} should be visible.`, page);
  }

  await assert(pageErrors.length === 0, `Unexpected page errors: ${pageErrors.join(" | ")}`, page);
  await assert(consoleErrors.length === 0, `Unexpected console errors: ${consoleErrors.join(" | ")}`, page);

  console.log(`Smoke QA passed: ${baseUrl}`);
} finally {
  await browser.close();
}
