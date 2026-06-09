import { NextRequest, NextResponse } from "next/server";
import { getAssetById } from "@/lib/catalog";
import { canOpenResourceSpace, canSeeAsset, normalizeRole } from "@/lib/permissions";
import { assetWithRoleImageUrls } from "@/lib/presentation";
import { normalizeAssetId } from "@/lib/request-validation";
import { resourceSpaceAssetUrl } from "@/lib/resourcespace-client";
import { latestPendingWriteForResource, pendingReviewWriteSummary } from "@/lib/pending-review-writes";
import type { DemoRole, MediaSourceStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

function sourceForRole(role: DemoRole, source: MediaSourceStatus): MediaSourceStatus {
  if (role !== "Viewer") return source;
  return {
    adapter: "demo-fallback",
    label: "Media library",
    detail: "Operational source diagnostics are available to reviewers.",
    readOnly: true
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = normalizeAssetId((await params).id);
  const role = normalizeRole(request.nextUrl.searchParams.get("role"));
  if (!id) {
    return NextResponse.json({ error: "Malformed asset id." }, { status: 400 });
  }
  const { asset, source, related } = await getAssetById(id);
  const safeSource = sourceForRole(role, source);
  if (!asset) {
    return NextResponse.json({ error: "Asset not found", source: safeSource }, { status: 404 });
  }
  if (!canSeeAsset(role, asset)) {
    return NextResponse.json({ error: "This role cannot view this asset.", source: safeSource }, { status: 403 });
  }
  const pending = latestPendingWriteForResource(asset.resourceSpaceId || asset.id);
  const opsView = role === "Reviewer" || role === "DAM Admin";
  return NextResponse.json({
    asset: {
      ...assetWithRoleImageUrls(asset, role),
      pendingReviewWrite: opsView && pending ? pendingReviewWriteSummary(pending) : undefined
    },
    source: safeSource,
    related: related.filter((item) => canSeeAsset(role, item)).map((item) => assetWithRoleImageUrls(item, role)),
    resourceSpaceUrl: opsView && asset.resourceSpaceId && canOpenResourceSpace(role) ? resourceSpaceAssetUrl(asset.resourceSpaceId) : null
  });
}
