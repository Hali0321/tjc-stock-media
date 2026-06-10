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
  /raw ResourceSpace/i
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

async function withTimeout(label, ms, work) {
  let timer;
  try {
    return await Promise.race([
      work(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
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
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      response = await page.goto(url, { waitUntil: "load", timeout: 60000 });
      break;
    } catch (error) {
      const message = String(error?.message || error);
      if (/ERR_CONNECTION_REFUSED|ECONNREFUSED|ERR_EMPTY_RESPONSE/i.test(message) && attempt < 3) {
        await page.waitForTimeout(750);
        continue;
      }
      if (!/ERR_ABORTED|frame was detached/i.test(message)) throw error;
      response = { status: () => 200 };
      await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => {});
      break;
    }
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
    await withTimeout(`screenshot ${screenshotPath}`, 15000, () => page.screenshot({ path: screenshotPath, fullPage: true }));
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
  await page.getByLabel("Source class").selectOption("Church photographer / TJC-created");
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

async function fillReviewEvidence(page, note) {
  const panel = page.locator('[data-component="ReviewActionEvidencePanel"]:visible').last();
  await panel.getByLabel("Review note").fill(note);
  for (const label of ["Source confirmed", "Rights confirmed", "People visibility confirmed", "Children/youth checked", "Usage scope selected", "Derivative available", "Sensitive context checked", "Credit requirement checked"]) {
    await panel.getByLabel(label).check();
  }
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
        if (el.closest(".ed-filter-bar, .ed-bulk-toolbar")) return false;
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
        console.log(`[browser-qa] ${item.label} ${width} attempt ${attempt + 1}`);
        const response = await withTimeout(`goto ${item.label} ${width}`, 30000, () => gotoAndSettle(page, `${base}${item.path}`));
        await withTimeout(`images ${item.label} ${width}`, 5000, () => waitForVisibleImages(page));
        const state = await withTimeout(`inspect ${item.label} ${width}`, 10000, () => inspectPage(page, item));
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
        if (item.label === "review-viewer" && !state.hasViewerReviewBlock) failures.push(`${item.label} ${width}: viewer review block missing`);
        if (item.label === "upload-viewer" && !state.hasViewerUploadBlock) failures.push(`${item.label} ${width}: viewer upload block missing`);
        if (item.label === "admin-viewer" && !state.hasAdminBlock) failures.push(`${item.label} ${width}: viewer admin block missing`);
        if (item.label === "library-reviewer" && state.hasOriginalFilenameOnCard) failures.push(`${item.label} ${width}: original filename exposed on Find card`);
        if (item.label === "viewer-needs-review-hidden" && state.textSample.includes("2012 Photo")) warnings.push(`${item.label} ${width}: viewer may see review asset copy`);
        if ((width === 1024 || width === 768 || width === 390 || width === 320) && ["library-viewer", "review-reviewer", "guide-viewer"].includes(item.label)) {
          await saveFullPageScreenshot(page, path.join(outDir, "qa", `${item.label}-${width}.png`));
        }
        completed = true;
      } catch (error) {
        if (/timed out after/i.test(String(error?.message || error))) {
          failures.push(`${item.label} ${width}: ${error.message}`);
          completed = true;
          continue;
        }
        if (attempt === 1 || !isTransientBrowserTargetClose(error)) throw error;
        warnings.push(`${item.label} ${width}: transient browser target closed; retried`);
      } finally {
        await closeContext(context);
      }
    }
  }
}

await browser.close().catch(() => {});
browser = await launchBrowser();

