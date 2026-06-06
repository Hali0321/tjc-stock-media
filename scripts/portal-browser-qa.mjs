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

async function openCommandPalette(page) {
  const commandSearch = page.getByLabel("Command search", { exact: true });
  const trigger = page.locator('button[aria-label="Open command palette"]:visible').first();
  await trigger.waitFor({ state: "visible", timeout: 10000 });
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (await commandSearch.isVisible().catch(() => false)) return commandSearch;
    if (attempt % 2 === 0) {
      await trigger.click();
    } else {
      await page.keyboard.press(process.platform === "darwin" ? "Meta+K" : "Control+K");
    }
    await page.waitForTimeout(350);
  }
  await commandSearch.waitFor({ state: "visible", timeout: 10000 });
  return commandSearch;
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
      missingTabControls: [...document.querySelectorAll('[role="tab"][aria-controls]')]
        .map((el) => el.getAttribute("aria-controls"))
        .filter((id) => id && !document.getElementById(id))
        .slice(0, 10),
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
    if (state.missingTabControls.length) failures.push(`${item.label} ${width}: tab aria-controls missing targets ${state.missingTabControls.join(", ")}`);
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
  const commandSearch = await openCommandPalette(page);
  await commandSearch.fill("website hero");
  const firstActiveCommand = await commandSearch.getAttribute("aria-activedescendant");
  await page.keyboard.press("ArrowDown");
  const secondActiveCommand = await commandSearch.getAttribute("aria-activedescendant");
  await page.keyboard.press("ArrowUp");
  const restoredActiveCommand = await commandSearch.getAttribute("aria-activedescendant");
  if (!firstActiveCommand || !secondActiveCommand || firstActiveCommand === secondActiveCommand || restoredActiveCommand !== firstActiveCommand) {
    failures.push("command palette: arrow-key selection did not update active command");
  }
  await page.keyboard.press("Enter");
  await page.waitForURL(/view=website-hero/, { timeout: 10000 });
  if (!page.url().includes("view=website-hero")) failures.push("command palette: website hero did not open stable view");
  await context.close();
}

{
  const { page, context } = await newRolePage("Reviewer", 1440, 1000);
  await page.goto(base, { waitUntil: "networkidle" });
  const commandSearch = await openCommandPalette(page);
  await commandSearch.fill("children youth");
  await page.keyboard.press("Enter");
  await page.waitForURL(/queue=children-youth/, { timeout: 10000 });
  const activeChildrenQueue = page.getByRole("button", { name: /Children\/Youth/ });
  if ((await activeChildrenQueue.getAttribute("aria-pressed")) !== "true") failures.push("command palette: children/youth queue did not become active");
  await context.close();
}

{
  const { page, context } = await newRolePage("Reviewer", 1440, 1000);
  await page.goto(`${base}/review?queue=rights-review`, { waitUntil: "networkidle" });
  const activeRightsQueue = page.getByRole("button", { name: /Rights Review/ });
  if ((await activeRightsQueue.getAttribute("aria-pressed")) !== "true") failures.push("review stable queue URL: rights-review did not become active");
  await activeRightsQueue.click();
  if (!page.url().includes("queue=rights-review")) failures.push("review stable queue URL: queue button did not preserve URL state");
  await context.close();
}

