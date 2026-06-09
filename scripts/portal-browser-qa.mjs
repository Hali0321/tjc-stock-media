#!/usr/bin/env node
import playwright from "../frontend/node_modules/playwright/index.js";
import fs from "node:fs";
import path from "node:path";

const { chromium } = playwright;
const base = process.env.BASE_URL || "http://localhost:3008";
const outDir = path.resolve("docs/screenshots");
const tinyPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=", "base64");

fs.mkdirSync(path.join(outDir, "qa"), { recursive: true });
fs.mkdirSync(path.join(outDir, "primitive-proof"), { recursive: true });

const requiredShots = [
  { name: "library-desktop.png", path: "/", role: "Viewer", width: 1440, height: 1000 },
  { name: "library-mobile-320.png", path: "/", role: "Viewer", width: 320, height: 900 },
  { name: "library-mobile-390.png", path: "/", role: "Viewer", width: 390, height: 900 },
  { name: "collections-desktop.png", path: "/collections", role: "Viewer", width: 1440, height: 1000 },
  { name: "collections-mobile-320.png", path: "/collections", role: "Viewer", width: 320, height: 900 },
  { name: "collections-mobile-390.png", path: "/collections", role: "Viewer", width: 390, height: 900 },
  { name: "upload-desktop.png", path: "/upload", role: "Contributor", width: 1440, height: 1000 },
  { name: "upload-mobile-320.png", path: "/upload", role: "Contributor", width: 320, height: 900 },
  { name: "upload-mobile-390.png", path: "/upload", role: "Contributor", width: 390, height: 900 },
  { name: "review-desktop.png", path: "/review", role: "Reviewer", width: 1440, height: 1000 },
  { name: "review-mobile-320.png", path: "/review", role: "Reviewer", width: 320, height: 900 },
  { name: "review-mobile-390.png", path: "/review", role: "Reviewer", width: 390, height: 900 },
  { name: "asset-detail-desktop.png", path: "/assets/368", role: "Viewer", width: 1440, height: 1000 },
  { name: "detail-mobile-320.png", path: "/assets/368", role: "Viewer", width: 320, height: 900 },
  { name: "detail-mobile-390.png", path: "/assets/368", role: "Viewer", width: 390, height: 900 },
  { name: "admin-desktop.png", path: "/admin", role: "DAM Admin", width: 1440, height: 1000 },
  { name: "admin-mobile-320.png", path: "/admin", role: "DAM Admin", width: 320, height: 900 },
  { name: "admin-mobile-390.png", path: "/admin", role: "DAM Admin", width: 390, height: 900 },
  { name: "guide-desktop.png", path: "/guide", role: "Viewer", width: 1440, height: 1000 },
  { name: "guide-mobile-320.png", path: "/guide", role: "Viewer", width: 320, height: 900 },
  { name: "guide-mobile-390.png", path: "/guide", role: "Viewer", width: 390, height: 900 }
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

async function launchBrowser() {
  const launchOptions = { headless: true };
  if (process.env.PLAYWRIGHT_CHROME_CHANNEL) launchOptions.channel = process.env.PLAYWRIGHT_CHROME_CHANNEL;
  return chromium.launch(launchOptions);
}

let browser = await launchBrowser();
const failures = [];
const warnings = [];
const consoleErrors = [];
const expectedDeniedConsole = [];
const networkFailures = [];

const normalUserRoles = new Set(["Viewer", "Contributor"]);
const normalUserOpsLeakPatterns = [
  /ResourceSpace/i,
  /Shared Drive/i,
  /pending writes?/i,
  /API mapping/i,
  /launch gate/i,
  /diagnostics?/i,
  /metadata health/i,
  /raw totals?/i,
  /source[- ]of[- ]truth/i,
  /field refs?/i,
  /source path/i,
  /master drive/i,
  /master\/original path/i,
  /master files?/i,
  /original filename/i,
  /checksum/i,
  /raw ResourceSpace/i,
  /ResourceSpace ID/i,
  /\bRS\s+\d+\b/
];

function isExpectedDeniedConsole(text) {
  return /Failed to load resource: the server responded with a status of (400|403|409)/.test(text);
}

function isTransientBrowserTargetClose(error) {
  return /Target page, context or browser has been closed|ERR_ABORTED|frame was detached/i.test(String(error?.message || error));
}

function visibleOpsLeaks(text) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalUserOpsLeakPatterns
    .filter((pattern) => pattern.test(normalized))
    .map((pattern) => pattern.source)
    .slice(0, 8);
}

function decodedHrefOpsLeaks(href) {
  const raw = String(href || "");
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  return visibleOpsLeaks(decoded);
}

async function closeContext(context) {
  await Promise.race([
    context.close(),
    new Promise((resolve) => setTimeout(resolve, 2500))
  ]).catch(() => {});
}

