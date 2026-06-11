import { normalizeAssetId, normalizeResourceSpaceRef } from "@/lib/request-validation";
import type { StockMediaAsset } from "@/lib/types";

export function assetResourceRef(asset?: Pick<StockMediaAsset, "id" | "resourceSpaceId">) {
  return normalizeResourceSpaceRef(asset?.resourceSpaceId) || normalizeAssetId(asset?.id) || "media-record";
}