{
  const { page, context } = await newRolePage("Contributor", 1440, 1000);
  await page.goto(`${base}/upload`, { waitUntil: "networkidle" });
  if ((await page.getByText("Drop files here or browse").count()) < 1) failures.push("upload file dropzone: drop/browse affordance missing");
  await page.getByText("Drop files here or browse").evaluate((node) => {
    const label = node.closest("label");
    if (!label) throw new Error("upload dropzone label missing");
    const transfer = new DataTransfer();
    transfer.items.add(new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], "qa-drop.jpg", { type: "image/jpeg" }));
    label.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
  });
  if ((await page.getByLabel("Selected file preview").getByText("qa-drop.jpg").count()) < 1) failures.push("upload file dropzone: dropped file missing from preview");
  await page.getByRole("button", { name: "Clear files" }).click();
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
  if ((await page.getByLabel("Suggested tags suggestions", { exact: true }).getByRole("button", { name: "Bible" }).count()) < 1) failures.push("upload tag input: taxonomy suggestions missing");
  await page.getByLabel("Suggested tags", { exact: true }).fill("qa");
  await page.keyboard.press("Enter");
  if ((await page.getByRole("button", { name: "Remove qa" }).count()) > 0) failures.push("upload tag input: non-canonical typed tag became canonical chip");
  if ((await page.getByText("not in the current taxonomy").count()) < 1) failures.push("upload tag input: non-canonical tag warning missing");
  await page.getByLabel("Suggested tags", { exact: true }).fill("Bible, worship");
  await page.keyboard.press("Enter");
  if ((await page.getByRole("button", { name: "Remove Bible" }).count()) < 1) failures.push("upload tag input: canonical typed tag chip missing");
  await page.getByLabel("Intake notes").fill("Browser QA no-file intake with source link only.");
  await page.getByRole("button", { name: "Submit intake" }).click();
  await page.waitForSelector("text=Intake received");
  if ((await page.getByText("Needs Review / Do Not Publish").count()) < 1) failures.push("upload contributor receipt: default review state missing");
  await context.close();
}

{
  const { page, context } = await newRolePage("Contributor", 320, 900);
  await page.goto(`${base}/upload`, { waitUntil: "networkidle" });
  await page.getByLabel("Files").setInputFiles([{ name: "qa-mobile-photo-with-a-long-name.jpg", mimeType: "image/jpeg", buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) }]);
  if ((await page.getByLabel("Selected file preview").getByText("qa-mobile-photo-with-a-long-name.jpg").count()) < 1) failures.push("upload mobile file preview: selected file missing");
  const mobileUploadOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (mobileUploadOverflow) failures.push("upload mobile file preview: horizontal overflow after file selection");
  await context.close();
}

{
  const { page, context } = await newRolePage("Reviewer", 1440, 1000);
  await page.goto(`${base}/review`, { waitUntil: "networkidle" });
  if ((await page.getByText("Showing 24 of").count()) < 1) failures.push("review queue load more: initial 24-row limit missing");
  if ((await page.getByRole("button", { name: "Show more review items" }).count()) < 1) failures.push("review queue load more: button missing");
  await page.getByRole("button", { name: "Asset actions" }).click();
  if ((await page.getByRole("menuitem", { name: /Copy ResourceSpace ID/ }).count()) < 1) failures.push("review asset actions menu: copy ResourceSpace ID missing");
  if ((await page.getByRole("menuitem", { name: /Open in ResourceSpace/ }).count()) > 0) failures.push("review asset actions menu: Reviewer can see ResourceSpace admin action");
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Metadata", exact: true }).click();
  if ((await page.getByText("Raw ResourceSpace status").count()) < 1) failures.push("review inspector tabs: Metadata panel missing raw status");
  await page.getByRole("tab", { name: "Metadata", exact: true }).press("ArrowRight");
  if ((await page.getByText("People/minors").count()) < 1) failures.push("review inspector tabs: ArrowRight did not open Rights panel");
  await page.getByRole("tab", { name: "Checklist", exact: true }).click();
  await page.getByLabel("Review note").fill("Browser QA confirms source, rights, people, derivative, and sensitive context evidence.");
  for (const label of ["Source confirmed", "Rights confirmed", "People visibility confirmed", "Children/youth checked", "Usage scope selected", "Derivative available", "Sensitive context checked", "Credit requirement checked"]) {
    await page.getByLabel(label).check();
  }
  if ((await page.getByRole("button", { name: "Hold to queue Archive only", exact: true }).count()) < 1) failures.push("review high-risk action: archive hold button missing");
  if ((await page.getByRole("button", { name: "Hold to queue Do not publish externally", exact: true }).count()) < 1) failures.push("review high-risk action: do-not-publish hold button missing");
  await page.getByRole("button", { name: "Approve for church-wide use" }).click();
  await page.waitForSelector("text=Queue pending review write");
  await page.getByRole("button", { name: "Queue pending review write" }).click();
  await page.waitForSelector("text=ResourceSpace API write mapping is not configured yet");
  if ((await page.getByText("Audit preview").count()) < 1) failures.push("review action: audit preview missing");
  await context.close();
}

