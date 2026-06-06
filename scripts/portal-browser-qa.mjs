#!/usr/bin/env node
import playwright from "../frontend/node_modules/playwright/index.js";
import fs from "node:fs";
import path from "node:path";

const { chromium } = playwright;
const base = process.env.BASE_URL || "http://localhost:3008";
const outDir = path.resolve("docs/screenshots");

fs.mkdirSync(path.join(outDir, "qa"), { recursive: true });

const requiredShots = [
  { name: "library-desktop.png", path: "/", role: "Viewer", width: 1440, height: 1000 },
  { name: "collections-desktop.png", path: "/collections", role: "Viewer", width: 1440, height: 1000 },
  { name: "asset-detail-desktop.png", path: "/assets/368", role: "Viewer", width: 1440, height: 1000 },
  { name: "upload-desktop.png", path: "/upload", role: "Contributor", width: 1440, height: 1000 },
  { name: "review-desktop.png", path: "/review", role: "Reviewer", width: 1440, height: 1000 },
  { name: "guide-desktop.png", path: "/guide", role: "Viewer", width: 1440, height: 1000 },
  { name: "admin-desktop.png", path: "/admin", role: "DAM Admin", width: 1440, height: 1000 },
  { name: "library-mobile-320.png", path: "/", role: "Viewer", width: 320, height: 900 },
  { name: "detail-mobile-320.png", path: "/assets/368", role: "Viewer", width: 320, height: 900 },
  { name: "review-mobile-320.png", path: "/review", role: "Reviewer", width: 320, height: 900 },
  { name: "upload-mobile-320.png", path: "/upload", role: "Contributor", width: 320, height: 900 },
  { name: "guide-mobile-320.png", path: "/guide", role: "Viewer", width: 320, height: 900 }
];

const qaViewports = [1440, 1280, 1024, 768, 390, 320];
const qaPaths = [
  { path: "/", role: "Viewer", label: "library-viewer" },
  { path: "/", role: "Reviewer", label: "library-reviewer" },
  { path: "/?view=website-hero", role: "Viewer", label: "library-website-hero" },
  { path: "/collections", role: "Viewer", label: "collections-viewer" },
  { path: "/?view=needs-review", role: "Viewer", label: "viewer-needs-review-hidden" },
  { path: "/assets/368", role: "Viewer", label: "detail-approved-viewer" },
  { path: "/assets/644", role: "Viewer", label: "detail-unsafe-viewer" },
  { path: "/assets/644", role: "Reviewer", label: "detail-unsafe-reviewer" },
  { path: "/upload", role: "Viewer", label: "upload-viewer" },
  { path: "/upload", role: "Contributor", label: "upload-contributor" },
  { path: "/review", role: "Viewer", label: "review-viewer" },
  { path: "/review", role: "Reviewer", label: "review-reviewer" },
  { path: "/admin", role: "Viewer", label: "admin-viewer" },
  { path: "/admin", role: "DAM Admin", label: "admin-dam-admin" },
  { path: "/guide", role: "Viewer", label: "guide-viewer" }
];

const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHROME_CHANNEL || "chrome", headless: true });
const failures = [];
const warnings = [];
const consoleErrors = [];
const expectedDeniedConsole = [];
const networkFailures = [];

function isExpectedDeniedConsole(text) {
  return /Failed to load resource: the server responded with a status of (400|403|409)/.test(text);
}

async function newRolePage(role, width, height) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  await context.addInitScript((nextRole) => window.localStorage.setItem("tjc-demo-role", nextRole), role);
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const item = { role, width, text: msg.text().slice(0, 300) };
    if (isExpectedDeniedConsole(item.text)) expectedDeniedConsole.push(item);
    else consoleErrors.push(item);
  });
  page.on("requestfailed", (request) => {
    const url = request.url();
    const failure = request.failure()?.errorText || "request failed";
    if (!url.startsWith(base)) return;
    if (failure === "net::ERR_ABORTED" && url.includes("_rsc=")) return;
    networkFailures.push({ role, width, url, error: failure });
  });
  return { page, context };
}

