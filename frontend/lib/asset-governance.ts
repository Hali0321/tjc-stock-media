import type { AssetGovernancePassport, StockMediaAsset } from "@/lib/types";
import { validateAssetMetadataContract } from "@/lib/resourcespace-schema";

const reviewPlaceholderPattern = /review before sharing|reviewer must approve/i;
const rightsConcernPattern = /rights unclear|unknown|concern|not confirmed|needs review|review required/i;
const rightsClearPattern = /rights approved|rights clear|permission confirmed|consent confirmed|tjc-owned|tjc owned|licensed/i;
const hymnMusicPattern = /hymn|music|choir|livestream|accompaniment/i;
const sacramentPattern = /sacrament|baptism|footwashing|holy communion|communion|holy spirit|prayer in spirit/i;
const testimonyPattern = /testimony|pastoral|healing|illness|grief|counseling|spiritual battle/i;

export type AssetGovernanceCounts = {
  visibleToRole: number;
  approvedRaw: number;
  approved: number;
  portalReady: number;
  batchApprovedWithBlockers: number;
  needsReview: number;
  pendingReview: number;
  archive: number;
  archiveCandidates: number;
  blocked: number;
  childrenYouth: number;
  missingSource: number;
  rightsReview: number;
  approvedThisMonth: number;
};

export type AssetMetadataHealth = {
  score: number;
  state: "Complete" | "Needs review" | "Needs metadata";
  missing: string[];
};

export function assetIsApproved(asset: StockMediaAsset) {
  return asset.status === "Approved Public" || asset.status === "Approved Internal";
}

export function assetNeedsReview(asset: StockMediaAsset) {
  return asset.status === "Needs Review" || asset.status === "Possible Minors";
}

export function assetIsArchiveOnly(asset: StockMediaAsset) {
  return asset.status === "Searchable Archive" || asset.usageScope === "Archive Only" || asset.reuseTier === "archive-only" || asset.visibilityTier === "archive";
}

export function assetIsBlocked(asset: StockMediaAsset) {
  return asset.status === "Do Not Use" || asset.usageScope === "Do Not Use" || asset.withdrawalStatus === "withdrawn" || asset.withdrawalStatus === "takedown-requested";
}

export function assetHasCompatibleUsageScope(asset: StockMediaAsset) {
  if (asset.status === "Approved Public") return asset.usageScope === "Public" || asset.usageScope === "Public and Internal";
  if (asset.status === "Approved Internal") return asset.usageScope === "Internal" || asset.usageScope === "Public and Internal";
  return false;
}

export function assetIsUnsafeForReuse(asset?: StockMediaAsset) {
  return Boolean(
    asset &&
      (assetNeedsReview(asset) ||
        assetIsBlocked(asset) ||
        asset.usageScope === "Do Not Publish")
  );
}

export function assetHasChildrenYouthRisk(asset: StockMediaAsset) {
  return asset.peopleRisk === "Possible minors" || asset.sensitivityClass === "youth-sensitive" || /minor|children|youth|\bRE\b|religious education/i.test(asset.sensitiveContext || "");
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
  return Boolean(
    asset.sensitivityClass && asset.sensitivityClass !== "public-safe" ||
      /sensitive|sacrament|communion|footwashing|baptism|children|youth|minor|privacy|consent concern|do not publish/.test(text)
  );
}

function maturePolicyText(asset: StockMediaAsset) {
  return [
    asset.sensitiveContext,
    asset.doctrineSacramentTheme,
    asset.testimonyTheme,
    asset.hymnNumberOrTitle,
    asset.sermonTitle,
    asset.publicationTitle,
    asset.rightsNotes,
    ...(asset.tags || []),
    ...(asset.tjcTerms || []),
    ...(asset.usageTerms || [])
  ].filter(Boolean).join(" ");
}

export function assetHasHymnMusicRisk(asset: StockMediaAsset) {
  return asset.rightsBasis === "hymn-license" || asset.rightsBasis === "hymn-permission" || hymnMusicPattern.test(maturePolicyText(asset));
}

export function assetHasSacramentRisk(asset: StockMediaAsset) {
  return asset.sensitivityClass === "sacrament-sensitive" || sacramentPattern.test(maturePolicyText(asset));
}

