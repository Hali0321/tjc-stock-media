import type { DemoRole, MetadataConfidence, ReuseBlocker, ReuseDecision, ReuseState, StockMediaAsset } from "@/lib/types";
import {
  assetHasChildrenYouthRisk,
  assetHasRenditionGap,
  assetHasSourceProvenance,
  assetIsArchiveOnly,
  assetIsBlocked,
  assetIsApproved,
  assetNeedsReview,
  assetNeedsRightsReview,
  assetNeedsUsageGuidance,
  assetReviewComplete
} from "@/lib/asset-governance";

const blockerLabels: Record<ReuseState, string> = {
  "portal-ready": "Portal ready",
  "internal-ready": "Internal ready",
  "preview-only": "Preview only",
  "blocked-needs-review": "Needs reviewer decision",
  "blocked-source": "Source/provenance missing",
  "blocked-rights": "Rights or consent unclear",
  "blocked-people-minors": "People/minors review required",
  "blocked-reviewer-date": "Reviewer/date missing",
  "blocked-derivative": "Approved derivative missing",
  "blocked-sensitive": "Sensitive context needs reviewer",
  "blocked-archive": "Archive only",
  "blocked-do-not-use": "Do not use"
};

function blocker(code: ReuseState): ReuseBlocker {
  return { code, label: blockerLabels[code] };
}

function meaningfulValue(value?: string) {
  return Boolean(value && !/^(unknown|not exported|not applicable|none|n\/a)$/i.test(value.trim()));
}

export function assetHasSensitiveContext(asset: StockMediaAsset) {
  const text = [
    asset.sensitiveContext,
    asset.rightsNotes,
    ...(asset.tags || []),
    ...(asset.tjcTerms || []),
    ...(asset.usageTerms || [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!text.trim()) return false;
  return /sensitive|sacrament|communion|footwashing|baptism|children|youth|minor|privacy|consent concern|do not publish/.test(text);
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
  if (assetIsBlocked(asset)) blockers.push(blocker("blocked-do-not-use"));
  if (assetIsArchiveOnly(asset)) blockers.push(blocker("blocked-archive"));
  if (assetNeedsReview(asset) || !assetIsApproved(asset)) blockers.push(blocker("blocked-needs-review"));
  if (!assetHasSourceProvenance(asset)) blockers.push(blocker("blocked-source"));
  if (assetNeedsRightsReview(asset)) blockers.push(blocker("blocked-rights"));
  if (!asset.peopleRisk || asset.peopleRisk === "Unknown" || assetHasChildrenYouthRisk(asset)) blockers.push(blocker("blocked-people-minors"));
  if (!asset.reviewer || !asset.reviewedDate) blockers.push(blocker("blocked-reviewer-date"));
  if (assetHasRenditionGap(asset)) blockers.push(blocker("blocked-derivative"));
  if (assetHasSensitiveContext(asset)) blockers.push(blocker("blocked-sensitive"));
  return blockers;
}

function firstBlockingState(blockers: ReuseBlocker[]): ReuseState {
  return blockers[0]?.code || "preview-only";
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
          ? "Needs portal review"
          : blockerLabels[state];

  return {
    state,
    label,
    summary: publicReady
      ? "Source, rights, people/minors, review, and derivative checks pass."
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
