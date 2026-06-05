import { NextRequest, NextResponse } from "next/server";
import { getAssetById } from "@/lib/catalog";
import { canOpenResourceSpace, canSeeAsset, normalizeRole } from "@/lib/permissions";
import { resourceSpaceAssetUrl } from "@/lib/resourcespace-client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = normalizeRole(request.nextUrl.searchParams.get("role"));
  const { asset, source, related } = await getAssetById(id);
  if (!asset) {
    return NextResponse.json({ error: "Asset not found", source }, { status: 404 });
  }
  if (!canSeeAsset(role, asset)) {
    return NextResponse.json({ error: "This role cannot view this asset.", source }, { status: 403 });
  }
  return NextResponse.json({
    asset,
    source,
    related: related.filter((item) => canSeeAsset(role, item)),
    resourceSpaceUrl: asset.resourceSpaceId && canOpenResourceSpace(role) ? resourceSpaceAssetUrl(asset.resourceSpaceId) : null
  });
}
