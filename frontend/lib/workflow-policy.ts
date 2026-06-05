import type { StockMediaAsset } from "@/lib/types";

export const LARGE_MEDIA_BYTES = 100 * 1024 * 1024;

export const uploadDefaultState = {
  status: "Needs Review / Do Not Publish",
  message: "New media starts in review. A reviewer approves it before anyone can reuse it.",
  largeMediaMessage:
    "Video/audio over 100 MB goes to Shared Drive Incoming. It will still be tracked in TJC Stock Media after admin import."
};

export const reviewActions = [
  { id: "approve-public", label: "Approve for church-wide use", backend: "Approve Public", targetStatus: "Approved Public" },
  { id: "approve-internal", label: "Approve for internal ministry use", backend: "Approve Internal", targetStatus: "Approved Internal" },
  { id: "archive-only", label: "Archive only", backend: "Searchable Archive", targetStatus: "Searchable Archive" },
  { id: "do-not-publish", label: "Do not publish externally", backend: "Do Not Use", targetStatus: "Do Not Use" },
  { id: "request-info", label: "Request more info", backend: "Request More Info", targetStatus: "Needs Review" },
  { id: "usage-guidance", label: "Add usage guidance", backend: "Add Usage Guidance", targetStatus: "Needs Review" }
] as const;

export type ReviewActionBackend = (typeof reviewActions)[number]["backend"];

export const reviewQueues = [
  { id: "pending", label: "Pending Review", description: "Needs a reviewer decision." },
  { id: "children-youth", label: "Children/Youth", description: "Contains or may contain children/youth." },
  { id: "missing-source", label: "Missing Source", description: "Source, album, or photographer missing." },
  { id: "rights-review", label: "Rights Review", description: "Rights, consent, or source unclear." },
  { id: "usage-guidance", label: "Needs Usage Guidance", description: "Approved/useful record lacks practical guidance." },
  { id: "internal-only", label: "Internal Only", description: "Useful but not public." },
  { id: "archive-candidates", label: "Archive Candidates", description: "Traceable, searchable, not promoted." },
  { id: "duplicate-candidates", label: "Duplicate Candidates", description: "Possible duplicate group or repeated source." },
  { id: "large-media", label: "Large Media", description: "Video/audio or large file intake." }
] as const;

export type ReviewQueueId = (typeof reviewQueues)[number]["id"];

export function assetMatchesReviewQueue(asset: StockMediaAsset, queueId: ReviewQueueId) {
  const missingSource = !asset.sourcePath && !asset.sourceAccount && !asset.sourceSystem && !asset.resourceSpaceId;
  const rightsUnclear = /unknown|concern|not confirmed/i.test(`${asset.rightsStatus || ""} ${asset.consentStatus || ""} ${asset.rightsNotes || ""}`);
  const largeMedia = asset.mediaType === "video" || asset.mediaType === "audio" || (asset.fileSizeBytes || 0) > LARGE_MEDIA_BYTES;

  switch (queueId) {
    case "pending":
      return asset.status === "Needs Review" || asset.status === "Possible Minors";
    case "children-youth":
      return asset.peopleRisk === "Possible minors" || /minor|children|youth/i.test(asset.sensitiveContext || "");
    case "missing-source":
      return missingSource;
    case "rights-review":
      return rightsUnclear || asset.status === "Do Not Use" || asset.usageScope === "Do Not Publish";
    case "usage-guidance":
      return !asset.usageGuidance || /review before sharing|reviewer must approve/i.test(asset.usageGuidance);
    case "internal-only":
      return asset.status === "Approved Internal" || asset.usageScope === "Internal";
    case "archive-candidates":
      return asset.status === "Searchable Archive" || asset.usageScope === "Archive Only";
    case "duplicate-candidates":
      return Boolean(asset.duplicateGroup);
    case "large-media":
      return largeMedia;
  }
}

export function reviewRiskFlags(asset: StockMediaAsset) {
  const flags: string[] = [];
  if (asset.peopleRisk === "Possible minors") flags.push("Children/youth");
  if (asset.peopleRisk === "Adults visible") flags.push("People visible");
  if (!asset.sourcePath && !asset.sourceAccount && !asset.sourceSystem) flags.push("Missing source");
  if (/unknown|concern|not confirmed/i.test(`${asset.rightsStatus || ""} ${asset.consentStatus || ""}`)) flags.push("Rights unclear");
  if (!asset.usageGuidance || /review before sharing|reviewer must approve/i.test(asset.usageGuidance)) flags.push("No usage guidance");
  if (asset.duplicateGroup) flags.push("Possible duplicate");
  if (asset.mediaType === "video" || asset.mediaType === "audio" || (asset.fileSizeBytes || 0) > LARGE_MEDIA_BYTES) flags.push("Large media");
  if (asset.sensitiveContext) flags.push("Sensitive context");
  return flags.length ? flags : ["Standard review"];
}

export function missingReviewFields(asset: StockMediaAsset) {
  const fields: string[] = [];
  if (!asset.reviewer) fields.push("reviewer");
  if (!asset.reviewedDate) fields.push("review date");
  if (!asset.rightsNotes) fields.push("rights notes");
  if (!asset.usageGuidance) fields.push("usage guidance");
  if (!asset.sourcePath && !asset.sourceAccount && !asset.sourceSystem) fields.push("source");
  return fields;
}
