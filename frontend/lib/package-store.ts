import fs from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { repoRoot } from "@/lib/env";
import type { DamPackage, DemoRole } from "@/lib/types";

export type StoredPackageDraft = {
  id: string;
  title: string;
  status: DamPackage["status"];
  sections: DamPackage["sections"];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  role: DemoRole;
  governance: {
    canPreview: boolean;
    canShare: boolean;
    canPublish: boolean;
    totalRefs: number;
    portalReadyRefs: number;
    blockedRefs: number;
    missingRefs: number;
    reason: string;
  };
  storageMode: "local-json";
};

const packageStorePath = () => path.join(repoRoot(), "data", "runtime", "package-drafts.json");

function newestFirst(records: StoredPackageDraft[]) {
  return [...records].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

function safeText(value: unknown, maxLength: number) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function safeResourceSpaceRef(value: unknown) {
  const ref = String(value || "").trim().slice(0, 80);
  return /^[a-z0-9_-]+$/i.test(ref) ? ref : "";
}

export function sanitizePackageDraft(input: unknown): DamPackage {
  const raw = (input || {}) as Partial<DamPackage>;
  const sections = Array.isArray(raw.sections) ? raw.sections : [];
  return {
    id: safeText(raw.id, 120) || "portal-local-draft",
    title: safeText(raw.title, 160) || "ResourceSpace Toolkit Draft",
    description: safeText(raw.description, 500) || undefined,
    status: raw.status === "pending-review" || raw.status === "approved" || raw.status === "archived" ? raw.status : "draft",
    collectionId: raw.collectionId ? safeText(raw.collectionId, 120) : undefined,
    sections: sections.slice(0, 12).map((section, index) => ({
      id: safeText(section?.id, 80) || `section-${index + 1}`,
      title: safeText(section?.title, 120) || `Section ${index + 1}`,
      resourceSpaceAssetIds: Array.isArray(section?.resourceSpaceAssetIds)
        ? [...new Set(section.resourceSpaceAssetIds.map((ref) => safeResourceSpaceRef(ref)).filter(Boolean))].slice(0, 80)
        : []
    })),
    updatedAt: new Date().toISOString()
  };
}

async function readLocalPackages() {
  try {
    const raw = await readFile(packageStorePath(), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(Boolean) as StoredPackageDraft[] : [];
  } catch {
    return [];
  }
}

async function writeLocalPackages(records: StoredPackageDraft[]) {
  const filePath = packageStorePath();
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(newestFirst(records).slice(0, 200), null, 2)}\n`);
}

export async function listStoredPackageDrafts() {
  return newestFirst(await readLocalPackages());
}

export async function savePackageDraft(record: Omit<StoredPackageDraft, "storageMode">) {
  const records = await readLocalPackages();
  const next: StoredPackageDraft = { ...record, storageMode: "local-json" };
  await writeLocalPackages([next, ...records.filter((item) => item.id !== next.id)]);
  return next;
}

export function packageDraftDiagnostics() {
  const filePath = packageStorePath();
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
    const records = Array.isArray(parsed) ? parsed.filter(Boolean) as StoredPackageDraft[] : [];
    const openDrafts = records.filter((record) => record.status !== "archived");
    const blockedRefs = records.reduce((sum, record) => sum + (record.governance?.blockedRefs || 0), 0);
    return {
      storageMode: "local-json" as const,
      durableStorageConfigured: false,
      count: records.length,
      openCount: openDrafts.length,
      blockedRefs,
      latestAt: records[0]?.updatedAt || "",
      filePath
    };
  } catch {
    return {
      storageMode: "local-json" as const,
      durableStorageConfigured: false,
      count: 0,
      openCount: 0,
      blockedRefs: 0,
      latestAt: "",
      filePath
    };
  }
}