async function inspectPage(page, expected) {
  return page.evaluate((expectedPage) => {
    const doc = document.documentElement;
    const visibleText = document.body.textContent || "";
    const visibleImages = [...document.images].filter((img) => {
      const rect = img.getBoundingClientRect();
      return rect.width > 20 && rect.height > 20 && rect.bottom > 0 && rect.top < window.innerHeight;
    });
    const brokenImages = visibleImages
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src)
      .slice(0, 5);
    const clippedControls = [...document.querySelectorAll("button, a, select, input")]
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        return rect.right > window.innerWidth + 2 || rect.left < -2;
      })
      .map((el) => ({
        text: (el.textContent || el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.tagName).trim().slice(0, 80),
        right: el.getBoundingClientRect().right
      }))
      .slice(0, 10);
    return {
      expected: expectedPage,
      title: document.title,
      h1: document.querySelector("h1")?.textContent?.trim() || "",
      url: location.href,
      width: window.innerWidth,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      overflowX: doc.scrollWidth > doc.clientWidth + 1,
      brokenImages,
      clippedControls,
    hasBlockedDownload: visibleText.includes("Downloads blocked") || visibleText.includes("Download blocked") || visibleText.includes("Needs portal review"),
      hasReviewBlocker: visibleText.includes("ResourceSpace API write mapping is not configured yet"),
      hasViewerReviewBlock: visibleText.includes("Review workbench requires reviewer access"),
      hasViewerUploadBlock: visibleText.includes("Upload is for Contributors"),
      hasAdminBlock: visibleText.includes("Admin cockpit requires DAM Admin role"),
      hasOriginalFilenameOnCard: [...document.querySelectorAll('[aria-label="Source metadata"]')].some((el) => (el.textContent || "").includes("Original:")),
      textSample: visibleText.replace(/\s+/g, " ").trim().slice(0, 220)
    };
  }, expected);
}

for (const width of qaViewports) {
  for (const item of qaPaths) {
    const { page, context } = await newRolePage(item.role, width, width <= 390 ? 900 : 1000);
    const response = await page.goto(`${base}${item.path}`, { waitUntil: "networkidle" });
    const state = await inspectPage(page, item);
    if (!response || response.status() >= 500) failures.push(`${item.label} ${width}: HTTP ${response?.status()}`);
    if (state.overflowX) failures.push(`${item.label} ${width}: horizontal overflow ${state.scrollWidth}/${state.clientWidth}`);
    if (state.clippedControls.length) failures.push(`${item.label} ${width}: clipped controls ${JSON.stringify(state.clippedControls)}`);
    if (state.brokenImages.length) warnings.push(`${item.label} ${width}: broken images ${state.brokenImages.join(", ")}`);
    if (item.label === "detail-approved-viewer" && !state.hasBlockedDownload) failures.push(`${item.label} ${width}: portal-ready blocker missing`);
    if (item.label === "review-viewer" && !state.hasViewerReviewBlock) failures.push(`${item.label} ${width}: viewer review block missing`);
    if (item.label === "upload-viewer" && !state.hasViewerUploadBlock) failures.push(`${item.label} ${width}: viewer upload block missing`);
    if (item.label === "admin-viewer" && !state.hasAdminBlock) failures.push(`${item.label} ${width}: viewer admin block missing`);
    if (item.label === "review-reviewer" && !state.hasReviewBlocker) failures.push(`${item.label} ${width}: write mapping blocker missing`);
    if (item.label === "library-reviewer" && state.hasOriginalFilenameOnCard) failures.push(`${item.label} ${width}: original filename exposed on Library card`);
    if (item.label === "viewer-needs-review-hidden" && state.textSample.includes("2012 Photo")) warnings.push(`${item.label} ${width}: viewer may see review asset copy`);
    if ((width === 1024 || width === 768 || width === 390 || width === 320) && ["library-viewer", "review-reviewer", "guide-viewer"].includes(item.label)) {
      await page.screenshot({ path: path.join(outDir, "qa", `${item.label}-${width}.png`), fullPage: true });
    }
    await context.close();
  }
}

{
  const { page, context } = await newRolePage("Viewer", 1440, 1000);
  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByRole("searchbox", { name: "Search approved media" }).fill("Bible");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.waitForLoadState("networkidle");
  if ((await page.getByText("Search: Bible").count()) !== 1) failures.push("search interaction: active search chip missing");
  await context.close();
}

{
  const { page, context } = await newRolePage("Viewer", 1440, 1000);
  await page.goto(base, { waitUntil: "networkidle" });
  await page.keyboard.press(process.platform === "darwin" ? "Meta+K" : "Control+K");
  if ((await page.getByLabel("Command search").count()) === 0) {
    await page.locator('button[aria-label="Open command palette"]:visible').first().click();
  }
  await page.getByLabel("Command search").fill("website hero");
  const firstActiveCommand = await page.getByLabel("Command search").getAttribute("aria-activedescendant");
  await page.keyboard.press("ArrowDown");
  const secondActiveCommand = await page.getByLabel("Command search").getAttribute("aria-activedescendant");
  await page.keyboard.press("ArrowUp");
  const restoredActiveCommand = await page.getByLabel("Command search").getAttribute("aria-activedescendant");
  if (!firstActiveCommand || !secondActiveCommand || firstActiveCommand === secondActiveCommand || restoredActiveCommand !== firstActiveCommand) {
    failures.push("command palette: arrow-key selection did not update active command");
  }
  await page.keyboard.press("Enter");
  await page.waitForURL(/view=website-hero/, { timeout: 10000 });
  if (!page.url().includes("view=website-hero")) failures.push("command palette: website hero did not open stable view");
  await context.close();
}

