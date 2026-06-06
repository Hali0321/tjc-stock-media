import { NextRequest, NextResponse } from "next/server";
import { getAssetRecordById } from "@/lib/catalog";
import { canReview, normalizeRole } from "@/lib/permissions";
import { normalizeAssetIds } from "@/lib/request-validation";

export const dynamic = "force-dynamic";

const supportedActions = new Set(["request-review", "mark-internal", "archive"]);

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    role?: string;
    action?: string;
    assetIds?: string[];
  };
  const role = normalizeRole(body.role);
  const assetIds = normalizeAssetIds(body.assetIds);

  if (!canReview(role)) {
    return NextResponse.json({ error: "Bulk governance actions require Reviewer or DAM Admin role." }, { status: 403 });
  }
  if (!body.action || !supportedActions.has(body.action)) {
    return NextResponse.json({ error: "Unsupported batch action." }, { status: 400 });
  }
  if (!assetIds.length) {
    return NextResponse.json({ error: "Select at least one asset." }, { status: 400 });
  }

  const records = await Promise.all(assetIds.map((id) => getAssetRecordById(id)));
  const found = records.filter((item) => item.asset).map((item) => item.asset!);
  const missing = assetIds.filter((id) => !found.some((asset) => asset.id === id));
  if (missing.length) {
    return NextResponse.json({ error: "One or more selected assets were not found.", missing }, { status: 404 });
  }

  const timestamp = new Date().toISOString();

  return NextResponse.json({
    ok: false,
    mode: "server-route-contract",
    action: body.action,
    count: found.length,
    auditRecords: found.map((asset) => ({
      assetId: asset.id,
      resourceSpaceId: asset.resourceSpaceId || asset.id,
      previousStatus: asset.status,
      requestedAction: body.action,
      reviewerRole: role,
      timestamp
    })),
    message: `Batch action preview ready for ${found.length} asset${found.length === 1 ? "" : "s"}: ${body.action.replace("-", " ")}. ResourceSpace API write mapping must be configured before persistence.`
  });
}
