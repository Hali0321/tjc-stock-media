import { NextRequest, NextResponse } from "next/server";
import { getAssetRecordById, getReviewQueue } from "@/lib/catalog";
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
  const queueId = normalizeQueue(request.nextUrl.searchParams.get("queue"));
  const queue = await getReviewQueue(role, queueId);
  return NextResponse.json({
    ...queue,
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
    peopleVisibilityConfirmed: raw.peopleVisibilityConfirmed === true,
    childrenYouthChecked: raw.childrenYouthChecked === true,
    usageScopeSelected: raw.usageScopeSelected === true,
    derivativeAvailable: raw.derivativeAvailable === true,
    sensitiveContextChecked: raw.sensitiveContextChecked === true,
    creditRequirementChecked: raw.creditRequirementChecked === true
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
    required.push("derivativeAvailable", "sensitiveContextChecked", "creditRequirementChecked");
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
    return NextResponse.json({ error: "Reviewer controls are unavailable for this role." }, { status: 403 });
  }
  if (!assetId || !body.action) {
    return NextResponse.json({ error: "Missing asset id or review action." }, { status: 400 });
  }
  if (!isReviewActionBackend(body.action)) {
    return NextResponse.json({ error: "Unsupported review action." }, { status: 400 });
  }

  const { asset, source } = await getAssetRecordById(assetId);
  if (!asset) {
    return NextResponse.json({ error: "Asset not found.", source }, { status: 404 });
  }

  const action = reviewActions.find((item) => item.backend === body.action);
  const checklist = normalizeChecklist(body.checklist);
  const note = typeof body.notes === "string" ? body.notes : "";
  const missingEvidence = missingEvidenceFields(body.action, checklist, note);
  if (missingEvidence.length) {
    return NextResponse.json({ error: "Review evidence is incomplete.", missingEvidence, source }, { status: 400 });
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
  return NextResponse.json(
    {
      ok: true,
      id: assetId,
      action: body.action,
      label: body.label || body.action,
      notes: note,
      message: "Pending review write queued. It has not yet been written to ResourceSpace.",
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
      mode: "server-route-contract"
    },
    { status: 202 }
  );
}
