import type { DemoRole, MetadataConfidence, ReuseBlocker, ReuseDecision, ReuseState, StockMediaAsset } from "@/lib/types";
import {
  assetHasChildrenYouthRisk,
  assetHasCompatibleUsageScope,
  assetHasRenditionGap,
  assetHasSensitiveContext,
  assetHasSourceProvenance,
  assetIsArchiveOnly,
  assetIsBlocked,
  assetIsApproved,
  assetNeedsReview,
  assetNeedsRightsReview,
  assetNeedsStaleApprovalReview,
  assetNeedsUsageGuidance,
  assetReviewComplete
} from "@/lib/asset-governance";

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

export type ViewerVerdictLabel =
  | "Ready to use"
  | "Review required before use"
  | "Source file restricted"
  | "Request access"
  | "Not available yet";

export type ViewerVerdictTone = "ready" | "review" | "restricted" | "request" | "unavailable";

export type ViewerVerdict = {
  label: ViewerVerdictLabel;
  tone: ViewerVerdictTone;
  title: string;
  reason: string;
  primaryAction: string;
  secondaryActions: string[];
  canDownload: boolean;
  downloadHref: string;
  blockers: ReuseBlocker[];
};

export type PortalReuseDecisionPacket = {
  role: DemoRole;
  reuse: ReuseDecision;
  metadataConfidence: MetadataConfidence;
  access: {
    viewAsset: AccessDecision;
    viewThumbnail: AccessDecision;
    viewDetailPreview: AccessDecision;
    downloadApprovedCopy: AccessDecision;
    downloadOriginal: AccessDecision;
    viewOriginalMetadata: AccessDecision;
    viewResourceSpaceAdminLink: AccessDecision;
  };
  viewerVerdict: ViewerVerdict;
};

const blockerLabels: Record<ReuseState, string> = {
  "portal-ready": "Portal ready",
  "internal-ready": "Internal ready",
  "preview-only": "Preview only",
  "blocked-needs-review": "Needs reviewer decision",
  "blocked-source": "Source/provenance missing",
  "blocked-rights": "Rights or consent unclear",
  "blocked-people-minors": "People/minors review required",
  "blocked-reviewer-date": "Reviewer/date missing",
  "blocked-derivative": "Approved copy missing",
  "blocked-sensitive": "Sensitive context needs reviewer",
  "blocked-archive": "Archive only",
  "blocked-do-not-use": "Do not use"
};

const reviewerRoles: DemoRole[] = ["Reviewer", "DAM Admin"];

function blocker(code: ReuseState): ReuseBlocker {
  return { code, label: blockerLabels[code] };
}

function meaningfulValue(value?: string) {
  return Boolean(value && !/^(unknown|not exported|not applicable|none|n\/a)$/i.test(value.trim()));
}

function isReviewer(role: DemoRole) {
  return reviewerRoles.includes(role);
}

function firstBlockingState(blockers: ReuseBlocker[]): ReuseState {
  return blockers[0]?.code || "preview-only";
}

function plainViewerReason(blockers: ReuseBlocker[]) {
  if (blockers.some((item) => item.code === "blocked-rights")) return "Rights or permission details need review.";
  if (blockers.some((item) => item.code === "blocked-people-minors")) return "People or youth visibility needs review.";
  if (blockers.some((item) => item.code === "blocked-derivative")) return "An approved copy is missing.";
  if (blockers.some((item) => item.code === "blocked-source")) return "Source information needs confirmation.";
  if (blockers.some((item) => item.code === "blocked-sensitive")) return "Ministry context needs review.";
  if (blockers.some((item) => item.code === "blocked-reviewer-date")) return "Reviewer evidence is incomplete.";
  if (blockers.some((item) => item.code === "blocked-archive")) return "This record is kept for reference only.";
  if (blockers.some((item) => item.code === "blocked-do-not-use")) return "This media is not available for reuse.";
  return "A reviewer must approve reuse before normal download.";
}

