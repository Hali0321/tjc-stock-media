import type { StockMediaAsset } from "@/lib/types";
import {
  assetHasChildrenYouthRisk,
  assetHasTaxonomyDrift,
  assetIsDuplicateCandidate,
  assetIsArchiveOnly,
  assetIsApproved,
  assetNeedsAiEnrichment,
  assetNeedsReview,
  assetNeedsRightsReview,
  assetNeedsSourceReview,
  assetNeedsStaleApprovalReview,
  assetNeedsUsageGuidance
} from "@/lib/asset-governance";
import { LARGE_MEDIA_LIMIT_BYTES, routeAssetForReview } from "@/lib/intake-routing";

export const LARGE_MEDIA_BYTES = LARGE_MEDIA_LIMIT_BYTES;

export const uploadDefaultState = {
  status: "Needs Review / Do Not Publish",
  message: "New media starts in review. A reviewer approves it before anyone can reuse it.",
  largeMediaMessage:
    "Video/audio and files over 100 MB use the large-media intake path. They still need review before reuse."
};

export const reviewActions = [
  { id: "approve-internal", label: "Approve internal use", backend: "Approve Internal", targetStatus: "Approved Internal" },
  { id: "approve-public", label: "Approve public/external use", backend: "Approve Public", targetStatus: "Approved Public" },
  { id: "archive-only", label: "Archive only", backend: "Searchable Archive", targetStatus: "Searchable Archive" },
  { id: "do-not-publish", label: "Mark Do Not Use", backend: "Do Not Use", targetStatus: "Do Not Use" },
  { id: "request-info", label: "Request changes", backend: "Request More Info", targetStatus: "Needs Review" },
  { id: "usage-guidance", label: "Add usage guidance", backend: "Add Usage Guidance", targetStatus: "Needs Review" }
] as const;

export type ReviewActionBackend = (typeof reviewActions)[number]["backend"];

export const reviewQueues = [
  { id: "pending", label: "Missing copyright evidence", description: "Evidence packet incomplete or needs reviewer decision." },
  { id: "children-youth", label: "People/minors status unresolved", description: "Contains, may contain, or has not ruled out people/youth." },
  { id: "missing-source", label: "Source access restricted", description: "Source, album, photographer, or custody path missing." },
  { id: "rights-review", label: "Rights review needed", description: "Owner, license, consent, attribution, or proof unclear." },
  { id: "usage-guidance", label: "Usage scope needed", description: "Approved/useful record lacks safe channel guidance." },
  { id: "internal-only", label: "Internal Only", description: "Useful but not public." },
  { id: "archive-candidates", label: "Archive Candidates", description: "Traceable, searchable, not promoted." },
  { id: "duplicate-candidates", label: "Duplicate Candidates", description: "Possible duplicate group or repeated source." },
  { id: "ai-enrichment", label: "AI Enrichment", description: "Needs tags, dimensions, people check, or TJC terms." },
  { id: "taxonomy-drift", label: "Taxonomy Drift", description: "Generic title or sparse controlled vocabulary." },
  { id: "stale-approvals", label: "Expiring/re-review due", description: "Approved assets that should be rechecked." },
  { id: "large-media", label: "Large Media", description: "Video/audio or large file intake." },
  { id: "doctrine-sacrament", label: "Doctrine/Sacrament Review", description: "Baptism, Holy Communion, footwashing, Holy Spirit, or doctrine context." },
  { id: "music-rights", label: "Music/Hymn Rights", description: "Hymns, music, choir, livestream, or worship audio/video clearance." },
  { id: "rendition-readiness", label: "Rendition Readiness", description: "Approved copy, derivative URL, or dimensions missing." }
] as const;

export type ReviewQueueId = (typeof reviewQueues)[number]["id"];

export function normalizeReviewQueueId(value: unknown): ReviewQueueId {
  const found = reviewQueues.find((queue) => queue.id === value);
  return found?.id || "pending";
}

export function isReviewActionBackend(value: unknown): value is ReviewActionBackend {
  return reviewActions.some((action) => action.backend === value);
}