async function newRolePage(role, width, height) {
  if (!browser.isConnected()) browser = await launchBrowser();
  let context;
  try {
    context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  } catch (error) {
    if (!isTransientBrowserTargetClose(error)) throw error;
    browser = await launchBrowser();
    context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  }
  await context.addInitScript((nextRole) => window.localStorage.setItem("tjc-demo-role", nextRole), role);
  let page;
  try {
    page = await context.newPage();
  } catch (error) {
    if (!isTransientBrowserTargetClose(error)) throw error;
    await closeContext(context);
    browser = await launchBrowser();
    context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    await context.addInitScript((nextRole) => window.localStorage.setItem("tjc-demo-role", nextRole), role);
    page = await context.newPage();
  }
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

async function gotoAndSettle(page, url) {
  let response;
  try {
    response = await page.goto(url, { waitUntil: "load", timeout: 60000 });
  } catch (error) {
    const message = String(error?.message || error);
    if (!/ERR_ABORTED|frame was detached/i.test(message)) throw error;
    response = { status: () => 200 };
    await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => {});
  }
  await page.waitForLoadState("networkidle", { timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(500);
  return response;
}

async function waitForVisibleImages(page) {
  await page.waitForFunction(() => {
    const visibleImages = [...document.images].filter((img) => {
      const rect = img.getBoundingClientRect();
      return rect.width > 20 && rect.height > 20 && rect.bottom > 0 && rect.top < window.innerHeight;
    });
    return visibleImages.every((img) => img.complete);
  }, { timeout: 1800 }).catch(() => {});
}

async function saveFullPageScreenshot(page, screenshotPath) {
  const style = await page.addStyleTag({
    content: ".dam-app-header{position:static!important;top:auto!important}"
  });
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } finally {
    await style.evaluate((node) => node.remove()).catch(() => {});
  }
}

async function fillUploadContextStep(page, prefix = "Browser QA") {
  await page.getByLabel("Title").fill(`${prefix} intake`);
  await page.getByLabel("Event").fill("Sabbath media QA");
  await page.getByLabel("Date").fill("2026-06-06");
  await page.getByLabel("Ministry/team").fill("Internet Ministry");
  await page.getByLabel("Source / photographer").fill("QA reviewer");
}

async function fillUploadRightsStep(page) {
  await page.getByLabel("People visible").selectOption("No");
  await page.getByLabel("Children/youth visible").selectOption("No");
  await page.getByLabel("Usage rights").selectOption("TJC-owned / permission confirmed");
  await page.getByLabel("Suggested approval direction").selectOption("Likely internal ministry use only");
  await page.getByLabel("Consent/restrictions").fill("No consent restrictions; no people visible.");
}

async function advanceUploadToFiles(page, prefix = "Browser QA") {
  await page.getByRole("button", { name: "Next" }).click();
  await fillUploadContextStep(page, prefix);
  await page.getByRole("button", { name: "Next" }).click();
  await fillUploadRightsStep(page);
  await page.getByRole("button", { name: "Next" }).click();
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
      .filter((img) => (img.currentSrc || img.src) && (!img.complete || img.naturalWidth === 0))
      .map((img) => img.currentSrc || img.src)
      .slice(0, 5);
    const clippedControls = [...document.querySelectorAll("button, a, select, input")]
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        if (el.closest(".dam-tabs-scroll")) return false;
        return rect.right > window.innerWidth + 2 || rect.left < -2;
      })
      .map((el) => ({
        text: (el.textContent || el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.tagName).trim().slice(0, 80),
        right: el.getBoundingClientRect().right
      }))
      .slice(0, 10);
    const headerControls = [...document.querySelectorAll("header a, header button, header select, header [data-header-control]")]
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.bottom > 0;
      })
      .map((el, index) => {
        const rect = el.getBoundingClientRect();
        return {
          index,
          label: (el.textContent || el.getAttribute("aria-label") || el.tagName).trim().replace(/\s+/g, " ").slice(0, 80),
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom
        };
      });
    const headerOverlaps = [];
    for (let index = 0; index < headerControls.length; index += 1) {
      for (let next = index + 1; next < headerControls.length; next += 1) {
        const a = headerControls[index];
        const b = headerControls[next];
        const xOverlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const yOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (xOverlap > 2 && yOverlap > 2) {
          headerOverlaps.push(`${a.label || a.index} <> ${b.label || b.index}`);
        }
      }
    }
    const fixedMobileNavs = [...document.querySelectorAll('nav[aria-label="Primary navigation"]')]
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        const parent = el.parentElement;
        const style = window.getComputedStyle(el);
        const parentStyle = parent ? window.getComputedStyle(parent) : null;
        const positionedFixed = style.position === "fixed" || parentStyle?.position === "fixed";
        return positionedFixed && rect.width > 0 && rect.height > 0 && rect.bottom > window.innerHeight - 120;
      })
      .map((el) => (el.textContent || el.getAttribute("aria-label") || "mobile nav").trim().replace(/\s+/g, " "));
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
      headerOverlaps: headerOverlaps.slice(0, 10),
      fixedMobileNavs,
    hasBlockedDownload: visibleText.includes("Download unavailable") || visibleText.includes("Downloads blocked") || visibleText.includes("Download blocked") || visibleText.includes("Needs review") || visibleText.includes("Review required before use") || visibleText.includes("Source file restricted") || visibleText.includes("Request DAM review") || visibleText.includes("Request-only") || visibleText.includes("Preview protected"),
      hasReviewBlocker: visibleText.includes("Decision locked") || visibleText.includes("Complete required evidence before approval"),
      hasViewerReviewBlock: visibleText.includes("Review inbox requires reviewer access"),
      hasViewerUploadBlock: visibleText.includes("Send media requires Contributor access"),
      hasAdminBlock: visibleText.includes("Governance requires DAM Admin role"),
      hasOriginalFilenameOnCard: [...document.querySelectorAll('[aria-label="Source metadata"]')].some((el) => (el.textContent || "").includes("Original:")),
      missingTabControls: [...document.querySelectorAll('[role="tab"][aria-controls]')]
        .map((el) => el.getAttribute("aria-controls"))
        .filter((id) => id && !document.getElementById(id))
        .slice(0, 10),
      visibleText: visibleText.replace(/\s+/g, " ").trim(),
      textSample: visibleText.replace(/\s+/g, " ").trim().slice(0, 220)
    };
  }, expected);
}

