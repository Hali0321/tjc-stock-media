#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const legacyModules = [
  "AdminPage",
  "ReviewPage",
  "LibraryPage",
  "AssetDetailPage",
  "CollectionsPage",
  "DamExperience"
];

const enterpriseRoutes = new Map([
  ["frontend/app/page.tsx", "EnterpriseLibraryPage"],
  ["frontend/app/collections/page.tsx", "EnterpriseCollectionsPage"],
  ["frontend/app/packages/page.tsx", "EnterprisePackageBuilderPage"],
  ["frontend/app/brand-hub/page.tsx", "EnterpriseBrandHubPage"],
  ["frontend/app/insights/page.tsx", "EnterpriseInsightsPage"],
  ["frontend/app/admin/page.tsx", "EnterpriseAdminPage"],
  ["frontend/app/review/page.tsx", "EnterpriseReviewPage"],
  ["frontend/app/assets/[id]/page.tsx", "EnterpriseAssetDetailPage"]
]);

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function walk(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if ([".next", "node_modules"].includes(entry.name)) return [];
      return walk(relativePath);
    }
    return /\.(tsx|ts|jsx|js|mjs)$/.test(entry.name) ? [relativePath] : [];
  });
}

const failures = [];

for (const [routePath, exportName] of enterpriseRoutes) {
  if (!fs.existsSync(path.join(root, routePath))) {
    failures.push(`missing live route: ${routePath}`);
    continue;
  }
  const content = read(routePath);
  const expectedImport = `import { ${exportName} } from "@/components/dam/EnterpriseDamPages";`;
  if (!content.includes(expectedImport)) {
    failures.push(`${routePath} must import ${exportName} from EnterpriseDamPages`);
  }
  if (!content.includes(`<${exportName}`)) {
    failures.push(`${routePath} must render ${exportName}`);
  }
}

const assetDetailPage = read("frontend/app/assets/[id]/page.tsx");
if (!assetDetailPage.includes("normalizeAssetId((await params).id)")) {
  failures.push("asset detail page must normalize path params through normalizeAssetId before rendering the client DAM shell");
}
if (!assetDetailPage.includes("notFound()")) {
  failures.push("asset detail page must render Next 404 for malformed asset ids");
}

const legacyImportPattern = new RegExp(`@/components/(${legacyModules.join("|")})(?:\\b|["'])`);
for (const file of walk("frontend")) {
  if (file.startsWith("frontend/components/dam/enterprise/")) continue;
  const content = read(file);
  if (legacyImportPattern.test(content)) {
    failures.push(`${file} imports a quarantined legacy page module`);
  }
}

if (failures.length) {
  console.error("Live DAM surface guard failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Live DAM surface guard passed.");
