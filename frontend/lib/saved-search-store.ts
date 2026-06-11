import path from "node:path";
import { normalizeCatalogSort } from "@/lib/catalog-language";
import { repoRoot } from "@/lib/env";
import { readLocalJsonStore, readLocalJsonStoreSync, writeLocalJsonStore } from "@/lib/local-json-store";
import { newestByTimestamp, safeIsoTimestamp, safeIsoTimestampIdPart } from "@/lib/persisted-record-safety";
import { canReview, normalizeContributingRoleWithFallback } from "@/lib/permissions";
import { normalizePersistedDisplayText, normalizePersistedSlugText, readJsonObject } from "@/lib/request-validation";
import type { AuditEventRecord } from "@/lib/audit-log";
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
export type SavedSearchDraft = Pick<SavedSearchRecord, "id" | "title" | "query" | "view" | "collection" | "filters" | "sort">;

const savedSearchStorePath = () => path.join(repoRoot(), "data", "runtime", "saved-searches.json");
export const maxSavedSearches = 250;
type SavedSearchAuditEvent = Omit<AuditEventRecord, "id" | "createdAt" | "actor"> & { actor?: string };
type SavedSearchRouteError = {
  body: {
    error: string;
  };
  status: 400 | 403;
};

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

export function sanitizeSavedSearch(input: unknown): SavedSearchDraft {
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

export async function readSavedSearchDraftInput(request: { json(): Promise<unknown> }) {
  const body = await readJsonObject(request);
  return sanitizeSavedSearch((body as { search?: unknown }).search || body);
}

export function hasSavedSearchCriteria(draft: SavedSearchDraft) {
  return Boolean(draft.query || draft.view || draft.collection || draft.filters.length);
}

export function savedSearchListDeniedError(): SavedSearchRouteError {
  return { body: { error: "Saved search list requires Contributor, Reviewer, or DAM Admin role." }, status: 403 };
}

export function savedSearchSaveDeniedError(): SavedSearchRouteError {
  return { body: { error: "Saved search save requires Contributor, Reviewer, or DAM Admin role." }, status: 403 };
}

export function savedSearchCriteriaError(draft: SavedSearchDraft): SavedSearchRouteError | null {
  return hasSavedSearchCriteria(draft) ? null : { body: { error: "Saved search needs a query, saved view, collection, or filter." }, status: 400 };
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
  return readLocalJsonStore({
    filePath: savedSearchStorePath,
    maxRecords: maxSavedSearches,
    normalize: normalizeStoredSavedSearch,
    order: newestFirst
  });
}

async function writeLocalSavedSearches(records: SavedSearchRecord[]) {
  await writeLocalJsonStore(records, {
    filePath: savedSearchStorePath,
    maxRecords: maxSavedSearches,
    normalize: normalizeStoredSavedSearch,
    order: newestFirst
  });
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

export function savedSearchListForRolePayload(role: DemoRole, records: SavedSearchRecord[]) {
  return records.map((record) => savedSearchForRolePayload(role, record));
}

export function buildSavedSearchListResponse(searches: SavedSearchRecord[]) {
  return { searches, count: searches.length, storageMode: "local-json" as const };
}

export function buildSavedSearchSaveResponse(role: DemoRole, record: SavedSearchRecord) {
  return { ok: true, search: savedSearchForRolePayload(role, record), storageMode: record.storageMode };
}

export function savedSearchListDeniedAuditEvent(role: DemoRole, actor: string): SavedSearchAuditEvent {
  return {
    type: "saved_search_denied",
    role,
    actor,
    status: "denied",
    summary: "Saved search list denied for Viewer role.",
    details: { reason: "role-cannot-list-saved-searches" }
  };
}

export function savedSearchSaveDeniedAuditEvent(role: DemoRole, actor: string): SavedSearchAuditEvent {
  return {
    type: "saved_search_denied",
    role,
    actor,
    status: "denied",
    summary: "Saved search save denied for Viewer role.",
    details: { reason: "role-cannot-save-search" }
  };
}

export function savedSearchListViewedAuditEvent(
  searches: SavedSearchRecord[],
  role: DemoRole,
  actor: string
): SavedSearchAuditEvent {
  return {
    type: "saved_search_listed",
    role,
    actor,
    status: "preview",
    summary: "Saved search list viewed.",
    details: { count: searches.length }
  };
}

export function savedSearchSavedAuditEvent(
  record: SavedSearchRecord,
  role: DemoRole,
  actor: string
): SavedSearchAuditEvent {
  return {
    type: "saved_search_saved",
    role,
    actor,
    status: "preview",
    summary: `Saved search created: ${record.title}.`,
    details: {
      savedSearchId: record.id,
      query: record.query || null,
      view: record.view || null,
      collection: record.collection || null,
      filterCount: record.filters.length,
      storageMode: record.storageMode
    }
  };
}

export async function saveSavedSearch(record: Omit<SavedSearchRecord, "storageMode">) {
  const records = await readLocalSavedSearches();
  const next: SavedSearchRecord = { ...record, storageMode: "local-json" };
  await writeLocalSavedSearches([next, ...records.filter((item) => item.id !== next.id)]);
  return next;
}

export async function saveSavedSearchDraft(draft: SavedSearchDraft, actor: { id: string; role: DemoRole }) {
  const now = new Date().toISOString();
  return saveSavedSearch({
    ...draft,
    id: draft.id || `search-${safeIsoTimestampIdPart(now)}`,
    createdAt: now,
    updatedAt: now,
    createdBy: actor.id,
    role: actor.role
  });
}

export function savedSearchDiagnostics() {
  const filePath = savedSearchStorePath();
  const records = readLocalJsonStoreSync({
    filePath: savedSearchStorePath,
    maxRecords: maxSavedSearches,
    normalize: normalizeStoredSavedSearch,
    order: newestFirst
  });
  return {
    storageMode: "local-json" as const,
    durableStorageConfigured: false,
    count: records.length,
    latestAt: records[0]?.updatedAt || "",
    filePath
  };
}