for (const width of qaViewports) {
  for (const item of qaPaths) {
    let completed = false;
    for (let attempt = 0; attempt < 2 && !completed; attempt += 1) {
      const { page, context } = await newRolePage(item.role, width, width <= 390 ? 900 : 1000);
      try {
        const response = await gotoAndSettle(page, `${base}${item.path}`);
        await waitForVisibleImages(page);
        const state = await inspectPage(page, item);
        if (!response || response.status() >= 500) failures.push(`${item.label} ${width}: HTTP ${response?.status()}`);
        if (state.overflowX) failures.push(`${item.label} ${width}: horizontal overflow ${state.scrollWidth}/${state.clientWidth}`);
        if (state.clippedControls.length) failures.push(`${item.label} ${width}: clipped controls ${JSON.stringify(state.clippedControls)}`);
        if (state.headerOverlaps.length) failures.push(`${item.label} ${width}: header controls overlap ${JSON.stringify(state.headerOverlaps)}`);
        if (width <= 767 && state.fixedMobileNavs.length) failures.push(`${item.label} ${width}: fixed mobile nav can cover content ${JSON.stringify(state.fixedMobileNavs)}`);
        if (state.missingTabControls.length) failures.push(`${item.label} ${width}: tab aria-controls missing targets ${state.missingTabControls.join(", ")}`);
        if (state.brokenImages.length) warnings.push(`${item.label} ${width}: broken images ${state.brokenImages.join(", ")}`);
        if (normalUserRoles.has(item.role)) {
          const leaks = visibleOpsLeaks(state.visibleText);
          if (leaks.length) failures.push(`${item.label} ${width}: normal-user ops language leak ${leaks.join(", ")} in "${state.textSample}"`);
        }
        const governanceShortcutCount = await page.getByLabel("Open governance").count();
        if (item.role === "Reviewer" && governanceShortcutCount > 0) failures.push(`${item.label} ${width}: Reviewer sees governance shortcut`);
        if (item.label === "admin-dam-admin" && width >= 768 && governanceShortcutCount < 1) failures.push(`${item.label} ${width}: DAM Admin governance shortcut missing`);
        if (item.label === "detail-approved-viewer" && !state.hasBlockedDownload) failures.push(`${item.label} ${width}: portal-ready blocker missing`);
        if (item.label === "review-viewer" && !state.hasViewerReviewBlock) failures.push(`${item.label} ${width}: viewer review block missing`);
        if (item.label === "upload-viewer" && !state.hasViewerUploadBlock) failures.push(`${item.label} ${width}: viewer upload block missing`);
        if (item.label === "admin-viewer" && !state.hasAdminBlock) failures.push(`${item.label} ${width}: viewer admin block missing`);
        if (item.label === "review-reviewer" && !state.hasReviewBlocker) failures.push(`${item.label} ${width}: write mapping blocker missing`);
        if (item.label === "library-reviewer" && state.hasOriginalFilenameOnCard) failures.push(`${item.label} ${width}: original filename exposed on Find card`);
        if (item.label === "viewer-needs-review-hidden" && state.textSample.includes("2012 Photo")) warnings.push(`${item.label} ${width}: viewer may see review asset copy`);
        if ((width === 1024 || width === 768 || width === 390 || width === 320) && ["library-viewer", "review-reviewer", "guide-viewer"].includes(item.label)) {
          await saveFullPageScreenshot(page, path.join(outDir, "qa", `${item.label}-${width}.png`));
        }
        completed = true;
      } catch (error) {
        if (attempt === 1 || !isTransientBrowserTargetClose(error)) throw error;
        warnings.push(`${item.label} ${width}: transient browser target closed; retried`);
      } finally {
        await closeContext(context);
      }
    }
  }
}

