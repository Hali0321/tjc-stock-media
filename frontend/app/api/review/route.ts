import { NextRequest, NextResponse } from "next/server";
import { getReviewQueue } from "@/lib/catalog";
import { updateResourceReviewStatus } from "@/lib/media-source/resourcespace-api";
import { canReview, normalizeRole } from "@/lib/permissions";
import { reviewQueues, type ReviewActionBackend, type ReviewQueueId } from "@/lib/workflow-policy";
import { resourceSpaceAssetUrl } from "@/lib/resourcespace-client";

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
    resourceSpaceUrls: Object.fromEntries(
      queue.assets
        .filter((asset) => asset.resourceSpaceId && canReview(role))
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
  };
  const role = normalizeRole(body.role);

  if (!canReview(role)) {
    return NextResponse.json({ error: "Reviewer controls are unavailable for this role." }, { status: 403 });
  }
  if (!body.id || !body.action) {
    return NextResponse.json({ error: "Missing asset id or review action." }, { status: 400 });
  }

  const result = await updateResourceReviewStatus();
  return NextResponse.json(
    {
      ...result,
      id: body.id,
      action: body.action,
      label: body.label || body.action,
      notes: body.notes || "",
      mode: "server-route-contract"
    },
    { status: result.status }
  );
}
