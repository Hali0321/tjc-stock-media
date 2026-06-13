import type { StockMediaAsset } from "@/lib/types";
import { normalizeResourceSpaceRef } from "@/lib/request-validation";

export function normalizePackageRef(value: unknown) {
  return normalizeResourceSpaceRef(value);
}

export function packageAssetRef(asset: Pick<StockMediaAsset, "id" | "resourceSpaceId">) {
  return normalizePackageRef(asset.resourceSpaceId) || normalizePackageRef(asset.id);
}

export function normalizePackageRefs(refs: Array<string | number>) {
  return [...new Set(refs.map((ref) => normalizePackageRef(ref)).filter(Boolean))];
}