{
  const { page, context } = await newRolePage("Viewer", 1440, 1000);
  await gotoAndSettle(page, base);
  await page.getByRole("searchbox", { name: "Search approved media" }).fill("Bible");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.waitForLoadState("networkidle", { timeout: 1500 }).catch(() => {});
  if (!page.url().includes("q=Bible")) failures.push("search interaction: search query did not update URL");
  if ((await page.getByRole("searchbox", { name: "Search approved media" }).inputValue()) !== "Bible") failures.push("search interaction: search input did not retain query");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Viewer", 390, 900);
  await gotoAndSettle(page, `${base}/?q=zzzzzz-no-visible-media-proof`);
  if ((await page.getByTestId("library-empty-state").getByText("No approved media matches this search").count()) < 1) failures.push("viewer-library-empty-to-collections: empty copy missing");
  await page.getByTestId("library-empty-state").getByRole("link", { name: "Browse packages" }).click();
  await page.waitForURL(/\/collections/, { timeout: 10000 });
  await page.getByRole("button", { name: /View details/ }).first().click();
  await page.getByRole("button", { name: /Open media/ }).first().click();
  await page.waitForURL(/\?collection=/, { timeout: 10000 });
  if (!page.url().includes("collection=")) failures.push("viewer-library-empty-to-collections: collection did not open Find results");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Viewer", 1440, 1000);
  await gotoAndSettle(page, `${base}/collections`);
  if ((await page.getByText("Best use:").count()) < 1) failures.push("packages ministry kits: best-use summary missing");
  if ((await page.getByText("Safety:").count()) < 1) failures.push("packages ministry kits: safety summary missing");
  if ((await page.getByText("Open media").count()) < 1) failures.push("packages ministry kits: open media action missing");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Viewer", 390, 900);
  await gotoAndSettle(page, `${base}/assets/368`);
  if ((await page.getByText(/Review required before use|Source file restricted|Not available yet/).count()) < 1) failures.push("viewer-asset-blocked-request-review: blocked decision title missing");
  if ((await page.getByRole("link", { name: "Download approved copy" }).count()) > 0) failures.push("viewer-asset-blocked-request-review: blocked record shows download action");
  const reviewRequestHref = await page.getByRole("link", { name: "Request DAM review" }).first().getAttribute("href");
  const reviewRequestLeaks = decodedHrefOpsLeaks(reviewRequestHref);
  if (reviewRequestLeaks.length) failures.push(`viewer-asset-blocked-request-review: viewer mailto exposes operations truth (${reviewRequestLeaks.join(", ")})`);
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Viewer", 1440, 1000);
  await gotoAndSettle(page, base);
  if ((await page.getByLabel("Common media tasks").getByText("Website image").count()) < 1) failures.push("viewer-find: use-case shortcuts missing");
  if ((await page.getByText("No approved copies are ready yet").count()) < 1) failures.push("viewer-find: safe empty state missing");
  if ((await page.getByText("Media may exist, but it still needs review, rights checks, or approved copies before normal users can reuse it.").count()) < 1) failures.push("viewer-find: safe empty explanation missing");
  for (const action of ["Browse packages", "Request DAM review", "Send new media"]) {
    if ((await page.getByText(action).count()) < 1) failures.push(`viewer-find: safe empty action missing ${action}`);
  }
  const viewerHomeText = await page.locator("body").innerText();
  if (/ResourceSpace|Shared Drive|pending writes|launch gate/i.test(viewerHomeText)) failures.push("viewer-find: Viewer sees operations truth copy");
  if ((await page.locator(".media-card").getByText(/Ready to use/).count()) > 0) failures.push("viewer-find: ready verdict visible when portal-ready set is empty");
  if ((await page.getByText("Saved ops views").count()) > 0) failures.push("viewer-find: ops saved views visible to Viewer");
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
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Viewer", 1440, 1000);
  await gotoAndSettle(page, `${base}/?view=batch-approved-blockers`);
  const simpleVerdicts = await page.locator(".media-card").getByText(/Review required before use|Source file restricted|Not available yet|Request access/).count();
  if (simpleVerdicts < 1) failures.push("viewer-review-needed-view: result cards do not show blocked simple verdicts");
  if ((await page.getByText("Ready to use").count()) > 0) failures.push("viewer-review-needed-view: unsafe result labelled ready to use");
  if ((await page.getByText(/ResourceSpace ID|RS [0-9]/).count()) > 0) failures.push("viewer-review-needed-view: ResourceSpace details visible to Viewer");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Reviewer", 1440, 1000);
  await gotoAndSettle(page, base);
  const commandSearch = await openCommandPalette(page);
  await commandSearch.fill("children youth");
  await page.keyboard.press("Enter");
  await page.waitForURL(/queue=children-youth/, { timeout: 10000 });
  const activeChildrenQueue = page.getByLabel("Review filters", { exact: true }).getByRole("button", { name: /Children\/Youth/ });
  if ((await activeChildrenQueue.getAttribute("aria-pressed")) !== "true") failures.push("command palette: children/youth queue did not become active");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Reviewer", 1440, 1000);
  await gotoAndSettle(page, `${base}/review?queue=rights-review`);
  const activeRightsQueue = page.getByLabel("Review filters", { exact: true }).getByRole("button", { name: /Rights Review/ });
  if ((await activeRightsQueue.getAttribute("aria-pressed")) !== "true") failures.push("review stable queue URL: rights-review did not become active");
  await activeRightsQueue.click();
  if (!page.url().includes("queue=rights-review")) failures.push("review stable queue URL: queue button did not preserve URL state");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Contributor", 1440, 1000);
  await gotoAndSettle(page, `${base}/upload`);
  await advanceUploadToFiles(page, "Browser QA");
  if ((await page.getByText("Drop files here or browse").count()) < 1) failures.push("upload file dropzone: drop/browse affordance missing");
  await page.getByText("Drop files here or browse").evaluate((node) => {
    const label = node.closest("label");
    if (!label) throw new Error("upload dropzone label missing");
    const transfer = new DataTransfer();
    transfer.items.add(new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], "qa-drop.jpg", { type: "image/jpeg" }));
    label.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
  });
  if ((await page.getByLabel("Selected file preview").getByText("qa-drop.jpg").count()) < 1) failures.push("upload file dropzone: dropped file missing from preview");
  await page.getByLabel("Selected file preview").getByRole("button", { name: "Clear files" }).click();
  await page.getByLabel("Files").setInputFiles([{ name: "qa-photo.png", mimeType: "image/png", buffer: tinyPng }]);
  if ((await page.getByLabel("Selected file preview").getByText("qa-photo.png").count()) < 1) failures.push("upload file preview: selected file missing");
  await page.getByLabel("Selected file preview").getByRole("button", { name: "Clear files" }).click();
  await page.getByLabel("Existing Drive or media link").fill("https://drive.google.com/example");
  if ((await page.getByLabel("Suggested tags suggestions", { exact: true }).getByRole("button", { name: "Bible" }).count()) < 1) failures.push("upload tag input: taxonomy suggestions missing");
  await page.getByLabel("Suggested tags", { exact: true }).fill("qa");
  await page.keyboard.press("Enter");
  if ((await page.getByRole("button", { name: "Remove qa" }).count()) > 0) failures.push("upload tag input: non-canonical typed tag became canonical chip");
  if ((await page.getByText("not in the current taxonomy").count()) < 1) failures.push("upload tag input: non-canonical tag warning missing");
  await page.getByLabel("Suggested tags", { exact: true }).fill("Bible, worship");
  await page.keyboard.press("Enter");
  if ((await page.getByRole("button", { name: "Remove Bible" }).count()) < 1) failures.push("upload tag input: canonical typed tag chip missing");
  await page.getByLabel("Reviewer notes").fill("Browser QA no-file intake with source link only.");
  await page.getByRole("button", { name: "Next" }).click();
  if ((await page.getByText("Reviewer packet").count()) < 1) failures.push("upload contributor packet: review packet step missing");
  await page.getByRole("button", { name: "Submit for DAM review" }).click();
  await page.waitForSelector("text=Intake received");
  if ((await page.getByText("Needs Review / Do Not Publish").count()) < 1) failures.push("upload contributor receipt: default review state missing");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Contributor", 320, 900);
  await gotoAndSettle(page, `${base}/upload`);
  await advanceUploadToFiles(page, "Mobile file preview QA");
  await page.getByLabel("Files").setInputFiles([{ name: "qa-mobile-photo-with-a-long-name.png", mimeType: "image/png", buffer: tinyPng }]);
  if ((await page.getByLabel("Selected file preview").getByText("qa-mobile-photo-with-a-long-name.png").count()) < 1) failures.push("upload mobile file preview: selected file missing");
  const mobileUploadOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (mobileUploadOverflow) failures.push("upload mobile file preview: horizontal overflow after file selection");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Contributor", 1440, 1000);
  await gotoAndSettle(page, `${base}/upload`);
  if ((await page.getByText("What are you sending?").count()) < 1) failures.push("upload desktop wizard: template-first prompt missing");
  if ((await page.getByText(/Send never publishes/).count()) < 1) failures.push("upload desktop wizard: never-publishes safety copy missing");
  if ((await page.locator('[data-component="UploadBottomActionBar"]').count()) > 0) failures.push("upload desktop rail: detached bottom submit bar still present");
  if ((await page.getByText("Step 1 of 5").count()) < 1) failures.push("upload desktop wizard: step indicator missing");
  await page.getByRole("button", { name: "Save draft" }).click();
  if ((await page.getByText("Draft saved locally").count()) < 1) failures.push("upload desktop wizard: save draft state missing");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Contributor", 320, 900);
  await gotoAndSettle(page, `${base}/upload`);
  if ((await page.getByText("Step 1 of 5").count()) < 1) failures.push("contributor-upload-stepper: step 1 indicator missing");
  await page.getByRole("button", { name: "Next" }).click();
  const contextStepBox = await page.locator('[data-send-step="1"]:visible').boundingBox();
  const actionBox = await page.getByLabel("Send actions").boundingBox();
  if (contextStepBox && actionBox && actionBox.y < contextStepBox.y + contextStepBox.height - 2) {
    failures.push("contributor-upload-stepper: mobile action controls appear before required step fields");
  }
  await page.getByRole("button", { name: "Next" }).click();
  if ((await page.getByText("Complete Where is this from? before continuing.").count()) < 1) failures.push("contributor-upload-stepper: context validation missing");
  await fillUploadContextStep(page, "Mobile stepper QA");
  await page.getByRole("button", { name: "Next" }).click();
  if ((await page.getByText("Who appears and what permission is known?").count()) < 1) failures.push("contributor-upload-stepper: step 2 did not appear");
  await fillUploadRightsStep(page);
  await page.getByRole("button", { name: "Next" }).click();
  if ((await page.getByText("Files, link, and reviewer notes").count()) < 1) failures.push("contributor-upload-stepper: step 3 did not appear");
  await page.getByRole("button", { name: "Next" }).click();
  if ((await page.getByText("Add a file or source link before continuing.").count()) < 1) failures.push("contributor-upload-stepper: file/source validation missing");
  await page.getByLabel("Existing Drive or media link").fill("https://drive.google.com/mobile-stepper-qa");
  await page.getByLabel("Suggested tags", { exact: true }).fill("Bible, worship");
  await page.keyboard.press("Enter");
  await page.getByLabel("Reviewer notes").fill("Mobile QA source-link intake ready for reviewer packet.");
  await page.getByRole("button", { name: "Next" }).click();
  if ((await page.getByText("Reviewer packet").count()) < 1) failures.push("contributor-upload-stepper: review step did not appear");
  await page.getByRole("button", { name: "Save draft" }).click();
  if ((await page.getByText("Draft saved locally").count()) < 1) failures.push("contributor-upload-stepper: draft local state missing");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Reviewer", 1440, 1000);
  await gotoAndSettle(page, `${base}/review`);
  if ((await page.getByTestId("review-primary-queue").count()) !== 1) failures.push("review console: expected one primary queue surface");
  if ((await page.locator('[data-component="ReviewTriageStrip"]').count()) > 0) failures.push("review console: visual triage strip returned");
  if ((await page.getByLabel("Review queue data table").count()) > 0) failures.push("review console: full data table returned");
  const selectedQueueItem = page.getByTestId("review-selected-queue-item");
  if ((await selectedQueueItem.count()) < 1) failures.push("review console: selected queue item highlight missing");
  if ((await selectedQueueItem.getByText("Selected", { exact: true }).count()) < 1) failures.push("review console: selected queue item label missing");
  const reviewWorkspaceBehavior = await page.getByTestId("review-current-workspace").evaluate((node) => {
    const style = window.getComputedStyle(node);
    return { position: style.position, overflowY: style.overflowY, maxHeight: style.maxHeight };
  });
  if (reviewWorkspaceBehavior.position !== "sticky" && !["auto", "scroll"].includes(reviewWorkspaceBehavior.overflowY)) failures.push("review console: right workspace is not sticky or internally scrollable");
  const reviewWorkspace = page.getByTestId("review-current-workspace");
  await page.evaluate(() => window.scrollTo(0, 520));
  await page.waitForTimeout(250);
  const stickyFollow = await reviewWorkspace.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const style = window.getComputedStyle(node);
    return { top: rect.top, stickyTop: parseFloat(style.top), scrollTop: node.scrollTop };
  });
  if (stickyFollow.top < stickyFollow.stickyTop - 3 || stickyFollow.top > stickyFollow.stickyTop + 16) failures.push(`review console: right workspace did not follow page scroll (${Math.round(stickyFollow.top)} vs ${Math.round(stickyFollow.stickyTop)})`);
  await page.getByRole("tab", { name: "Metadata", exact: true }).click();
  const forcedPanelScroll = await reviewWorkspace.evaluate((node) => {
    node.scrollTop = 360;
    return node.scrollTop;
  });
  if (forcedPanelScroll < 40) failures.push("review console: right workspace does not have internal scroll");
  await page.getByRole("button", { name: "Review", exact: true }).first().click();
  await page.waitForTimeout(250);
  const resetPanelState = await reviewWorkspace.evaluate((node) => ({ scrollTop: node.scrollTop, top: node.getBoundingClientRect().top }));
  const overviewSelected = await page.getByRole("tab", { name: "Overview", exact: true }).getAttribute("aria-selected");
  if (resetPanelState.scrollTop > 3) failures.push(`review console: right workspace did not reset to top after selecting asset (${resetPanelState.scrollTop})`);
  if (overviewSelected !== "true") failures.push("review console: selecting a new asset did not reset inspector to Overview");
  if ((await page.getByTestId("review-decision-requirements").count()) !== 1) failures.push("review console: decision lock panel should appear once");
  if ((await page.getByText(/disabled because/).count()) > 0) failures.push("review console: repeated verbose disabled reason copy returned");
  if ((await page.getByText("Sync setup is required").count()) > 0) failures.push("review console: production sync warning returned");
  if ((await page.getByText(/ResourceSpace updated successfully/i).count()) > 0) failures.push("review console: fake ResourceSpace success visible");
  if ((await page.getByRole("button", { name: "Show more review items" }).count()) < 1) failures.push("review queue load more: button missing");
  await page.getByRole("button", { name: "Asset actions" }).click();
  if ((await page.getByRole("menuitem", { name: /Copy reference code/ }).count()) < 1) failures.push("review asset actions menu: copy reference code missing");
  if ((await page.getByRole("menuitem", { name: /Open in ResourceSpace/ }).count()) > 0) failures.push("review asset actions menu: Reviewer can see ResourceSpace admin action");
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Metadata", exact: true }).click();
  if ((await page.getByText("Library status").count()) < 1) failures.push("review inspector tabs: Metadata panel missing library status");
  await page.getByRole("tab", { name: "Metadata", exact: true }).press("ArrowRight");
  if ((await page.getByText("People/minors").count()) < 1) failures.push("review inspector tabs: ArrowRight did not open Usage panel");
  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  await page.getByLabel("Review note").fill("Browser QA confirms source, rights, people, derivative, and sensitive context evidence.");
  for (const label of ["Source confirmed", "Rights confirmed", "People visibility confirmed", "Children/youth checked", "Usage scope selected", "Derivative available", "Sensitive context checked", "Credit requirement checked"]) {
    await page.getByLabel(label).check();
  }
  if ((await page.getByRole("button", { name: "Hold to queue Archive only", exact: true }).count()) < 1) failures.push("review high-risk action: archive hold button missing");
  if ((await page.getByRole("button", { name: "Hold to queue Do not publish externally", exact: true }).count()) < 1) failures.push("review high-risk action: do-not-publish hold button missing");
  await page.getByRole("button", { name: "Approve for church-wide use" }).click();
  await page.waitForSelector("text=Queue decision for sync");
  await page.getByRole("button", { name: "Queue decision for sync" }).click();
  await page.waitForFunction(() =>
    [...document.querySelectorAll("h3")]
      .some((node) => node.textContent?.trim() === "Audit preview" && node.checkVisibility())
  );
  if ((await page.getByText("Audit preview").count()) < 1) failures.push("review action: audit preview missing");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Reviewer", 390, 900);
  await gotoAndSettle(page, `${base}/review`);
  const currentWorkspace = page.getByTestId("review-current-workspace");
  const loadedQueueList = page.getByTestId("review-mobile-collapsed-queue");
  if ((await currentWorkspace.getByText("Currently reviewing").count()) < 1) failures.push("reviewer-decision-workflow: currently reviewing panel missing on mobile");
  if ((await loadedQueueList.getByText("Queue below").count()) < 1) failures.push("reviewer-decision-workflow: collapsed queue missing on mobile");
  const currentBox = await currentWorkspace.boundingBox();
  const queueBox = await loadedQueueList.boundingBox();
  if (currentBox && queueBox && currentBox.y > queueBox.y) failures.push("reviewer-decision-workflow: current asset appears after loaded queue list on mobile");
  if ((await page.locator('[data-testid="review-selected-queue-item"]:visible').count()) > 0) failures.push("reviewer-decision-workflow: selected queue item duplicated on mobile");
  if ((await page.getByTestId("review-decision-requirements").getByText("Decision locked").count()) < 1) failures.push("reviewer-decision-workflow: decision locked panel missing");
  if ((await page.getByTestId("review-decision-requirements").getByText(/Complete before approval/).count()) < 1) failures.push("reviewer-decision-workflow: requirements summary missing");
  if ((await page.getByTestId("review-disabled-decision-group").getByRole("button", { name: "Approve for church-wide use" }).isDisabled()) !== true) failures.push("reviewer-decision-workflow: approve should be disabled before evidence");
  if ((await page.getByText(/Approve for church-wide use disabled because/).count()) > 0) failures.push("reviewer-decision-workflow: repeated disabled reason copy returned");
  if ((await page.getByText("Sync setup is required").count()) > 0) failures.push("reviewer-decision-workflow: production sync warning returned");
  if ((await page.getByText(/ResourceSpace updated successfully/i).count()) > 0) failures.push("reviewer-decision-workflow: fake ResourceSpace success visible");
  await loadedQueueList.locator("summary").click();
  await loadedQueueList.locator("button").nth(1).click();
  await page.waitForTimeout(250);
  const mobileWorkspaceAfterSelect = await currentWorkspace.boundingBox();
  const mobileWorkspaceScrollTop = await currentWorkspace.evaluate((node) => node.scrollTop);
  if (!mobileWorkspaceAfterSelect || mobileWorkspaceAfterSelect.y < -4 || mobileWorkspaceAfterSelect.y > 120) failures.push("reviewer-decision-workflow: selecting queue item should return current workspace to view on mobile");
  if (mobileWorkspaceScrollTop > 3) failures.push(`reviewer-decision-workflow: current workspace did not reset to top on mobile (${mobileWorkspaceScrollTop})`);
  await page.getByLabel("Review note").fill("Mobile QA confirms source, rights, people, derivative, and sensitive context evidence.");
  for (const label of ["Source confirmed", "Rights confirmed", "People visibility confirmed", "Children/youth checked", "Usage scope selected", "Derivative available", "Sensitive context checked", "Credit requirement checked"]) {
    await page.getByLabel(label).check();
  }
  await page.getByRole("button", { name: "Approve for church-wide use" }).click();
  await page.waitForSelector("text=Queue decision for sync");
  if ((await page.getByText("Source records stay unchanged until sync completes.").count()) < 1) failures.push("reviewer-decision-workflow: sync confirmation copy missing");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Reviewer", 1440, 1000);
  await gotoAndSettle(page, `${base}/assets/368`);
  const reviewerDetailText = await page.locator("body").innerText();
  if (/Reviewer\/Admin source truth|Admin source truth|Raw ResourceSpace status|Source\/original path|Pending write status|ResourceSpace ID/i.test(reviewerDetailText)) failures.push("asset detail: Reviewer sees admin source truth");
  await page.getByRole("button", { name: "Asset actions" }).click();
  if ((await page.getByRole("menuitem", { name: /Copy reference code/ }).count()) < 1) failures.push("asset actions menu: Reviewer copy reference code missing");
  if ((await page.getByRole("menuitem", { name: /Open in ResourceSpace/ }).count()) > 0) failures.push("asset actions menu: Reviewer can see ResourceSpace admin action");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("DAM Admin", 1440, 1000);
  await gotoAndSettle(page, `${base}/review`);
  await page.getByRole("button", { name: "Asset actions" }).click();
  if ((await page.getByRole("menuitem", { name: /Open in ResourceSpace/ }).count()) < 1) failures.push("review asset actions menu: DAM Admin ResourceSpace action missing");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("DAM Admin", 390, 900);
  await gotoAndSettle(page, `${base}/admin`);
  if ((await page.getByRole("heading", { name: "Launch blocked" }).count()) < 1) failures.push("admin-launch-blocked: launch blocked heading missing");
  for (const blocker of ["ResourceSpace write mapping", "Real authentication / SSO", "Rights and consent review coverage"]) {
    if ((await page.getByText(blocker).count()) < 1) failures.push(`admin-launch-blocked: top blocker missing ${blocker}`);
  }
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Viewer", 390, 900);
  await gotoAndSettle(page, `${base}/guide`);
  if ((await page.getByText("What are you trying to do?").count()) < 1) failures.push("guide-task-cards: task prompt missing");
  await page.getByLabel("Search help").fill("children");
  const childrenTask = page.getByLabel("Help topics").getByRole("button", { name: /Check people\/youth/ });
  if ((await childrenTask.count()) < 1) failures.push("guide-task-cards: search did not match children task");
  await childrenTask.click();
  if ((await page.getByText("Do", { exact: true }).count()) < 1 || (await page.getByText("Avoid", { exact: true }).count()) < 1) failures.push("guide-task-cards: do/avoid guidance missing after open");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Viewer", 1440, 1000);
  await gotoAndSettle(page, `${base}/assets/368`);
  if ((await page.getByTestId("asset-primary-verdict").count()) !== 1) failures.push("asset detail one-verdict: expected exactly one primary verdict card");
  if ((await page.getByRole("heading", { name: "Download and requests" }).count()) > 0) failures.push("asset detail one-verdict: viewer sees duplicate download panel");
  if ((await page.getByRole("heading", { name: "Use guidance" }).count()) < 1) failures.push("asset detail: use guidance missing");
  if ((await page.getByRole("heading", { name: "Credit" }).count()) < 1) failures.push("asset detail: credit guidance missing");
  if ((await page.getByRole("heading", { name: "People/youth note" }).count()) < 1) failures.push("asset detail: people/youth note missing");
  const viewerDetailText = await page.locator("body").innerText();
  if (/Reviewer\/Admin source truth|Raw ResourceSpace status|Source\/original path|Pending write status/i.test(viewerDetailText)) failures.push("asset detail: viewer sees operations truth");
  const viewerActionsButton = page.getByRole("button", { name: "Record actions" });
  await viewerActionsButton.click();
  if ((await viewerActionsButton.getAttribute("aria-expanded")) !== "true") failures.push("asset actions menu: aria-expanded not true after open");
  if ((await page.getByRole("menuitem", { name: /Copy reference code/ }).count()) < 1) failures.push("asset actions menu: copy reference code missing");
  if ((await page.getByRole("menuitem", { name: /Copy portal link/ }).count()) < 1) failures.push("asset actions menu: copy portal link missing");
  if ((await page.getByRole("menuitem", { name: /Open in ResourceSpace/ }).count()) > 0) failures.push("asset actions menu: Viewer can see ResourceSpace admin action");
  await page.keyboard.press("ArrowDown");
  const activeMenuText = await page.evaluate(() => document.activeElement?.textContent || "");
  if (!activeMenuText.includes("Copy portal link")) failures.push("asset actions menu: ArrowDown did not move focus");
  await page.keyboard.press("Escape");
  if ((await viewerActionsButton.getAttribute("aria-expanded")) !== "false") failures.push("asset actions menu: Escape did not close menu");
  const focusedAfterEscape = await page.evaluate(() => document.activeElement?.textContent || "");
  if (!focusedAfterEscape.includes("Record actions")) failures.push("asset actions menu: focus did not return after Escape");
  const requestLinks = page.getByRole("link", { name: /Request DAM review|Ask media team|Request source-file access/ });
  if ((await requestLinks.count()) < 1) {
    failures.push("asset detail request link: request action missing");
  } else {
    const requestLinkCount = await requestLinks.count();
    for (let index = 0; index < requestLinkCount; index += 1) {
      const requestHref = await requestLinks.nth(index).getAttribute("href");
      const leaks = decodedHrefOpsLeaks(requestHref);
      if (leaks.length) failures.push(`asset detail request link: viewer href exposes operations truth (${leaks.join(", ")})`);
    }
  }
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("DAM Admin", 1440, 1000);
  await gotoAndSettle(page, `${base}/assets/368`);
  await page.getByRole("button", { name: "Asset actions" }).click();
  if ((await page.getByRole("menuitem", { name: /Open in ResourceSpace/ }).count()) < 1) failures.push("asset actions menu: DAM Admin ResourceSpace action missing");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Viewer", 320, 900);
  await gotoAndSettle(page, `${base}/assets/368`);
  await page.getByRole("button", { name: "Record actions" }).click();
  const menuOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (menuOverflow) failures.push("asset actions menu: mobile menu caused horizontal overflow");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Viewer", 1440, 1000);
  await gotoAndSettle(page, base);
  const checks = await page.evaluate(async () => {
    const approved = await fetch("/api/download/368?role=Viewer");
    const unsafe = await fetch("/api/download/644?role=Viewer");
    const malformed = await fetch("/api/download/%2E%2E368?role=Viewer");
    return { approved: approved.status, unsafe: unsafe.status, malformed: malformed.status };
  });
  if (checks.approved !== 403) failures.push(`blocked approved download browser fetch status ${checks.approved}`);
  if (checks.unsafe !== 403) failures.push(`unsafe download browser fetch status ${checks.unsafe}`);
  if (checks.malformed !== 400) failures.push(`malformed download browser fetch status ${checks.malformed}`);
  await closeContext(context);
}

