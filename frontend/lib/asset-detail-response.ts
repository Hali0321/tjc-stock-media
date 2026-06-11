import type { getAssetById } from "@/lib/catalog";
import type { createDamRouteSession } from "@/lib/dam-route-session";
import { latestPendingWriteForResource, pendingReviewWriteSummary } from "@/lib/pending-review-writes";
import { canOpenResourceSpace, canReview, canSeeAsset } from "@/lib/permissions";
import { assetWithRoleImageUrls } from "@/lib/presentation";
import { resourceSpaceRecordRef } from "@/lib/asset-refs";
import { resourceSpaceAssetUrl } from "@/lib/resourcespace-client";

type AssetDetailResult = Awaited<ReturnType<typeof getAssetById>>;
type DamRouteSession = ReturnType<typeof createDamRouteSession>;

export function buildAssetDetailResponse({
  asset,
  related,
  resourceSpaceId,
  session,
  source
}: {
  asset: NonNullable<AssetDetailResult["asset"]>;
  related: AssetDetailResult["related"];
  resourceSpaceId: string;
  session: DamRouteSession;
  source: AssetDetailResult["source"];
}) {
  const role = session.role;
  const pending = latestPendingWriteForResource(resourceSpaceId);
  const isReviewerOrAdmin = canReview(role);
  const assetPayload = assetWithRoleImageUrls(asset, role);
  const resourceSpaceRef = resourceSpaceRecordRef(asset);
  return {
    asset: {
      ...session.assetPayload(assetPayload),
      pendingReviewWrite: isReviewerOrAdmin && pending ? pendingReviewWriteSummary(pending) : undefined
    },
    ...session.sourceEnvelope(source),
    related: related.filter((item) => canSeeAsset(role, item)).map((item) => session.assetPayload(assetWithRoleImageUrls(item, role))),
    resourceSpaceUrl: isReviewerOrAdmin && resourceSpaceRef && canOpenResourceSpace(role) ? resourceSpaceAssetUrl(resourceSpaceRef) : undefined
  };
}
