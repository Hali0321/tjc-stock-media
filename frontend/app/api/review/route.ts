import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { getReviewQueue } from "@/lib/catalog";
import { createDamRouteSession } from "@/lib/dam-route-session";
import { canReview } from "@/lib/permissions";
import { readReviewActionRequestBody, runReviewActionWorkflow } from "@/lib/review-action-workflow";
import { buildReviewQueueResponse } from "@/lib/review-queue-response";
import { normalizeReviewQueueId } from "@/lib/workflow-policy";

export const dynamic = "force-dynamic";

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
  const queueId = normalizeReviewQueueId(request.nextUrl.searchParams.get("queue"));
  const queue = await getReviewQueue(role, queueId);
  return NextResponse.json(buildReviewQueueResponse(queue, session));
}

export async function POST(request: NextRequest) {
  const body = await readReviewActionRequestBody(request);
  const result = await runReviewActionWorkflow(request, body);
  return NextResponse.json(result.body, { status: result.status });
}
