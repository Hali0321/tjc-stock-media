import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "@/lib/env";
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

function auditDir() {
  return path.join(repoRoot(), ".runtime", "audit-log");
}

function auditFile(createdAt = new Date()) {
  const month = createdAt.toISOString().slice(0, 7);
  return path.join(auditDir(), `${month}.jsonl`);
}

function readJsonLine(line: string): AuditEventRecord | null {
  try {
    return normalizeAuditEvent(JSON.parse(line));
  } catch {
    return null;
  }
}

function safeText(value: unknown, maxLength: number) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function containsPrivateSourceText(value: string) {
  return /source path|master drive|checksum/i.test(value);
}

function safeDisplayText(value: unknown, maxLength: number) {
  const text = safeText(value, maxLength);
  return text.includes("..") || /[\\/]/.test(text) || containsPrivateSourceText(text) ? "" : text;
}

function safeId(value: unknown) {
  const text = safeText(value, 120);
  if (containsPrivateSourceText(text)) return "";
  return text.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "");
}

function safeIso(value: unknown) {
  const text = safeText(value, 40);
  return Number.isNaN(Date.parse(text)) ? "" : text;
}

function safeRole(value: unknown): DemoRole {
  return value === "Contributor" || value === "Reviewer" || value === "DAM Admin" ? value : "Viewer";
}

function safeStatus(value: unknown): AuditEventRecord["status"] {
  return value === "allowed" || value === "denied" || value === "blocked" || value === "queued" || value === "preview"
    ? value
    : "preview";
}

function safeType(value: unknown): AuditEventType {
  const allowed: AuditEventType[] = [
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
  return allowed.includes(value as AuditEventType) ? value as AuditEventType : "admin_denied";
}

function safeDetails(value: unknown): AuditEventRecord["details"] {
  if (!value || Array.isArray(value) || typeof value !== "object") return undefined;
  const entries: Array<[string, string | number | boolean | string[] | null]> = [];
  for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 24)) {
    const safeKey = safeId(key).slice(0, 80);
    if (!safeKey) continue;
    if (Array.isArray(item)) {
      entries.push([safeKey, item.map((entry) => safeDisplayText(entry, 120)).filter(Boolean).slice(0, 24)]);
    } else if (typeof item === "number") {
      entries.push([safeKey, Number.isFinite(item) ? item : 0]);
    } else if (typeof item === "boolean" || item === null) {
      entries.push([safeKey, item]);
    } else {
      entries.push([safeKey, safeDisplayText(item, 240)]);
    }
  }
  return Object.fromEntries(entries);
}

function normalizeAuditEvent(input: unknown): AuditEventRecord | null {
  const raw = (input || {}) as Partial<AuditEventRecord>;
  const id = safeId(raw.id);
  if (!id) return null;
  const createdAt = safeIso(raw.createdAt) || new Date(0).toISOString();
  return {
    id,
    type: safeType(raw.type),
    createdAt,
    role: safeRole(raw.role),
    actor: safeDisplayText(raw.actor, 160) || "local-beta:unknown",
    assetId: raw.assetId === undefined ? undefined : safeId(raw.assetId),
    resourceSpaceId: raw.resourceSpaceId === undefined ? undefined : safeId(raw.resourceSpaceId),
    packageId: raw.packageId === undefined ? undefined : safeId(raw.packageId),
    status: safeStatus(raw.status),
    summary: safeDisplayText(raw.summary, 240) || "Audit event",
    details: safeDetails(raw.details)
  };
}

export function appendAuditEvent(event: Omit<AuditEventRecord, "id" | "createdAt" | "actor"> & { actor?: string }) {
  const createdAt = new Date();
  const draft: AuditEventRecord = {
    id: `${createdAt.toISOString().replace(/[:.]/g, "-")}-${crypto.randomUUID().slice(0, 8)}`,
    createdAt: createdAt.toISOString(),
    actor: event.actor || event.role,
    ...event
  };
  const record = normalizeAuditEvent(draft) || draft;
  try {
    fs.mkdirSync(auditDir(), { recursive: true });
    fs.appendFileSync(auditFile(createdAt), `${JSON.stringify(record)}\n`, "utf8");
  } catch {
    // Audit logging must not break safe read/deny/write route behavior in local runtime.
  }
  return record;
}

export function listAuditEvents(limit = 20): AuditEventRecord[] {
  const dir = auditDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".jsonl"))
    .sort()
    .reverse()
    .flatMap((file) => {
      const filePath = path.join(dir, file);
      return fs
        .readFileSync(filePath, "utf8")
        .split("\n")
        .filter(Boolean)
        .map(readJsonLine)
        .filter((event): event is AuditEventRecord => Boolean(event));
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
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
