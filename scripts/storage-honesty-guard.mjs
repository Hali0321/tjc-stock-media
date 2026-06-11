#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = {
  feedback: "frontend/lib/beta-feedback.ts",
  savedSearches: "frontend/lib/saved-search-store.ts",
  packages: "frontend/lib/package-store.ts",
  readiness: "frontend/lib/dam-readiness-integrations.ts"
};

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

const feedback = read(files.feedback);
const savedSearches = read(files.savedSearches);
const packages = read(files.packages);
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
