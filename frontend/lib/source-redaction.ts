import type { DemoRole, MediaSourceStatus, SavedViewSummary, StockMediaAsset } from "@/lib/types";

function canSeeOperationalSource(role: DemoRole) {
  return role === "Reviewer" || role === "DAM Admin";
}

function hasOperationalText(value?: string) {
  return Boolean(value && /ResourceSpace|Shared Drive|pending writes?|API mapping|launch gate|diagnostics?|metadata health|raw totals?|source[- ]of[- ]truth|field refs?|source path|master drive|original filename|checksum/i.test(value));
}

function safeSavedViewText(value: string) {
  return value
    .replace(/ResourceSpace-approved/gi, "Batch-approved")
    .replace(/ResourceSpace publish status/gi, "approval state")
    .replace(/ResourceSpace/gi, "media library")
    .replace(/Shared Drive/gi, "media library")
    .replace(/metadata health/gi, "record readiness")
    .replace(/raw totals?/gi, "library totals")
    .replace(/diagnostics?/gi, "readiness notes");
}

export function sourceForRole(role: DemoRole, source: MediaSourceStatus): MediaSourceStatus {
  if (canSeeOperationalSource(role)) return source;
  return {
    adapter: "demo-fallback",
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
    sourceAlbumMemberships: _sourceAlbumMemberships,
    sourceAlbumPath: _sourceAlbumPath,
    sourcePath: _sourcePath,
    sourcePlatform: _sourcePlatform,
    sourceSystem: _sourceSystem,
    workflowState: _workflowState,
    reviewer: _reviewer,
    rightsNotes,
    ...safeAsset
  } = asset;

  return {
    ...safeAsset,
    sourceAccount: hasOperationalText(asset.sourceAccount) ? undefined : asset.sourceAccount,
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