export function assetHasTestimonyRisk(asset: StockMediaAsset) {
  return asset.sensitivityClass === "testimony-sensitive" || testimonyPattern.test(maturePolicyText(asset));
}

export function assetHasConsentEvidence(asset: StockMediaAsset) {
  if (asset.consentReleaseRecordId?.trim()) return true;
  return /confirmed|not applicable|documented exception/i.test(`${asset.consentStatus || ""} ${asset.rightsNotes || ""}`);
}

export function assetHasPublicChannelClearance(asset: StockMediaAsset) {
  if (!asset.approvedChannels?.length) return true;
  return asset.approvedChannels.some((channel) => ["website", "social", "print", "projection", "livestream"].includes(channel));
}

export function assetHasAcceptableRightsBasis(asset: StockMediaAsset) {
  if (asset.rightsBasis && asset.rightsBasis !== "unknown" && asset.rightsBasis !== "fair-use-internal-only") return true;
  return rightsClearPattern.test(`${asset.rightsStatus || ""} ${asset.rightsNotes || ""}`);
}

export function assetHasDomainReviewClearance(asset: StockMediaAsset) {
  if (assetHasChildrenYouthRisk(asset) && asset.domainReviewer !== "RE/minors") return false;
  if (assetHasSacramentRisk(asset) && asset.domainReviewer !== "doctrine") return false;
  if (assetHasTestimonyRisk(asset) && asset.domainReviewer !== "pastoral-sensitivity") return false;
  if (assetHasHymnMusicRisk(asset) && asset.domainReviewer !== "music-rights") return false;
  return true;
}

export function assetLifecycleIsCurrent(asset: StockMediaAsset, now: Date | number = new Date()) {
  const referenceDate = now instanceof Date ? now : new Date(now);
  const dateFields = [asset.expirationDate, asset.approvalRecheckDate, asset.expirationOrRecheckDate, asset.rightsExpirationDate, asset.consentExpirationDate];
  const stale = dateFields.some((value) => {
    if (!value) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date.getTime() < referenceDate.getTime();
  });
  if (stale) return false;
  if (asset.embargoDate) {
    const embargo = new Date(asset.embargoDate);
    if (!Number.isNaN(embargo.getTime()) && embargo.getTime() > referenceDate.getTime()) return false;
  }
  return asset.withdrawalStatus !== "embargoed" && asset.withdrawalStatus !== "expired";
}

export function assetHasSourceProvenance(asset: StockMediaAsset) {
  return Boolean(
    asset.sourcePath ||
      asset.sourceAccount ||
      asset.sourceSystem ||
      asset.sourceAlbumPath ||
      asset.sourceAlbumMemberships?.length ||
      asset.eventName ||
      (asset.collection && asset.collection !== "ResourceSpace export")
  );
}

export function assetNeedsSourceReview(asset: StockMediaAsset) {
  return !assetHasSourceProvenance(asset);
}

export function assetNeedsRightsReview(asset: StockMediaAsset) {
  const rightsStatus = (asset.rightsStatus || "").toLowerCase();
  const consentStatus = (asset.consentStatus || "").toLowerCase();
  const rightsNotes = (asset.rightsNotes || "").toLowerCase();
  const rightsText = `${rightsStatus} ${consentStatus} ${rightsNotes}`;

  if (assetIsBlocked(asset)) return true;
  if (asset.status === "Approved Public" && !assetHasAcceptableRightsBasis(asset)) return true;
  if (assetHasChildrenYouthRisk(asset) && !assetHasConsentEvidence(asset)) return true;
  if (assetHasHymnMusicRisk(asset) && (!assetHasAcceptableRightsBasis(asset) || !asset.requiredNotice || !asset.approvedChannels?.length)) return true;
  if (rightsConcernPattern.test(rightsStatus) || rightsConcernPattern.test(consentStatus)) return true;
  if (rightsClearPattern.test(rightsText)) return false;
  if (assetIsApproved(asset)) return true;
  return assetNeedsReview(asset) && !rightsText.trim();
}

export function assetNeedsUsageGuidance(asset: StockMediaAsset) {
  return !asset.usageGuidance || reviewPlaceholderPattern.test(asset.usageGuidance);
}

export function buildDuplicateGroupCounts(assets: StockMediaAsset[]) {
  const counts = new Map<string, number>();
  assets.forEach((asset) => {
    if (!asset.duplicateGroup) return;
    counts.set(asset.duplicateGroup, (counts.get(asset.duplicateGroup) || 0) + 1);
  });
  return counts;
}

