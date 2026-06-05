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
  imageUrls?: {
    small: string;
    card: string;
    collection: string;
    detail: string;
    download: string;
  };
  mediaType: "photo" | "video" | "audio" | "graphic" | "document";
  collection: string;
  status: PublishStatus;
  usageScope: UsageScope;
  visibility?: "public" | "internal" | "reviewer" | "admin";
  peopleRisk?: "No people" | "Adults visible" | "Possible minors" | "Unknown";
  sourcePlatform?: string;
  sourceSystem?: string;
  sourceAccount?: string;
  sourceAlbumPath?: string;
  sourceAlbumMemberships?: string[];
  eventName?: string;
  eventDate?: string;
  capturedDate?: string;
  importDate?: string;
  imageDimensions?: string;
  rightsStatus?: string;
  workflowState?: string;
  qualityStatus?: string;
  sensitiveContext?: string;
  consentStatus?: string;
  usageTerms?: string[];
  duplicateGroup?: string;
  checksumSha256?: string;
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

export type SavedViewSummary = {
  id: string;
  label: string;
  description: string;
  count: number;
  reason: string;
};

export type CatalogCollection = {
  id: string;
  name: string;
  description: string;
  count: number;
  countLabel: string;
  dateRange: string;
  ministry: string;
  approvalSummary: string;
  peopleWarning?: string;
  searchQuery: string;
  images: { src: string; alt: string }[];
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
    childrenYouth: number;
    missingSource: number;
    rightsReview: number;
    approvedThisMonth: number;
  };
  savedViews: SavedViewSummary[];
  collections: CatalogCollection[];
};

export type MediaSourceStatus = {
  adapter: "resourcespace-api" | "exported-metadata" | "demo-fallback";
  label: string;
  detail: string;
  readOnly: boolean;
};
