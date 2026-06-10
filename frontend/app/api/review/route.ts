import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { getReviewQueue } from "@/lib/catalog";
import { createDamRouteSession } from "@/lib/dam-route-session";
import { latestPendingWriteForResource, pendingReviewWriteSummary } from "@/lib/pending-review-writes";
import { canOpenResourceSpace, canReview } from "@/lib/permissions";
import { runReviewActionWorkflow, type ReviewActionRequestBody } from "@/lib/review-action-workflow";
import { reviewQueues, type ReviewQueueId } from "@/lib/workflow-policy";
import { resourceSpaceAssetUrl } from "@/lib/resourcespace-client";

export const dynamic = "force-dynamic";

function normalizeQueue(value: string | null): ReviewQueueId {
  const found = reviewQueues.find((queue) => queue.id === value);
  return found?.id || "pending";
}

export async function GET(request: NextRequest) {
  const session = createDamRouteSession(request, request.nextUrl.searchParams.get("role"));
  const role = session.role;
  if (!canReview(role)) {
    appendAuditEvent({
      type: "review_denied",
      role,
      actor: session.identity.id,
      status: "denied",
      summary: "Review queue access denied for role.",
      details: { reason: "role-cannot-review" }
    });
    return NextResponse.json({ error: "Review Inbox requires reviewer access." }, { status: 403 });
  }
  const queueId = normalizeQueue(request.nextUrl.searchParams.get("queue"));
  const queue = await getReviewQueue(role, queueId);
  const envelope = session.rawSourceEnvelope(queue.source);
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
  const body = (await request.json().catch(() => ({}))) as ReviewActionRequestBody;
  const result = await runReviewActionWorkflow(request, body);
  return NextResponse.json(result.body, { status: result.status });
}
