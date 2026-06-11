#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const apiRoot = path.join(root, "frontend/app/api");
const sourceRedactionSource = fs.readFileSync(path.join(root, "frontend/lib/source-redaction.ts"), "utf8");

function stringArrayConst(source, constName) {
  const match = source.match(new RegExp(`const\\s+${constName}\\s*=\\s*\\[([\\s\\S]*?)\\]`));
  return match ? [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]) : [];
}

const sourceCustodyAssetKeys = stringArrayConst(sourceRedactionSource, "sourceCustodyAssetKeys");
const forbiddenPayloadKeys = [
  "signedUrl",
  "originalUrl",
  ...sourceCustodyAssetKeys
];
const allowedFilesByKey = new Map([
  ["resourceSpaceUrl", new Set(["frontend/app/api/assets/[id]/route.ts"])],
  ["resourceSpaceUrls", new Set(["frontend/app/api/review/route.ts"])]
]);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return entry.name === "route.ts" ? [fullPath] : [];
  });
}

const failures = [];
if (sourceCustodyAssetKeys.length < 8) {
  failures.push("API payload guard could not read canonical sourceCustodyAssetKeys");
}
for (const fullPath of walk(apiRoot)) {
  const relativePath = path.relative(root, fullPath);
  const source = fs.readFileSync(fullPath, "utf8");
  for (const key of forbiddenPayloadKeys) {
    if (!new RegExp(`\\b${key}\\b`).test(source)) continue;
    const allowed = allowedFilesByKey.get(key);
    if (!allowed?.has(relativePath)) failures.push(`${relativePath} references private payload key ${key}`);
  }
  if (/\bdownloadUrl\s*:/.test(source) && !source.includes("`/api/download/${encodeURIComponent(asset.id)}")) {
    failures.push(`${relativePath} exposes a downloadUrl that is not the backend-gated download route`);
  }
  if (/\b(signedUrl|originalUrl|url)\s*:/.test(source) && relativePath !== "frontend/app/api/download/[id]/route.ts") {
    failures.push(`${relativePath} exposes direct URL-like response fields outside the download gate`);
  }
}

