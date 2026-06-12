import crypto from "node:crypto";
import path from "node:path";
import { writableRuntimeRoot } from "@/lib/env";
import { newestByTimestamp, safeEnumValue, safeFiniteNumber, safeIsoTimestamp, safeIsoTimestampIdPart } from "@/lib/persisted-record-safety";
import { normalizeRoleWithFallback } from "@/lib/permissions";
import { normalizeAssetId, normalizePersistedDisplayText, normalizePersistedSlugText, normalizeResourceSpaceRef } from "@/lib/request-validation";
import { appendRuntimeJsonLine, listRuntimeFiles, readRuntimeJsonLines } from "@/lib/runtime-file-store";
import type { DemoRole } from "@/lib/types";

export type AuditEventType =
  | "admin_readiness_denied"
  | "admin_readiness_viewed"
  | "download_gate_checked"
  | "approved_download"
  | "denied_download"
  | "upload_denied"
  | "upload_submitted"
  | "review_denied"
  | "review_evidence_incomplete"
  | "review_pending_write_queued"
  | "collection_draft_denied"
  | "collection_draft_previewed"
  | "saved_search_denied"
  | "saved_search_saved"
  | "saved_search_listed"
  | "package_draft_denied"
  | "package_draft_saved"
  | "package_draft_listed"
  | "batch_action_denied"
  | "batch_action_previewed"
  | "admin_denied"
  | "beta_feedback_submitted"
  | "beta_feedback_triaged";

export type AuditEventRecord = {
  id: string;
  type: AuditEventType;
  createdAt: string;
  role: DemoRole;
  actor: string;
  assetId?: string;
  resourceSpaceId?: string;
  packageId?: string;
  status: "allowed" | "denied" | "blocked" | "queued" | "preview";
  summary: string;
  details?: Record<string, string | number | boolean | string[] | null>;
};

const auditEventStatuses: AuditEventRecord["status"][] = ["allowed", "denied", "blocked", "queued", "preview"];
const maxAuditEventsReturned = 1000;
const minAuditReadWindow = 100;
const auditEventTypes: AuditEventType[] = [
  "admin_readiness_denied",
  "admin_readiness_viewed",
  "download_gate_checked",
  "approved_download",
  "denied_download",
  "upload_denied",
  "upload_submitted",
  "review_denied",
  "review_evidence_incomplete",
  "review_pending_write_queued",
  "collection_draft_denied",
  "collection_draft_previewed",
  "saved_search_denied",
  "saved_search_saved",
  "saved_search_listed",
  "package_draft_denied",
  "package_draft_saved",
  "package_draft_listed",
  "batch_action_denied",
  "batch_action_previewed",
  "admin_denied",
  "beta_feedback_submitted",
  "beta_feedback_triaged"
];

function auditDir() {
  return path.join(writableRuntimeRoot(), ".runtime", "audit-log");
}

function auditFile(createdAt = new Date()) {
  const month = createdAt.toISOString().slice(0, 7);
  return path.join(auditDir(), `${month}.jsonl`);
}

function safeId(value: unknown) {
  return normalizePersistedSlugText(value, 120);
}

function safeAssetId(value: unknown) {
  return normalizeAssetId(value);
}

function safeResourceSpaceId(value: unknown) {
  return normalizeResourceSpaceRef(value);
}

function safeStatus(value: unknown): AuditEventRecord["status"] {
  return safeEnumValue(value, auditEventStatuses, "preview");
}

function safeType(value: unknown): AuditEventType {
  return safeEnumValue(value, auditEventTypes, "admin_denied");
}

function safeDetails(value: unknown): AuditEventRecord["details"] {
  if (!value || Array.isArray(value) || typeof value !== "object") return undefined;
  const entries: Array<[string, string | number | boolean | string[] | null]> = [];
  for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 24)) {
    const safeKey = safeId(key).slice(0, 80);
    if (!safeKey) continue;
    if (Array.isArray(item)) {
      entries.push([safeKey, item.map((entry) => normalizePersistedDisplayText(entry, 120)).filter(Boolean).slice(0, 24)]);
    } else if (typeof item === "number") {
      entries.push([safeKey, safeFiniteNumber(item)]);
    } else if (typeof item === "boolean" || item === null) {
      entries.push([safeKey, item]);
    } else {
      entries.push([safeKey, normalizePersistedDisplayText(item, 240)]);
    }
  }
  return Object.fromEntries(entries);
}