{
  const { page, context } = await newRolePage("Viewer", 1440, 1000);
  await gotoAndSettle(page, base);
  const findSearchInput = page.locator('form[aria-label="Search assets, collections, and folders"] input[name="q"]').first();
  if (!(await findSearchInput.isVisible({ timeout: 10000 }).catch(() => false))) {
    const bodySample = await page.locator("body").innerText({ timeout: 1000 }).catch(() => "");
    failures.push(`search interaction: global search input missing before query in "${bodySample.replace(/\s+/g, " ").slice(0, 180)}"`);
  } else {
    await findSearchInput.fill("Bible");
    await findSearchInput.press("Enter");
    await page.waitForLoadState("networkidle", { timeout: 1500 }).catch(() => {});
    if ((await findSearchInput.inputValue()) !== "Bible") failures.push("search interaction: search input did not retain query");
  }
  for (const text of ["Asset Library", "Saved views", "Can I use this?", "Download"]) {
    if ((await page.getByText(text).count()) < 1) failures.push(`library ResourceSpace shell: missing ${text}`);
  }
  if ((await page.locator(".ed-source-pill").count()) < 1) failures.push("library ResourceSpace shell: data-source badge missing");
  if ((await page.getByText(/Serene mountain|Coastal cliffs|Summer Launch Toolkit/i).count()) > 0) failures.push("library ResourceSpace shell: old demo asset copy visible");
  if ((await page.locator(".ed-inspector").count()) < 1) failures.push("library ResourceSpace shell: right inspector missing");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Viewer", 390, 900);
  await gotoAndSettle(page, base);
  if ((await page.getByText("Asset Library").count()) < 1) failures.push("library mobile: asset library heading missing");
  if ((await page.locator(".ed-grid .ed-asset-card").count()) < 1) failures.push("library mobile: asset cards missing");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Viewer", 1440, 1000);
  await gotoAndSettle(page, `${base}/brand-hub`);
  for (const text of ["Easter at TJC 2024", "Worship God", "Follow Christ", "Love People", "Bring Hope", "Logo usage", "Allowed channels"]) {
    if ((await page.getByText(text).count()) < 1) failures.push(`brand hub ResourceSpace shell: missing ${text}`);
  }
  if ((await page.locator(".ed-logo-grid img").count()) < 4) failures.push("brand hub ResourceSpace shell: TJC logo assets missing");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Viewer", 390, 900);
  await gotoAndSettle(page, `${base}/review`);
  if ((await page.getByText("Review inbox requires reviewer access").count()) < 1) failures.push("viewer review gate: access block missing");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Viewer", 390, 900);
  await gotoAndSettle(page, `${base}/admin`);
  if ((await page.getByText("Governance requires DAM Admin role").count()) < 1) failures.push("viewer admin gate: access block missing");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Viewer", 1440, 1000);
  await gotoAndSettle(page, `${base}/assets/368`);
  for (const text of ["Bench Bible", "Can I use this?", "Rights & Restrictions", "Download approved copy"]) {
    if ((await page.getByText(text).count()) < 1) failures.push(`asset detail ResourceSpace shell: missing ${text}`);
  }
  if ((await page.getByText(/Serene mountain|Coastal cliffs|Summer Launch Toolkit/i).count()) > 0) failures.push("asset detail ResourceSpace shell: old demo asset copy visible");
  const viewerDetailText = await page.locator("body").innerText();
  if (/Reviewer\/Admin source truth|Raw ResourceSpace status|Source\/original path|Pending write status|Shared Drive|master\/original/i.test(viewerDetailText)) failures.push("asset detail: viewer sees operations truth");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Reviewer", 1440, 1000);
  await gotoAndSettle(page, `${base}/review`);
  for (const text of ["Review Queue", "Review Evidence", "Metadata Completeness", "Rights & Model Checks", "Review Decision", "Approve", "Request Changes", "Restrict"]) {
    if ((await page.getByText(text).count()) < 1) failures.push(`review ResourceSpace shell: missing ${text}`);
  }
  if ((await page.locator(".ed-review-list .ed-queue-item.is-active").count()) < 1) failures.push("review ResourceSpace shell: selected queue item missing");
  if ((await page.getByText(/ResourceSpace updated successfully/i).count()) > 0) failures.push("review ResourceSpace shell: fake ResourceSpace success visible");
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
  await page.getByLabel("Existing media-team link").fill("https://media.tjc.example/review-source");
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
  await page.getByLabel("Existing media-team link").fill("https://media.tjc.example/mobile-stepper-qa");
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
  const { page, context } = await newRolePage("Reviewer", 390, 900);
  await gotoAndSettle(page, `${base}/review`);
  if ((await page.getByText("Review Queue").count()) < 1) failures.push("review mobile: queue heading missing");
  if ((await page.getByText("Review Decision").count()) < 1) failures.push("review mobile: decision panel missing");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Reviewer", 1440, 1000);
  await gotoAndSettle(page, `${base}/assets/368`);
  const reviewerDetailText = await page.locator("body").innerText();
  if (/Reviewer\/Admin source truth|Admin source truth|Raw ResourceSpace status|Source\/original path|Pending write status/i.test(reviewerDetailText)) failures.push("asset detail: Reviewer sees admin source truth");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("DAM Admin", 390, 900);
  await gotoAndSettle(page, `${base}/admin`);
  for (const text of ["DAM Control Center", "Roles & Permissions", "Policy Summary", "System Health"]) {
    if ((await page.getByText(text).count()) < 1) failures.push(`admin control center: missing ${text}`);
  }
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Viewer", 390, 900);
  await gotoAndSettle(page, `${base}/guide`);
  if ((await page.getByText("Safe reuse guide").count()) < 1) failures.push("guide-task-cards: guide heading missing");
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
  if ((await page.getByText("Can I use this?").count()) !== 1) failures.push("asset detail one-verdict: expected exactly one primary verdict card");
  if ((await page.getByText("Download approved copy").count()) < 1) failures.push("asset detail: approved-copy action missing");
  const viewerDetailText = await page.locator("body").innerText();
  if (/Reviewer\/Admin source truth|Raw ResourceSpace status|Source\/original path|Pending write status/i.test(viewerDetailText)) failures.push("asset detail: viewer sees operations truth");
  await closeContext(context);
}

