import fs from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeCatalogSort } from "@/lib/catalog-language";
import { repoRoot } from "@/lib/env";
import { newestByTimestamp, safeIsoTimestamp } from "@/lib/persisted-record-safety";
import { canReview, normalizeContributingRoleWithFallback } from "@/lib/permissions";
import { normalizePersistedDisplayText, normalizePersistedSlugText } from "@/lib/request-validation";
import type { CatalogSort, DemoRole } from "@/lib/types";

export type SavedSearchRecord = {
  id: string;
  title: string;
  query: string;
  view?: string;
  collection?: string;
  filters: string[];
  sort: CatalogSort;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  role: DemoRole;
  storageMode: "local-json";
};

const savedSearchStorePath = () => path.join(repoRoot(), "data", "runtime", "saved-searches.json");
export const maxSavedSearches = 250;

function newestFirst(records: SavedSearchRecord[]) {
  return newestByTimestamp(records, (record) => record.updatedAt);
}

function safeId(value: unknown) {
  return normalizePersistedSlugText(value, 100);
}

function safeRef(value: unknown) {
  return normalizePersistedSlugText(value, 100, { rejectUnsafePath: true });
}

function safeFilter(value: unknown) {
  return normalizePersistedDisplayText(value, 80);
}

function safeSort(value: unknown): CatalogSort {
  return normalizeCatalogSort(value);
}

export function sanitizeSavedSearch(input: unknown) {
  const raw = (input || {}) as Partial<SavedSearchRecord>;
  const filters = Array.isArray(raw.filters) ? raw.filters : [];
  const query = normalizePersistedDisplayText(raw.query, 200);
  const view = safeRef(raw.view);
  const collection = safeRef(raw.collection);
  const safeFilters = [...new Set(filters.map(safeFilter).filter(Boolean))].slice(0, 24);
  return {
    id: safeId(raw.id) || "",
    title: normalizePersistedDisplayText(raw.title, 120) || query || view || collection || safeFilters[0] || "Saved search",
    query,
    view: view || undefined,
    collection: collection || undefined,
    filters: safeFilters,
    sort: safeSort(raw.sort)
  };
}

function normalizeStoredSavedSearch(input: unknown): SavedSearchRecord | null {
  const raw = (input || {}) as Partial<SavedSearchRecord>;
  const draft = sanitizeSavedSearch(raw);
  if (!draft.id) return null;
  const updatedAt = safeIsoTimestamp(raw.updatedAt) || safeIsoTimestamp(raw.createdAt) || new Date(0).toISOString();
  return {
    ...draft,
    createdAt: safeIsoTimestamp(raw.createdAt) || updatedAt,
    updatedAt,
    createdBy: normalizePersistedDisplayText(raw.createdBy, 120) || "local-beta:unknown",
    role: normalizeContributingRoleWithFallback(raw.role, "Contributor"),
    storageMode: "local-json"
  };
}

async function readLocalSavedSearches() {
  try {
    const raw = await readFile(savedSearchStorePath(), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(normalizeStoredSavedSearch).filter(Boolean) as SavedSearchRecord[] : [];
  } catch {
    return [];
  }
}

async function writeLocalSavedSearches(records: SavedSearchRecord[]) {
  const filePath = savedSearchStorePath();
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(newestFirst(records).slice(0, maxSavedSearches), null, 2)}\n`);
}

export async function listSavedSearches() {
  return newestFirst(await readLocalSavedSearches()).slice(0, maxSavedSearches);
}

function creatorLabel(role: DemoRole) {
  return role === "DAM Admin" ? "DAM Admin" : role === "Reviewer" ? "Reviewer" : "Contributor";
}

export function savedSearchForRolePayload(role: DemoRole, record: SavedSearchRecord): SavedSearchRecord {
  if (canReview(role)) return record;
  return {
    ...record,
    createdBy: creatorLabel(record.role)
  };
}

export async function saveSavedSearch(record: Omit<SavedSearchRecord, "storageMode">) {
  const records = await readLocalSavedSearches();
  const next: SavedSearchRecord = { ...record, storageMode: "local-json" };
  await writeLocalSavedSearches([next, ...records.filter((item) => item.id !== next.id)]);
  return next;
}

export function savedSearchDiagnostics() {
  const filePath = savedSearchStorePath();
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
    const records = Array.isArray(parsed) ? newestFirst(parsed.map(normalizeStoredSavedSearch).filter(Boolean) as SavedSearchRecord[]).slice(0, maxSavedSearches) : [];
    return {
      storageMode: "local-json" as const,
      durableStorageConfigured: false,
      count: records.length,
      latestAt: records[0]?.updatedAt || "",
      filePath
    };
  } catch {
    return {
      storageMode: "local-json" as const,
      durableStorageConfigured: false,
      count: 0,
      latestAt: "",
      filePath
    };
  }
}
