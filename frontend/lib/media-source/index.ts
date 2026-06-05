import path from "node:path";
import { repoRoot } from "@/lib/env";
import { findResourceSpaceImageDerivative, type ImageVariant } from "@/lib/images";
import type { MediaSourceStatus, StockMediaAsset } from "@/lib/types";
import { demoFallbackAssets, demoFallbackStatus } from "@/lib/media-source/demo-fallback";
import { exportedMetadataStatus, getAssetsFromExport, latestMetadataExportPath } from "@/lib/media-source/exported-metadata";
import { getAssetsFromResourceSpaceApi, resourceSpaceApiStatus } from "@/lib/media-source/resourcespace-api";

let cachedAssets: StockMediaAsset[] | null = null;
let cachedStatus: MediaSourceStatus | null = null;

export async function getActiveMediaSource() {
  if (cachedAssets && cachedStatus) {
    return { assets: cachedAssets, status: cachedStatus };
  }

  const apiAssets = await getAssetsFromResourceSpaceApi();
  if (apiAssets?.length) {
    cachedAssets = apiAssets;
    cachedStatus = resourceSpaceApiStatus;
    return { assets: cachedAssets, status: cachedStatus };
  }

  const exportAssets = await getAssetsFromExport();
  if (exportAssets?.length) {
    cachedAssets = exportAssets;
    const exportPath = latestMetadataExportPath();
    cachedStatus = {
      ...exportedMetadataStatus,
      detail: exportPath
        ? `Reading ${path.relative(repoRoot(), exportPath)}. Approval writes still require ResourceSpace API field mapping.`
        : exportedMetadataStatus.detail
    };
    return { assets: cachedAssets, status: cachedStatus };
  }

  cachedAssets = demoFallbackAssets;
  cachedStatus = demoFallbackStatus;
  return { assets: cachedAssets, status: cachedStatus };
}

export function clearMediaSourceCache() {
  cachedAssets = null;
  cachedStatus = null;
}

export function findFilestoreDerivative(id: string, variant: ImageVariant) {
  return findResourceSpaceImageDerivative(id, variant);
}
