import fs from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { repoRoot } from "@/lib/env";
import { safeCompactText, safeIsoTimestamp, safeNonNegativeInt } from "@/lib/persisted-record-safety";
import { normalizeRoleWithFallback } from "@/lib/permissions";
import { containsPrivateSourceText, containsUnsafePathText } from "@/lib/private-source-text";
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
export const maxPackageDrafts = 200;

function newestFirst(records: StoredPackageDraft[]) {
  return [...records].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

function safeText(value: unknown, maxLength: number) {
  return safeCompactText(value, maxLength);
}

function safeDisplayText(value: unknown, maxLength: number) {
  const text = safeText(value, maxLength);
  if (containsUnsafePathText(text)) return "";
  if (containsPrivateSourceText(text)) return "";
  return text;
}

function safeIdentifierText(value: unknown, maxLength: number) {
  const text = safeText(value, maxLength);
  if (containsUnsafePathText(text) || containsPrivateSourceText(text)) return "";
  return text.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "");
}

function safeResourceSpaceRef(value: unknown) {
  const ref = String(value || "").trim().slice(0, 80);
  if (containsPrivateSourceText(ref) || /^[a-f0-9]{32,}$/i.test(ref)) return "";
  return /^[a-z0-9_-]+$/i.test(ref) ? ref : "";
}

function safeBoolean(value: unknown) {
  return value === true;
}

export function sanitizePackageDraft(input: unknown): DamPackage {
  const raw = (input || {}) as Partial<DamPackage>;
  const sections = Array.isArray(raw.sections) ? raw.sections : [];
  const seenRefs = new Set<string>();
  return {
    id: safeIdentifierText(raw.id, 120) || "portal-local-draft",
    title: safeDisplayText(raw.title, 160) || "ResourceSpace Toolkit Draft",
    description: safeDisplayText(raw.description, 500) || undefined,
    status: raw.status === "pending-review" || raw.status === "approved" || raw.status === "archived" ? raw.status : "draft",
    collectionId: raw.collectionId ? safeDisplayText(raw.collectionId, 120) : undefined,
    sections: sections.slice(0, 12).map((section, index) => ({
      id: safeIdentifierText(section?.id, 80) || `section-${index + 1}`,
      title: safeDisplayText(section?.title, 120) || `Section ${index + 1}`,
      resourceSpaceAssetIds: Array.isArray(section?.resourceSpaceAssetIds)
        ? section.resourceSpaceAssetIds
            .map((ref) => safeResourceSpaceRef(ref))
            .filter((ref) => {
              if (!ref || seenRefs.has(ref)) return false;
              seenRefs.add(ref);
              return true;
            })
            .slice(0, 80)
        : []
    })),
    updatedAt: new Date().toISOString()
  };
}

function normalizeStoredPackageDraft(input: unknown): StoredPackageDraft | null {
  const raw = (input || {}) as Partial<StoredPackageDraft>;
  const draft = sanitizePackageDraft(raw);
  if (!draft.id) return null;
  const updatedAt = safeIsoTimestamp(raw.updatedAt) || safeIsoTimestamp(raw.createdAt) || new Date(0).toISOString();
  const governance = (raw.governance || {}) as Partial<StoredPackageDraft["governance"]>;
  return {
    id: draft.id,
    title: draft.title,
    status: draft.status,
    sections: draft.sections,
    createdAt: safeIsoTimestamp(raw.createdAt) || updatedAt,
    updatedAt,
    createdBy: safeDisplayText(raw.createdBy, 120) || "local-beta:unknown",
    role: normalizeRoleWithFallback(raw.role, "Contributor"),
    governance: {
      canPreview: safeBoolean(governance.canPreview),
      canShare: safeBoolean(governance.canShare),
      canPublish: safeBoolean(governance.canPublish),
      totalRefs: safeNonNegativeInt(governance.totalRefs),
      portalReadyRefs: safeNonNegativeInt(governance.portalReadyRefs),
      blockedRefs: safeNonNegativeInt(governance.blockedRefs),
      missingRefs: safeNonNegativeInt(governance.missingRefs),
      reason: safeDisplayText(governance.reason, 240)
    },
    storageMode: "local-json"
  };
}

async function readLocalPackages() {
  try {
    const raw = await readFile(packageStorePath(), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(normalizeStoredPackageDraft).filter(Boolean) as StoredPackageDraft[] : [];
  } catch {
    return [];
  }
}

async function writeLocalPackages(records: StoredPackageDraft[]) {
  const filePath = packageStorePath();
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(newestFirst(records).slice(0, maxPackageDrafts), null, 2)}\n`);
}

export async function listStoredPackageDrafts() {
  return newestFirst(await readLocalPackages()).slice(0, maxPackageDrafts);
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
    const records = Array.isArray(parsed) ? newestFirst(parsed.map(normalizeStoredPackageDraft).filter(Boolean) as StoredPackageDraft[]).slice(0, maxPackageDrafts) : [];
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