export function assetIsDuplicateCandidate(asset: StockMediaAsset, duplicateGroupCounts?: Map<string, number>) {
  const role = asset.duplicateRole?.trim().toLowerCase();
  const hasGroup = Boolean(asset.duplicateGroup);
  const groupSize = asset.duplicateGroup ? duplicateGroupCounts?.get(asset.duplicateGroup) || 0 : 0;

  if (role && !/^(canonical|primary|original)$/.test(role)) return true;
  if (groupSize > 1) return true;
  return hasGroup && !role;
}

export function assetReviewComplete(asset: StockMediaAsset) {
  return Boolean(asset.reviewer && asset.reviewedDate);
}

export function assetNeedsAiEnrichment(asset: StockMediaAsset) {
  return Boolean(
    !asset.tags?.length ||
      !asset.tjcTerms?.length ||
      !asset.imageDimensions ||
      !asset.usageGuidance ||
      asset.peopleRisk === "Unknown"
  );
}

export function assetHasTaxonomyDrift(asset: StockMediaAsset) {
  const title = `${asset.title || ""} ${asset.originalFilename || ""}`.toLowerCase();
  const genericTitle = /\b(copy|img|dsc|asset|photo|untitled|mvp 2024 asset)\b/.test(title);
  const sparseTags = (asset.tags || []).length + (asset.tjcTerms || []).length < 2;
  return genericTitle || sparseTags;
}

export function assetHasRenditionGap(asset: StockMediaAsset) {
  return !asset.imageUrls?.download || !asset.imageUrls?.detail || (asset.mediaType === "photo" && !asset.imageDimensions);
}

export function assetIsPortalReady(asset: StockMediaAsset) {
  return asset.status === "Approved Public" && assetPortalBlockers(asset).length === 0;
}

export function assetNeedsStaleApprovalReview(asset: StockMediaAsset, now: Date | number = new Date()) {
  if (!assetLifecycleIsCurrent(asset, now)) return true;
  if (!assetIsApproved(asset) || !asset.reviewedDate) return false;
  const referenceDate = now instanceof Date ? now : new Date();
  const reviewed = new Date(asset.reviewedDate);
  if (Number.isNaN(reviewed.getTime())) return false;
  return referenceDate.getTime() - reviewed.getTime() > 1000 * 60 * 60 * 24 * 180;
}

export function assetPortalBlockers(asset: StockMediaAsset) {
  const blockers: string[] = [];
  const contract = validateAssetMetadataContract(asset);
  if (assetIsBlocked(asset)) blockers.push("Do not use");
  if (assetIsArchiveOnly(asset)) blockers.push("Archive only");
  if (asset.status !== "Approved Public") blockers.push("Not Approved Public");
  if (asset.reuseTier === "context-safe") blockers.push("Context-safe only");
  if (asset.visibilityTier && asset.visibilityTier !== "public") blockers.push("Visibility not public");
  if (asset.withdrawalStatus && asset.withdrawalStatus !== "active") blockers.push("Lifecycle blocks reuse");
  contract.missing.forEach((field) => blockers.push(`Metadata contract missing: ${field}`));
  if (!asset.peopleRisk || asset.peopleRisk === "Unknown") blockers.push("People/minors unknown");
  if (assetHasChildrenYouthRisk(asset)) blockers.push("Children/youth review required");
  if (assetHasChildrenYouthRisk(asset) && !assetHasConsentEvidence(asset)) blockers.push("Consent/release record missing");
  if (assetNeedsSourceReview(asset)) blockers.push("Source not traceable");
  if (assetNeedsRightsReview(asset)) blockers.push("Rights/consent unclear");
  if (!assetHasCompatibleUsageScope(asset)) blockers.push("Usage scope not public-ready");
  if (!assetReviewComplete(asset)) blockers.push("Reviewer/date missing");
  if (assetHasRenditionGap(asset)) blockers.push("Approved derivatives missing");
  if (assetHasSensitiveContext(asset)) blockers.push("Sensitive context review required");
  if (!assetHasDomainReviewClearance(asset)) blockers.push("Domain reviewer clearance missing");
  if (assetHasHymnMusicRisk(asset) && !asset.requiredNotice) blockers.push("Required notice missing");
  if (assetHasHymnMusicRisk(asset) && !asset.approvedChannels?.length) blockers.push("Hymn/music channel clearance missing");
  if (!assetHasPublicChannelClearance(asset)) blockers.push("Approved channels do not include public reuse");
  if (assetNeedsStaleApprovalReview(asset)) blockers.push("Approval is stale");
  return blockers;
}

