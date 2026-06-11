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
  { name: "saved searches", source: savedSearches },
  { name: "package drafts", source: packages },
  { name: "pending review writes", source: pendingReviewWrites },
  { name: "audit log", source: auditLog }
];

for (const store of persistedRecordSources) {
  if (!store.source.includes("safeIsoTimestamp")) failures.push(`${store.name} must normalize persisted timestamps through safeIsoTimestamp`);
  if (!store.source.includes("safeCompactText")) failures.push(`${store.name} must normalize persisted text through safeCompactText`);
  if (!store.source.includes("safeSlugText")) failures.push(`${store.name} must normalize persisted slugs through safeSlugText`);
  if (!store.source.includes("safeEnumValue")) failures.push(`${store.name} must normalize persisted enums through safeEnumValue`);
  if (/function\s+safeIso\s*\(/.test(store.source)) failures.push(`${store.name} must not hand-roll Date.parse timestamp guards`);
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

if (!packages.includes("safeBoolean")) failures.push("package drafts must normalize persisted booleans through safeBoolean");
if (/function\s+safeBoolean\s*\(/.test(packages) || /value\s*===\s*true/.test(packages)) {
  failures.push("package drafts must not hand-roll boolean normalization");
}

if (!usageAnalytics.includes("safeCompactText")) failures.push("usage analytics must normalize usage labels through safeCompactText");
if (!usageAnalytics.includes("safeEnumValue")) failures.push("usage analytics must normalize event types through safeEnumValue");
if (!usageAnalytics.includes("safeNonNegativeInt")) failures.push("usage analytics must normalize metric counters through safeNonNegativeInt");
if (/String\([^)]*\|\|\s*""\)\.replace\(\/\\s\+\/g/.test(usageAnalytics)) failures.push("usage analytics must not hand-roll compact text normalization");
if (/\.includes\(value as /.test(usageAnalytics)) failures.push("usage analytics must not hand-roll enum fallback normalization");
if (/Math\.max\(0,\s*Number/.test(usageAnalytics)) failures.push("usage analytics must not hand-roll nonnegative metric normalization");

for (const route of [
  { name: "beta feedback update route", source: betaFeedbackUpdateRoute },
  { name: "beta feedback export route", source: betaFeedbackExportRoute }
]) {
  if (!route.source.includes("safeEnumValue")) failures.push(`${route.name} must normalize API enum filters through safeEnumValue`);
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
