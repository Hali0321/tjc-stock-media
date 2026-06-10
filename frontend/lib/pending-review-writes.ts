import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "@/lib/env";
import type { ReviewEvidenceChecklist, ReviewWriteRecord, ReviewWriteRecordSummary, StockMediaAsset } from "@/lib/types";

const pendingDirName = "pending-review-writes";

function pendingDir() {
  return path.join(repoRoot(), ".runtime", pendingDirName);
}

function ensurePendingDir() {
  fs.mkdirSync(pendingDir(), { recursive: true });
}

function safeFilePart(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "").slice(0, 80) || "review-write";
}

function readRecord(filePath: string): ReviewWriteRecord | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as ReviewWriteRecord;
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
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
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
