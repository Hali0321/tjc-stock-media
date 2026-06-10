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
    return JSON.parse(line) as AuditEventRecord;
  } catch {
    return null;
  }
}

export function appendAuditEvent(event: Omit<AuditEventRecord, "id" | "createdAt" | "actor"> & { actor?: string }) {
  const createdAt = new Date();
  const record: AuditEventRecord = {
    id: `${createdAt.toISOString().replace(/[:.]/g, "-")}-${crypto.randomUUID().slice(0, 8)}`,
    createdAt: createdAt.toISOString(),
    actor: event.actor || event.role,
    ...event
  };
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
    recent: events.slice(0, 10).map((event) => ({
      id: event.id,
      type: event.type,
      createdAt: event.createdAt,
      role: event.role,
      status: event.status,
      assetId: event.assetId,
      resourceSpaceId: event.resourceSpaceId,
      packageId: event.packageId,
      summary: event.summary
    }))
  };
}
