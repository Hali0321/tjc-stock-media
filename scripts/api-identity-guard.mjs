#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const apiRoot = path.join(root, "frontend/app/api");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return entry.name === "route.ts" ? [fullPath] : [];
  });
}

const failures = [];
const routeFiles = walk(apiRoot);

for (const fullPath of routeFiles) {
  const relativePath = path.relative(root, fullPath);
  const source = fs.readFileSync(fullPath, "utf8");
  const hasIdentitySeam = source.includes("requestIdentity(") || source.includes("createDamRouteSession(");
  if (!hasIdentitySeam) {
    failures.push(`${relativePath} must resolve role through requestIdentity or createDamRouteSession`);
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