export function metadataConfidence(asset: StockMediaAsset): MetadataConfidence {
  return {
    source: assetHasSourceProvenance(asset) ? "verified" : "missing",
    peopleMinors: assetHasChildrenYouthRisk(asset)
      ? "children_youth_possible"
      : asset.peopleRisk && asset.peopleRisk !== "Unknown"
        ? "reviewed"
        : "unknown",
    rights: assetNeedsRightsReview(asset)
      ? meaningfulValue(asset.rightsStatus) || meaningfulValue(asset.rightsNotes)
        ? "review_required"
        : "unknown"
      : "approved",
    usageGuidance: assetNeedsUsageGuidance(asset) ? "missing" : "present",
    review: assetReviewComplete(asset) ? "complete" : "pending"
  };
}

export function reuseBlockers(asset: StockMediaAsset) {
  const blockers: ReuseBlocker[] = [];
  const addBlocker = (code: ReuseState) => {
    if (!blockers.some((item) => item.code === code)) blockers.push(blocker(code));
  };

  if (assetIsBlocked(asset)) addBlocker("blocked-do-not-use");
  if (assetIsArchiveOnly(asset)) addBlocker("blocked-archive");
  if (assetNeedsReview(asset) || !assetIsApproved(asset)) addBlocker("blocked-needs-review");
  if (!assetHasSourceProvenance(asset)) addBlocker("blocked-source");
  if (assetNeedsRightsReview(asset)) addBlocker("blocked-rights");
  if (!assetHasCompatibleUsageScope(asset)) addBlocker("blocked-needs-review");
  if (!asset.peopleRisk || asset.peopleRisk === "Unknown" || assetHasChildrenYouthRisk(asset)) addBlocker("blocked-people-minors");
  if (!asset.reviewer || !asset.reviewedDate) addBlocker("blocked-reviewer-date");
  if (assetHasRenditionGap(asset)) addBlocker("blocked-derivative");
  if (assetHasSensitiveContext(asset)) addBlocker("blocked-sensitive");
  if (assetNeedsStaleApprovalReview(asset)) addBlocker("blocked-reviewer-date");
  return blockers;
}

export function buildReuseDecision(asset: StockMediaAsset): ReuseDecision {
  const blockers = reuseBlockers(asset);
  const publicReady = asset.status === "Approved Public" && blockers.length === 0;
  const internalReady = asset.status === "Approved Internal" && blockers.length === 0;
  const state: ReuseState = publicReady ? "portal-ready" : internalReady ? "internal-ready" : firstBlockingState(blockers);
  const sensitiveBlocked = blockers.some((item) =>
    ["blocked-do-not-use", "blocked-archive", "blocked-rights", "blocked-people-minors", "blocked-sensitive"].includes(item.code)
  );
  const previewTier = publicReady || internalReady
    ? "reusable-preview"
    : sensitiveBlocked
      ? "reviewer-only-preview"
      : blockers.length
        ? "candidate-preview"
        : "candidate-preview";
  const label =
    publicReady
      ? "Portal ready"
      : internalReady
        ? "Internal ready"
        : assetIsApproved(asset)
          ? "Needs review"
          : blockerLabels[state];

  return {
    state,
    label,
    summary: publicReady
      ? "Source, rights, people/minors, review, and approved-copy checks pass."
      : internalReady
        ? "Approved for internal ministry use with required checks complete."
        : blockers.length
          ? blockers.map((item) => item.label).join(", ")
          : "Reviewer should confirm before reuse.",
    downloadable: publicReady || internalReady,
    previewTier,
    blockers,
    reasonCodes: blockers.map((item) => item.code),
    allowedRenditions: publicReady || internalReady ? ["web"] : []
  };
}

export function canDownloadReuse(asset: StockMediaAsset, role: DemoRole) {
  const decision = buildReuseDecision(asset);
  if (decision.state === "portal-ready") return true;
  return decision.state === "internal-ready" && role !== "Viewer";
}

