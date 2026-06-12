import { safeNonNegativeInt } from "@/lib/persisted-record-safety";
import type { PublishStatus, StockMediaAsset, UsageScope } from "@/lib/types";

export type ResourceSpaceRecord = Record<string, string | number | null | undefined>;

const mediaExtensions = {
  video: ["mp4", "mov", "m4v"],
  audio: ["mp3", "wav", "m4a", "aac", "flac"],
  graphic: ["pdf", "psd", "ai", "svg"],
  document: ["doc", "docx", "txt"]
};

const statusLabels: Record<PublishStatus, string> = {
  "Approved Public": "ResourceSpace Approved Public",
  "Approved Internal": "ResourceSpace Approved Internal",
  "Needs Review": "Please review before public sharing",
  "Searchable Archive": "Archive only",
  "Do Not Use": "Do not publish externally",
  "Possible Minors": "Contains children/youth"
};

const usageLabels: Record<UsageScope, string> = {
  Public: "Church-wide use",
  Internal: "Internal ministry use",
  "Public and Internal": "Church-wide and internal",
  "Archive Only": "Archive only",
  "Do Not Publish": "Do not publish yet",
  "Do Not Use": "Do not use"
};

function value(row: ResourceSpaceRecord, ...keys: string[]) {
  for (const key of keys) {
    const found = row[key] ?? row[key.toLowerCase()] ?? row[key.toUpperCase()];
    if (found !== undefined && found !== null && String(found).trim()) return String(found).trim();
  }
  return "";
}

