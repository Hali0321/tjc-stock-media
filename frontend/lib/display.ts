import type { StockMediaAsset } from "@/lib/types";

function titleCase(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function normalizeAssetTitle(rawTitle: string, originalFilename?: string, asset?: Pick<StockMediaAsset, "tags" | "tjcTerms" | "collection">) {
  const source = rawTitle || originalFilename || "Untitled asset";
  const cleaned = source
    .replace(/^copy of\s+/i, "")
    .replace(/\.(jpe?g|png|heic|heif|gif|tif|tiff|mp4|mov|m4v|mp3|wav|m4a|aac|flac|pdf)$/i, "")
    .replace(/\b(cleanup|edited|final|copy)\b/gi, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const context = [...(asset?.tjcTerms || []), ...(asset?.tags || [])]
    .find((item) => !/stock media candidate|mvp 2024|photo|image/i.test(item));

  if (/^img\s*(\d+)/i.test(cleaned)) return `Image ${cleaned.match(/\d+/)?.[0] || ""}`.trim();
  if (/^image\s*(\d+)/i.test(cleaned)) return `Image ${cleaned.match(/\d+/)?.[0] || ""}`.trim();
  if (/^bible\s+\d+/i.test(cleaned)) return context ? `${titleCase(context)} Detail` : "Bible Study Detail";
  if (/^mvp\s+2024\s+plant\s+\d+/i.test(cleaned)) return "Plant Detail";
  if (/^mvp\s+2024\s+photo\s+\d+/i.test(cleaned)) return context ? `MVP 2024 ${titleCase(context)}` : titleCase(cleaned);
  if (/^copy\s*of\s*img/i.test(source)) return titleCase(cleaned);

  return titleCase(cleaned || source);
}

export function shortStatusLabel(status: StockMediaAsset["status"]) {
  switch (status) {
    case "Approved Public":
      return "Approved";
    case "Approved Internal":
      return "Internal";
    case "Needs Review":
      return "Needs review";
    case "Searchable Archive":
      return "Archive";
    case "Do Not Use":
      return "Do not use";
    case "Possible Minors":
      return "Children/youth";
  }
}

export function usageLabel(scope: StockMediaAsset["usageScope"]) {
  switch (scope) {
    case "Public":
      return "Church-wide";
    case "Internal":
      return "Internal";
    case "Public and Internal":
      return "Church-wide";
    case "Archive Only":
      return "Archive only";
    case "Do Not Publish":
      return "Not publishable";
    case "Do Not Use":
      return "Blocked";
  }
}

export function formatResultCount(shown: number, total: number) {
  const shownText = shown.toLocaleString();
  const totalText = total.toLocaleString();
  return shown >= total ? `${totalText} matching assets` : `Showing first ${shownText} of ${totalText} matching assets`;
}

export function cardImageUrl(asset: StockMediaAsset) {
  return asset.preview || asset.thumbnail;
}

export function collectionImageUrl(asset: StockMediaAsset) {
  return asset.preview || asset.thumbnail;
}

export function friendlySourceLabel(asset: Pick<StockMediaAsset, "collection" | "resourceSpaceId" | "id">) {
  if (asset.collection) return asset.collection;
  return asset.resourceSpaceId ? `ResourceSpace ${asset.resourceSpaceId}` : `Asset ${asset.id}`;
}

export function friendlyReviewTrace(asset: Pick<StockMediaAsset, "reviewedDate" | "reviewer" | "resourceSpaceId" | "id">) {
  if (asset.reviewedDate && asset.reviewer) return `Reviewed ${asset.reviewedDate} by ${asset.reviewer}`;
  if (asset.reviewedDate) return `Reviewed ${asset.reviewedDate}`;
  return asset.resourceSpaceId ? `ResourceSpace ID ${asset.resourceSpaceId}` : `Asset ID ${asset.id}`;
}
