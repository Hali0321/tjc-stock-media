export type DemoRole = "Viewer" | "Contributor" | "Reviewer" | "DAM Admin";

export type PublishStatus =
  | "Approved Public"
  | "Approved Internal"
  | "Needs Review"
  | "Searchable Archive"
  | "Do Not Use"
  | "Possible Minors";

export type UsageScope =
  | "Public"
  | "Internal"
  | "Public and Internal"
  | "Archive Only"
  | "Do Not Publish"
  | "Do Not Use";

export type StockMediaAsset = {
  id: string;
  title: string;
  thumbnail: string;
  thumbnailAlt: string;
  preview?: string;
  mediaType: "photo" | "video" | "audio" | "graphic" | "document";
  collection: string;
  status: PublishStatus;
  usageScope: UsageScope;
  visibility?: "public" | "internal" | "reviewer" | "admin";
  peopleRisk?: "No people" | "Adults visible" | "Possible minors" | "Unknown";
  reviewer?: string;
  reviewedDate?: string;
  rightsNotes?: string;
  usageGuidance?: string;
  downloadPolicy:
    | "approved-copy-allowed"
    | "internal-approved-copy-allowed"
    | "not-downloadable"
    | "admin-original-only";
  resourceSpaceId?: string;
  sourcePath?: string;
  masterDrivePath?: string;
  originalFilename?: string;
  fileExtension?: string;
  fileSizeBytes?: number;
  tags?: string[];
  tjcTerms?: string[];
};

export type SearchResult = {
  assets: StockMediaAsset[];
  total: number;
  source: MediaSourceStatus;
  counts: {
    approved: number;
    needsReview: number;
    archive: number;
    blocked: number;
  };
};

export type MediaSourceStatus = {
  adapter: "resourcespace-api" | "exported-metadata" | "demo-fallback";
  label: string;
  detail: string;
  readOnly: boolean;
};
