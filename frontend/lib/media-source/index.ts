import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "@/lib/env";
import { canSeeAsset } from "@/lib/permissions";
import type { DemoRole, MediaSourceStatus, SearchResult, StockMediaAsset } from "@/lib/types";
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

function matchesQuery(asset: StockMediaAsset, query: string) {
  if (!query.trim()) return true;
  const haystack = [
    asset.title,
    asset.collection,
    asset.status,
    asset.usageScope,
    asset.mediaType,
    asset.peopleRisk,
    ...(asset.tags || []),
    ...(asset.tjcTerms || [])
  ]
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

function matchesFilters(asset: StockMediaAsset, filters: string[]) {
  return filters.every((filter) => {
    const value = filter.toLowerCase();
    if (value === "approved public" || value === "church-wide use") return asset.status === "Approved Public";
    if (value === "approved internal" || value === "internal ministry") return asset.status === "Approved Internal";
    if (["photo", "video", "audio", "graphic"].includes(value)) return asset.mediaType === value;
    if (value === "no people") return asset.peopleRisk === "No people";
    if (value === "adults only") return asset.peopleRisk === "Adults visible";
    if (value === "possible minors" || value === "children/youth") return asset.peopleRisk === "Possible minors";
    return [asset.collection, asset.title, ...(asset.tags || []), ...(asset.tjcTerms || [])]
      .join(" ")
      .toLowerCase()
      .includes(value);
  });
}

function statusWeight(asset: StockMediaAsset) {
  if (asset.status === "Approved Public") return 0;
  if (asset.status === "Approved Internal") return 1;
  if (asset.status === "Needs Review") return 2;
  if (asset.status === "Searchable Archive") return 3;
  return 4;
}

function curatedWeight(asset: StockMediaAsset) {
  const terms = [asset.title, ...(asset.tags || []), ...(asset.tjcTerms || [])].join(" ").toLowerCase();
  let score = 0;
  if (asset.tags?.length || asset.tjcTerms?.length) score += 8;
  if (terms.includes("bible")) score += 28;
  if (terms.includes("worship")) score += 18;
  if (terms.includes("fellowship")) score += 16;
  if (terms.includes("flower")) score += 14;
  if (terms.includes("plant")) score += 12;
  if (terms.includes("fountain")) score += 12;
  if (terms.includes("water")) score += 8;
  if (terms.includes("stage")) score += 8;
  if (terms.includes("beach")) score += 2;
  return score;
}

export async function searchAssets({
  role,
  query,
  filters,
  limit = 72
}: {
  role: DemoRole;
  query: string;
  filters: string[];
  limit?: number;
}): Promise<SearchResult> {
  const { assets, status } = await getActiveMediaSource();
  const visible = assets
    .filter((asset) => canSeeAsset(role, asset))
    .filter((asset) => matchesQuery(asset, query))
    .filter((asset) => matchesFilters(asset, filters))
    .sort(
      (a, b) =>
        statusWeight(a) - statusWeight(b) ||
        curatedWeight(b) - curatedWeight(a) ||
        a.title.localeCompare(b.title)
    );

  return {
    assets: visible.slice(0, limit),
    total: visible.length,
    source: status,
    counts: {
      approved: assets.filter((asset) => asset.status === "Approved Public" || asset.status === "Approved Internal").length,
      needsReview: assets.filter((asset) => asset.status === "Needs Review" || asset.status === "Possible Minors").length,
      archive: assets.filter((asset) => asset.status === "Searchable Archive").length,
      blocked: assets.filter((asset) => asset.status === "Do Not Use").length
    }
  };
}

export async function getAssetById(id: string) {
  const { assets, status } = await getActiveMediaSource();
  return { asset: assets.find((item) => item.id === id) || null, source: status };
}

export function findFilestoreDerivative(id: string, variant: "thumb" | "preview" | "download") {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) return null;
  const filestore = path.join(repoRoot(), ".runtime", "filestore");
  if (!fs.existsSync(filestore)) return null;

  const suffixes =
    variant === "thumb"
      ? [`${id}thm_`, `${id}col_`, `${id}pre_`]
      : variant === "preview"
        ? [`${id}scr_`, `${id}pre_`, `${id}thm_`]
        : [`${id}scr_`, `${id}pre_`];

  const stack = [filestore];
  while (stack.length) {
    const dir = stack.pop();
    if (!dir) break;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (suffixes.some((suffix) => entry.name.startsWith(suffix)) && /\.(jpg|jpeg)$/i.test(entry.name)) {
        return fullPath;
      }
    }
  }
  return null;
}

export async function getReviewQueue(role: DemoRole) {
  const { assets, status } = await getActiveMediaSource();
  const queue = assets
    .filter((asset) => asset.status === "Needs Review" || asset.status === "Possible Minors" || asset.status === "Searchable Archive")
    .sort((a, b) => statusWeight(a) - statusWeight(b) || a.title.localeCompare(b.title))
    .slice(0, role === "DAM Admin" || role === "Reviewer" ? 80 : 0);

  return { assets: queue, source: status };
}