function normalizeAuditEvent(input: unknown): AuditEventRecord | null {
  const raw = (input || {}) as Partial<AuditEventRecord>;
  const id = safeId(raw.id);
  if (!id) return null;
  const createdAt = safeIsoTimestamp(raw.createdAt) || new Date(0).toISOString();
  return {
    id,
    type: safeType(raw.type),
    createdAt,
    role: normalizeRoleWithFallback(raw.role),
    actor: normalizePersistedDisplayText(raw.actor, 160) || "local-beta:unknown",
    assetId: raw.assetId === undefined ? undefined : safeAssetId(raw.assetId),
    resourceSpaceId: raw.resourceSpaceId === undefined ? undefined : safeResourceSpaceId(raw.resourceSpaceId),
    packageId: raw.packageId === undefined ? undefined : safeId(raw.packageId),
    status: safeStatus(raw.status),
    summary: normalizePersistedDisplayText(raw.summary, 240) || "Audit event",
    details: safeDetails(raw.details)
  };
}

export function appendAuditEvent(event: Omit<AuditEventRecord, "id" | "createdAt" | "actor"> & { actor?: string }) {
  const createdAt = new Date();
  const draft: AuditEventRecord = {
    id: `${safeIsoTimestampIdPart(createdAt)}-${crypto.randomUUID().slice(0, 8)}`,
    createdAt: createdAt.toISOString(),
    actor: event.actor || event.role,
    ...event
  };
  const record = normalizeAuditEvent(draft) || draft;
  try {
    appendRuntimeJsonLine(auditFile(createdAt), record);
  } catch {
    // Audit logging must not break safe read/deny/write route behavior in local runtime.
  }
  return record;
}

export function appendRequiredAuditEvent(event: Omit<AuditEventRecord, "id" | "createdAt" | "actor"> & { actor?: string }) {
  const createdAt = new Date();
  const draft: AuditEventRecord = {
    id: `${safeIsoTimestampIdPart(createdAt)}-${crypto.randomUUID().slice(0, 8)}`,
    createdAt: createdAt.toISOString(),
    actor: event.actor || event.role,
    ...event
  };
  const record = normalizeAuditEvent(draft);
  if (!record) throw new Error("Audit event normalization failed.");
  appendRuntimeJsonLine(auditFile(createdAt), record);
  return record;
}

export function listAuditEvents(limit = 20): AuditEventRecord[] {
  const safeLimit = Math.max(1, Math.min(maxAuditEventsReturned, Math.trunc(limit) || 20));
  const readWindow = Math.max(minAuditReadWindow, Math.min(maxAuditEventsReturned, safeLimit * 2));
  const events = listRuntimeFiles(auditDir(), ".jsonl")
    .sort()
    .reverse()
    .flatMap((filePath) => readRuntimeJsonLines(filePath, normalizeAuditEvent, { maxLinesFromEnd: readWindow }));
  return newestByTimestamp(events, (event) => event.createdAt)
    .slice(0, safeLimit);
}

export function auditLogDiagnostics() {
  const events = listAuditEvents(200);
  const latest = events[0];
  const denied = events.filter((event) => event.status === "denied" || event.status === "blocked").length;
  const queued = events.filter((event) => event.status === "queued").length;
  return {
    count: events.length,
    latestAt: latest?.createdAt,
    denied,
    queued,
    recent: events.slice(0, 25).map((event) => ({
      id: event.id,
      type: event.type,
      createdAt: event.createdAt,
      role: event.role,
      actor: event.actor,
      status: event.status,
      assetId: event.assetId,
      resourceSpaceId: event.resourceSpaceId,
      packageId: event.packageId,
      summary: event.summary
    }))
  };
}
