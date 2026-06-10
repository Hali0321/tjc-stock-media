import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "@/lib/env";
import type { ReviewEvidenceChecklist, ReviewWriteRecord, ReviewWriteRecordSummary, StockMediaAsset } from "@/lib/types";

const pendingDirName = "pending-review-writes";
export const maxPendingReviewWrites = 200;

function pendingDir() {
  return path.join(repoRoot(), ".runtime", pendingDirName);
}

function ensurePendingDir() {
  fs.mkdirSync(pendingDir(), { recursive: true });
}

function safeFilePart(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "").slice(0, 80) || "review-write";
}

function safeText(value: unknown, maxLength: number) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function safeDisplayText(value: unknown, maxLength: number) {
  const text = safeText(value, maxLength);
  return text.includes("..") || /[\\/]/.test(text) ? "" : text;
}

function safeIso(value: unknown) {
  const text = safeText(value, 40);
  return Number.isNaN(Date.parse(text)) ? "" : text;
}

function safeRole(value: unknown): ReviewWriteRecord["reviewerRole"] {
  return value === "DAM Admin" ? "DAM Admin" : "Reviewer";
}

function safeSyncState(value: unknown): ReviewWriteRecord["syncState"] {
  return value === "ready_to_sync" || value === "sync_failed" || value === "synced_to_resourcespace" || value === "cancelled" || value === "superseded"
    ? value
    : "queued";
}

function safeCount(value: unknown) {
  return Math.max(0, Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0);
}

function safeChecklist(value: unknown): ReviewEvidenceChecklist {
  const raw = (value || {}) as Partial<ReviewEvidenceChecklist>;
  return {
    sourceConfirmed: raw.sourceConfirmed === true,
    rightsConfirmed: raw.rightsConfirmed === true,
    attributionConfirmed: raw.attributionConfirmed === true,
    peopleVisibilityConfirmed: raw.peopleVisibilityConfirmed === true,
    childrenYouthChecked: raw.childrenYouthChecked === true,
    usageScopeSelected: raw.usageScopeSelected === true,
    derivativeAvailable: raw.derivativeAvailable === true,
    sensitiveContextChecked: raw.sensitiveContextChecked === true,
    creditRequirementChecked: raw.creditRequirementChecked === true,
    expirationRereviewSet: raw.expirationRereviewSet === true,
    proofLinkAttached: raw.proofLinkAttached === true
  };
}

function normalizePendingReviewWrite(input: unknown): ReviewWriteRecord | null {
  const raw = (input || {}) as Partial<ReviewWriteRecord>;
  const id = safeFilePart(safeText(raw.id, 120));
  const resourceId = safeFilePart(safeText(raw.resourceId, 120));
  if (!id || !resourceId) return null;
  const updatedAt = safeIso(raw.updatedAt) || safeIso(raw.createdAt) || new Date(0).toISOString();
  return {
    id,
    resourceId,
    oldStatus: safeDisplayText(raw.oldStatus, 120) || "Unknown",
    requestedStatus: safeDisplayText(raw.requestedStatus, 120) || "Needs Review",
    reviewerRole: safeRole(raw.reviewerRole),
    reviewerName: raw.reviewerName === undefined ? undefined : safeDisplayText(raw.reviewerName, 120),
    createdAt: safeIso(raw.createdAt) || updatedAt,
    updatedAt,
    note: safeDisplayText(raw.note, 1200),
    checklist: safeChecklist(raw.checklist),
    blockers: Array.isArray(raw.blockers) ? raw.blockers.map((item) => safeDisplayText(item, 120)).filter(Boolean).slice(0, 24) : [],
    syncState: safeSyncState(raw.syncState),
    retryCount: safeCount(raw.retryCount),
    lastError: raw.lastError === undefined ? undefined : safeDisplayText(raw.lastError, 240)
  };
}

function readRecord(filePath: string): ReviewWriteRecord | null {
  try {
    return normalizePendingReviewWrite(JSON.parse(fs.readFileSync(filePath, "utf8")));
  } catch {
    return null;
  }
}

export function listPendingReviewWrites(): ReviewWriteRecord[] {
  const dir = pendingDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => readRecord(path.join(dir, file)))
    .filter((record): record is ReviewWriteRecord => Boolean(record))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, maxPendingReviewWrites);
}

export function pendingReviewWriteSummary(record: ReviewWriteRecord): ReviewWriteRecordSummary {
  return {
    id: record.id,
    resourceId: record.resourceId,
    requestedStatus: record.requestedStatus,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    syncState: record.syncState,
    lastError: record.lastError
  };
}

export function latestPendingWriteForResource(resourceId: string) {
  return listPendingReviewWrites().find((record) => record.resourceId === resourceId && !["cancelled", "superseded", "synced_to_resourcespace"].includes(record.syncState));
}

export function pendingReviewWriteDiagnostics() {
  const records = listPendingReviewWrites();
  const lastAttempt = records[0];
  const lastError = records.find((record) => record.lastError);
  return {
    count: records.filter((record) => !["cancelled", "superseded", "synced_to_resourcespace"].includes(record.syncState)).length,
    lastAttemptAt: lastAttempt?.updatedAt,
    lastError: lastError?.lastError
  };
}

export function createPendingReviewWrite({
  asset,
  requestedStatus,
  reviewerRole,
  reviewerName,
  note,
  checklist,
  blockers
}: {
  asset: StockMediaAsset;
  requestedStatus: string;
  reviewerRole: "Reviewer" | "DAM Admin";
  reviewerName?: string;
  note: string;
  checklist: ReviewEvidenceChecklist;
  blockers: string[];
}) {
  ensurePendingDir();
  const now = new Date().toISOString();
  const id = `${now.replace(/[:.]/g, "-")}-${safeFilePart(asset.resourceSpaceId || asset.id)}-${crypto.randomUUID().slice(0, 8)}`;
  const record: ReviewWriteRecord = {
    id,
    resourceId: asset.resourceSpaceId || asset.id,
    oldStatus: asset.status,
    requestedStatus,
    reviewerRole,
    reviewerName,
    createdAt: now,
    updatedAt: now,
    note,
    checklist,
    blockers,
    syncState: "queued",
    retryCount: 0
  };
  fs.writeFileSync(path.join(pendingDir(), `${id}.json`), `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return record;
}

function writeRecord(record: ReviewWriteRecord) {
  ensurePendingDir();
  fs.writeFileSync(path.join(pendingDir(), `${record.id}.json`), `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return record;
}

export function updatePendingReviewWrite(id: string, update: Partial<Pick<ReviewWriteRecord, "syncState" | "lastError" | "retryCount">>) {
  const record = listPendingReviewWrites().find((item) => item.id === id);
  if (!record) return null;
  return writeRecord({
    ...record,
    ...update,
    updatedAt: new Date().toISOString(),
    retryCount: update.retryCount ?? record.retryCount
  });
}

export function markPendingReviewWriteSyncFailed(id: string, error: string) {
  const record = listPendingReviewWrites().find((item) => item.id === id);
  return updatePendingReviewWrite(id, {
    syncState: "sync_failed",
    lastError: error,
    retryCount: record ? record.retryCount + 1 : 1
  });
}

export function markPendingReviewWriteSynced(id: string) {
  return updatePendingReviewWrite(id, {
    syncState: "synced_to_resourcespace",
    lastError: undefined
  });
}
