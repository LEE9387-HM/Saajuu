import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const repoRoot = process.cwd();
const outputDir = path.join(repoRoot, "output", "playwright");
const baseUrl = process.env.SAAJUU_QA_URL ?? "https://lee9387-hm.github.io/Saajuu/";
const storageKey = "sb-eizojtispxmlwvhgpmgs-auth-token";

function parseEnvFile(filePath) {
  const env = {};
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    env[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return env;
}

function getProjectRef(supabaseUrl) {
  const hostname = new URL(supabaseUrl).hostname;
  return hostname.split(".")[0] ?? "";
}

function getSupabaseApiKeys(projectRef) {
  const stdout =
    process.platform === "win32"
      ? execFileSync(
          "powershell",
          [
            "-NoProfile",
            "-Command",
            `npx supabase projects api-keys --project-ref ${projectRef} -o json`,
          ],
          { encoding: "utf8", cwd: repoRoot }
        )
      : execFileSync(
          "npx",
          ["supabase", "projects", "api-keys", "--project-ref", projectRef, "-o", "json"],
          { encoding: "utf8", cwd: repoRoot }
        );
  return JSON.parse(stdout);
}

async function createTempUser({ supabaseUrl, serviceRoleKey, label }) {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `codex.${label}.${unique}@mail.com`;
  const password = `Codex!${Date.now()}${label.toUpperCase()}a1`;
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: `Codex E2E ${label.toUpperCase()}`,
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`temp user create failed (${label}): ${response.status} ${await response.text()}`);
  }
  const user = await response.json();
  return { email, password, userId: user.id, displayName: user.user_metadata?.display_name ?? label };
}

async function captureStoredSession({ supabaseUrl, publishableKey, email, password }) {
  const storage = {
    map: new Map(),
    getItem(key) {
      return this.map.has(key) ? this.map.get(key) : null;
    },
    setItem(key, value) {
      this.map.set(key, value);
    },
    removeItem(key) {
      this.map.delete(key);
    },
  };
  const client = createClient(supabaseUrl, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage,
    },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return {
    stored: storage.map.get(storageKey),
    user: data.session.user,
  };
}

async function createRelationshipInvite({ supabaseUrl, serviceRoleKey, inviterUserId, relationship }) {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const inviteToken = Buffer.from(bytes).toString("base64url");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(inviteToken));
  const inviteHash = Buffer.from(digest).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const response = await fetch(`${supabaseUrl}/rest/v1/relationship_invites`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      inviter_user_id: inviterUserId,
      invite_token_hash: inviteHash,
      relationship,
      expires_at: expiresAt,
    }),
  });
  if (!response.ok) {
    throw new Error(`relationship invite create failed: ${response.status} ${await response.text()}`);
  }
  return inviteToken;
}

async function ensureDir(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

async function saveFailureArtifacts(page, name) {
  await ensureDir(outputDir);
  const slug = `${name}-${Date.now()}`;
  const screenshotPath = path.join(outputDir, `${slug}.png`);
  const htmlPath = path.join(outputDir, `${slug}.html`);
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
  const html = await page.content().catch(() => "");
  if (html) await fs.promises.writeFile(htmlPath, html, "utf8");
  return { screenshotPath, htmlPath };
}

async function expect(condition, message, page) {
  if (condition) return;
  const artifacts = page ? await saveFailureArtifacts(page, "relationship-flow-failure") : null;
  const artifactText = artifacts ? `\nScreenshot: ${artifacts.screenshotPath}\nHTML: ${artifacts.htmlPath}` : "";
  throw new Error(`${message}${artifactText}`);
}

async function waitForRelationshipCards(page, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const count = await page.locator(".relationship-link-card").count();
    if (count > 0) return count;
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
  }
  return 0;
}

