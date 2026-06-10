import { NextRequest, NextResponse } from "next/server";
import { getAssetById } from "@/lib/catalog";
import { roleSourceEnvelope } from "@/lib/media-source/session";
import { canOpenResourceSpace, canReview, canSeeAsset, normalizeRole } from "@/lib/permissions";
import { assetWithRoleImageUrls } from "@/lib/presentation";
import { normalizeAssetId } from "@/lib/request-validation";
import { resourceSpaceAssetUrl } from "@/lib/resourcespace-client";
import { latestPendingWriteForResource, pendingReviewWriteSummary } from "@/lib/pending-review-writes";
import { assetForRolePayload } from "@/lib/source-redaction";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = normalizeAssetId((await params).id);
  const role = normalizeRole(request.nextUrl.searchParams.get("role"));
  if (!id) {
    return NextResponse.json({ error: "Malformed asset id." }, { status: 400 });
  }
  const { asset, source, related } = await getAssetById(id);
  const envelope = roleSourceEnvelope(role, source);
  if (!asset) {
    return NextResponse.json({ error: "Asset not found", ...envelope }, { status: 404 });
  }
  if (!canSeeAsset(role, asset)) {
    return NextResponse.json({ error: "This role cannot view this asset.", ...envelope }, { status: 403 });
  }
  const pending = latestPendingWriteForResource(asset.resourceSpaceId || asset.id);
  const isReviewerOrAdmin = canReview(role);
  const assetPayload = assetWithRoleImageUrls(asset, role);
  return NextResponse.json({
    asset: {
      ...assetForRolePayload(role, assetPayload),
      pendingReviewWrite: isReviewerOrAdmin && pending ? pendingReviewWriteSummary(pending) : undefined
    },
    ...envelope,
    related: related.filter((item) => canSeeAsset(role, item)).map((item) => assetForRolePayload(role, assetWithRoleImageUrls(item, role))),
    resourceSpaceUrl: isReviewerOrAdmin && asset.resourceSpaceId && canOpenResourceSpace(role) ? resourceSpaceAssetUrl(asset.resourceSpaceId) : undefined
  });
}