{
  const { page, context } = await newRolePage("Contributor", 1440, 1000);
  await page.goto(`${base}/upload`, { waitUntil: "networkidle" });
  await page.getByLabel("Files").setInputFiles([{ name: "qa-photo.jpg", mimeType: "image/jpeg", buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) }]);
  if ((await page.getByLabel("Selected file preview").getByText("qa-photo.jpg").count()) < 1) failures.push("upload file preview: selected file missing");
  await page.getByRole("button", { name: "Clear files" }).click();
  await page.getByLabel("Title").fill("Browser QA intake");
  await page.getByLabel("Event name").fill("Sabbath media QA");
  await page.getByLabel("Event date").fill("2026-06-06");
  await page.getByLabel("Ministry/team").fill("Internet Ministry");
  await page.getByLabel("Source / photographer").fill("QA reviewer");
  await page.getByLabel("People visible").selectOption("No");
  await page.getByLabel("Children/youth visible").selectOption("No");
  await page.getByLabel("Usage rights").selectOption("TJC-owned / permission confirmed");
  await page.getByLabel("Suggested approval direction").selectOption("Likely internal ministry use only");
  await page.getByLabel("Consent/restrictions").fill("No consent restrictions; no people visible.");
  await page.getByLabel("Existing Google / ResourceSpace link").fill("https://drive.google.com/example");
  await page.getByLabel("Suggested tags").fill("qa, sabbath");
  await page.getByLabel("Intake notes").fill("Browser QA no-file intake with source link only.");
  await page.getByRole("button", { name: "Submit intake" }).click();
  await page.waitForSelector("text=Intake received");
  if ((await page.getByText("Needs Review / Do Not Publish").count()) < 1) failures.push("upload contributor receipt: default review state missing");
  await context.close();
}

{
  const { page, context } = await newRolePage("Reviewer", 1440, 1000);
  await page.goto(`${base}/review`, { waitUntil: "networkidle" });
  await page.getByLabel("Review note").fill("Browser QA confirms source, rights, people, derivative, and sensitive context evidence.");
  for (const label of ["Source confirmed", "Rights confirmed", "People visibility confirmed", "Children/youth checked", "Usage scope selected", "Derivative available", "Sensitive context checked", "Credit requirement checked"]) {
    await page.getByLabel(label).check();
  }
  await page.getByRole("button", { name: "Approve for church-wide use" }).click();
  await page.waitForSelector("text=Queue pending review write");
  await page.getByRole("button", { name: "Queue pending review write" }).click();
  await page.waitForSelector("text=ResourceSpace API write mapping is not configured yet");
  if ((await page.getByText("Audit preview").count()) < 1) failures.push("review action: audit preview missing");
  await context.close();
}

{
  const { page, context } = await newRolePage("Viewer", 1440, 1000);
  await page.goto(base, { waitUntil: "networkidle" });
  const checks = await page.evaluate(async () => {
    const approved = await fetch("/api/download/368?role=Viewer");
    const unsafe = await fetch("/api/download/644?role=Viewer");
    const malformed = await fetch("/api/download/%2E%2E368?role=Viewer");
    return { approved: approved.status, unsafe: unsafe.status, malformed: malformed.status };
  });
  if (checks.approved !== 403) failures.push(`blocked approved download browser fetch status ${checks.approved}`);
  if (checks.unsafe !== 403) failures.push(`unsafe download browser fetch status ${checks.unsafe}`);
  if (checks.malformed !== 400) failures.push(`malformed download browser fetch status ${checks.malformed}`);
  await context.close();
}

for (const shot of requiredShots) {
  const { page, context } = await newRolePage(shot.role, shot.width, shot.height);
  await page.goto(`${base}${shot.path}`, { waitUntil: "networkidle" });
  if (shot.selector) await page.locator(shot.selector).scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(outDir, shot.name), fullPage: true });
  await context.close();
}

await browser.close();

const report = {
  checkedAt: new Date().toISOString(),
  viewports: qaViewports,
  pages: qaPaths.length,
  screenshots: requiredShots.map((shot) => shot.name),
  consoleErrors,
  expectedDeniedConsole,
  networkFailures,
  warnings,
  failures
};

fs.writeFileSync(path.resolve("docs/screenshots/qa/browser-qa-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (failures.length || consoleErrors.length || networkFailures.length) process.exit(1);
