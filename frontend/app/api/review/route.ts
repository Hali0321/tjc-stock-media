import { NextRequest, NextResponse } from "next/server";
import { getReviewQueue } from "@/lib/media-source";
import { updateResourceReviewStatus } from "@/lib/media-source/resourcespace-api";
import { canReview, normalizeRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const role = normalizeRole(request.nextUrl.searchParams.get("role"));
  const queue = await getReviewQueue(role);
  return NextResponse.json({
    ...queue,
    canReview: canReview(role)
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    role?: string;
    id?: string;
    action?: "Approve Public" | "Approve Internal" | "Searchable Archive" | "Do Not Use";
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
      notes: body.notes || "",
      mode: "server-route-contract"
    },
    { status: result.status }
  );
}
