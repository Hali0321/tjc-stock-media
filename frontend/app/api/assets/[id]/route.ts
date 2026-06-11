import { NextRequest, NextResponse } from "next/server";
import { assetResourceRef } from "@/lib/asset-refs";
import { buildAssetDetailResponse } from "@/lib/asset-detail-response";
import { getAssetById } from "@/lib/catalog";
import { createDamRouteSession } from "@/lib/dam-route-session";
import { canSeeAsset } from "@/lib/permissions";
import { normalizeAssetId } from "@/lib/request-validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = normalizeAssetId((await params).id);
  const session = createDamRouteSession(request, request.nextUrl.searchParams.get("role"));
  const role = session.role;
  if (!id) {
    return NextResponse.json({ error: "Malformed asset id." }, { status: 400 });
  }
  const { asset, source, related } = await getAssetById(id);
  const envelope = session.sourceEnvelope(source);
  if (!asset) {
    return NextResponse.json({ error: "Asset not found", ...envelope }, { status: 404 });
  }
  if (!canSeeAsset(role, asset)) {
    return NextResponse.json({ error: "This role cannot view this asset.", ...envelope }, { status: 403 });
  }
  const resourceSpaceId = assetResourceRef(asset);
  session.recordUsage({
    type: "asset_view",
    assetId: asset.id,
    resourceSpaceId,
    route: `/api/assets/${asset.id}`
  });
  return NextResponse.json(buildAssetDetailResponse({ asset, related, resourceSpaceId, session, source }));
}
