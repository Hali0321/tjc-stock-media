import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { getAssetRecordById, getReviewQueue } from "@/lib/catalog";
import { sourceEnvelope } from "@/lib/media-source/session";
import { updateResourceReviewStatus } from "@/lib/media-source/resourcespace-api";
import { latestPendingWriteForResource, pendingReviewWriteSummary } from "@/lib/pending-review-writes";
import { canOpenResourceSpace, canReview, normalizeRole } from "@/lib/permissions";
import { normalizeAssetId } from "@/lib/request-validation";
import { requestIdentity } from "@/lib/request-identity";
import { missingReviewEvidence, normalizeReviewChecklist, queuePendingReviewDecision } from "@/lib/review-decision";
import { isReviewActionBackend, reviewActions, reviewQueues, type ReviewActionBackend, type ReviewQueueId } from "@/lib/workflow-policy";
import { resourceSpaceAssetUrl } from "@/lib/resourcespace-client";
import { recordUsageEvent } from "@/lib/usage-analytics";
import type { ReviewEvidenceChecklist } from "@/lib/types";

export const dynamic = "force-dynamic";

function normalizeQueue(value: string | null): ReviewQueueId {
  const found = reviewQueues.find((queue) => queue.id === value);
  return found?.id || "pending";
}

export async function GET(request: NextRequest) {
  const identity = requestIdentity(request, request.nextUrl.searchParams.get("role"));
  const role = identity.role;
  if (!canReview(role)) {
    appendAuditEvent({
      type: "review_denied",
      role,
      actor: identity.id,
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
  const checklist = normalizeReviewChecklist(body.checklist);
  const note = typeof body.notes === "string" ? body.notes : "";
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
    return NextResponse.json({ error: "Review evidence is incomplete.", missingEvidence, ...envelope }, { status: 400 });
  }

  const pending = queuePendingReviewDecision({
    asset,
    requestedStatus: action?.targetStatus || asset.status,
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
      requestedStatus: action?.targetStatus || asset.status,
      pendingWriteId: pending.id
    }
  });
  recordUsageEvent({
    type: "review_action",
    role,
    actor: identity.id,
    assetId: asset.id,
    resourceSpaceId: asset.resourceSpaceId || asset.id,
    route: "/api/review",
    metadata: { action: body.action, requestedStatus: action?.targetStatus || asset.status }
  });
  const sync = await updateResourceReviewStatus(pending);
  return NextResponse.json(
    {
      ok: true,
      id: assetId,
      action: body.action,
      label: body.label || body.action,
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
        requestedStatus: action?.targetStatus || asset.status,
        reviewerRole: role,
        timestamp: pending.createdAt,
        notes: note,
        checklist,
        blockers: pending.blockers
      },
      mode: sync.ok ? "resourcespace-live-writeback" : "review-follow-up-preview"
    },
    { status: sync.ok ? 200 : 202 }
  );
}
