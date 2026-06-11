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
  env: "frontend/lib/env.ts",
  nextConfig: "frontend/next.config.mjs",
  reviewEvidence: "frontend/lib/review-evidence.ts",
  requestValidation: "frontend/lib/request-validation.ts",
  catalog: "frontend/lib/catalog.ts",
  catalogLanguage: "frontend/lib/catalog-language.ts",
  searchRoute: "frontend/app/api/assets/search/route.ts",
  betaFeedbackUpdateRoute: "frontend/app/api/beta-feedback/[id]/route.ts",
  betaFeedbackExportRoute: "frontend/app/api/beta-feedback/export/route.ts",
  savedSearchRoute: "frontend/app/api/saved-searches/route.ts",
  packageRoute: "frontend/app/api/packages/route.ts",
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
const env = read(files.env);
const nextConfig = read(files.nextConfig);
const reviewEvidence = read(files.reviewEvidence);
const requestValidation = read(files.requestValidation);
const catalog = read(files.catalog);
const catalogLanguage = read(files.catalogLanguage);
const searchRoute = read(files.searchRoute);
const betaFeedbackUpdateRoute = read(files.betaFeedbackUpdateRoute);
const betaFeedbackExportRoute = read(files.betaFeedbackExportRoute);
const savedSearchRoute = read(files.savedSearchRoute);
const packageRoute = read(files.packageRoute);
const readiness = read(files.readiness);
const publicTextSafety = read("frontend/lib/public-text-safety.ts");
const sourceRedaction = read("frontend/lib/source-redaction.ts");
const viewerVerdict = read("frontend/lib/viewer-verdict.ts");
const betaReadinessFacts = read("frontend/lib/beta-readiness-facts.ts");
const makefile = read("Makefile");
const frontendCheck = read("scripts/frontend-check.sh");
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
  if (!store.source.includes("safeCompactText") && !store.source.includes("normalizePersisted")) failures.push(`${store.name} must normalize persisted text through shared safety helpers`);
  if (!store.source.includes("safeSlugText") && !store.source.includes("normalizePersistedSlugText") && !store.source.includes("normalizeFeedbackId")) failures.push(`${store.name} must normalize persisted slugs through normalizePersistedSlugText, safeSlugText, or normalizeFeedbackId`);
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
if (!requestValidation.includes("function normalizePersistedDisplayText")) {
  failures.push("request validation must expose normalizePersistedDisplayText for persisted display labels");
}
if (!requestValidation.includes("function normalizePersistedSlugText")) {
  failures.push("request validation must expose normalizePersistedSlugText for persisted identifiers");
}
if (/checksumLikePattern|\/\^\[a-f0-9\]\{32,\}/.test(requestValidation)) {
  failures.push("request validation must not hand-roll private token detection");
}
if (!requestValidation.includes("function readJsonObject")) {
  failures.push("request validation must expose readJsonObject for API JSON body fallback");
}
if (!read("frontend/lib/persisted-record-safety.ts").includes("function safeIsoTimestampIdPart")) {
  failures.push("persisted record safety must expose safeIsoTimestampIdPart for record id timestamps");
}
for (const store of [
  { name: "feedback", source: feedback },
  { name: "saved searches", source: savedSearches },
  { name: "package drafts", source: packages },
  { name: "pending review writes", source: pendingReviewWrites },
  { name: "audit log", source: auditLog }
]) {
  if (!store.source.includes("normalizePersistedSlugText") && !store.source.includes("normalizeFeedbackId")) {
    failures.push(`${store.name} must normalize persisted identifiers through normalizePersistedSlugText or normalizeFeedbackId`);
  }
}
for (const store of [
  { name: "feedback", source: feedback },
  { name: "saved searches", source: savedSearches },
  { name: "package drafts", source: packages },
  { name: "pending review writes", source: pendingReviewWrites },
  { name: "audit log", source: auditLog },
  { name: "usage analytics", source: usageAnalytics }
]) {
  if (!store.source.includes("normalizePersistedDisplayText")) {
    failures.push(`${store.name} must normalize persisted display labels through normalizePersistedDisplayText`);
  }
  if (/function\s+safeDisplayText\s*\(/.test(store.source)) {
    failures.push(`${store.name} must not hand-roll persisted display label normalization`);
  }
}
for (const writer of [
  { name: "saved search route", source: savedSearchRoute },
  { name: "package route", source: packageRoute },
  { name: "pending review writes", source: pendingReviewWrites },
  { name: "audit log", source: auditLog }
]) {
  if (!writer.source.includes("safeIsoTimestampIdPart")) failures.push(`${writer.name} must derive record id timestamps through safeIsoTimestampIdPart`);
  if (/\.replace\(\/\[:\\\.\]\/g,\s*"-"\)/.test(writer.source)) failures.push(`${writer.name} must not hand-roll timestamp id slugging`);
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
for (const surface of [
  { name: "catalog search", source: catalog },
  { name: "asset search route", source: searchRoute }
]) {
  if (!surface.source.includes("safeBoundedInt")) failures.push(`${surface.name} must normalize pagination bounds through safeBoundedInt`);
  if (/Number\.isFinite\([^)]*(limit|offset|parsed)/.test(surface.source)) failures.push(`${surface.name} must not hand-roll pagination number bounds`);
}

if (!usageAnalytics.includes("normalizePersistedDisplayText")) failures.push("usage analytics must normalize usage labels through normalizePersistedDisplayText");
if (!usageAnalytics.includes("normalizeAssetId")) failures.push("usage analytics must normalize asset ids through normalizeAssetId");
if (!usageAnalytics.includes("normalizeResourceSpaceRef")) failures.push("usage analytics must normalize ResourceSpace ids through normalizeResourceSpaceRef");
if (!usageAnalytics.includes("safeEnumValue")) failures.push("usage analytics must normalize event types through safeEnumValue");
if (!usageAnalytics.includes("safeNonNegativeInt")) failures.push("usage analytics must normalize metric counters through safeNonNegativeInt");
if (!usageAnalytics.includes("normalizeSafeRoutePath")) failures.push("usage analytics must normalize routes through normalizeSafeRoutePath");
if (/String\([^)]*\|\|\s*""\)\.replace\(\/\\s\+\/g/.test(usageAnalytics)) failures.push("usage analytics must not hand-roll compact text normalization");
if (/\.includes\(value as /.test(usageAnalytics)) failures.push("usage analytics must not hand-roll enum fallback normalization");
if (/Math\.max\(0,\s*Number/.test(usageAnalytics)) failures.push("usage analytics must not hand-roll nonnegative metric normalization");
if (/containsUnsafeRouteText|startsWith\("\/"\)/.test(usageAnalytics)) failures.push("usage analytics must not hand-roll route path normalization");
for (const module of [
  { name: "audit log", source: auditLog },
  { name: "usage analytics", source: usageAnalytics }
]) {
  if (!module.source.includes("safeFiniteNumber")) failures.push(`${module.name} must normalize finite metadata numbers through safeFiniteNumber`);
  if (/Number\.isFinite\(item\)/.test(module.source)) failures.push(`${module.name} must not hand-roll finite metadata number normalization`);
}

if (!feedback.includes("normalizeSafeRoutePath")) failures.push("feedback store must normalize routes through normalizeSafeRoutePath");
if (/containsUnsafeRouteText|startsWith\("\/"\)/.test(feedback)) failures.push("feedback store must not hand-roll route path normalization");
if (/npm --prefix frontend run (build|dev|typecheck)/.test(makefile) || /npm --prefix frontend run (build|typecheck)/.test(frontendCheck)) {
  failures.push("frontend build/dev checks must run from frontend cwd so Next outputFileTracingRoot and production artifacts are correct");
}
if (!env.includes("function findRepoRoot") || !env.includes("looksLikeRepoRoot") || /path\.resolve\(process\.cwd\(\),\s*"\.\."\)/.test(env)) {
  failures.push("env repoRoot must detect repo root from current or frontend cwd without assuming cwd/..");
}
if (!nextConfig.includes("fileURLToPath(import.meta.url)") || !nextConfig.includes("outputFileTracingRoot: repoRoot") || /outputFileTracingRoot:\s*path\.resolve\(process\.cwd\(\)/.test(nextConfig)) {
  failures.push("Next config must derive outputFileTracingRoot from its file location, not process.cwd()");
}

if (!betaReadinessFacts.includes('scripts", "git-hygiene-guard.mjs"') || !betaReadinessFacts.includes('source: "git-hygiene"')) {
  failures.push("beta readiness brand PNG allowlist fact must use git hygiene guard as source of truth");
}
if (/function allowlistFact\(\)[\s\S]*launch-readiness\.sh/.test(betaReadinessFacts)) {
  failures.push("beta readiness brand PNG allowlist fact must not infer media allowlist from launch-readiness.sh copy");
}

if (!publicTextSafety.includes("function containsOperationalText") || !publicTextSafety.includes("function containsScaffoldText") || !publicTextSafety.includes("function safePublicList")) {
  failures.push("public text safety must expose shared operational/scaffold redaction helpers");
}
if (!sourceRedaction.includes("@/lib/public-text-safety") || /const operationalTextPattern|function hasOperationalText|function hasScaffoldText|function safePublicList/.test(sourceRedaction)) {
  failures.push("source redaction must use shared public text safety helpers");
}
if (!viewerVerdict.includes("containsOperationalText") || /ResourceSpace\|Shared Drive|source\[- \]path|master drive\|master/.test(viewerVerdict)) {
  failures.push("request mailto safety must reuse shared operational text detection");
}

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
