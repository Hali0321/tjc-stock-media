import type { DemoRole, StockMediaAsset } from "@/lib/types";
import { buildReuseDecision, canDownloadReuse, canPreviewAsset } from "@/lib/reuse-policy";

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
  effect?: "allow" | "block" | "preview-only" | "pending";
  reasonCodes?: string[];
  allowedRenditions?: string[];
  reason?: string;
  label?: string;
};

const reviewerRoles: DemoRole[] = ["Reviewer", "DAM Admin"];

function isReviewer(role: DemoRole) {
  return reviewerRoles.includes(role);
}

export function decideAccess(role: DemoRole, action: AccessAction, asset?: StockMediaAsset): AccessDecision {
  if (action === "viewReviewQueue") {
    return isReviewer(role)
      ? { allowed: true, effect: "allow", reasonCodes: [], allowedRenditions: [], label: "Review queue available" }
      : { allowed: false, effect: "block", reasonCodes: ["role-cannot-review"], allowedRenditions: [], reason: "Review is available to reviewers.", label: "Reviewer role required" };
  }

  if (action === "reviewAsset") {
    return isReviewer(role)
      ? { allowed: true, effect: "allow", reasonCodes: [], allowedRenditions: [], label: "Reviewer action available" }
      : { allowed: false, effect: "block", reasonCodes: ["role-cannot-review"], allowedRenditions: [], reason: "Contributor and Viewer roles cannot approve assets.", label: "Reviewer role required" };
  }

  if (action === "uploadAsset") {
    return role === "Contributor" || isReviewer(role)
      ? { allowed: true, effect: "allow", reasonCodes: [], allowedRenditions: [], label: "Upload intake available" }
      : { allowed: false, effect: "block", reasonCodes: ["role-cannot-submit"], allowedRenditions: [], reason: "Upload is available to contributors.", label: "Contributor role required" };
  }

  if (action === "viewResourceSpaceAdminLink") {
    return role === "DAM Admin"
      ? { allowed: true, effect: "allow", reasonCodes: [], allowedRenditions: [], label: "Open ResourceSpace admin record" }
      : { allowed: false, effect: "block", reasonCodes: ["role-cannot-admin"], allowedRenditions: [], reason: "ResourceSpace admin links are for DAM admins.", label: "DAM Admin role required" };
  }

  if (action === "downloadOriginal") {
    return role === "DAM Admin"
      ? { allowed: false, effect: "pending", reasonCodes: ["request-original-required"], allowedRenditions: [], reason: "Original/master download is still routed through ResourceSpace or Google Shared Drive admin workflow.", label: "Original/master restricted" }
      : { allowed: false, effect: "block", reasonCodes: ["original-restricted"], allowedRenditions: [], reason: "Original/master files are restricted.", label: "Original/master restricted" };
  }

  if (action === "viewOriginalMetadata") {
    return isReviewer(role)
      ? { allowed: true, effect: "allow", reasonCodes: [], allowedRenditions: [], label: "Source metadata visible" }
      : { allowed: false, effect: "block", reasonCodes: ["source-metadata-hidden"], allowedRenditions: [], reason: "Original source paths are hidden from normal library cards.", label: "Source metadata hidden" };
  }

  if (!asset) {
    return { allowed: false, effect: "block", reasonCodes: ["asset-required"], allowedRenditions: [], reason: "Asset is required for this action." };
  }

  if (action === "viewUnsafeAssets") {
    return isReviewer(role)
      ? { allowed: true, effect: "allow", reasonCodes: [], allowedRenditions: [], label: "Unsafe assets visible for governance" }
      : { allowed: false, effect: "block", reasonCodes: ["role-cannot-view-unsafe"], allowedRenditions: [], reason: "Only reviewers can view assets that are not approved.", label: "Reviewer role required" };
  }

  if (action === "viewInternalAssets") {
    return role !== "Viewer"
      ? { allowed: true, effect: "allow", reasonCodes: [], allowedRenditions: [], label: "Internal ministry assets visible" }
      : { allowed: false, effect: "block", reasonCodes: ["role-cannot-view-internal"], allowedRenditions: [], reason: "Internal ministry use is hidden from Viewer role.", label: "Contributor or reviewer role required" };
  }

  if (action === "viewAsset") {
    if (isReviewer(role)) return { allowed: true, effect: "allow", reasonCodes: [], allowedRenditions: [], label: "Asset visible" };
    if (asset.status === "Approved Public") {
      const reuse = buildReuseDecision(asset);
      return {
        allowed: true,
        effect: reuse.downloadable ? "allow" : "preview-only",
        reasonCodes: reuse.reasonCodes,
        allowedRenditions: reuse.allowedRenditions,
        label: reuse.label
      };
    }
    if (asset.status === "Approved Internal" && role !== "Viewer") return { allowed: true, effect: "allow", reasonCodes: [], allowedRenditions: [], label: "Internal ministry asset visible" };
    return { allowed: false, effect: "block", reasonCodes: ["role-cannot-view-asset"], allowedRenditions: [], reason: "This role cannot view this asset.", label: "Not visible" };
  }

  if (action === "viewThumbnail" || action === "viewDetailPreview") {
    const reuse = buildReuseDecision(asset);
    if (!canPreviewAsset(asset, role)) {
      return { allowed: false, effect: "block", reasonCodes: reuse.reasonCodes, allowedRenditions: [], reason: "Preview is limited until review is complete.", label: "Preview restricted" };
    }
    return {
      allowed: true,
      effect: reuse.downloadable ? "allow" : "preview-only",
      reasonCodes: reuse.reasonCodes,
      allowedRenditions: reuse.allowedRenditions,
      label: reuse.downloadable ? "Preview available" : "Candidate preview only"
    };
  }

  if (action === "downloadApprovedCopy") {
    const reuse = buildReuseDecision(asset);
    if (!canDownloadReuse(asset, role)) {
      return {
        allowed: false,
        effect: "block",
        reasonCodes: reuse.reasonCodes,
        allowedRenditions: [],
        reason: reuse.blockers.length ? `Not downloadable yet: ${reuse.summary}.` : "Not downloadable yet. A reviewer must approve this asset before reuse.",
        label: reuse.label
      };
    }
    return {
      allowed: true,
      effect: "allow",
      reasonCodes: [],
      allowedRenditions: reuse.allowedRenditions.length ? reuse.allowedRenditions : ["web"],
      label: reuse.state === "internal-ready" ? "Download internal approved copy" : "Download approved web copy"
    };
  }

  return { allowed: false, effect: "block", reasonCodes: ["action-not-supported"], allowedRenditions: [], reason: "Unsupported access action." };
}