export function canPreviewAsset(asset: StockMediaAsset, role: DemoRole) {
  const decision = buildReuseDecision(asset);
  if (role === "Reviewer" || role === "DAM Admin") return decision.previewTier !== "no-preview";
  if (decision.previewTier === "reusable-preview") return true;
  return decision.previewTier === "candidate-preview";
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
      ? { allowed: false, effect: "pending", reasonCodes: ["request-original-required"], allowedRenditions: [], reason: "Source-file download is still routed through approved media operations.", label: "Source file restricted" }
      : { allowed: false, effect: "block", reasonCodes: ["original-restricted"], allowedRenditions: [], reason: "Source-file access is restricted.", label: "Source file restricted" };
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

export function viewerVerdictForAsset(asset: StockMediaAsset, role: DemoRole): ViewerVerdict {
  const reuse = buildReuseDecision(asset);
  const download = decideAccess(role, "downloadApprovedCopy", asset);
  const canDownload = download.allowed;
  const blockers = reuse.blockers;
  const downloadHref = `/api/download/${asset.id}?role=${encodeURIComponent(role)}`;
  const sourceRestricted = blockers.some((item) => item.code === "blocked-source" || item.code === "blocked-derivative");
  const unavailable = blockers.some((item) => item.code === "blocked-archive" || item.code === "blocked-do-not-use");
  const accessOnly = blockers.some((item) => item.code === "blocked-sensitive");

  if (canDownload) {
    return {
      label: "Ready to use",
      tone: "ready",
      title: "Ready to use",
      reason: asset.usageGuidance || "Approved copy available. Check use guidance before sharing.",
      primaryAction: "Download approved copy",
      secondaryActions: ["View credit", "View use guidance"],
      canDownload,
      downloadHref,
      blockers
    };
  }

  if (unavailable) {
    return {
      label: "Not available yet",
      tone: "unavailable",
      title: "Not available yet",
      reason: plainViewerReason(blockers),
      primaryAction: "Request DAM review",
      secondaryActions: ["Ask media team"],
      canDownload,
      downloadHref,
      blockers
    };
  }

  if (sourceRestricted) {
    return {
      label: "Source file restricted",
      tone: "restricted",
      title: "Source file restricted",
      reason: plainViewerReason(blockers),
      primaryAction: "Request DAM review",
      secondaryActions: ["Ask media team", "Request source-file access"],
      canDownload,
      downloadHref,
      blockers
    };
  }

  if (accessOnly) {
    return {
      label: "Request access",
      tone: "request",
      title: "Request access",
      reason: plainViewerReason(blockers),
      primaryAction: "Request DAM review",
      secondaryActions: ["Ask media team"],
      canDownload,
      downloadHref,
      blockers
    };
  }

  return {
    label: "Review required before use",
    tone: "review",
    title: "Review required before use",
    reason: plainViewerReason(blockers),
    primaryAction: "Request DAM review",
    secondaryActions: ["Ask media team", "Request source-file access"],
    canDownload,
    downloadHref,
    blockers
  };
}

export function buildPortalReuseDecision(asset: StockMediaAsset, role: DemoRole): PortalReuseDecisionPacket {
  return {
    role,
    reuse: buildReuseDecision(asset),
    metadataConfidence: metadataConfidence(asset),
    access: {
      viewAsset: decideAccess(role, "viewAsset", asset),
      viewThumbnail: decideAccess(role, "viewThumbnail", asset),
      viewDetailPreview: decideAccess(role, "viewDetailPreview", asset),
      downloadApprovedCopy: decideAccess(role, "downloadApprovedCopy", asset),
      downloadOriginal: decideAccess(role, "downloadOriginal", asset),
      viewOriginalMetadata: decideAccess(role, "viewOriginalMetadata", asset),
      viewResourceSpaceAdminLink: decideAccess(role, "viewResourceSpaceAdminLink", asset)
    },
    viewerVerdict: viewerVerdictForAsset(asset, role)
  };
}
