import fs from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { repoRoot } from "@/lib/env";
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
const sortOptions: CatalogSort[] = ["Approved first", "Recently approved", "Newest", "A-Z"];

function newestFirst(records: SavedSearchRecord[]) {
  return [...records].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

function safeText(value: unknown, maxLength: number) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function safeId(value: unknown) {
  return safeText(value, 100).replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "");
}

function safeRef(value: unknown) {
  const raw = safeText(value, 100);
  if (raw.includes("..") || /[\\/]/.test(raw)) {
    return "";
  }
  return safeId(raw);
}

function safeFilter(value: unknown) {
  const label = safeText(value, 80);
  if (label.includes("..") || /[\\/]/.test(label)) {
    return "";
  }
  return label;
}

function safeSort(value: unknown): CatalogSort {
  return sortOptions.includes(value as CatalogSort) ? value as CatalogSort : "Approved first";
}

function safeIso(value: unknown) {
  const text = safeText(value, 40);
  return Number.isNaN(Date.parse(text)) ? "" : text;
}

export function sanitizeSavedSearch(input: unknown) {
  const raw = (input || {}) as Partial<SavedSearchRecord>;
  const filters = Array.isArray(raw.filters) ? raw.filters : [];
  const query = safeText(raw.query, 200);
  const view = safeRef(raw.view);
  const collection = safeRef(raw.collection);
  return {
    id: safeId(raw.id) || "",
    title: safeText(raw.title, 120) || query || view || collection || "Saved search",
    query,
    view: view || undefined,
    collection: collection || undefined,
    filters: [...new Set(filters.map(safeFilter).filter(Boolean))].slice(0, 24),
    sort: safeSort(raw.sort)
  };
}

function normalizeStoredSavedSearch(input: unknown): SavedSearchRecord | null {
  const raw = (input || {}) as Partial<SavedSearchRecord>;
  const draft = sanitizeSavedSearch(raw);
  if (!draft.id) return null;
  const updatedAt = safeIso(raw.updatedAt) || safeIso(raw.createdAt) || new Date(0).toISOString();
  return {
    ...draft,
    createdAt: safeIso(raw.createdAt) || updatedAt,
    updatedAt,
    createdBy: safeText(raw.createdBy, 120) || "local-beta:unknown",
    role: raw.role === "Contributor" || raw.role === "Reviewer" || raw.role === "DAM Admin" ? raw.role : "Contributor",
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
  await writeFile(filePath, `${JSON.stringify(newestFirst(records).slice(0, 250), null, 2)}\n`);
}

export async function listSavedSearches() {
  return newestFirst(await readLocalSavedSearches());
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
    const records = Array.isArray(parsed) ? parsed.map(normalizeStoredSavedSearch).filter(Boolean) as SavedSearchRecord[] : [];
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
