import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.SAAJUU_QA_URL ?? "https://lee9387-hm.github.io/Saajuu/";
const outputDir = path.resolve("output/playwright");
const userDataDir = process.env.SAAJUU_QA_USER_DATA_DIR ?? path.join(outputDir, "auth-profile");
const loginWaitMs = Number(process.env.SAAJUU_QA_LOGIN_WAIT_MS ?? 120000);

function makeUrl(hash = "") {
  const url = new URL(baseUrl);
  url.hash = hash;
  return url.toString();
}

async function screenshot(page, name) {
  await mkdir(outputDir, { recursive: true });
  const filePath = path.join(outputDir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

async function assert(condition, message, page) {
  if (condition) return;
  const filePath = await screenshot(page, "auth-smoke-failure");
  throw new Error(`${message}\nScreenshot: ${filePath}`);
}

async function text(page, selector) {
  return ((await page.locator(selector).textContent().catch(() => "")) ?? "").trim();
}

async function isLoggedIn(page) {
  const status = await text(page, "#auth-status");
  return /계정|로그인.*되어|logged in/i.test(status);
}

async function waitForManualLogin(page) {
  const deadline = Date.now() + loginWaitMs;
  while (Date.now() < deadline) {
    if (await isLoggedIn(page)) return true;
    await page.waitForTimeout(1500);
  }
  return false;
}

const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  viewport: { width: 390, height: 844 },
});
const page = context.pages()[0] ?? (await context.newPage());
const consoleErrors = [];
const pageErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(error.message));

try {
  await page.goto(makeUrl("my-page"), { waitUntil: "networkidle" });

  if (!(await isLoggedIn(page))) {
    console.log("A headed Chromium window is open.");
    console.log(`Log in with Kakao or Google in that window. The script will wait up to ${loginWaitMs / 1000}s.`);
    await waitForManualLogin(page);
    await page.goto(makeUrl("my-page"), { waitUntil: "networkidle" });
  }

  await assert(await isLoggedIn(page), "User must be logged in before authenticated QA can continue.", page);

  const consentFormVisible = await page.locator("#consent-form").isVisible().catch(() => false);
  if (consentFormVisible) {
    for (const selector of [
      'input[name="terms"]',
      'input[name="privacy"]',
      'input[name="ai_notice"]',
    ]) {
      const inputBox = page.locator(selector);
      if (!(await inputBox.isChecked())) await inputBox.check();
    }
    await page.locator('#consent-form button[type="submit"]').click();
    await page.waitForFunction(
      () => {
        const note = document.querySelector("#consent-note")?.textContent ?? "";
        return /동의|저장/.test(note);
      },
      null,
      { timeout: 10000 },
    );
  }

  await page.goto(makeUrl("consult"), { waitUntil: "networkidle" });
  await page.locator("#trial-persona").selectOption("miseon");
  await page.locator("#trial-topic").selectOption("business");
  await page.locator("#trial-concern").fill("당장 사업을 시작하고 싶어요. 언제 시작하면 좋고, 지금 시작하면 성공할 수 있을까요?");
  await page.locator("#trial-session-start").click();
  await page.waitForFunction(
    () => {
      const note = document.querySelector("#trial-session-note")?.textContent ?? "";
      return /무료|체험|세션/.test(note) || !document.querySelector("#trial-chat")?.hasAttribute("hidden");
    },
    null,
    { timeout: 15000 },
  );

  await assert(await page.locator("#trial-chat").isVisible(), "Trial chat should be visible after session start.", page);

  const trialAlreadyUsed = await page.locator("#trial-message-send").isDisabled().catch(() => false);
  const nextStepVisible = await page.locator("#trial-next-step").isVisible().catch(() => false);
  let completedWithUsedTrialState = false;
  if (trialAlreadyUsed && nextStepVisible) {
    const nextStep = await text(page, "#trial-next-step");
    await assert(
      /무료 체험|기본 상담|프로 상담/.test(nextStep),
      "Used trial state should show the next paid consultation step.",
      page,
    );
    await assert(pageErrors.length === 0, `Unexpected page errors: ${pageErrors.join(" | ")}`, page);
    await assert(consoleErrors.length === 0, `Unexpected console errors: ${consoleErrors.join(" | ")}`, page);
    console.log(`Authenticated consultation QA passed with used trial state: ${baseUrl}`);
    console.log(`Session profile kept at: ${userDataDir}`);
    completedWithUsedTrialState = true;
  }

  if (!completedWithUsedTrialState) {
    const messageBox = page.locator("#trial-message");
    await messageBox.fill("당장 사업을 시작하고 싶어요. 언제 시작해야 하고, 지금 시작하면 성공할 수 있을까요?");
    await page.locator("#trial-message-send").click();
    await page.waitForFunction(
      () => document.querySelectorAll('.trial-chat__message[data-role="assistant"]').length > 0,
      null,
      { timeout: 45000 },
    );

    const remaining = await text(page, "#trial-chat-remaining");
    const reply = await text(page, '.trial-chat__message[data-role="assistant"]');
    await assert(/남은 턴|0회|1회|2회/.test(remaining), "Remaining turns should be displayed after AI reply.", page);
    await assert(
      !/(Verdict|Reasoning|Constraint|Persona|Topic|Draft|USER:|SYSTEM:)/i.test(reply),
      "Assistant reply should not leak prompt labels or draft instructions.",
      page,
    );
    await assert(
      /준비|검증|테스트|시장|고객|리스크/.test(reply),
      "Business consultation reply should include practical readiness or validation guidance.",
      page,
    );
    await assert(pageErrors.length === 0, `Unexpected page errors: ${pageErrors.join(" | ")}`, page);
    await assert(consoleErrors.length === 0, `Unexpected console errors: ${consoleErrors.join(" | ")}`, page);

    console.log(`Authenticated consultation QA passed: ${baseUrl}`);
    console.log(`Session profile kept at: ${userDataDir}`);
  }
} finally {
  await context.close();
}