function scoreFromBooleans(values: boolean[]) {
  return Math.round((values.filter(Boolean).length / values.length) * 100);
}

function assetDecision(asset: StockMediaAsset) {
  const hasTrustWarnings = assetNeedsRightsReview(asset) || assetNeedsSourceReview(asset) || assetHasChildrenYouthRisk(asset) || !asset.peopleRisk || asset.peopleRisk === "Unknown";
  if (assetIsBlocked(asset)) return "Do not use";
  if (assetNeedsReview(asset)) return "Needs review";
  if (assetIsArchiveOnly(asset)) return "Archive only";
  if (asset.status === "Approved Public" && asset.downloadPolicy === "approved-copy-allowed") return hasTrustWarnings ? "Needs review" : "Portal ready";
  if (asset.status === "Approved Internal") return hasTrustWarnings ? "Needs internal review" : "Internal ministry only";
  return "Ask reviewer";
}

export function assetGovernancePassport(asset: StockMediaAsset): AssetGovernancePassport {
  const health = assetMetadataHealth(asset);
  const blockers = assetPortalBlockers(asset);
  const hasTrustWarnings = assetNeedsRightsReview(asset) || assetNeedsSourceReview(asset) || assetHasChildrenYouthRisk(asset) || !asset.peopleRisk || asset.peopleRisk === "Unknown";
  const warnings = [
    assetNeedsAiEnrichment(asset) && "AI/tag enrichment needed",
    assetHasTaxonomyDrift(asset) && "Taxonomy drift weakens search",
    asset.duplicateGroup && "Duplicate group needs canonical decision",
    asset.duplicateSimilarityHint && "Near-duplicate similarity hint needs reviewer/admin decision",
    asset.suggestedTags?.length && asset.controlledVocabularySource !== "approved-historical-tjc" && "Suggested tags need controlled vocabulary review",
    assetNeedsUsageGuidance(asset) && "Usage guidance missing",
    assetNeedsStaleApprovalReview(asset) && "Approval recheck due",
    ...validateAssetMetadataContract(asset).warnings.map((field) => `Metadata contract warning: ${field}`)
  ].filter((item): item is string => Boolean(item));
  const policyScore = scoreFromBooleans([
    blockers.length === 0,
    warnings.length === 0,
    Boolean(asset.checksumSha256),
    Boolean(asset.imageUrls?.download)
  ]);

  return {
    score: Math.round((health.score + policyScore) / 2),
    decision: assetDecision(asset),
    portalReady: blockers.length === 0,
    blockers,
    warnings,
    evidence: [
      {
        label: "Source",
        value: assetHasSourceProvenance(asset) ? asset.sourcePath || asset.sourceAlbumPath || asset.sourceSystem || asset.collection : "Missing",
        tone: assetHasSourceProvenance(asset) ? "ok" : "warn"
      },
      {
        label: "Rights",
        value: assetNeedsRightsReview(asset) ? "Unknown - reviewer should confirm before public use" : asset.rightsStatus || asset.rightsNotes || "Rights review pending",
        tone: assetNeedsRightsReview(asset) ? "warn" : "ok"
      },
      {
        label: "People/minors",
        value: asset.peopleRisk || "Unknown",
        tone: assetHasChildrenYouthRisk(asset) || asset.peopleRisk === "Unknown" || !asset.peopleRisk ? "warn" : "ok"
      },
      {
        label: "Review",
        value: asset.reviewer && asset.reviewedDate ? `${asset.reviewer} / ${asset.reviewedDate}` : "Review pending",
        tone: assetReviewComplete(asset) ? "ok" : "warn"
      },
      {
        label: "Checksum",
        value: asset.checksumSha256 ? `${asset.checksumSha256.slice(0, 12)}...` : "Not exported",
        tone: asset.checksumSha256 ? "ok" : "info"
      },
      {
        label: "Portal",
        value: blockers.length ? `${blockers.length} blocker${blockers.length === 1 ? "" : "s"}` : "Portal ready",
        tone: blockers.length ? "warn" : "ok"
      }
    ],
    auditTrail: [
      {
        event: "Imported / indexed",
        actor: asset.sourceSystem || "ResourceSpace export",
        date: asset.importDate || asset.capturedDate || asset.eventDate || "Date not exported",
        detail: asset.sourcePath || asset.sourceAlbumPath || asset.collection || "Source path pending",
        tone: assetHasSourceProvenance(asset) ? "ok" : "warn"
      },
      {
        event: "Workflow state",
        actor: "ResourceSpace",
        date: asset.reviewedDate || "Pending",
        detail: asset.workflowState || asset.status,
        tone: assetNeedsReview(asset) ? "warn" : "info"
      },
      {
        event: "Rights decision",
        actor: asset.reviewer || "Reviewer pending",
        date: asset.reviewedDate || "Pending",
        detail: asset.rightsNotes || asset.rightsStatus || "Rights notes not exported",
        tone: assetNeedsRightsReview(asset) ? "warn" : "ok"
      },
      {
        event: "Reuse decision",
        actor: "TJC Stock Media policy",
        date: "Current",
        detail: assetDecision(asset),
        tone: assetIsPortalReady(asset) || (asset.status === "Approved Internal" && !hasTrustWarnings) ? "ok" : "warn"
      }
    ],
    renditions: [
      {
        label: "Preview",
        available: Boolean(asset.imageUrls?.detail || asset.preview),
        detail: asset.imageUrls?.detail || asset.preview ? "Detail preview available" : "Detail preview missing",
        intent: "Inspect asset before review or reuse"
      },
      {
        label: "Approved download",
        available: Boolean(asset.imageUrls?.download) && (asset.status === "Approved Public" || asset.status === "Approved Internal"),
        detail: asset.imageUrls?.download ? "Download derivative route configured" : "Download derivative missing",
        intent: "Safe copy for church workflows"
      },
      {
        label: "Web/social derivatives",
        available: false,
        detail: "Channel-specific derivative presets are not mapped yet",
        intent: "Website hero, newsletter, slides, square social"
      },
      {
        label: "Original/master",
        available: false,
        detail: "Source file remains restricted to approved media operations",
        intent: "Archive/master preservation"
      }
    ]
  };
}