for (const shot of requiredShots) {
  const { page, context } = await newRolePage(shot.role, shot.width, shot.height);
  await gotoAndSettle(page, `${base}${shot.path}`);
  if (shot.selector) await page.locator(shot.selector).scrollIntoViewIfNeeded();
  await saveFullPageScreenshot(page, path.join(outDir, shot.name));
  await closeContext(context);
}

async function captureProof(name, role, width, height, pathName, setup) {
  const { page, context } = await newRolePage(role, width, height);
  await gotoAndSettle(page, `${base}${pathName}`);
  if (setup) await setup(page);
  await page.screenshot({ path: path.join(outDir, "primitive-proof", name), fullPage: false });
  await closeContext(context);
}

await captureProof("appnav-tubelight-desktop.png", "Viewer", 1440, 720, "/", async (page) => {
  await page.locator("header").first().scrollIntoViewIfNeeded();
});

await captureProof("appnav-tubelight-mobile.png", "Viewer", 320, 720, "/", async (page) => {
  await page.locator("header").first().scrollIntoViewIfNeeded();
});

await captureProof("command-palette-open.png", "Reviewer", 1440, 900, "/", async (page) => {
  const commandSearch = await openCommandPalette(page);
  await commandSearch.fill("pending writes");
});

await captureProof("library-badges-pagination-filterpills.png", "Viewer", 1440, 1000, "/?view=website-hero", async (page) => {
  await page.getByLabel("Find results").scrollIntoViewIfNeeded();
});