async function main() {
  const env = parseEnvFile(path.join(repoRoot, ".env"));
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error(".env must include VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY.");
  }

  const projectRef = getProjectRef(supabaseUrl);
  const apiKeys = getSupabaseApiKeys(projectRef);
  const serviceRoleKey = apiKeys.find((item) => item.name === "service_role")?.api_key;
  await expect(Boolean(serviceRoleKey), "Supabase service_role key could not be resolved from CLI.", null);

  const userA = await createTempUser({ supabaseUrl, serviceRoleKey, label: "a" });
  const userB = await createTempUser({ supabaseUrl, serviceRoleKey, label: "b" });

  const sessionA = await captureStoredSession({
    supabaseUrl,
    publishableKey,
    email: userA.email,
    password: userA.password,
  });
  const sessionB = await captureStoredSession({
    supabaseUrl,
    publishableKey,
    email: userB.email,
    password: userB.password,
  });

  const inviteToken = await createRelationshipInvite({
    supabaseUrl,
    serviceRoleKey,
    inviterUserId: sessionA.user.id,
    relationship: "spouse",
  });

  const browser = await chromium.launch({ headless: true });
  const contextA = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const contextB = await browser.newContext({ viewport: { width: 1440, height: 1200 } });

  await contextA.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, value);
    },
    { key: storageKey, value: sessionA.stored }
  );
  await contextB.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, value);
    },
    { key: storageKey, value: sessionB.stored }
  );

  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  const summary = {
    baseUrl,
    users: [
      { email: userA.email, displayName: userA.displayName },
      { email: userB.email, displayName: userB.displayName },
    ],
    checks: {},
  };

  try {
    await pageA.goto(`${baseUrl}#relationship`, { waitUntil: "networkidle" });
    await pageB.goto(`${baseUrl}#invite=${encodeURIComponent(inviteToken)}`, { waitUntil: "networkidle" });

    summary.checks.authA = (await pageA.locator("#auth-status").textContent())?.trim() ?? "";
    summary.checks.authB = (await pageB.locator("#auth-status").textContent())?.trim() ?? "";
    await expect(summary.checks.authA.includes(userA.email), "User A session did not restore in the app.", pageA);
    await expect(summary.checks.authB.includes(userB.email), "User B session did not restore in the app.", pageB);

    await expect(
      !(await pageB.locator("#relationship").evaluate((node) => node.hasAttribute("hidden"))),
      "Invite deep link should expose the relationship section.",
      pageB
    );

    await pageB.evaluate(() => {
      document.querySelector("#relationship-invite-accept")?.click();
    });
    await pageB.waitForTimeout(4000);
    await expect(
      (await waitForRelationshipCards(pageB)) > 0,
      "User B should see a relationship card immediately after accepting the invite.",
      pageB
    );

    summary.checks.inviteAcceptedNote = (await pageB.locator("#relationship-invite-note").textContent())?.trim() ?? "";

    await pageA.close();
    await pageB.close();

    const verifyPageA = await contextA.newPage();
    const verifyPageB = await contextB.newPage();

    await verifyPageA.goto(`${baseUrl}#relationship`, { waitUntil: "networkidle" });
    await verifyPageB.goto(`${baseUrl}#relationship`, { waitUntil: "networkidle" });
    const relationshipCardCountA = await waitForRelationshipCards(verifyPageA);
    const relationshipCardCountB = await waitForRelationshipCards(verifyPageB);
    summary.checks.relationshipCardCountA = relationshipCardCountA;
    summary.checks.relationshipCardCountB = relationshipCardCountB;
    await expect(relationshipCardCountA > 0, "User A should see at least one relationship card after acceptance.", verifyPageA);
    await expect(relationshipCardCountB > 0, "User B should see at least one relationship card after acceptance.", verifyPageB);

    summary.checks.relationshipCardTextA =
      ((await verifyPageA.locator(".relationship-link-card").first().textContent()) ?? "").trim();
    summary.checks.relationshipCardTextB =
      ((await verifyPageB.locator(".relationship-link-card").first().textContent()) ?? "").trim();

    await verifyPageA.locator('[data-relationship-action="toggle-label"]').first().click();
    await verifyPageA.locator('[data-relationship-label-input]').first().fill("우리 와이프");
    await verifyPageA.locator('[data-relationship-action="save-label"]').first().click();
    await verifyPageA.waitForFunction(
      () => document.querySelector(".relationship-link-card strong")?.textContent?.includes("우리 와이프"),
      null,
      { timeout: 12000 }
    );
    summary.checks.relationshipRenamedTextA =
      ((await verifyPageA.locator(".relationship-link-card").first().textContent()) ?? "").trim();
    await expect(summary.checks.relationshipRenamedTextA.includes("우리 와이프"), "User A should see the saved relationship label.", verifyPageA);

    await verifyPageA.goto(`${baseUrl}#relationship`, { waitUntil: "networkidle" });
    await waitForRelationshipCards(verifyPageA);
    summary.checks.relationshipRenamedAfterReloadA =
      ((await verifyPageA.locator(".relationship-link-card").first().textContent()) ?? "").trim();
    await expect(summary.checks.relationshipRenamedAfterReloadA.includes("우리 와이프"), "User A should keep the saved relationship label after reload.", verifyPageA);

    await verifyPageA.locator('[data-relationship-action="consult"]').first().click();
    await verifyPageA.waitForTimeout(800);
    summary.checks.consultHashA = await verifyPageA.evaluate(() => window.location.hash);
    summary.checks.consultTopicA = await verifyPageA.locator("#trial-topic").inputValue();
    summary.checks.consultConcernA = await verifyPageA.locator("#trial-concern").inputValue();
    await expect(summary.checks.consultHashA === "#consult", "Consult CTA should move to #consult.", verifyPageA);
    await expect(summary.checks.consultTopicA === "marriage", "Spouse relationship should map to marriage consult topic.", verifyPageA);
    await expect(summary.checks.consultConcernA.length > 20, "Consult CTA should prefill a relationship concern.", verifyPageA);

    await verifyPageA.goto(`${baseUrl}#relationship`, { waitUntil: "networkidle" });
    await verifyPageA.locator('[data-relationship-action="compatibility"]').first().click();
    await verifyPageA.waitForTimeout(800);
    summary.checks.compatHashA = await verifyPageA.evaluate(() => window.location.hash);
    summary.checks.partnerRelationA = await verifyPageA.locator("#partner-relation").inputValue();
    await expect(summary.checks.compatHashA === "#relationship", "Compatibility CTA should stay on #relationship.", verifyPageA);
    await expect(summary.checks.partnerRelationA === "spouse", "Compatibility CTA should preselect spouse relation.", verifyPageA);
  } finally {
    await contextA.close();
    await contextB.close();
    await browser.close();
  }

  await ensureDir(path.join(repoRoot, "output"));
  await fs.promises.writeFile(path.join(repoRoot, "output", "temp-e2e-users.json"), JSON.stringify([userA, userB], null, 2));
  await fs.promises.writeFile(path.join(repoRoot, "output", "relationship-e2e-summary.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
