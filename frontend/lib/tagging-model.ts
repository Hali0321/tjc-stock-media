import type { StockMediaAsset } from "@/lib/types";

export const trustedImportSourceAccount = "lm.photos@tjc.org";

export const tagBuckets = {
  assetType: ["photo", "video", "audio", "graphic", "document"],
  ministry: ["Religious Education", "Sabbath Service", "Evangelical Service", "Fellowship", "Hymns of Praise"],
  eventType: ["Bible study", "worship", "testimony", "baptism", "prayer", "fellowship meal"],
  subject: ["Bible", "people", "children/youth", "choir", "stage", "flowers"],
  visualContent: ["book", "plant", "water", "landscape", "portrait", "graphic"],
  colorMoodStyle: ["warm", "welcoming", "quiet", "hopeful", "seasonal"],
  seasonContext: ["Sabbath", "spring", "retreat", "service", "church life"],
  language: ["English", "Chinese", "Spanish"],
  source: ["Google Photos", "Google Drive", trustedImportSourceAccount],
  approvalReuseTier: ["stock-safe", "context-safe", "archive-only"],
  rightsUseChannel: ["website", "slides", "newsletter", "social", "internal training", "archive only"],
  tjcTerms: ["Sabbath Service", "Religious Education", "Evangelical Service", "Testimony", "Hymns of Praise"]
} as const;

export type TagBucketName = keyof typeof tagBuckets;

export type TagLifecycle = "ai-suggested" | "human-approved" | "source-imported" | "controlled-taxonomy" | "freeform";

export type TaggingFieldModel = {
  lifecycle: TagLifecycle;
  fields: string[];
  governance: string;
};

export const taggingFieldModel: TaggingFieldModel[] = [
  {
    lifecycle: "ai-suggested",
    fields: ["ai_title_suggestion", "ai_visible_tag_suggestions", "ai_tjc_term_suggestions"],
    governance: "Searchable hints only; never final rights, minors, consent, doctrine, or approval."
  },
  {
    lifecycle: "human-approved",
    fields: ["human_title_final", "human_tags_final", "visible_content_tags", "TJC_terms"],
    governance: "Reviewer-owned final discovery vocabulary."
  },
  {
    lifecycle: "source-imported",
    fields: ["source_account", "source_album", "source_album_memberships", "import_batch"],
    governance: "Preserve provenance and album membership without mutating source media."
  },
  {
    lifecycle: "controlled-taxonomy",
    fields: ["visible_content_tags", "TJC_terms", "usage_terms", "reuse_tier"],
    governance: "Store canonical labels; expand aliases only at search time."
  },
  {
    lifecycle: "freeform",
    fields: ["approval_notes", "rights_notes", "sensitive_context"],
    governance: "Useful for review context, not broad approval automation."
  }
];

function compact(values: Array<string | number | undefined | null>) {
  return values
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

function list(values?: string[]) {
  return values?.map((value) => value.trim()).filter(Boolean) || [];
}

export function assetSearchTerms(asset: StockMediaAsset) {
  return compact([
    asset.id,
    asset.title,
    asset.collection,
    asset.status,
    asset.usageScope,
    asset.mediaType,
    asset.peopleRisk,
    asset.eventName,
    asset.eventDate,
    asset.capturedDate,
    asset.importDate,
    asset.sourcePlatform,
    asset.sourceSystem,
    asset.sourceAccount,
    asset.sourceAlbum,
    asset.resourceSpaceId,
    asset.originalFilename,
    asset.fileExtension,
    asset.rightsStatus,
    asset.qualityStatus,
    asset.sensitiveContext,
    asset.consentStatus,
    asset.aiTitleSuggestion,
    asset.aiQualitySuggestion,
    asset.aiPeopleOrMinorFlag,
    asset.humanAiDecision,
    ...list(asset.sourceAlbumMemberships),
    ...list(asset.tags),
    ...list(asset.tjcTerms),
    ...list(asset.usageTerms),
    ...list(asset.aiVisibleTagSuggestions),
    ...list(asset.aiTjcTermSuggestions)
  ]);
}

export function isTrustedLmPhotosSource(asset: Pick<StockMediaAsset, "sourceAccount" | "sourceSystem">) {
  return asset.sourceAccount?.toLowerCase() === trustedImportSourceAccount || /lm photos/i.test(asset.sourceSystem || "");
}