export function assetMatchesReviewQueue(asset: StockMediaAsset, queueId: ReviewQueueId, duplicateGroupCounts?: Map<string, number>) {
  const largeMedia = asset.mediaType === "video" || asset.mediaType === "audio" || (asset.fileSizeBytes || 0) > LARGE_MEDIA_BYTES;

  switch (queueId) {
    case "pending":
      return assetNeedsReview(asset);
    case "children-youth":
      return assetHasChildrenYouthRisk(asset);
    case "missing-source":
      return assetNeedsSourceReview(asset);
    case "rights-review":
      return assetNeedsRightsReview(asset);
    case "usage-guidance":
      return assetNeedsUsageGuidance(asset);
    case "internal-only":
      return asset.status === "Approved Internal" || asset.usageScope === "Internal";
    case "archive-candidates":
      return assetIsArchiveOnly(asset);
    case "duplicate-candidates":
      return assetIsDuplicateCandidate(asset, duplicateGroupCounts);
    case "ai-enrichment":
      return assetNeedsAiEnrichment(asset);
    case "taxonomy-drift":
      return assetHasTaxonomyDrift(asset);
    case "stale-approvals":
      return assetNeedsStaleApprovalReview(asset);
    case "large-media":
      return largeMedia;
    case "doctrine-sacrament":
      return routeAssetForReview(asset).some((reason) => reason.id === "doctrine-sacrament-review");
    case "music-rights":
      return routeAssetForReview(asset).some((reason) => reason.id === "music-rights-review");
    case "rendition-readiness":
      return routeAssetForReview(asset).some((reason) => reason.id === "rendition-readiness-review");
  }
}

function meaningfulMetadataValue(value?: string) {
  return Boolean(value && !/^(unknown|not exported|not applicable|none|n\/a)$/i.test(value.trim()));
}

export function reviewRiskFlags(asset: StockMediaAsset, duplicateGroupCounts?: Map<string, number>) {
  const flags: string[] = [];
  if (assetHasChildrenYouthRisk(asset)) flags.push("Children/youth");
  if (asset.peopleRisk === "Adults visible") flags.push("People visible");
  if (!asset.peopleRisk || asset.peopleRisk === "Unknown") flags.push("People/minors status unresolved");
  if (assetNeedsSourceReview(asset)) flags.push("Missing source");
  if (assetNeedsRightsReview(asset)) flags.push("Rights unclear");
  if (!meaningfulMetadataValue(asset.consentStatus)) flags.push("Consent unknown");
  if (assetNeedsUsageGuidance(asset)) flags.push("No usage guidance");
  if (assetIsDuplicateCandidate(asset, duplicateGroupCounts)) flags.push("Possible duplicate");
  if (assetNeedsAiEnrichment(asset)) flags.push("Metadata enrichment");
  if (assetHasTaxonomyDrift(asset)) flags.push("Taxonomy drift");
  if (assetNeedsStaleApprovalReview(asset)) flags.push("Stale approval");
  if (asset.mediaType === "video" || asset.mediaType === "audio" || (asset.fileSizeBytes || 0) > LARGE_MEDIA_BYTES) flags.push("Large media");
  routeAssetForReview(asset).forEach((reason) => flags.push(reason.label));
  if (meaningfulMetadataValue(asset.sensitiveContext)) flags.push("Sensitive context");
  else if (asset.sensitiveContext === "Unknown") flags.push("Sensitivity unknown");
  return flags.length ? flags : ["Standard review"];
}

export function missingReviewFields(asset: StockMediaAsset) {
  const fields: string[] = [];
  if (assetIsApproved(asset) && !asset.reviewer) fields.push("reviewer");
  if (assetIsApproved(asset) && !asset.reviewedDate) fields.push("review date");
  if (!asset.peopleRisk || asset.peopleRisk === "Unknown") fields.push("people/minors");
  if (!meaningfulMetadataValue(asset.consentStatus)) fields.push("consent");
  if (assetNeedsRightsReview(asset) && !asset.rightsNotes) fields.push("rights notes");
  if (assetNeedsUsageGuidance(asset)) fields.push("usage guidance");
  if (assetNeedsSourceReview(asset)) fields.push("source");
  if (assetNeedsAiEnrichment(asset) && (!asset.tags?.length || !asset.tjcTerms?.length)) fields.push("AI/taxonomy suggestions");
  return fields;
}
