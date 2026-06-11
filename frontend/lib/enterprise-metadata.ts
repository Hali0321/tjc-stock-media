import { assetRecordRef, assetType, formatBytes, recordIdLabel } from "@/lib/enterprise-display";
import type { DemoRole, MediaSourceStatus, StockMediaAsset } from "@/lib/types";

export type MetadataRow = [string, string | number];

export function metadataValue(value: unknown): string {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ") || "Not provided";
  if (value === null || value === undefined || value === "") return "Not provided";
  return String(value);
}

export function assetKeywordText(asset: StockMediaAsset) {
  return metadataValue([...(asset.tags || []), ...(asset.tjcTerms || [])]);
}

export function inspectorMetadataRows({
  asset,
  tab,
  source
}: {
  asset: StockMediaAsset;
  tab: string;
  source?: MediaSourceStatus | null;
}): MetadataRow[] {
  if (tab === "Rights & restrictions") {
    return [
      ["Approval status", metadataValue(asset.status)],
      ["Usage scope", metadataValue(asset.usageScope)],
      ["Rights status", metadataValue(asset.rightsStatus)],
      ["Consent status", metadataValue(asset.consentStatus)],
      ["People/minors", metadataValue(asset.peopleRisk)],
      ["Policy", metadataValue(asset.downloadPolicy)]
    ];
  }

  if (tab === "Versions") {
    return [
      ["Versions", "Not provided by current ResourceSpace export"],
      [recordIdLabel(source), metadataValue(assetRecordRef(asset))]
    ];
  }

  if (tab === "Activity") {
    return [
      ["Reviewer", metadataValue(asset.reviewer)],
      ["Reviewed date", metadataValue(asset.reviewedDate)],
      ["Pending sync", asset.pendingReviewWrite ? "Pending ResourceSpace write" : "None"]
    ];
  }

  return [
    [recordIdLabel(source), metadataValue(assetRecordRef(asset))],
    ["File type", assetType(asset)],
    ["Dimensions", metadataValue(asset.imageDimensions)],
    ["File size", formatBytes(asset.fileSizeBytes)],
    ["Created by", metadataValue(asset.sourceAccount)],
    ["Capture date", metadataValue(asset.capturedDate)],
    ["Collection", metadataValue(asset.collection)],
    ["Keywords", assetKeywordText(asset)]
  ];
}

export function assetDetailMetadataRows(asset: StockMediaAsset, role: DemoRole): MetadataRow[] {
  return [
    ["Title", metadataValue(asset.title)],
    ["Description", metadataValue(asset.usageGuidance)],
    ["Creator", metadataValue(asset.sourceAccount)],
    ["Capture Date", metadataValue(asset.capturedDate)],
    ["Collection", metadataValue(asset.collection)],
    ["Categories", metadataValue(asset.tjcTerms)],
    ["Keywords", metadataValue(asset.tags)],
    ["Asset ID", metadataValue(assetRecordRef(asset))],
    ["File Type", assetType(asset)],
    ["Dimensions", metadataValue(asset.imageDimensions)],
    ["File Size", formatBytes(asset.fileSizeBytes)],
    ["Uploaded", metadataValue(asset.importDate)],
    ["Uploaded By", metadataValue(asset.sourceAccount)],
    ["Source", metadataValue(asset.sourceSystem)],
    ...(role === "DAM Admin"
      ? [
          ["Checksum", metadataValue(asset.checksumSha256)] as MetadataRow,
          ["Original filename", metadataValue(asset.originalFilename)] as MetadataRow
        ]
      : [])
  ];
}

export function rightsRestrictionRows(asset: StockMediaAsset): MetadataRow[] {
  return [
    ["Approval status", metadataValue(asset.status)],
    ["Usage", metadataValue(asset.usageScope)],
    ["Rights status", metadataValue(asset.rightsStatus)],
    ["Consent", metadataValue(asset.consentStatus)],
    ["People/minors", metadataValue(asset.peopleRisk)],
    ["Restrictions", metadataValue(asset.reuseDecision?.summary)]
  ];
}

export function reviewMetadataRows({
  asset,
  pendingAction
}: {
  asset: StockMediaAsset;
  pendingAction?: string;
}): MetadataRow[] {
  return [
    ["Title", metadataValue(asset.title)],
    ["Review summary", metadataValue(asset.reuseDecision?.summary || "Needs reviewer decision.")],
    ["Pending sync", pendingAction || "None"],
    ["Source", metadataValue(asset.sourceSystem)],
    ["Capture Date", metadataValue(asset.capturedDate)],
    ["Collection", metadataValue(asset.collection)],
    ["Asset ID", metadataValue(assetRecordRef(asset))],
    ["File Type", assetType(asset)],
    ["Dimensions", metadataValue(asset.imageDimensions)],
    ["File Size", formatBytes(asset.fileSizeBytes)],
    ["Uploaded By", metadataValue(asset.sourceAccount)]
  ];
}

export function reviewEvidenceRows({
  asset,
  currentStatus,
  pendingStatus
}: {
  asset: StockMediaAsset;
  currentStatus: string;
  pendingStatus?: string;
}): MetadataRow[] {
  return [
    ["ResourceSpace ID", metadataValue(assetRecordRef(asset))],
    ["Assigned to", "Reviewer queue"],
    ["Policy", metadataValue(asset.downloadPolicy)],
    ["Source", metadataValue(asset.sourceSystem)],
    ["Current ResourceSpace status", currentStatus],
    ["Portal pending decision", pendingStatus || "None"]
  ];
}
