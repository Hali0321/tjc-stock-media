import { NextRequest, NextResponse } from "next/server";
import { getAssetById } from "@/lib/catalog";
import { canOpenResourceSpace, canSeeAsset, normalizeRole } from "@/lib/permissions";
import { assetWithRoleImageUrls } from "@/lib/presentation";
import { normalizeAssetId } from "@/lib/request-validation";
import { resourceSpaceAssetUrl } from "@/lib/resourcespace-client";
import { latestPendingWriteForResource, pendingReviewWriteSummary } from "@/lib/pending-review-writes";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = normalizeAssetId((await params).id);
  const role = normalizeRole(request.nextUrl.searchParams.get("role"));
  if (!id) {
    return NextResponse.json({ error: "Malformed asset id." }, { status: 400 });
  }
  const { asset, source, related } = await getAssetById(id);
  if (!asset) {
    return NextResponse.json({ error: "Asset not found", source }, { status: 404 });
  }
  if (!canSeeAsset(role, asset)) {
    return NextResponse.json({ error: "This role cannot view this asset.", source }, { status: 403 });
  }
  const pending = latestPendingWriteForResource(asset.resourceSpaceId || asset.id);
  return NextResponse.json({
    asset: {
      ...assetWithRoleImageUrls(asset, role),
      pendingReviewWrite: pending ? pendingReviewWriteSummary(pending) : undefined
    },
    source,
    related: related.filter((item) => canSeeAsset(role, item)).map((item) => assetWithRoleImageUrls(item, role)),
    resourceSpaceUrl: asset.resourceSpaceId && canOpenResourceSpace(role) ? resourceSpaceAssetUrl(asset.resourceSpaceId) : null
  });
}