await captureProof("admin-datatable.png", "DAM Admin", 1440, 1000, "/admin", async (page) => {
  await page.getByRole("tab", { name: "Action backlog" }).click();
  await page.locator("#backlog").scrollIntoViewIfNeeded();
});

await captureProof("review-datatable-inspector.png", "Reviewer", 1440, 1000, "/review", async (page) => {
  await page.getByLabel("Review workbench").scrollIntoViewIfNeeded();
});

await captureProof("media-preview-panel-image.png", "DAM Admin", 1440, 1000, "/assets/1556", async (page) => {
  await page.getByLabel("Media record decision").first().scrollIntoViewIfNeeded();
});

await captureProof("media-preview-panel-restricted.png", "Viewer", 1440, 1000, "/assets/368", async (page) => {
  await page.getByText("Preview protected").first().scrollIntoViewIfNeeded();
});

await captureProof("media-preview-panel-document.png", "Viewer", 1440, 1000, "/guide", async (page) => {
  await page.locator(".help-assistant-rail").getByText("Quick decision").scrollIntoViewIfNeeded();
});

await captureProof("asset-actions-menu-open.png", "Viewer", 1440, 900, "/assets/368", async (page) => {
  await page.getByRole("button", { name: "Record actions" }).click();
});

await captureProof("upload-dropzone-tags.png", "Contributor", 1440, 1000, "/upload", async (page) => {
  await advanceUploadToFiles(page, "Primitive proof");
  await page.getByLabel("Files").setInputFiles([{ name: "primitive-proof-photo.png", mimeType: "image/png", buffer: tinyPng }]);
  await page.waitForFunction(() => {
    const img = document.querySelector('[aria-label="Selected file preview"] img');
    return img && img.complete && img.naturalWidth > 0;
  });
  await page.getByLabel("Suggested tags", { exact: true }).fill("Bible, worship");
  await page.keyboard.press("Enter");
});

await captureProof("toast-feedback.png", "Contributor", 1440, 900, "/upload", async (page) => {
  await page.getByRole("button", { name: "Save draft" }).click();
  await page.waitForTimeout(500);
});

await captureProof("review-hold-confirm-dialog.png", "Reviewer", 1440, 1000, "/review", async (page) => {
  await page.getByLabel("Review note").fill("Primitive proof confirms source, rights, people, derivative, and sensitive context evidence.");
  for (const label of ["Source confirmed", "Rights confirmed", "People visibility confirmed", "Children/youth checked", "Usage scope selected", "Derivative available", "Sensitive context checked", "Credit requirement checked"]) {
    await page.getByLabel(label).check();
  }
  await page.getByRole("button", { name: "Approve for church-wide use" }).click();
  await page.waitForSelector("text=Queue decision for sync");
});

await captureProof("state-system-empty-error-loading.png", "Viewer", 1440, 900, "/?q=zzzzzz-no-visible-media-proof", async (page) => {
  await page.getByText("No approved media matches this search").scrollIntoViewIfNeeded();
});

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
browser.close().catch(() => {});
process.exit(failures.length || consoleErrors.length || networkFailures.length ? 1 : 0);
