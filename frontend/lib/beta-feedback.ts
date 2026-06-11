import { mkdir, readFile, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { hasVercelBlobConfig, hasVercelKvConfig, repoRoot } from "@/lib/env";
import { safeCompactText, safeIsoTimestamp } from "@/lib/persisted-record-safety";
import { normalizeRoleWithFallback } from "@/lib/permissions";
import { containsPrivateSourceText, containsUnsafePathText, containsUnsafeRouteText, isSafeHttpUrl } from "@/lib/private-source-text";
import type { BetaFeedbackRecord, BetaFeedbackSeverity, BetaFeedbackStatus, DemoRole } from "@/lib/types";

const feedbackIndexKey = "tjc-stock-media:beta-feedback:index";
const feedbackRecordPrefix = "tjc-stock-media:beta-feedback:record:";
const localFeedbackPath = () => path.join(repoRoot(), "data", "runtime", "beta-feedback.json");
const localFileFeedbackEnabled = () => process.env.VERCEL !== "1";
export const maxBetaFeedbackRecords = 500;

export const betaFeedbackSeverities: BetaFeedbackSeverity[] = ["low", "medium", "high", "critical"];
export const betaFeedbackStatuses: BetaFeedbackStatus[] = ["new", "triaged", "agent-ready", "fixed", "wont-fix"];

type FeedbackPatch = Partial<Pick<BetaFeedbackRecord, "severity" | "status" | "notes">>;
type FeedbackGlobal = typeof globalThis & { __tjcStockMediaBetaFeedback?: BetaFeedbackRecord[] };
export type BetaFeedbackExportFilters = {
  status?: BetaFeedbackStatus | "all";
  severity?: BetaFeedbackSeverity | "all";
  role?: DemoRole | "all";
  route?: string;
};

function memoryFeedback() {
  const store = globalThis as FeedbackGlobal;
  store.__tjcStockMediaBetaFeedback ||= [];
  return store.__tjcStockMediaBetaFeedback;
}

function safeText(value: unknown, maxLength: number) {
  return safeCompactText(value, maxLength);
}

function safeFeedbackText(value: unknown, maxLength: number) {
  const text = safeText(value, maxLength);
  if (containsUnsafePathText(text)) return "";
  if (containsPrivateSourceText(text)) return "";
  return text;
}

function safeId(value: unknown) {
  const text = safeText(value, 120);
  if (containsPrivateSourceText(text)) return "";
  return text.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "");
}

function safeSeverity(value: unknown): BetaFeedbackSeverity {
  return betaFeedbackSeverities.includes(value as BetaFeedbackSeverity) ? value as BetaFeedbackSeverity : "medium";
}

function safeStatus(value: unknown): BetaFeedbackStatus {
  return betaFeedbackStatuses.includes(value as BetaFeedbackStatus) ? value as BetaFeedbackStatus : "new";
}

function safeStorageMode(value: unknown): BetaFeedbackRecord["storageMode"] {
  return value === "vercel-kv" ? "vercel-kv" : "local-json";
}

function safeRoute(value: unknown) {
  const route = safeText(value, 240);
  if (!route.startsWith("/") || containsUnsafeRouteText(route)) return "/";
  if (containsPrivateSourceText(route)) return "/";
  return route;
}

function safeUrl(value: unknown) {
  const url = safeText(value, 500);
  return isSafeHttpUrl(url) ? url : "";
}

function feedbackKey(id: string) {
  return `${feedbackRecordPrefix}${id}`;
}

