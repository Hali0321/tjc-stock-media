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

const requestValidationSource = fs.readFileSync(path.join(root, "frontend/lib/request-validation.ts"), "utf8");
if (!requestValidationSource.includes("function readJsonObject")) {
  failures.push("request validation must expose readJsonObject for API JSON body fallback");
}
for (const fullPath of walk(apiRoot)) {
  const relativePath = path.relative(root, fullPath);
  const source = fs.readFileSync(fullPath, "utf8");
  if (/request\.json\(\)\.catch/.test(source)) {
    failures.push(`${relativePath} must parse fallback JSON through readJsonObject`);
  }
}

if (failures.length) {
  console.error("API payload guard failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("API payload guard passed.");
