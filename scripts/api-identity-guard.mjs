#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const apiRoot = path.join(root, "frontend/app/api");
const handlerPattern = /export\s+async\s+function\s+(GET|POST|PATCH|PUT|DELETE)\b/g;
const identityCalls = [
  "requestIdentity(",
  "createDamRouteSession(",
  "runReviewActionWorkflow("
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return entry.name === "route.ts" ? [fullPath] : [];
  });
}

function functionBodyAt(source, startIndex) {
  const paramsOpenIndex = source.indexOf("(", startIndex);
  if (paramsOpenIndex === -1) return "";
  let parenDepth = 0;
  let paramsCloseIndex = -1;
  for (let index = paramsOpenIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === "(") parenDepth += 1;
    if (char === ")") parenDepth -= 1;
    if (parenDepth === 0) {
      paramsCloseIndex = index;
      break;
    }
  }
  if (paramsCloseIndex === -1) return "";
  const openIndex = source.indexOf("{", paramsCloseIndex);
  if (openIndex === -1) return "";
  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return source.slice(openIndex, index + 1);
  }
  return "";
}

const failures = [];
const routeFiles = walk(apiRoot);

for (const fullPath of routeFiles) {
  const relativePath = path.relative(root, fullPath);
  const source = fs.readFileSync(fullPath, "utf8");
  for (const match of source.matchAll(handlerPattern)) {
    const method = match[1];
    const body = functionBodyAt(source, match.index || 0);
    const hasIdentitySeam = identityCalls.some((call) => body.includes(call));
    if (!hasIdentitySeam) {
      failures.push(`${relativePath} ${method} must resolve role through requestIdentity/createDamRouteSession or delegated workflow`);
    }
  }
  if (/\bnormalizeRole\b/.test(source)) {
    failures.push(`${relativePath} must not normalize roles directly; use requestIdentity/createDamRouteSession`);
  }
}

if (failures.length) {
  console.error("API identity guard failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`API identity guard passed for ${routeFiles.length} routes.`);
