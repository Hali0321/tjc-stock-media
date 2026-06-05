import type { DemoRole, StockMediaAsset } from "@/lib/types";

export type AccessAction =
  | "viewAsset"
  | "viewReviewQueue"
  | "reviewAsset"
  | "downloadApprovedCopy"
  | "downloadOriginal"
  | "viewOriginalMetadata"
  | "viewResourceSpaceAdminLink"
  | "viewUnsafeAssets"
  | "viewInternalAssets"
  | "viewThumbnail"
  | "viewDetailPreview"
  | "uploadAsset";

export type AccessDecision = {
  allowed: boolean;
  reason?: string;
  label?: string;
};

const reviewerRoles: DemoRole[] = ["Reviewer", "DAM Admin"];

function isReviewer(role: DemoRole) {
  return reviewerRoles.includes(role);
}

function assetIsUnsafe(asset?: StockMediaAsset) {
  return Boolean(
    asset &&
      (asset.status === "Needs Review" ||
        asset.status === "Possible Minors" ||
        asset.status === "Do Not Use" ||
        asset.usageScope === "Do Not Publish" ||
        asset.usageScope === "Do Not Use")
  );
}

export function decideAccess(role: DemoRole, action: AccessAction, asset?: StockMediaAsset): AccessDecision {
  if (action === "viewReviewQueue") {
    return isReviewer(role)
      ? { allowed: true, label: "Review queue available" }
      : { allowed: false, reason: "Review is available to reviewers.", label: "Reviewer role required" };
  }

  if (action === "reviewAsset") {
    return isReviewer(role)
      ? { allowed: true, label: "Reviewer action available" }
      : { allowed: false, reason: "Contributor and Viewer roles cannot approve assets.", label: "Reviewer role required" };
  }

  if (action === "uploadAsset") {
    return role === "Contributor" || isReviewer(role)
      ? { allowed: true, label: "Upload intake available" }
      : { allowed: false, reason: "Upload is available to contributors.", label: "Contributor role required" };
  }

  if (action === "viewResourceSpaceAdminLink") {
    return isReviewer(role)
      ? { allowed: true, label: "Open ResourceSpace admin record" }
      : { allowed: false, reason: "ResourceSpace admin links are for reviewers and DAM admins.", label: "Admin link hidden" };
  }

  if (action === "downloadOriginal") {
    return role === "DAM Admin"
      ? { allowed: false, reason: "Original/master download is still routed through ResourceSpace or Google Shared Drive admin workflow.", label: "Original/master restricted" }
      : { allowed: false, reason: "Original/master files are restricted.", label: "Original/master restricted" };
  }

  if (action === "viewOriginalMetadata") {
    return isReviewer(role)
      ? { allowed: true, label: "Source metadata visible" }
      : { allowed: false, reason: "Original source paths are hidden from normal library cards.", label: "Source metadata hidden" };
  }

  if (!asset) {
    return { allowed: false, reason: "Asset is required for this action." };
  }

  if (action === "viewUnsafeAssets") {
    return isReviewer(role)
      ? { allowed: true, label: "Unsafe assets visible for governance" }
      : { allowed: false, reason: "Only reviewers can view assets that are not approved.", label: "Reviewer role required" };
  }

  if (action === "viewInternalAssets") {
    return role !== "Viewer"
      ? { allowed: true, label: "Internal ministry assets visible" }
      : { allowed: false, reason: "Internal ministry use is hidden from Viewer role.", label: "Contributor or reviewer role required" };
  }

  if (action === "viewAsset") {
    if (isReviewer(role)) return { allowed: true, label: "Asset visible" };
    if (asset.status === "Approved Public") return { allowed: true, label: "Approved for church-wide use" };
    if (asset.status === "Approved Internal" && role !== "Viewer") return { allowed: true, label: "Internal ministry asset visible" };
    return { allowed: false, reason: "This role cannot view this asset.", label: "Not visible" };
  }

  if (action === "viewThumbnail" || action === "viewDetailPreview") {
    if (assetIsUnsafe(asset) && !isReviewer(role)) {
      return { allowed: false, reason: "Preview is limited until review is complete.", label: "Preview restricted" };
    }
    return decideAccess(role, "viewAsset", asset);
  }

  if (action === "downloadApprovedCopy") {
    if (assetIsUnsafe(asset)) {
      return {
        allowed: false,
        reason: "Not downloadable yet. A reviewer must approve this asset before reuse.",
        label: "Not downloadable"
      };
    }
    if (asset.downloadPolicy === "approved-copy-allowed" && asset.status === "Approved Public") {
      return { allowed: true, label: "Download approved copy" };
    }
    if (asset.downloadPolicy === "internal-approved-copy-allowed" && asset.status === "Approved Internal" && role !== "Viewer") {
      return { allowed: true, label: "Download internal approved copy" };
    }
    return { allowed: false, reason: "This role cannot download this approved copy.", label: "Download blocked" };
  }

  return { allowed: false, reason: "Unsupported access action." };
}
