import fs from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { repoRoot } from "@/lib/env";
import { newestByTimestamp, safeBoolean, safeCompactText, safeEnumValue, safeIsoTimestamp, safeNonNegativeInt, safeSlugText } from "@/lib/persisted-record-safety";
import { normalizeContributingRoleWithFallback } from "@/lib/permissions";
import { containsPrivateSourceText, containsUnsafePathText } from "@/lib/private-source-text";
import { normalizePersistedDisplayText, normalizeResourceSpaceRef } from "@/lib/request-validation";
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
const packageStatuses: DamPackage["status"][] = ["draft", "pending-review", "approved", "archived"];

function newestFirst(records: StoredPackageDraft[]) {
  return newestByTimestamp(records, (record) => record.updatedAt);
}

function safeText(value: unknown, maxLength: number) {
  return safeCompactText(value, maxLength);
}

function safeIdentifierText(value: unknown, maxLength: number) {
  const text = safeText(value, maxLength);
  if (containsUnsafePathText(text) || containsPrivateSourceText(text)) return "";
  return safeSlugText(text, maxLength);
}

export function sanitizePackageDraft(input: unknown): DamPackage {
  const raw = (input || {}) as Partial<DamPackage>;
  const sections = Array.isArray(raw.sections) ? raw.sections : [];
  const seenRefs = new Set<string>();
  return {
    id: safeIdentifierText(raw.id, 120) || "portal-local-draft",
    title: normalizePersistedDisplayText(raw.title, 160) || "ResourceSpace Toolkit Draft",
    description: normalizePersistedDisplayText(raw.description, 500) || undefined,
    status: safeEnumValue(raw.status, packageStatuses, "draft"),
    collectionId: raw.collectionId ? normalizePersistedDisplayText(raw.collectionId, 120) : undefined,
    sections: sections.slice(0, 12).map((section, index) => ({
      id: safeIdentifierText(section?.id, 80) || `section-${index + 1}`,
      title: normalizePersistedDisplayText(section?.title, 120) || `Section ${index + 1}`,
      resourceSpaceAssetIds: Array.isArray(section?.resourceSpaceAssetIds)
        ? section.resourceSpaceAssetIds
            .map((ref) => normalizeResourceSpaceRef(ref))
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
    createdBy: normalizePersistedDisplayText(raw.createdBy, 120) || "local-beta:unknown",
    role: normalizeContributingRoleWithFallback(raw.role, "Contributor"),
    governance: {
      canPreview: safeBoolean(governance.canPreview),
      canShare: safeBoolean(governance.canShare),
      canPublish: safeBoolean(governance.canPublish),
      totalRefs: safeNonNegativeInt(governance.totalRefs),
      portalReadyRefs: safeNonNegativeInt(governance.portalReadyRefs),
      blockedRefs: safeNonNegativeInt(governance.blockedRefs),
      missingRefs: safeNonNegativeInt(governance.missingRefs),
      reason: normalizePersistedDisplayText(governance.reason, 240)
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
