#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const failures = [];

const taxonomy = read("frontend/lib/taxonomy.ts").toLowerCase();
for (const term of ["religious education", "sabbath service", "evangelical service", "testimony", "hymns of praise", "\"re\""]) {
  if (!taxonomy.includes(term)) failures.push(`taxonomy alias missing ${term}`);
}

const catalogLanguage = read("frontend/lib/catalog-language.ts");
if (!catalogLanguage.includes("assetSearchTerms(asset)")) {
  failures.push("assetHaystack must use tagging-model search terms");
}

const taggingModel = read("frontend/lib/tagging-model.ts");
for (const term of ["resourceSpaceId", "originalFilename", "sourceAlbum", "aiVisibleTagSuggestions", "aiTjcTermSuggestions"]) {
  if (!taggingModel.includes(term)) failures.push(`search term missing ${term}`);
}

const fallback = read("frontend/lib/media-source/demo-fallback.ts");
const approvedPublic = (fallback.match(/status: "Approved Public"/g) || []).length;
const needsReview = (fallback.match(/status: "Needs Review"/g) || []).length;
const archive = (fallback.match(/status: "Searchable Archive"/g) || []).length;
if (approvedPublic !== 2 || needsReview !== 1 || archive !== 1) {
  failures.push(`fallback distribution expected 2/1/1 got ${approvedPublic}/${needsReview}/${archive}`);
}
if (!fallback.includes("lm.photos@tjc.org") || !fallback.includes("stock-safe") || !fallback.includes("context-safe") || !fallback.includes("archive-only")) {
  failures.push("fallback fixtures missing trusted source or reuse tier tags");
}

if (failures.length) {
  console.error(`FAIL: tag search static smoke\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log("Tag search static smoke complete.");
