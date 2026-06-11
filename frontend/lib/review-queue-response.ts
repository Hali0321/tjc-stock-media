import { assetResourceRef, resourceSpaceRecordRef } from "@/lib/asset-refs";
import type { getReviewQueue } from "@/lib/catalog";
import type { createDamRouteSession } from "@/lib/dam-route-session";
import { latestPendingWriteForResource, pendingReviewWriteSummary } from "@/lib/pending-review-writes";
import { canOpenResourceSpace, canReview } from "@/lib/permissions";
import { resourceSpaceAssetUrl } from "@/lib/resourcespace-client";
import type { DemoRole, ReviewWriteRecordSummary, StockMediaAsset } from "@/lib/types";

type ReviewQueueResult = Awaited<ReturnType<typeof getReviewQueue>>;
type DamRouteSession = ReturnType<typeof createDamRouteSession>;

function reviewPendingWrites(assets: StockMediaAsset[]) {
  return Object.fromEntries(
    assets
      .map((asset) => {
        const pending = latestPendingWriteForResource(assetResourceRef(asset));
        return pending ? [asset.id, pendingReviewWriteSummary(pending)] : null;
      })
      .filter((item): item is [string, ReviewWriteRecordSummary] => Boolean(item))
  );
}

function reviewResourceSpaceUrls(assets: StockMediaAsset[], role: DemoRole) {
  return Object.fromEntries(
    assets
      .map((asset) => [asset.id, resourceSpaceRecordRef(asset)] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[1]) && canOpenResourceSpace(role))
      .map(([assetId, resourceSpaceRef]) => [assetId, resourceSpaceAssetUrl(resourceSpaceRef)])
  );
}

export function buildReviewQueueResponse(queue: ReviewQueueResult, session: DamRouteSession) {
  const role = session.role;
  return {
    ...queue,
    assets: session.assetsPayload(queue.assets),
    allAssets: session.assetsPayload(queue.allAssets),
    ...session.rawSourceEnvelope(queue.source),
    pendingWrites: reviewPendingWrites(queue.assets),
    resourceSpaceUrls: reviewResourceSpaceUrls(queue.assets, role),
    canReview: canReview(role)
  };
}
