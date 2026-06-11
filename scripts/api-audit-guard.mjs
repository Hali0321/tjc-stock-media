#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const apiRoot = path.join(root, "frontend/app/api");
const mutatingMethodPattern = /export\s+async\s+function\s+(POST|PATCH|PUT|DELETE)\b/g;
const auditedWorkflowCalls = [
  "appendAuditEvent(",
  "runReviewActionWorkflow("
];

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
  const methods = [...source.matchAll(mutatingMethodPattern)].map((match) => match[1]);
  if (!methods.length) continue;
  const hasAudit = auditedWorkflowCalls.some((call) => source.includes(call));
  if (!hasAudit) {
    failures.push(`${relativePath} exposes ${methods.join(", ")} without appendAuditEvent or audited workflow delegation`);
  }
}

if (failures.length) {
  console.error("API audit guard failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("API audit guard passed.");
