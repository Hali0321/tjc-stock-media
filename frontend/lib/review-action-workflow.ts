import { appendAuditEvent } from "@/lib/audit-log";
import { getAssetRecordById } from "@/lib/catalog";
import { sourceEnvelope } from "@/lib/media-source/session";
import { updateResourceReviewStatus } from "@/lib/media-source/resourcespace-api";
import { canReview } from "@/lib/permissions";
import { containsPrivateSourceText, containsUnsafePathText } from "@/lib/private-source-text";
import { requestIdentity } from "@/lib/request-identity";
import { normalizeAssetId } from "@/lib/request-validation";
import { missingReviewEvidence, normalizeReviewChecklist, queuePendingReviewDecision } from "@/lib/review-decision";
import { recordUsageEvent } from "@/lib/usage-analytics";
import { isReviewActionBackend, reviewActions, type ReviewActionBackend } from "@/lib/workflow-policy";
import type { NextRequest } from "next/server";
import type { ReviewEvidenceChecklist } from "@/lib/types";

export type ReviewActionRequestBody = {
  role?: string;
  id?: string;
  action?: ReviewActionBackend;
  label?: string;
  notes?: string;
  checklist?: Partial<ReviewEvidenceChecklist>;
  reviewerName?: string;
};

export type ReviewActionWorkflowResult = {
  status: number;
  body: Record<string, unknown>;
};

function safeDisplayText(value: unknown, maxLength: number) {
  const text = String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
  if (containsUnsafePathText(text)) return "";
  if (containsPrivateSourceText(text)) return "";
  return text;
}

export async function runReviewActionWorkflow(request: NextRequest, body: ReviewActionRequestBody): Promise<ReviewActionWorkflowResult> {
  const identity = requestIdentity(request, body.role);
  const role = identity.role;
  const assetId = normalizeAssetId(body.id);

  if (!canReview(role)) {
    appendAuditEvent({
      type: "review_denied",
      role,
      actor: identity.id,
      assetId: assetId || undefined,
      status: "denied",
      summary: "Review action denied for role.",
      details: { action: body.action || null, reason: "role-cannot-review" }
    });
    return { status: 403, body: { error: "Reviewer controls are unavailable for this role." } };
  }

  if (!assetId || !body.action) {
    return { status: 400, body: { error: "Missing asset id or review action." } };
  }
  if (!isReviewActionBackend(body.action)) {
    return { status: 400, body: { error: "Unsupported review action." } };
  }

  const { asset, source } = await getAssetRecordById(assetId);
  const envelope = sourceEnvelope(source);
  if (!asset) {
    return { status: 404, body: { error: "Asset not found.", ...envelope } };
  }

  const action = reviewActions.find((item) => item.backend === body.action);
  const checklist = normalizeReviewChecklist(body.checklist);
  const note = safeDisplayText(body.notes, 1200);
  const missingEvidence = missingReviewEvidence(body.action, checklist, note);
  if (missingEvidence.length) {
    appendAuditEvent({
      type: "review_evidence_incomplete",
      role,
      actor: identity.id,
      assetId: asset.id,
      resourceSpaceId: asset.resourceSpaceId || asset.id,
      status: "blocked",
      summary: "Review decision blocked by missing evidence.",
      details: { action: body.action, missingEvidence }
    });
    return { status: 400, body: { error: "Review evidence is incomplete.", missingEvidence, ...envelope } };
  }

  const requestedStatus = action?.targetStatus || asset.status;
  const pending = queuePendingReviewDecision({
    asset,
    requestedStatus,
    role,
    reviewerName: body.reviewerName,
    note,
    checklist
  });

  appendAuditEvent({
    type: "review_pending_write_queued",
    role,
    actor: identity.id,
    assetId: asset.id,
    resourceSpaceId: asset.resourceSpaceId || asset.id,
    status: "queued",
    summary: "Review decision queued for media-team follow-up.",
    details: {
      action: body.action,
      requestedStatus,
      pendingWriteId: pending.id
    }
  });
  const usageEvent = recordUsageEvent({
    type: "review_action",
    role,
    actor: identity.id,
    assetId: asset.id,
    resourceSpaceId: asset.resourceSpaceId || asset.id,
    route: "/api/review",
    metadata: { action: body.action, requestedStatus }
  });

  const sync = await updateResourceReviewStatus(pending);
  return {
    status: sync.ok ? 200 : 202,
    body: {
      ok: true,
      id: assetId,
      action: body.action,
      label: safeDisplayText(body.label, 120) || body.action,
      notes: note,
      message: sync.ok
        ? "ResourceSpace review fields were updated through the live API."
        : `Review decision queued for media-team follow-up. Record status remains unchanged until review is completed. ${sync.message}`,
      pendingWriteId: pending.id,
      syncState: sync.ok ? "synced_to_resourcespace" : sync.record?.syncState || pending.syncState,
      sync,
      auditRecord: {
        assetId: asset.id,
        resourceSpaceId: asset.resourceSpaceId || asset.id,
        previousStatus: asset.status,
        requestedStatus,
        actor: identity.id,
        reviewerRole: role,
        timestamp: pending.createdAt,
        notes: note,
        checklist,
        blockers: pending.blockers
      },
      usageRecord: {
        actor: identity.id,
        recorded: usageEvent.recorded,
        reason: usageEvent.reason
      },
      mode: sync.ok ? "resourcespace-live-writeback" : "review-follow-up-preview"
    }
  };
}
