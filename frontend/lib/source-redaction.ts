import type { DemoRole, MediaSourceStatus, SavedViewSummary, StockMediaAsset } from "@/lib/types";

function canSeeOperationalSource(role: DemoRole) {
  return role === "Reviewer" || role === "DAM Admin";
}

const operationalTextPattern = /ResourceSpace|Shared Drive|pending writes?|API mapping|launch gate|diagnostics?|metadata health|raw totals?|source[- ]of[- ]truth|field refs?|source path|master drive|master\/original path|master files?|original filename|checksum|raw ResourceSpace|ResourceSpace ID|\bRS\s+\d+\b|[a-f0-9]{32,}/i;
const scaffoldTextPattern = /\b(MVP 2024|stock media candidate|prototype|demo role)\b/i;

function hasOperationalText(value?: string) {
  return Boolean(value && operationalTextPattern.test(value));
}

function hasScaffoldText(value?: string) {
  return Boolean(value && scaffoldTextPattern.test(value));
}

function safePublicList(values?: string[]) {
  return (values || []).filter((value) => value && !hasOperationalText(value) && !hasScaffoldText(value));
}

function safeSavedViewText(value: string) {
  return value
    .replace(/ResourceSpace-approved/gi, "Library-approved")
    .replace(/ResourceSpace publish status/gi, "approval state")
    .replace(/ResourceSpace ID/gi, "reference code")
    .replace(/ResourceSpace/gi, "media library")
    .replace(/Shared Drive/gi, "media library")
    .replace(/pending writes?/gi, "review queue")
    .replace(/API mapping/gi, "review setup")
    .replace(/launch gate/gi, "readiness check")
    .replace(/metadata health/gi, "record readiness")
    .replace(/raw totals?/gi, "library totals")
    .replace(/diagnostics?/gi, "readiness notes")
    .replace(/source[- ]of[- ]truth/gi, "record source")
    .replace(/field refs?/gi, "required details")
    .replace(/source path/gi, "source access")
    .replace(/master drive/gi, "media library")
    .replace(/master\/original path/gi, "source-file access")
    .replace(/master files?/gi, "source files")
    .replace(/original filename/gi, "file reference")
    .replace(/checksum/gi, "file check")
    .replace(/exported/gi, "recorded")
    .replace(/metadata/gi, "details")
    .replace(/derivatives?/gi, "approved copies")
    .replace(/renditions?/gi, "approved copies");
}

const publicSavedViewIds = new Set([
  "approved-church-wide",
  "batch-approved-blockers",
  "website-hero",
  "sermon-slides",
  "newsletter",
  "social-media",
  "no-people",
  "people-unknown",
  "children-youth-review",
  "recently-approved",
  "needs-review",
  "archive-only"
]);

function canExposeSavedView(role: DemoRole, view: SavedViewSummary) {
  if (canSeeOperationalSource(role)) return true;
  if (role === "Contributor" && view.id === "internal-ministry") return true;
  return publicSavedViewIds.has(view.id);
}

export function sourceForRole(role: DemoRole, source: MediaSourceStatus): MediaSourceStatus {
  if (canSeeOperationalSource(role)) return source;
  return {
    adapter: "media-library",
    label: "Media library",
    detail: "Use approved copies and request review when a media record is not cleared.",
    readOnly: true
  };
}

export function assetForRolePayload(role: DemoRole, asset: StockMediaAsset): StockMediaAsset {
  if (canSeeOperationalSource(role)) return asset;
  const {
    checksumSha256: _checksumSha256,
    duplicateGroup: _duplicateGroup,
    duplicateRole: _duplicateRole,
    fileSizeBytes: _fileSizeBytes,
    masterDrivePath: _masterDrivePath,
    originalFilename: _originalFilename,
    pendingReviewWrite: _pendingReviewWrite,
    resourceSpaceId: _resourceSpaceId,
    reuseDecision: _reuseDecision,
    sourceAlbumMemberships: _sourceAlbumMemberships,
    sourceAlbumPath: _sourceAlbumPath,
    sourcePath: _sourcePath,
    sourcePlatform: _sourcePlatform,
    sourceSystem: _sourceSystem,
    workflowState: _workflowState,
    reviewer: _reviewer,
    collection,
    eventName,
    rightsNotes,
    sourceAccount: _sourceAccount,
    tags,
    tjcTerms,
    usageTerms,
    ...safeAsset
  } = asset;

  return {
    ...safeAsset,
    collection: hasScaffoldText(collection) || hasOperationalText(collection) ? "Media library" : collection,
    eventName: hasScaffoldText(eventName) || hasOperationalText(eventName) ? undefined : eventName,
    tags: safePublicList(tags),
    tjcTerms: safePublicList(tjcTerms),
    usageTerms: safePublicList(usageTerms),
    rightsNotes: hasOperationalText(rightsNotes) ? undefined : rightsNotes
  };
}

export function savedViewForRolePayload(role: DemoRole, view: SavedViewSummary): SavedViewSummary {
  if (canSeeOperationalSource(role)) return view;
  return {
    ...view,
    description: safeSavedViewText(view.description),
    reason: safeSavedViewText(view.reason)
  };
}

export function savedViewsForRolePayload(role: DemoRole, views: SavedViewSummary[]): SavedViewSummary[] {
  return views.filter((view) => canExposeSavedView(role, view)).map((view) => savedViewForRolePayload(role, view));
}