function newestFirst(records: BetaFeedbackRecord[]) {
  return [...records].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function newestFeedbackWindow(records: BetaFeedbackRecord[]) {
  return newestFirst(records).slice(0, maxBetaFeedbackRecords);
}

function normalizeStoredFeedback(input: unknown): BetaFeedbackRecord | null {
  const raw = (input || {}) as Partial<BetaFeedbackRecord>;
  const id = safeId(raw.id);
  if (!id) return null;
  const createdAt = safeIsoTimestamp(raw.createdAt) || safeIsoTimestamp(raw.updatedAt) || new Date(0).toISOString();
  return {
    id,
    createdAt,
    updatedAt: safeIsoTimestamp(raw.updatedAt) || createdAt,
    role: normalizeRoleWithFallback(raw.role),
    route: safeRoute(raw.route),
    task: safeFeedbackText(raw.task, 220) || "Free play",
    severity: safeSeverity(raw.severity),
    expected: safeFeedbackText(raw.expected, 1200),
    actual: safeFeedbackText(raw.actual, 1200),
    status: safeStatus(raw.status),
    notes: raw.notes === undefined ? undefined : safeFeedbackText(raw.notes, 1200),
    reporterName: raw.reporterName === undefined ? undefined : safeFeedbackText(raw.reporterName, 120),
    browser: raw.browser === undefined ? undefined : safeFeedbackText(raw.browser, 280),
    device: raw.device === undefined ? undefined : safeFeedbackText(raw.device, 180),
    viewport: raw.viewport === undefined ? undefined : safeFeedbackText(raw.viewport, 60),
    attachmentUrl: raw.attachmentUrl === undefined ? undefined : safeUrl(raw.attachmentUrl),
    storageMode: safeStorageMode(raw.storageMode),
    actor: raw.actor === undefined ? undefined : safeFeedbackText(raw.actor, 160)
  };
}

async function readLocalFeedback() {
  if (!localFileFeedbackEnabled()) return newestFeedbackWindow(memoryFeedback().map(normalizeStoredFeedback).filter(Boolean) as BetaFeedbackRecord[]);
  try {
    const raw = await readFile(localFeedbackPath(), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? newestFeedbackWindow(parsed.map(normalizeStoredFeedback).filter(Boolean) as BetaFeedbackRecord[]) : [];
  } catch {
    return [];
  }
}

async function writeLocalFeedback(records: BetaFeedbackRecord[]) {
  if (!localFileFeedbackEnabled()) {
    const store = memoryFeedback();
    store.splice(0, store.length, ...newestFeedbackWindow(records));
    return;
  }
  const filePath = localFeedbackPath();
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(newestFeedbackWindow(records), null, 2)}\n`);
  } catch {
    const store = memoryFeedback();
    store.splice(0, store.length, ...newestFeedbackWindow(records));
  }
}

async function getKvClient() {
  if (!hasVercelKvConfig()) return null;
  const { kv } = await import("@vercel/kv");
  return kv;
}

async function readKvFeedback() {
  const kv = await getKvClient();
  if (!kv) return null;
  const ids = await kv.get<string[]>(feedbackIndexKey).catch(() => null);
  if (!ids?.length) return [];
  const records = await Promise.all(ids.map((id) => kv.get<BetaFeedbackRecord>(feedbackKey(id)).catch(() => null)));
  return newestFirst(records.map(normalizeStoredFeedback).filter(Boolean) as BetaFeedbackRecord[]);
}

async function writeKvFeedback(record: BetaFeedbackRecord) {
  const kv = await getKvClient();
  if (!kv) return false;
  const ids = await kv.get<string[]>(feedbackIndexKey).catch(() => null);
  const nextIds = [record.id, ...(ids || []).filter((id) => id !== record.id)].slice(0, maxBetaFeedbackRecords);
  await Promise.all([
    kv.set(feedbackKey(record.id), record),
    kv.set(feedbackIndexKey, nextIds)
  ]);
  return true;
}

export async function putBetaFeedbackAttachment(id: string, file: File | null) {
  if (!file || !file.size || !hasVercelBlobConfig()) return "";
  const { put } = await import("@vercel/blob");
  const safeName = file.name.replace(/[^a-z0-9._-]+/gi, "-").slice(0, 120) || "attachment";
  const blob = await put(`beta-feedback/${id}/${safeName}`, file, {
    access: "public",
    addRandomSuffix: true
  });
  return blob.url;
}

export function betaFeedbackDiagnostics() {
  const kvConfigured = hasVercelKvConfig();
  const blobConfigured = hasVercelBlobConfig();
  const records = (() => {
    if (!localFileFeedbackEnabled()) return memoryFeedback();
    try {
      const parsed = JSON.parse(readFileSync(localFeedbackPath(), "utf8")) as unknown;
      return Array.isArray(parsed) ? newestFeedbackWindow(parsed.map(normalizeStoredFeedback).filter(Boolean) as BetaFeedbackRecord[]) : [];
    } catch {
      return newestFeedbackWindow(memoryFeedback().map(normalizeStoredFeedback).filter(Boolean) as BetaFeedbackRecord[]);
    }
  })();
  const storageModes = Array.from(new Set(records.map((record) => record.storageMode))).sort();
  const openRecords = records.filter((record) => !["fixed", "wont-fix"].includes(record.status));
  const criticalOpen = openRecords.filter((record) => record.severity === "critical");
  return {
    kvConfigured,
    blobConfigured,
    hostedRuntime: process.env.VERCEL === "1",
    durableStorageConfigured: kvConfigured,
    attachmentStorageConfigured: blobConfigured,
    count: records.length,
    openCount: openRecords.length,
    criticalOpenCount: criticalOpen.length,
    latestAt: records[0]?.createdAt || "",
    storageModes,
    primaryStorageMode: kvConfigured ? "vercel-kv" as const : "local-json" as const
  };
}

export function validateFeedbackPayload(payload: {
  role: DemoRole;
  route: string;
  severity: string;
  expected: string;
  actual: string;
}) {
  const errors = [
    !payload.role && "role",
    !payload.route && "route",
    !betaFeedbackSeverities.includes(payload.severity as BetaFeedbackSeverity) && "severity",
    !payload.expected && "expected",
    !payload.actual && "actual"
  ].filter((item): item is string => Boolean(item));
  return errors;
}

export async function createBetaFeedback(input: Omit<BetaFeedbackRecord, "id" | "createdAt" | "updatedAt" | "status" | "storageMode"> & { id?: string }) {
  const id = input.id || crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const kvAvailable = Boolean(await getKvClient());
  const record: BetaFeedbackRecord = {
    ...input,
    id,
    createdAt,
    updatedAt: createdAt,
    status: "new",
    storageMode: kvAvailable ? "vercel-kv" : "local-json"
  };
  const wroteKv = kvAvailable ? await writeKvFeedback(record).catch(() => false) : false;
  if (!wroteKv) {
    record.storageMode = "local-json";
    const records = await readLocalFeedback();
    await writeLocalFeedback([record, ...records.filter((item) => item.id !== record.id)]);
  }
  return record;
}

export async function listBetaFeedback() {
  const kvRecords = await readKvFeedback().catch(() => null);
  if (kvRecords) return kvRecords;
  return newestFeedbackWindow(await readLocalFeedback());
}

export function filterBetaFeedback(records: BetaFeedbackRecord[], filters: BetaFeedbackExportFilters) {
  const route = safeText(filters.route || "all", 240);
  return newestFirst(records).filter((record) => (
    (!filters.status || filters.status === "all" || record.status === filters.status)
    && (!filters.severity || filters.severity === "all" || record.severity === filters.severity)
    && (!filters.role || filters.role === "all" || record.role === filters.role)
    && (!route || route === "all" || record.route.startsWith(route))
  ));
}

export function buildBetaFeedbackExport(records: BetaFeedbackRecord[], filters: BetaFeedbackExportFilters) {
  const exportedAt = new Date().toISOString();
  const filtered = filterBetaFeedback(records, filters);
  return {
    schema: "tjc-beta-feedback-export.v1",
    exportedAt,
    filters: {
      status: filters.status || "all",
      severity: filters.severity || "all",
      role: filters.role || "all",
      route: filters.route || "all"
    },
    counts: {
      totalRecords: records.length,
      exportedRecords: filtered.length,
      critical: filtered.filter((record) => record.severity === "critical").length,
      high: filtered.filter((record) => record.severity === "high").length,
      agentReady: filtered.filter((record) => record.status === "agent-ready").length,
      open: filtered.filter((record) => !["fixed", "wont-fix"].includes(record.status)).length
    },
    records: filtered
  };
}

export async function patchBetaFeedback(id: string, patch: FeedbackPatch) {
  const cleanId = safeText(id, 120);
  const records = await listBetaFeedback();
  const existing = records.find((record) => record.id === cleanId);
  if (!existing) return null;
  const next: BetaFeedbackRecord = {
    ...existing,
    severity: patch.severity && betaFeedbackSeverities.includes(patch.severity) ? patch.severity : existing.severity,
    status: patch.status && betaFeedbackStatuses.includes(patch.status) ? patch.status : existing.status,
    notes: patch.notes === undefined ? existing.notes : safeFeedbackText(patch.notes, 1200),
    updatedAt: new Date().toISOString()
  };
  const wroteKv = await writeKvFeedback(next).catch(() => false);
  if (!wroteKv) {
    const localRecords = await readLocalFeedback();
    await writeLocalFeedback([{ ...next, storageMode: "local-json" }, ...localRecords.filter((record) => record.id !== cleanId)]);
  }
  return wroteKv ? next : { ...next, storageMode: "local-json" as const };
}

export function normalizeFeedbackText(value: unknown, maxLength = 1200) {
  return safeFeedbackText(value, maxLength);
}

export function normalizeFeedbackRoute(value: unknown) {
  return safeRoute(value);
}

export function normalizeFeedbackUrl(value: unknown) {
  return safeUrl(value);
}