{
  const { page, context } = await newRolePage("Viewer", 320, 900);
  await gotoAndSettle(page, `${base}/assets/368`);
  const detailOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (detailOverflow) failures.push("asset detail: mobile caused horizontal overflow");
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
  console.log(`[browser-qa] screenshot ${shot.name}`);
  await withTimeout(`required shot ${shot.name}`, 35000, async () => {
    await gotoAndSettle(page, `${base}${shot.path}`);
    if (shot.selector) await page.locator(shot.selector).scrollIntoViewIfNeeded();
    await saveFullPageScreenshot(page, path.join(outDir, shot.name));
  }).catch((error) => failures.push(`${shot.name}: ${error.message || error}`));
  await closeContext(context);
}

async function captureProof(name, role, width, height, pathName, setup) {
  const { page, context } = await newRolePage(role, width, height);
  console.log(`[browser-qa] proof ${name}`);
  await withTimeout(`proof ${name}`, 35000, async () => {
    await gotoAndSettle(page, `${base}${pathName}`);
    if (setup) await setup(page);
    await page.screenshot({ path: path.join(outDir, "primitive-proof", name), fullPage: false });
  }).catch((error) => failures.push(`${name}: ${error.message || error}`));
  await closeContext(context);
}

await captureProof("appnav-tubelight-desktop.png", "Viewer", 1440, 720, "/", async (page) => {
  await page.locator("header").first().scrollIntoViewIfNeeded();
});

await captureProof("appnav-tubelight-mobile.png", "Viewer", 320, 720, "/", async (page) => {
  await page.locator("header").first().scrollIntoViewIfNeeded();
});

await captureProof("library-badges-pagination-filterpills.png", "Viewer", 1440, 1000, "/?view=website-hero", async (page) => {
  await page.locator(".ed-approved-banner").scrollIntoViewIfNeeded();
});

await captureProof("admin-datatable.png", "DAM Admin", 1440, 1000, "/admin", async (page) => {
  await page.getByRole("heading", { name: "Integration Status" }).scrollIntoViewIfNeeded();
});

await captureProof("review-datatable-inspector.png", "Reviewer", 1440, 1000, "/review", async (page) => {
  await page.getByText("Review Decision").scrollIntoViewIfNeeded();
});

await captureProof("media-preview-panel-image.png", "DAM Admin", 1440, 1000, "/assets/1556", async (page) => {
  await page.getByText("Can I use this?").first().scrollIntoViewIfNeeded();
});

await captureProof("media-preview-panel-document.png", "Viewer", 1440, 1000, "/guide", async (page) => {
  await page.getByText("Safe reuse guide").scrollIntoViewIfNeeded();
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
  await page.getByText("Review Decision").scrollIntoViewIfNeeded();
});

await captureProof("state-system-empty-error-loading.png", "Viewer", 1440, 900, "/?q=zzzzzz-no-visible-media-proof", async (page) => {
  await page.getByText("Asset Library").scrollIntoViewIfNeeded();
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