export function splitResourceSpaceList(input?: string) {
  return (input || "")
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function titleCase(input: string) {
  return input
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function cleanDisplayTitle(row: ResourceSpaceRecord, fallback: string) {
  const original = value(row, "original_filename") || fallback;
  const tags = splitResourceSpaceList(value(row, "visible_content_tags", "human_tags_final"));
  const tjcTerms = splitResourceSpaceList(value(row, "tjc_terms", "TJC_terms"));
  let base = fallback
    .replace(/^copy of\s+/i, "")
    .replace(/\.(jpe?g|png|heic|heif|gif|tif|tiff|mp4|mov|m4v|mp3|wav|m4a|aac|flac|pdf)$/i, "")
    .replace(/已增强-降噪-\d+$/i, "")
    .replace(/[a-f0-9]{8}-[a-f0-9-]{20,}/gi, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const longNumericSuffix = base.match(/^(.*?)\s+\d{8,}\s*o?$/i);
  if (longNumericSuffix) base = longNumericSuffix[1].replace(/^\d+\s+/, "").trim() || base;

  const letters = (base.match(/[a-z]/gi) || []).length;
  const digits = (base.match(/\d/g) || []).length;
  const archiveContext = value(row, "source_album", "import_batch", "event_or_topic", "event_name") || "Archive";
  const resourceId = value(row, "resource_id", "resourcespace_ref", "ref");

  if (/^_?DSC0*\d+/i.test(base)) {
    const serial = base.match(/\d+/)?.[0]?.replace(/^0+/, "") || "";
    return `Photo${serial ? ` ${serial}` : ""}`;
  }
  if (/^(?:[a-f0-9]{8,}|[a-f0-9]{6,}\s+version\s+\d+|[a-f0-9]{6,}\s+\d{8,})/i.test(base)) {
    return `${archiveContext} Photo ${resourceId}`.trim();
  }
  if ((digits >= 1 && letters <= 2) || (digits >= 8 && letters < 6)) {
    return `${archiveContext} Photo ${resourceId}`.trim();
  }
  if (/^\d?[a-z0-9]{5,}$/i.test(base) && !/[aeiou].*[aeiou]/i.test(base)) {
    return `${archiveContext} Photo ${resourceId}`.trim();
  }
  if (/^[A-Z0-9-]{12,}$/i.test(base) || base.length < 3) {
    const context = [...tjcTerms, ...tags].find((item) => !/stock media candidate|mvp 2024/i.test(item));
    return context ? `${titleCase(context)} Detail` : `Media Record ${resourceId}`.trim();
  }
  if (/^bible\s+\d+/i.test(base)) return titleCase(base);
  if (/^beach\s+\d+/i.test(base)) return titleCase(base);
  if (/bench bible/i.test(original)) return "Bench Bible";

  return titleCase(base);
}

export function normalizeResourceSpaceStatus(row: ResourceSpaceRecord): PublishStatus {
  const raw = value(row, "publish_status", "status");
  if (raw === "Approved Public" || raw === "Approved Internal" || raw === "Needs Review" || raw === "Do Not Use") return raw;
  if (raw === "Searchable Archive" || raw === "Archive - Not Promoted") return "Searchable Archive";
  if (/possible minors|children|youth/i.test(raw)) return "Possible Minors";
  if (value(row, "minors_visible", "children_visible").toLowerCase() === "yes") return "Possible Minors";
  if (value(row, "public_safe").toLowerCase() === "yes" && /public/i.test(value(row, "usage_scope"))) return "Approved Public";
  if (value(row, "public_safe").toLowerCase() === "yes" && /internal/i.test(value(row, "usage_scope"))) return "Approved Internal";
  return "Needs Review";
}

export function statusToUserLabel(status: PublishStatus) {
  return statusLabels[status];
}

export function normalizeUsageScope(row: ResourceSpaceRecord): UsageScope {
  const raw = value(row, "usage_scope").replace(/internal only/i, "Internal");
  if (raw === "Public" || raw === "Internal" || raw === "Public and Internal" || raw === "Archive Only" || raw === "Do Not Use") return raw;
  if (/public.*internal|church-wide/i.test(raw)) return "Public and Internal";
  if (/internal/i.test(raw)) return "Internal";
  if (/archive/i.test(raw)) return "Archive Only";
  if (/do not use/i.test(raw)) return "Do Not Use";
  return "Do Not Publish";
}

export function usageScopeToUserLabel(scope: UsageScope) {
  return usageLabels[scope];
}

export function normalizePeopleRisk(row: ResourceSpaceRecord): StockMediaAsset["peopleRisk"] {
  const minors = value(row, "minors_visible", "children_visible").toLowerCase();
  const people = value(row, "people_visible").toLowerCase();
  if (minors === "yes") return "Possible minors";
  if (people === "yes") return "Adults visible";
  if (people === "no") return "No people";
  return "Unknown";
}

function normalizeMediaType(row: ResourceSpaceRecord): StockMediaAsset["mediaType"] {
  const raw = value(row, "media_type", "resource_type").toLowerCase();
  const ext = value(row, "file_extension", "original_extension", "file_format").toLowerCase().replace(/^\./, "");
  if (raw.includes("video") || mediaExtensions.video.includes(ext)) return "video";
  if (raw.includes("audio") || mediaExtensions.audio.includes(ext)) return "audio";
  if (raw.includes("graphic") || mediaExtensions.graphic.includes(ext)) return "graphic";
  if (mediaExtensions.document.includes(ext)) return "document";
  return "photo";
}

function normalizeRightsStatus(row: ResourceSpaceRecord) {
  const raw = value(row, "rights_status");
  if (!raw) return undefined;
  if (/^(approved public|approved internal|needs review|searchable archive|archive - not promoted|do not use|possible minors)$/i.test(raw)) {
    return undefined;
  }
  return raw;
}

function normalizeDownloadPolicy(status: PublishStatus): StockMediaAsset["downloadPolicy"] {
  if (status === "Approved Public") return "approved-copy-allowed";
  if (status === "Approved Internal") return "internal-approved-copy-allowed";
  return "not-downloadable";
}

export function imageUrlsForResource(id: string, cacheKey?: string) {
  const encoded = encodeURIComponent(id);
  const version = cacheKey ? `&v=${encodeURIComponent(cacheKey.slice(0, 16))}` : "";
  return {
    small: `/api/assets/thumbnail/${encoded}?variant=small${version}`,
    card: `/api/assets/thumbnail/${encoded}?variant=card${version}`,
    collection: `/api/assets/thumbnail/${encoded}?variant=collection${version}`,
    detail: `/api/assets/thumbnail/${encoded}?variant=detail${version}`,
    download: `/api/assets/thumbnail/${encoded}?variant=download${version}`
  };
}

export function validateResourceSpaceRecord(row: ResourceSpaceRecord) {
  const id = value(row, "resource_id", "resourcespace_ref", "canonical_asset_id", "ref");
  return {
    ok: Boolean(id),
    id,
    missing: id ? [] : ["resource_id"]
  };
}

function isMeaningful(value?: string) {
  return Boolean(value && !/^(unknown|not exported|not applicable|none|n\/a|needs review|review required)$/i.test(value.trim()));
}

export type MetadataContractValidation = {
  ok: boolean;
  missing: string[];
  warnings: string[];
};

export function validateAssetMetadataContract(asset: StockMediaAsset): MetadataContractValidation {
  const missing: string[] = [];
  const warnings: string[] = [];
  const requireField = (field: string, present: boolean) => {
    if (!present) missing.push(field);
  };
  const warnField = (field: string, present: boolean) => {
    if (!present) warnings.push(field);
  };

  requireField("asset_id", Boolean(asset.id || asset.resourceSpaceId));
  requireField("media_type", Boolean(asset.mediaType));
  requireField("source_system", Boolean(asset.sourceSystem || asset.sourcePlatform));
  requireField("source_album_or_event", Boolean(asset.sourceAlbum || asset.collection || asset.eventName));
  requireField("original_filename", Boolean(asset.originalFilename));
  requireField("master_drive_path", Boolean(asset.masterDrivePath));
  requireField("checksum_sha256", Boolean(asset.checksumSha256));

  if (asset.status === "Approved Public" || asset.status === "Approved Internal") {
    requireField("rights_status", isMeaningful(asset.rightsStatus));
    requireField("reviewed_by", Boolean(asset.reviewer));
    requireField("reviewed_date", Boolean(asset.reviewedDate));
    requireField("approval_notes", isMeaningful(asset.rightsNotes));
    requireField("people_visible", Boolean(asset.peopleRisk && asset.peopleRisk !== "Unknown"));
    requireField("approved_use_copy", Boolean(asset.imageUrls?.download));
  }

  if (asset.status === "Approved Public") {
    requireField("usage_scope_public", asset.usageScope === "Public" || asset.usageScope === "Public and Internal");
    requireField("derivative_dimensions", Boolean(asset.imageDimensions));
  }

  warnField("reuse_tier", isMeaningful(asset.reuseTier));
  warnField("visibility_tier", isMeaningful(asset.visibilityTier));
  warnField("sensitivity_class", isMeaningful(asset.sensitivityClass));
  warnField("rights_basis", isMeaningful(asset.rightsBasis));
  warnField("approved_channels", Boolean(asset.approvedChannels?.length));
  warnField("required_notice", asset.requiredNotice !== undefined);
  warnField("expiration_or_recheck_date", isMeaningful(asset.expirationOrRecheckDate));
  warnField("domain_reviewer", isMeaningful(asset.domainReviewer));

  const peopleOrYouth = asset.peopleRisk === "Adults visible" || asset.peopleRisk === "Possible minors";
  if (peopleOrYouth) warnField("consent_release_record_id", isMeaningful(asset.consentReleaseRecordId));

  const aiLooksFinal = Boolean(asset.aiTitleSuggestion || asset.aiVisibleTagSuggestions?.length || asset.aiTjcTermSuggestions?.length || asset.aiQualitySuggestion || asset.aiPeopleOrMinorFlag)
    && !/accepted|edited|rejected/i.test(asset.humanAiDecision || "");
  if (aiLooksFinal) warnings.push("ai_suggestions_not_human_approved");

  return {
    ok: missing.length === 0,
    missing,
    warnings
  };
}

export function normalizeResourceSpaceRecord(row: ResourceSpaceRecord): StockMediaAsset {
  const validation = validateResourceSpaceRecord(row);
  const id = validation.id || value(row, "canonical_asset_id") || "unknown-resource";
  const status = normalizeResourceSpaceStatus(row);
  const usageScope = normalizeUsageScope(row);
  const rawTitle = value(row, "human_title_final", "title", "original_filename") || `Resource ${id}`;
  const title = cleanDisplayTitle(row, rawTitle);
  const collection = value(row, "source_album", "import_batch", "event_or_topic", "event_name") || "ResourceSpace export";
  const checksumSha256 = value(row, "checksum_sha256") || undefined;
  const imageUrls = imageUrlsForResource(id, checksumSha256 || value(row, "reviewed_date") || id);
  const fileSizeBytes = safeNonNegativeInt(value(row, "file_size", "original_file_size_bytes")) || undefined;
  const peopleRisk = normalizePeopleRisk(row);

  return {
    id,
    title,
    thumbnail: imageUrls.small,
    thumbnailAlt: `${title} thumbnail`,
    preview: imageUrls.detail,
    imageUrls,
    mediaType: normalizeMediaType(row),
    collection,
    status,
    usageScope,
    visibility: status === "Approved Public" ? "public" : status === "Approved Internal" ? "internal" : "reviewer",
    peopleRisk,
    sourcePlatform: value(row, "source_platform") || undefined,
    sourceSystem: value(row, "source_system") || undefined,
    sourceAccount: value(row, "source_account") || undefined,
    sourceAlbum: value(row, "source_album", "import_batch", "event_or_topic", "event_name") || undefined,
    sourceAlbumPath: value(row, "source_album_path") || undefined,
    sourceAlbumMemberships: splitResourceSpaceList(value(row, "source_album_memberships")),
    eventName: value(row, "event_name", "event_or_topic") || undefined,
    eventDate: value(row, "event_date") || undefined,
    capturedDate: value(row, "captured_date") || undefined,
    importDate: value(row, "import_date") || undefined,
    imageDimensions: value(row, "image_dimensions") || undefined,
    rightsStatus: normalizeRightsStatus(row),
    workflowState: value(row, "workflow_state") || undefined,
    qualityStatus: value(row, "quality_status") || undefined,
    sensitiveContext: value(row, "sensitive_context") || undefined,
    consentStatus: value(row, "consent_status") || undefined,
    usageTerms: splitResourceSpaceList(value(row, "usage_terms")),
    duplicateGroup: value(row, "duplicate_group") || undefined,
    duplicateRole: value(row, "duplicate_role") || undefined,
    checksumSha256,
    reviewer: value(row, "reviewed_by") || undefined,
    reviewedDate: value(row, "reviewed_date") || undefined,
    rightsNotes: value(row, "approval_notes", "notes") || undefined,
    usageGuidance:
      status === "Approved Public"
        ? "Approved for newsletters, slides, local church announcements, and church-wide ministry communication."
        : status === "Approved Internal"
          ? "Approved for internal ministry use only. Please do not share publicly without another review."
          : peopleRisk === "Possible minors"
            ? "Use with care: children/youth may be visible. Please ask a media coworker before public sharing."
            : "Please review before sharing publicly. A reviewer must approve this asset before reuse.",
    downloadPolicy: normalizeDownloadPolicy(status),
    resourceSpaceId: value(row, "resource_id", "resourcespace_ref", "ref") || undefined,
    sourcePath: value(row, "source_path") || undefined,
    masterDrivePath: value(row, "master_drive_path") || undefined,
    originalFilename: value(row, "original_filename") || undefined,
    fileExtension: value(row, "file_extension", "original_extension", "file_format") || undefined,
    fileSizeBytes,
    tags: splitResourceSpaceList(value(row, "visible_content_tags", "human_tags_final")),
    tjcTerms: splitResourceSpaceList(value(row, "tjc_terms", "TJC_terms")),
    aiTitleSuggestion: value(row, "ai_title_suggestion") || undefined,
    aiVisibleTagSuggestions: splitResourceSpaceList(value(row, "ai_visible_tag_suggestions")),
    aiTjcTermSuggestions: splitResourceSpaceList(value(row, "ai_tjc_term_suggestions")),
    aiQualitySuggestion: value(row, "ai_quality_suggestion") || undefined,
    aiPeopleOrMinorFlag: value(row, "ai_people_or_minor_flag") || undefined,
    humanAiDecision: value(row, "human_ai_decision") || undefined,
    reuseTier: value(row, "reuse_tier") || undefined,
    visibilityTier: value(row, "visibility_tier") || undefined,
    sensitivityClass: value(row, "sensitivity_class") || undefined,
    rightsBasis: value(row, "rights_basis") || undefined,
    approvedChannels: splitResourceSpaceList(value(row, "approved_channels")),
    requiredNotice: value(row, "required_notice") || undefined,
    consentReleaseRecordId: value(row, "consent_release_record_id") || undefined,
    expirationOrRecheckDate: value(row, "expiration_or_recheck_date") || undefined,
    domainReviewer: value(row, "domain_reviewer") || undefined
  };
}