const downloadRoute = "frontend/app/api/download/[id]/route.ts";
const downloadSource = fs.readFileSync(path.join(root, downloadRoute), "utf8");
const thumbnailRoute = "frontend/app/api/assets/thumbnail/[id]/route.ts";
const thumbnailSource = fs.readFileSync(path.join(root, thumbnailRoute), "utf8");
const mediaDeliverySource = fs.readFileSync(path.join(root, "frontend/lib/media-delivery.ts"), "utf8");
if (!downloadSource.includes('findFilestoreDerivative(id, "download")')) {
  failures.push(`${downloadRoute} must resolve approved copies through findFilestoreDerivative`);
}
if (!downloadSource.includes("Private originals and S3 paths are not exposed.")) {
  failures.push(`${downloadRoute} must keep explicit no-originals response copy`);
}
if (!downloadSource.includes("approvedCopyFileName(asset.title, id)") || !mediaDeliverySource.includes("safeSlugText(normalizeDisplayTextField")) {
  failures.push(`${downloadRoute} must derive download filenames through media-delivery approvedCopyFileName`);
}
if (/\.replace\(\/\[\^a-z0-9_-\]\+\/gi/.test(downloadSource)) {
  failures.push(`${downloadRoute} must not hand-roll approved-copy filename slugging`);
}
for (const route of [
  { name: downloadRoute, source: downloadSource },
  { name: thumbnailRoute, source: thumbnailSource }
]) {
  if (!route.source.includes("readDeliveredImage(")) {
    failures.push(`${route.name} must read derivative bytes through media-delivery readDeliveredImage`);
  }
  if (/from "node:fs"/.test(route.source) || /readFileSync/.test(route.source)) {
    failures.push(`${route.name} must not hand-roll derivative file reads`);
  }
}
if (!mediaDeliverySource.includes("function supportedImageContentType") || !mediaDeliverySource.includes("function readDeliveredImage") || !mediaDeliverySource.includes("function approvedCopyFileName")) {
  failures.push("media-delivery must own supported image detection, derivative reads, and approved-copy filenames");
}

const collectionsRoute = "frontend/app/api/collections/route.ts";
const collectionsSource = fs.readFileSync(path.join(root, collectionsRoute), "utf8");
const collectionDraftSource = fs.readFileSync(path.join(root, "frontend/lib/collection-drafts.ts"), "utf8");
const batchRoute = "frontend/app/api/batch/route.ts";
const batchSource = fs.readFileSync(path.join(root, batchRoute), "utf8");
const assetSelectionSource = fs.readFileSync(path.join(root, "frontend/lib/asset-selection.ts"), "utf8");
if (!collectionsSource.includes("readCollectionDraftInput(request)") || !collectionsSource.includes("collectionDraftPublicBlockedAssets(input.audience, selection.assets)") || !collectionsSource.includes("buildCollectionDraftPreviewPayload(input, selection.assets, portalBlockedAssets)")) {
  failures.push(`${collectionsRoute} must delegate collection draft parsing, public gate checks, and preview payload assembly to collection-drafts`);
}
if (!collectionDraftSource.includes("normalizeCollectionDraftAudience") || !collectionDraftSource.includes("normalizeCollectionShareSlug") || !collectionDraftSource.includes("normalizeDateField") || !collectionDraftSource.includes("selectedAssetIds")) {
  failures.push("collection-drafts must own draft audience, share slug, expiry, and selected asset id normalization");
}
if (/readJsonObject|normalizeCollectionDraftAudience|normalizeCollectionShareSlug|normalizeDateField|normalizeDisplayTextField|selectedAssetIds|assetIsPortalReady|assetNeedsStaleApprovalReview/.test(collectionsSource)) {
  failures.push(`${collectionsRoute} must not hand-roll collection draft parsing, field normalization, selected ids, or public gate checks`);
}
if (/function\s+slugify\s*\(/.test(collectionsSource) || /function\s+slugify\s*\(/.test(collectionDraftSource) || /allowedAudiences\s*=\s*new Set/.test(collectionsSource) || /allowedAudiences\s*=\s*new Set/.test(collectionDraftSource)) {
  failures.push("collection draft code must not hand-roll collection audience or share slug normalization");
}
if (!assetSelectionSource.includes("normalizeAssetIds") || !assetSelectionSource.includes("getAssetRecordById") || !assetSelectionSource.includes("canSeeAsset")) {
  failures.push("asset-selection must own selected asset id normalization, record lookup, and optional visibility filtering");
}
for (const route of [
  { name: collectionsRoute, source: collectionsSource },
  { name: batchRoute, source: batchSource }
]) {
  if (!route.source.includes("resolveAssetSelection(")) {
    failures.push(`${route.name} must resolve selected assets through asset-selection`);
  }
  if (route.source.includes("getAssetRecordById") || route.source.includes("normalizeAssetIds")) {
    failures.push(`${route.name} must not hand-roll selected asset lookup or id normalization`);
  }
}

const searchRoute = "frontend/app/api/assets/search/route.ts";
const searchRouteSource = fs.readFileSync(path.join(root, searchRoute), "utf8");
if (!searchRouteSource.includes('const query = normalizePublicTextField(params.get("q"), "", 200)')) {
  failures.push(`${searchRoute} must normalize public search query through normalizePublicTextField`);
}
if (!searchRouteSource.includes('normalizePublicTextField(value, "", 80)')) {
  failures.push(`${searchRoute} must normalize public search filters through normalizePublicTextField`);
}

const requestValidationSource = fs.readFileSync(path.join(root, "frontend/lib/request-validation.ts"), "utf8");
if (!requestValidationSource.includes("function readJsonObject")) {
  failures.push("request validation must expose readJsonObject for API JSON body fallback");
}
if (!requestValidationSource.includes("function readFormData")) {
  failures.push("request validation must expose readFormData for API multipart body fallback");
}
if (!requestValidationSource.includes("function normalizeBrandKitId")) {
  failures.push("request validation must expose normalizeBrandKitId for brand kit route ids");
}
if (!requestValidationSource.includes("function normalizeFeedbackId")) {
  failures.push("request validation must expose normalizeFeedbackId for beta feedback route ids");
}
if (!requestValidationSource.includes("function normalizePublicTextField")) {
  failures.push("request validation must expose normalizePublicTextField for public reviewer-visible fields");
}
for (const fullPath of walk(apiRoot)) {
  const relativePath = path.relative(root, fullPath);
  const source = fs.readFileSync(fullPath, "utf8");
  if (/request\.json\(\)\.catch/.test(source)) {
    failures.push(`${relativePath} must parse fallback JSON through readJsonObject`);
  }
  if (/request\.formData\(\)/.test(source)) {
    failures.push(`${relativePath} must parse fallback multipart forms through readFormData`);
  }
}

const brandKitRoute = "frontend/app/api/brand-kits/[id]/route.ts";
const brandKitRouteSource = fs.readFileSync(path.join(root, brandKitRoute), "utf8");
if (!brandKitRouteSource.includes("normalizeBrandKitId((await params).id)")) {
  failures.push(`${brandKitRoute} must normalize path params through normalizeBrandKitId`);
}
if (!brandKitRouteSource.includes("`/api/brand-kits/${encodeURIComponent(kitId)}`")) {
  failures.push(`${brandKitRoute} must record usage route with encoded brand kit id`);
}

const betaFeedbackItemRoute = "frontend/app/api/beta-feedback/[id]/route.ts";
const betaFeedbackItemRouteSource = fs.readFileSync(path.join(root, betaFeedbackItemRoute), "utf8");
if (!betaFeedbackItemRouteSource.includes("normalizeFeedbackId((await params).id)")) {
  failures.push(`${betaFeedbackItemRoute} must normalize path params through normalizeFeedbackId`);
}
const betaFeedbackRoute = "frontend/app/api/beta-feedback/route.ts";
const betaFeedbackRouteSource = fs.readFileSync(path.join(root, betaFeedbackRoute), "utf8");
const betaFeedbackSource = fs.readFileSync(path.join(root, "frontend/lib/beta-feedback.ts"), "utf8");
if (!betaFeedbackRouteSource.includes("readBetaFeedbackRequestInput(request)") || !betaFeedbackRouteSource.includes("normalizeBetaFeedbackSubmission(")) {
  failures.push(`${betaFeedbackRoute} must delegate submission parsing and field normalization to beta-feedback module`);
}
if (!betaFeedbackSource.includes("function normalizeBetaFeedbackSubmission") || !betaFeedbackSource.includes("normalizeFeedbackUrl(fields.screenshotLink)") || !betaFeedbackSource.includes("readBetaFeedbackRequestInput")) {
  failures.push("beta-feedback module must own feedback submission normalization, screenshot URL sanitization, and multipart parsing");
}
if (/normalizeFeedback(Route|Text|Url)\(/.test(betaFeedbackRouteSource) || /readFormData|readJsonObject/.test(betaFeedbackRouteSource)) {
  failures.push(`${betaFeedbackRoute} must not hand-roll feedback submission parsing or field normalization`);
}

const savedSearchRoute = "frontend/app/api/saved-searches/route.ts";
const savedSearchRouteSource = fs.readFileSync(path.join(root, savedSearchRoute), "utf8");
const savedSearchSource = fs.readFileSync(path.join(root, "frontend/lib/saved-search-store.ts"), "utf8");
if (!savedSearchRouteSource.includes("readSavedSearchDraftInput(request)") || !savedSearchRouteSource.includes("hasSavedSearchCriteria(draft)") || !savedSearchRouteSource.includes("saveSavedSearchDraft(draft, identity)")) {
  failures.push(`${savedSearchRoute} must delegate draft parsing, criteria checks, and record creation to saved-search-store`);
}
if (!savedSearchSource.includes("function readSavedSearchDraftInput") || !savedSearchSource.includes("function hasSavedSearchCriteria") || !savedSearchSource.includes("function saveSavedSearchDraft")) {
  failures.push("saved-search-store must own saved search draft parsing, criteria checks, and record creation");
}
if (/readJsonObject|sanitizeSavedSearch|safeIsoTimestampIdPart|saveSavedSearch\(/.test(savedSearchRouteSource)) {
  failures.push(`${savedSearchRoute} must not hand-roll saved search body parsing, sanitization, timestamp ids, or persistence record creation`);
}

const packageRoute = "frontend/app/api/packages/route.ts";
const packageRouteSource = fs.readFileSync(path.join(root, packageRoute), "utf8");
const packageSource = fs.readFileSync(path.join(root, "frontend/lib/package-store.ts"), "utf8");
if (!packageRouteSource.includes("readPackageDraftInput(request)") || !packageRouteSource.includes("savePackageDraftSubmission(draft, identity, governance)")) {
  failures.push(`${packageRoute} must delegate draft parsing and stored record creation to package-store`);
}
if (!packageSource.includes("function readPackageDraftInput") || !packageSource.includes("function savePackageDraftSubmission") || !packageSource.includes("function storedGovernanceSnapshot")) {
  failures.push("package-store must own package draft parsing, stored governance snapshots, and record creation");
}
if (/readJsonObject|sanitizePackageDraft|safeIsoTimestampIdPart|savePackageDraft\(/.test(packageRouteSource)) {
  failures.push(`${packageRoute} must not hand-roll package draft body parsing, sanitization, timestamp ids, or persistence record creation`);
}

for (const route of [
  "frontend/app/api/assets/[id]/route.ts",
  "frontend/app/api/assets/thumbnail/[id]/route.ts",
  "frontend/app/api/download/[id]/route.ts"
]) {
  const source = fs.readFileSync(path.join(root, route), "utf8");
  if (!source.includes("normalizeAssetId((await params).id)")) {
    failures.push(`${route} must normalize path params through normalizeAssetId`);
  }
}

const uploadRoute = "frontend/app/api/upload/route.ts";
const uploadRouteSource = fs.readFileSync(path.join(root, uploadRoute), "utf8");
const uploadIntakeSource = fs.readFileSync(path.join(root, "frontend/lib/upload-intake.ts"), "utf8");
if (!uploadRouteSource.includes("normalizeUploadIntake(form)")) {
  failures.push(`${uploadRoute} must delegate intake field normalization to upload-intake`);
}
if (!uploadIntakeSource.includes("normalizePublicTextField") || !uploadIntakeSource.includes("nonCanonicalUploadTags") || !uploadIntakeSource.includes("LARGE_MEDIA_BYTES")) {
  failures.push("upload-intake must normalize public intake text, canonical tags, and large-media threshold in one module");
}
if (/normalize(DateField|DisplayTextField|PublicTextField|UrlField)\(/.test(uploadRouteSource)) {
  failures.push(`${uploadRoute} must not hand-roll upload intake field normalization`);
}
if (/normalizeTextField\(form\.get/.test(uploadRouteSource)) {
  failures.push(`${uploadRoute} must not normalize public intake form fields through raw normalizeTextField`);
}

if (failures.length) {
  console.error("API payload guard failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("API payload guard passed.");
