#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const apiRoot = path.join(root, "frontend/app/api");
const forbiddenPayloadKeys = [
  "signedUrl",
  "originalUrl",
  "sourcePath",
  "masterDrivePath",
  "sourceAlbumPath",
  "sourceAlbumMemberships",
  "checksumSha256",
  "originalFilename"
];
const allowedFilesByKey = new Map([
  ["sourcePath", new Set(["frontend/app/api/download/[id]/route.ts"])],
  ["masterDrivePath", new Set(["frontend/app/api/download/[id]/route.ts"])],
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
if (!downloadSource.includes('findFilestoreDerivative(id, "download")')) {
  failures.push(`${downloadRoute} must resolve approved copies through findFilestoreDerivative`);
}
if (!downloadSource.includes("Private originals and S3 paths are not exposed.")) {
  failures.push(`${downloadRoute} must keep explicit no-originals response copy`);
}
if (!downloadSource.includes("safeSlugText(normalizeDisplayTextField")) {
  failures.push(`${downloadRoute} must derive download filenames through normalizeDisplayTextField and safeSlugText`);
}
if (/\.replace\(\/\[\^a-z0-9_-\]\+\/gi/.test(downloadSource)) {
  failures.push(`${downloadRoute} must not hand-roll approved-copy filename slugging`);
}

const collectionsRoute = "frontend/app/api/collections/route.ts";
const collectionsSource = fs.readFileSync(path.join(root, collectionsRoute), "utf8");
if (!collectionsSource.includes("normalizeCollectionDraftAudience")) {
  failures.push(`${collectionsRoute} must derive draft audience through normalizeCollectionDraftAudience`);
}
if (!collectionsSource.includes("normalizeCollectionShareSlug")) {
  failures.push(`${collectionsRoute} must derive share paths through normalizeCollectionShareSlug`);
}
if (/function\s+slugify\s*\(/.test(collectionsSource) || /allowedAudiences\s*=\s*new Set/.test(collectionsSource)) {
  failures.push(`${collectionsRoute} must not hand-roll collection audience or share slug normalization`);
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
if (!uploadRouteSource.includes("normalizePublicTextField")) {
  failures.push(`${uploadRoute} must normalize public intake freeform text through normalizePublicTextField`);
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
