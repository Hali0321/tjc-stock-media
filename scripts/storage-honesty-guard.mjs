#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = {
  feedback: "frontend/lib/beta-feedback.ts",
  savedSearches: "frontend/lib/saved-search-store.ts",
  packages: "frontend/lib/package-store.ts",
  pendingReviewWrites: "frontend/lib/pending-review-writes.ts",
  auditLog: "frontend/lib/audit-log.ts",
  usageAnalytics: "frontend/lib/usage-analytics.ts",
  reviewEvidence: "frontend/lib/review-evidence.ts",
  requestValidation: "frontend/lib/request-validation.ts",
  catalog: "frontend/lib/catalog.ts",
  catalogLanguage: "frontend/lib/catalog-language.ts",
  searchRoute: "frontend/app/api/assets/search/route.ts",
  betaFeedbackUpdateRoute: "frontend/app/api/beta-feedback/[id]/route.ts",
  betaFeedbackExportRoute: "frontend/app/api/beta-feedback/export/route.ts",
  readiness: "frontend/lib/dam-readiness-integrations.ts"
};

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

const feedback = read(files.feedback);
const savedSearches = read(files.savedSearches);
const packages = read(files.packages);
const pendingReviewWrites = read(files.pendingReviewWrites);
const auditLog = read(files.auditLog);
const usageAnalytics = read(files.usageAnalytics);
const reviewEvidence = read(files.reviewEvidence);
const requestValidation = read(files.requestValidation);
const catalog = read(files.catalog);
const catalogLanguage = read(files.catalogLanguage);
const searchRoute = read(files.searchRoute);
const betaFeedbackUpdateRoute = read(files.betaFeedbackUpdateRoute);
const betaFeedbackExportRoute = read(files.betaFeedbackExportRoute);
const readiness = read(files.readiness);
const failures = [];

const stores = [
  { name: "feedback", source: feedback, path: "data\", \"runtime\", \"beta-feedback.json", cap: "maxBetaFeedbackRecords = 500", diagnostic: "durableStorageConfigured: kvConfigured" },
  { name: "saved searches", source: savedSearches, path: "data\", \"runtime\", \"saved-searches.json", cap: "maxSavedSearches = 250", diagnostic: "durableStorageConfigured: false" },
  { name: "package drafts", source: packages, path: "data\", \"runtime\", \"package-drafts.json", cap: "maxPackageDrafts = 200", diagnostic: "durableStorageConfigured: false" }
];

for (const store of stores) {
  if (!store.source.includes(store.path)) failures.push(`${store.name} store must persist local beta JSON under data/runtime`);
  if (!store.source.includes(store.cap)) failures.push(`${store.name} store must keep explicit record cap: ${store.cap}`);
  if (!store.source.includes(store.diagnostic)) failures.push(`${store.name} diagnostics must report durable storage honestly`);
  if (!store.source.includes("storageMode")) failures.push(`${store.name} records must expose storageMode`);
}

const persistedRecordSources = [
  { name: "feedback", source: feedback },
  { name: "saved searches", source: savedSearches, enumHelper: "normalizeCatalogSort" },
  { name: "package drafts", source: packages },
  { name: "pending review writes", source: pendingReviewWrites },
  { name: "audit log", source: auditLog }
];

