import { decideAccess } from "@/lib/access-decisions";
import { normalizeAssetTitle, usageLabel, shortStatusLabel } from "@/lib/display";
import { statusToUserLabel, usageScopeToUserLabel } from "@/lib/resourcespace-schema";
import { missingReviewFields, reviewRiskFlags } from "@/lib/workflow-policy";
import type { DemoRole, StockMediaAsset } from "@/lib/types";

export function cardImageUrl(asset: StockMediaAsset) {
  return asset.imageUrls?.card || asset.preview || asset.thumbnail;
}

export function collectionImageUrl(asset: StockMediaAsset) {
  return asset.imageUrls?.collection || asset.preview || asset.thumbnail;
}

export function detailImageUrl(asset: StockMediaAsset) {
  return asset.imageUrls?.detail || asset.preview || asset.thumbnail;
}

export function assetDisplayTitle(asset: StockMediaAsset) {
  return normalizeAssetTitle(asset.title, asset.originalFilename, asset);
}

export function provenanceSummary(asset: StockMediaAsset, role: DemoRole) {
  const source = asset.sourceAccount || asset.sourceSystem || asset.collection || "ResourceSpace";
  const origin = asset.eventName || asset.sourcePlatform || asset.collection;
  const adminDecision = decideAccess(role, "viewOriginalMetadata", asset);
  return {
    source,
    origin,
    publicLabel: [source, origin].filter(Boolean).join(" · "),
    technicalPath: adminDecision.allowed ? asset.sourcePath || asset.masterDrivePath || "Source path not exported" : undefined
  };
}

export function downloadState(asset: StockMediaAsset, role: DemoRole) {
  const approved = decideAccess(role, "downloadApprovedCopy", asset);
  const original = decideAccess(role, "downloadOriginal", asset);
  return {
    approvedCopy: approved,
    originalMaster: original,
    cardLabel: approved.allowed ? "copy" : "blocked",
    panelLabel: approved.allowed ? approved.label || "Download approved copy" : approved.reason || "Not downloadable yet."
  };
}

export function guidanceFacts(asset: StockMediaAsset, role: DemoRole) {
  const canDownload = decideAccess(role, "downloadApprovedCopy", asset).allowed;
  const context = [...(asset.usageTerms || []), ...(asset.tjcTerms || []), ...(asset.tags || [])].slice(0, 3).join(", ") || asset.collection;
  return [
    {
      label: "Best used for",
      value: canDownload ? bestUseCopy(asset) : "Reference only until a reviewer approves public or internal ministry use."
    },
    {
      label: "Please avoid",
      value:
        asset.peopleRisk === "Possible minors"
          ? "Do not post publicly, crop tightly, or share on social before children/youth visibility is reviewed."
          : "Do not crop in a way that removes worship, ministry, or event context."
    },
    { label: "Caption suggestion", value: `${assetDisplayTitle(asset)}${context ? ` - ${context}` : ""}` },
    {
      label: "Credit requirement",
      value: asset.rightsNotes?.toLowerCase().includes("credit") ? asset.rightsNotes : "Credit not required unless noted by reviewer."
    },
    {
      label: "Ministry sensitivity",
      value:
        asset.peopleRisk === "Possible minors"
          ? "Review before public sharing if children/youth are visible."
          : asset.sensitiveContext || "Use respectfully and keep ministry context intact."
    }
  ];
}

function bestUseCopy(asset: StockMediaAsset) {
  const terms = [...(asset.usageTerms || []), ...(asset.tjcTerms || []), ...(asset.tags || [])].join(" ").toLowerCase();
  if (terms.includes("social")) return "Social media, event recap, and internal ministry updates when approval allows.";
  if (terms.includes("slide") || terms.includes("sermon")) return "Sermon slides, presentation backgrounds, Bible study decks, and worship visuals.";
  if (terms.includes("newsletter")) return "Newsletter, website article, ministry update, and internal recap.";
  if (asset.peopleRisk === "No people") return "Website hero, newsletter, worship slides, and design backgrounds.";
  return "Newsletter, worship slides, website article, internal recap, and ministry reports.";
}

export function trustFacts(asset: StockMediaAsset, role: DemoRole) {
  const provenance = provenanceSummary(asset, role);
  return [
    { label: "Approval", value: statusToUserLabel(asset.status) },
    { label: "Usage scope", value: usageScopeToUserLabel(asset.usageScope) },
    { label: "Source / provenance", value: provenance.publicLabel },
    { label: "Reviewer", value: asset.reviewer && asset.reviewedDate ? `${asset.reviewer} · ${asset.reviewedDate}` : "Review pending" },
    { label: "People/minors", value: asset.peopleRisk || "Unknown" },
    { label: "Rights", value: asset.rightsStatus || asset.rightsNotes || "Rights review pending" }
  ];
}

export function reviewFacts(asset: StockMediaAsset) {
  return {
    riskFlags: reviewRiskFlags(asset),
    missingFields: missingReviewFields(asset),
    reviewLine: asset.reviewer && asset.reviewedDate ? `Reviewed ${asset.reviewedDate} by ${asset.reviewer}` : "Review status pending",
    statusHistory: [
      asset.workflowState || "ResourceSpace workflow state pending",
      asset.reviewedDate ? `Reviewed ${asset.reviewedDate}` : "Awaiting reviewer decision",
      asset.status
    ]
  };
}

export function assetPresentation(asset: StockMediaAsset, role: DemoRole) {
  const title = assetDisplayTitle(asset);
  const quickTerms = [...(asset.usageTerms || []), ...(asset.tjcTerms || []), ...(asset.tags || [])].slice(0, 2);
  return {
    title,
    shortStatus: shortStatusLabel(asset.status),
    fullStatus: statusToUserLabel(asset.status),
    usage: usageLabel(asset.usageScope),
    cardSubtitle: asset.eventName || asset.collection,
    quickLabel: quickTerms[0] || asset.peopleRisk || asset.mediaType,
    image: cardImageUrl(asset),
    detailImage: detailImageUrl(asset),
    download: downloadState(asset, role),
    trustFacts: trustFacts(asset, role),
    guidanceFacts: guidanceFacts(asset, role),
    reviewFacts: reviewFacts(asset)
  };
}
