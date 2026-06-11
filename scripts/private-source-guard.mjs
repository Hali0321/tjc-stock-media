#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const allowedFiles = new Set(["frontend/lib/private-source-text.ts"]);
const scanRoots = ["frontend/lib", "frontend/app"];
const forbiddenPatterns = [
  { label: 'ad hoc ".." traversal check', pattern: /\.includes\(["']\.\.["']\)/ },
  { label: "ad hoc slash/backslash path check", pattern: /\/\[\\{1,2}\/\]\// },
  { label: "ad hoc backslash route check", pattern: /\/\[\\{2}\]\// },
  { label: "ad hoc http URL allowlist", pattern: /\^https\?:\\\/\\\// }
];

function walk(relativeDir) {
  return fs.readdirSync(path.join(root, relativeDir), { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      if ([".next", "node_modules"].includes(entry.name)) return [];
      return walk(relativePath);
    }
    return /\.(ts|tsx)$/.test(entry.name) ? [relativePath] : [];
  });
}

const failures = [];

for (const file of scanRoots.flatMap(walk)) {
  if (allowedFiles.has(file)) continue;
  const source = fs.readFileSync(path.join(root, file), "utf8");
  for (const { label, pattern } of forbiddenPatterns) {
    if (pattern.test(source)) failures.push(`${file} uses ${label}; use frontend/lib/private-source-text.ts`);
  }
}

const reviewActionWorkflow = fs.readFileSync(path.join(root, "frontend/lib/review-action-workflow.ts"), "utf8");
if (!reviewActionWorkflow.includes("normalizeDisplayTextField")) {
  failures.push("frontend/lib/review-action-workflow.ts must normalize reviewer-visible text through normalizeDisplayTextField");
}
if (/function\s+safeDisplayText\s*\(/.test(reviewActionWorkflow)) {
  failures.push("frontend/lib/review-action-workflow.ts must not hand-roll reviewer text sanitization");
}

if (failures.length) {
  console.error("Private source guard failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Private source guard passed.");