for (const store of persistedRecordSources) {
  if (!store.source.includes("safeIsoTimestamp")) failures.push(`${store.name} must normalize persisted timestamps through safeIsoTimestamp`);
  if (!store.source.includes("newestByTimestamp")) failures.push(`${store.name} must sort persisted records through newestByTimestamp`);
  if (!store.source.includes("safeCompactText")) failures.push(`${store.name} must normalize persisted text through safeCompactText`);
  if (!store.source.includes("safeSlugText")) failures.push(`${store.name} must normalize persisted slugs through safeSlugText`);
  if (!store.source.includes(store.enumHelper || "safeEnumValue")) failures.push(`${store.name} must normalize persisted enums through ${store.enumHelper || "safeEnumValue"}`);
  if (/function\s+safeIso\s*\(/.test(store.source)) failures.push(`${store.name} must not hand-roll Date.parse timestamp guards`);
  if (/Date\.parse/.test(store.source)) failures.push(`${store.name} must not hand-roll timestamp ordering with Date.parse`);
  if (/String\([^)]*\|\|\s*""\)\.replace\(\/\\s\+\/g/.test(store.source)) failures.push(`${store.name} must not hand-roll compact text normalization`);
  if (/\.replace\(\/\[\^a-z0-9_-\]\+\/gi,\s*"-"\)\.replace\(\/\^-\|-\\\$\/g,\s*""\)/.test(store.source)) failures.push(`${store.name} must not hand-roll slug normalization`);
  if (/\.includes\(value as /.test(store.source) || /value\s*===\s*"[a-zA-Z0-9_-]+"\s*\?\s*"[a-zA-Z0-9_-]+"/.test(store.source)) failures.push(`${store.name} must not hand-roll enum fallback normalization`);
}

for (const store of [
  { name: "package drafts", source: packages },
  { name: "pending review writes", source: pendingReviewWrites }
]) {
  if (!store.source.includes("safeNonNegativeInt")) failures.push(`${store.name} must normalize persisted counters through safeNonNegativeInt`);
  if (/Math\.max\(0,\s*Number\.isFinite\(Number\(/.test(store.source)) failures.push(`${store.name} must not hand-roll nonnegative counter normalization`);
}

if (!pendingReviewWrites.includes("normalizeReviewRoleWithFallback")) {
  failures.push("pending review writes must normalize reviewer roles through normalizeReviewRoleWithFallback");
}
if (!pendingReviewWrites.includes("normalizeReviewChecklist")) {
  failures.push("pending review writes must normalize persisted checklist through normalizeReviewChecklist");
}
if (/function\s+safeChecklist\s*\(/.test(pendingReviewWrites) || /raw\.[a-zA-Z0-9_]+\s*===\s*true/.test(pendingReviewWrites)) {
  failures.push("pending review writes must not hand-roll review checklist boolean normalization");
}

if (!packages.includes("safeBoolean")) failures.push("package drafts must normalize persisted booleans through safeBoolean");
if (/function\s+safeBoolean\s*\(/.test(packages) || /value\s*===\s*true/.test(packages)) {
  failures.push("package drafts must not hand-roll boolean normalization");
}
if (!packages.includes("normalizeResourceSpaceRef")) {
  failures.push("package drafts must normalize ResourceSpace refs through normalizeResourceSpaceRef");
}
if (/function\s+safeResourceSpaceRef\s*\(/.test(packages) || /String\([^)]*\|\|\s*""\)\.trim\(\)\.slice\(0,\s*80\)/.test(packages)) {
  failures.push("package drafts must not hand-roll ResourceSpace ref normalization");
}
if (!requestValidation.includes("function normalizeResourceSpaceRef")) {
  failures.push("request validation must expose normalizeResourceSpaceRef");
}
if (!requestValidation.includes("containsPrivateSourceText(ref)")) {
  failures.push("request validation ResourceSpace refs must reject private-source tokens through containsPrivateSourceText");
}
if (/checksumLikePattern|\/\^\[a-f0-9\]\{32,\}/.test(requestValidation)) {
  failures.push("request validation must not hand-roll private token detection");
}
if (!reviewEvidence.includes("safeBoolean")) failures.push("review evidence must normalize checklist booleans through safeBoolean");
if (/raw\.[a-zA-Z0-9_]+\s*===\s*true/.test(reviewEvidence)) {
  failures.push("review evidence must not hand-roll checklist boolean normalization");
}

if (/betaFeedback(?:Statuses|Severities)\.includes/.test(feedback)) {
  failures.push("feedback store must not hand-roll status/severity normalization");
}
if (!feedback.includes("safeFileNameText")) {
  failures.push("feedback attachments must derive blob filenames through safeFileNameText");
}
if (/\.replace\(\/\[\^a-z0-9\._-\]\+\/gi,\s*"-"\)/.test(feedback)) {
  failures.push("feedback attachments must not hand-roll attachment filename normalization");
}

if (!catalogLanguage.includes("function normalizeCatalogSort")) failures.push("catalog language must expose normalizeCatalogSort");
for (const surface of [
  { name: "catalog search", source: catalog },
  { name: "asset search route", source: searchRoute },
  { name: "saved searches", source: savedSearches }
]) {
  if (!surface.source.includes("normalizeCatalogSort")) failures.push(`${surface.name} must normalize catalog sort through normalizeCatalogSort`);
  if (/catalogSortOptions\.includes/.test(surface.source)) failures.push(`${surface.name} must not hand-roll catalog sort normalization`);
}

if (!usageAnalytics.includes("safeCompactText")) failures.push("usage analytics must normalize usage labels through safeCompactText");
if (!usageAnalytics.includes("safeEnumValue")) failures.push("usage analytics must normalize event types through safeEnumValue");
if (!usageAnalytics.includes("safeNonNegativeInt")) failures.push("usage analytics must normalize metric counters through safeNonNegativeInt");
if (!usageAnalytics.includes("normalizeSafeRoutePath")) failures.push("usage analytics must normalize routes through normalizeSafeRoutePath");
if (/String\([^)]*\|\|\s*""\)\.replace\(\/\\s\+\/g/.test(usageAnalytics)) failures.push("usage analytics must not hand-roll compact text normalization");
if (/\.includes\(value as /.test(usageAnalytics)) failures.push("usage analytics must not hand-roll enum fallback normalization");
if (/Math\.max\(0,\s*Number/.test(usageAnalytics)) failures.push("usage analytics must not hand-roll nonnegative metric normalization");
if (/containsUnsafeRouteText|startsWith\("\/"\)/.test(usageAnalytics)) failures.push("usage analytics must not hand-roll route path normalization");

if (!feedback.includes("normalizeSafeRoutePath")) failures.push("feedback store must normalize routes through normalizeSafeRoutePath");
if (/containsUnsafeRouteText|startsWith\("\/"\)/.test(feedback)) failures.push("feedback store must not hand-roll route path normalization");

for (const route of [
  { name: "beta feedback update route", source: betaFeedbackUpdateRoute, required: ["normalizeFeedbackStatus", "normalizeFeedbackSeverity"] },
  { name: "beta feedback export route", source: betaFeedbackExportRoute, required: ["normalizeFeedbackStatusFilter", "normalizeFeedbackSeverityFilter"] }
]) {
  for (const helper of route.required) {
    if (!route.source.includes(helper)) failures.push(`${route.name} must normalize API enum filters through ${helper}`);
  }
  if (/\.includes\([^)]* as /.test(route.source)) failures.push(`${route.name} must not hand-roll enum filter normalization`);
}

const readinessRequirements = [
  "Feedback is using",
  "local/private beta rehearsal only, not wider rollout",
  "Configure Vercel KV for durable hosted feedback and Blob for attachments before larger testing.",
  "Saved searches use",
  "Connect durable profile storage before favorites, teams, or persistent saved views are promised.",
  "Package drafts use",
  "Connect durable backend storage before package sharing or invites."
];

for (const phrase of readinessRequirements) {
  if (!readiness.includes(phrase)) failures.push(`readiness storage copy missing: ${phrase}`);
}

if (failures.length) {
  console.error("Storage honesty guard failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Storage honesty guard passed.");