{
  const { page, context } = await newRolePage("DAM Admin", 1440, 1000);
  await page.goto(`${base}/review`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Asset actions" }).click();
  if ((await page.getByRole("menuitem", { name: /Open in ResourceSpace/ }).count()) < 1) failures.push("review asset actions menu: DAM Admin ResourceSpace action missing");
  await context.close();
}

{
  const { page, context } = await newRolePage("Viewer", 1440, 1000);
  await page.goto(`${base}/assets/368`, { waitUntil: "networkidle" });
  const viewerActionsButton = page.getByRole("button", { name: "Asset actions" });
  await viewerActionsButton.click();
  if ((await viewerActionsButton.getAttribute("aria-expanded")) !== "true") failures.push("asset actions menu: aria-expanded not true after open");
  if ((await page.getByRole("menuitem", { name: /Copy ResourceSpace ID/ }).count()) < 1) failures.push("asset actions menu: copy ResourceSpace ID missing");
  if ((await page.getByRole("menuitem", { name: /Copy portal link/ }).count()) < 1) failures.push("asset actions menu: copy portal link missing");
  if ((await page.getByRole("menuitem", { name: /Open in ResourceSpace/ }).count()) > 0) failures.push("asset actions menu: Viewer can see ResourceSpace admin action");
  await page.keyboard.press("ArrowDown");
  const activeMenuText = await page.evaluate(() => document.activeElement?.textContent || "");
  if (!activeMenuText.includes("Copy portal link")) failures.push("asset actions menu: ArrowDown did not move focus");
  await page.keyboard.press("Escape");
  if ((await viewerActionsButton.getAttribute("aria-expanded")) !== "false") failures.push("asset actions menu: Escape did not close menu");
  const focusedAfterEscape = await page.evaluate(() => document.activeElement?.textContent || "");
  if (!focusedAfterEscape.includes("Asset actions")) failures.push("asset actions menu: focus did not return after Escape");
  await page.getByRole("tab", { name: "Files", exact: true }).click();
  if ((await page.getByText("Original filename").count()) < 1) failures.push("asset detail tabs: Files panel missing original filename row");
  await page.getByRole("tab", { name: "Files", exact: true }).press("ArrowRight");
  if ((await page.getByRole("heading", { name: "Related", exact: true }).count()) < 1) failures.push("asset detail tabs: ArrowRight did not open Related panel");
  await page.getByRole("button", { name: "Request original access", exact: true }).click();
  if ((await page.getByRole("dialog", { name: "Request original access" }).count()) < 1) failures.push("request original dialog: dialog did not open");
  if ((await page.getByText("This request does not grant access automatically.").count()) < 1) failures.push("request original dialog: safety copy missing");
  if ((await page.getByText("ResourceSpace status, portal reuse state, and pending review writes do not change here.").count()) < 1) failures.push("request original dialog: no-fake-persistence copy missing");
  await page.getByRole("button", { name: "Close request dialog" }).click();
  await context.close();
}

{
  const { page, context } = await newRolePage("DAM Admin", 1440, 1000);
  await page.goto(`${base}/assets/368`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Asset actions" }).click();
  if ((await page.getByRole("menuitem", { name: /Open in ResourceSpace/ }).count()) < 1) failures.push("asset actions menu: DAM Admin ResourceSpace action missing");
  await context.close();
}

{
  const { page, context } = await newRolePage("Viewer", 320, 900);
  await page.goto(`${base}/assets/368`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Asset actions" }).click();
  const menuOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (menuOverflow) failures.push("asset actions menu: mobile menu caused horizontal overflow");
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
console.log(
  JSON.stringify({
    checkedAt: report.checkedAt,
    pages: report.pages,
    viewports: report.viewports,
    screenshots: report.screenshots.length,
    failures: report.failures.length,
    consoleErrors: report.consoleErrors.length,
    networkFailures: report.networkFailures.length,
    warnings: report.warnings.length,
    expectedDeniedConsole: report.expectedDeniedConsole.length,
    report: "docs/screenshots/qa/browser-qa-report.json"
  })
);
if (failures.length || consoleErrors.length || networkFailures.length) process.exit(1);
process.exit(0);