export function assetMetadataHealth(asset: StockMediaAsset): AssetMetadataHealth {
  const missing: string[] = [];
  if (!assetHasSourceProvenance(asset)) missing.push("source");
  if (!asset.peopleRisk || asset.peopleRisk === "Unknown") missing.push("people");
  if (assetNeedsRightsReview(asset)) missing.push("rights");
  if (assetNeedsUsageGuidance(asset)) missing.push("usage");
  if (!assetReviewComplete(asset)) missing.push("review");

  const score = Math.round(((5 - missing.length) / 5) * 100);
  return {
    score,
    state: missing.length === 0 ? "Complete" : assetNeedsReview(asset) || !assetReviewComplete(asset) ? "Needs review" : "Needs metadata",
    missing
  };
}

export function countAssetGovernance(assets: StockMediaAsset[], now = new Date()): AssetGovernanceCounts {
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return {
    visibleToRole: assets.length,
    approvedRaw: assets.filter((asset) => asset.status === "Approved Public").length,
    approved: assets.filter(assetIsApproved).length,
    portalReady: assets.filter(assetIsPortalReady).length,
    batchApprovedWithBlockers: assets.filter((asset) => asset.status === "Approved Public" && !assetIsPortalReady(asset)).length,
    needsReview: assets.filter(assetNeedsReview).length,
    pendingReview: assets.filter(assetNeedsReview).length,
    archive: assets.filter((asset) => asset.status === "Searchable Archive").length,
    archiveCandidates: assets.filter(assetIsArchiveOnly).length,
    blocked: assets.filter(assetIsBlocked).length,
    childrenYouth: assets.filter(assetHasChildrenYouthRisk).length,
    missingSource: assets.filter(assetNeedsSourceReview).length,
    rightsReview: assets.filter(assetNeedsRightsReview).length,
    approvedThisMonth: assets.filter((asset) => asset.reviewedDate?.startsWith(monthPrefix) && assetIsApproved(asset)).length
  };
}
