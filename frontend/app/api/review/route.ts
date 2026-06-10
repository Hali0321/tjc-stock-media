import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { getAssetRecordById, getReviewQueue } from "@/lib/catalog";
import { sourceEnvelope } from "@/lib/media-source/session";
import { createPendingReviewWrite, latestPendingWriteForResource, pendingReviewWriteSummary } from "@/lib/pending-review-writes";
import { canOpenResourceSpace, canReview, normalizeRole } from "@/lib/permissions";
import { normalizeAssetId } from "@/lib/request-validation";
import { isReviewActionBackend, reviewActions, reviewQueues, type ReviewActionBackend, type ReviewQueueId } from "@/lib/workflow-policy";
import { resourceSpaceAssetUrl } from "@/lib/resourcespace-client";
import { buildReuseDecision } from "@/lib/reuse-policy";
import type { ReviewEvidenceChecklist } from "@/lib/types";

export const dynamic = "force-dynamic";

function normalizeQueue(value: string | null): ReviewQueueId {
  const found = reviewQueues.find((queue) => queue.id === value);
  return found?.id || "pending";
}

export async function GET(request: NextRequest) {
  const role = normalizeRole(request.nextUrl.searchParams.get("role"));
  if (!canReview(role)) {
    appendAuditEvent({
      type: "review_denied",
      role,
      status: "denied",
      summary: "Review queue access denied for role.",
      details: { reason: "role-cannot-review" }
    });
    return NextResponse.json({ error: "Review Inbox requires reviewer access." }, { status: 403 });
  }
  const queueId = normalizeQueue(request.nextUrl.searchParams.get("queue"));
  const queue = await getReviewQueue(role, queueId);
  const envelope = sourceEnvelope(queue.source);
  return NextResponse.json({
    ...queue,
    ...envelope,
    pendingWrites: Object.fromEntries(
      queue.assets
        .map((asset) => {
          const pending = latestPendingWriteForResource(asset.resourceSpaceId || asset.id);
          return pending ? [asset.id, pendingReviewWriteSummary(pending)] : null;
        })
        .filter((item): item is [string, ReturnType<typeof pendingReviewWriteSummary>] => Boolean(item))
    ),
    resourceSpaceUrls: Object.fromEntries(
      queue.assets
        .filter((asset) => asset.resourceSpaceId && canOpenResourceSpace(role))
        .map((asset) => [asset.id, resourceSpaceAssetUrl(asset.resourceSpaceId || asset.id)])
    ),
    canReview: canReview(role)
  });
}

function normalizeChecklist(value: unknown): ReviewEvidenceChecklist {
  const raw = typeof value === "object" && value ? (value as Partial<Record<keyof ReviewEvidenceChecklist, unknown>>) : {};
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

function missingEvidenceFields(action: ReviewActionBackend, checklist: ReviewEvidenceChecklist, note: string) {
  const required: Array<keyof ReviewEvidenceChecklist> = [
    "sourceConfirmed",
    "rightsConfirmed",
    "peopleVisibilityConfirmed",
    "childrenYouthChecked",
    "usageScopeSelected"
  ];
  if (action === "Approve Public") {
    required.push(
      "derivativeAvailable",
      "sensitiveContextChecked",
      "creditRequirementChecked",
      "attributionConfirmed",
      "expirationRereviewSet",
      "proofLinkAttached"
    );
  }
  const missing = required.filter((field) => !checklist[field]).map((field) => String(field));
  if (note.trim().length <= 10) missing.push("reviewNote");
  return missing;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    role?: string;
    id?: string;
    action?: ReviewActionBackend;
    label?: string;
    notes?: string;
    checklist?: Partial<ReviewEvidenceChecklist>;
    reviewerName?: string;
  };
  const role = normalizeRole(body.role);
  const assetId = normalizeAssetId(body.id);

  if (!canReview(role)) {
    appendAuditEvent({
      type: "review_denied",
      role,
      assetId: assetId || undefined,
      status: "denied",
      summary: "Review action denied for role.",
      details: { action: body.action || null, reason: "role-cannot-review" }
    });
    return NextResponse.json({ error: "Reviewer controls are unavailable for this role." }, { status: 403 });
  }
  if (!assetId || !body.action) {
    return NextResponse.json({ error: "Missing asset id or review action." }, { status: 400 });
  }
  if (!isReviewActionBackend(body.action)) {
    return NextResponse.json({ error: "Unsupported review action." }, { status: 400 });
  }

  const { asset, source } = await getAssetRecordById(assetId);
  const envelope = sourceEnvelope(source);
  if (!asset) {
    return NextResponse.json({ error: "Asset not found.", ...envelope }, { status: 404 });
  }

  const action = reviewActions.find((item) => item.backend === body.action);
  const checklist = normalizeChecklist(body.checklist);
  const note = typeof body.notes === "string" ? body.notes : "";
  const missingEvidence = missingEvidenceFields(body.action, checklist, note);
  if (missingEvidence.length) {
    appendAuditEvent({
      type: "review_evidence_incomplete",
      role,
      assetId: asset.id,
      resourceSpaceId: asset.resourceSpaceId || asset.id,
      status: "blocked",
      summary: "Review decision blocked by missing evidence.",
      details: { action: body.action, missingEvidence }
    });
    return NextResponse.json({ error: "Review evidence is incomplete.", missingEvidence, ...envelope }, { status: 400 });
  }

  const reuse = buildReuseDecision(asset);
  const pending = createPendingReviewWrite({
    asset,
    requestedStatus: action?.targetStatus || asset.status,
    reviewerRole: role === "DAM Admin" ? "DAM Admin" : "Reviewer",
    reviewerName: body.reviewerName,
    note,
    checklist,
    blockers: reuse.blockers.map((item) => item.label)
  });
  appendAuditEvent({
    type: "review_pending_write_queued",
    role,
    assetId: asset.id,
    resourceSpaceId: asset.resourceSpaceId || asset.id,
    status: "queued",
    summary: "Review decision queued for media-team follow-up.",
    details: {
      action: body.action,
      requestedStatus: action?.targetStatus || asset.status,
      pendingWriteId: pending.id
    }
  });
  return NextResponse.json(
    {
      ok: true,
      id: assetId,
      action: body.action,
      label: body.label || body.action,
      notes: note,
      message: "Review decision queued for media-team follow-up. Record status remains unchanged until review is completed.",
      pendingWriteId: pending.id,
      syncState: pending.syncState,
      auditRecord: {
        assetId: asset.id,
        resourceSpaceId: asset.resourceSpaceId || asset.id,
        previousStatus: asset.status,
        requestedStatus: action?.targetStatus || asset.status,
        reviewerRole: role,
        timestamp: pending.createdAt,
        notes: note,
        checklist,
        blockers: pending.blockers
      },
      mode: "review-follow-up-preview"
    },
    { status: 202 }
  );
}
