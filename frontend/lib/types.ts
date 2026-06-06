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
  duplicateRole?: string;
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
  reuseDecision?: ReuseDecision;
  pendingReviewWrite?: ReviewWriteRecordSummary;
};

export type ReuseState =
  | "portal-ready"
  | "internal-ready"
  | "preview-only"
  | "blocked-needs-review"
  | "blocked-source"
  | "blocked-rights"
  | "blocked-people-minors"
  | "blocked-reviewer-date"
  | "blocked-derivative"
  | "blocked-sensitive"
  | "blocked-archive"
  | "blocked-do-not-use";

export type PreviewTier =
  | "reusable-preview"
  | "candidate-preview"
  | "reviewer-only-preview"
  | "no-preview";

export type ReuseBlocker = {
  code: ReuseState;
  label: string;
};

export type ReuseDecision = {
  state: ReuseState;
  label: string;
  summary: string;
  downloadable: boolean;
  previewTier: PreviewTier;
  blockers: ReuseBlocker[];
  reasonCodes: string[];
  allowedRenditions: string[];
};

export type MetadataConfidence = {
  source: "verified" | "missing" | "unknown";
  peopleMinors: "reviewed" | "unknown" | "children_youth_possible";
  rights: "approved" | "unknown" | "review_required";
  usageGuidance: "present" | "missing";
  review: "complete" | "pending";
};

export type ReviewEvidenceChecklist = {
  sourceConfirmed: boolean;
  rightsConfirmed: boolean;
  peopleVisibilityConfirmed: boolean;
  childrenYouthChecked: boolean;
  usageScopeSelected: boolean;
  derivativeAvailable: boolean;
  sensitiveContextChecked: boolean;
  creditRequirementChecked: boolean;
};

export type ReviewWriteSyncState =
  | "queued"
  | "ready_to_sync"
  | "sync_failed"
  | "synced_to_resourcespace"
  | "cancelled"
  | "superseded";

export type ReviewWriteRecord = {
  id: string;
  resourceId: string;
  oldStatus: string;
  requestedStatus: string;
  reviewerRole: "Reviewer" | "DAM Admin";
  reviewerName?: string;
  createdAt: string;
  updatedAt: string;
  note: string;
  checklist: ReviewEvidenceChecklist;
  blockers: string[];
  syncState: ReviewWriteSyncState;
  retryCount: number;
  lastError?: string;
};

export type ReviewWriteRecordSummary = Pick<
  ReviewWriteRecord,
  "id" | "resourceId" | "requestedStatus" | "createdAt" | "updatedAt" | "syncState" | "lastError"
>;

export type SavedViewSummary = {
  id: string;
  label: string;
  description: string;
  count: number;
  reason: string;
};

export type CatalogSort = "Approved first" | "Recently approved" | "Newest" | "A-Z";

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
  viewId?: string;
  images: { src: string; alt: string }[];
};

export type MetadataHealthSummary = {
  averageScore: number;
  complete: number;
  needsSource: number;
  needsPeople: number;
  needsRights: number;
  needsUsage: number;
  reviewPending: number;
};

export type ZeroResultInsight = {
  query: string;
  rawCount: number;
  savedViewCount: number;
  savedViewId?: string;
  recommendation: string;
};

export type OperationalInsight = {
  id: string;
  label: string;
  value: number;
  detail: string;
  tone: "ok" | "warn" | "info";
  savedViewId?: string;
};

export type DamReadinessItem = {
  id: string;
  pillar: "Find" | "Trust" | "Review" | "Share" | "Govern";
  label: string;
  score: number;
  detail: string;
  action: string;
  savedViewId?: string;
  tone: "ok" | "warn" | "info";
};

export type FieldMappingStatus = {
  key: string;
  label: string;
  resourceSpaceField: string;
  required: boolean;
  coverage: number;
  present: number;
  missing: number;
};

export type VocabularyInsight = {
  term: string;
  count: number;
  kind: "canonical" | "candidate" | "drift";
};

export type PortalPolicyCheck = {
  id: string;
  label: string;
  blocked: number;
  detail: string;
  savedViewId?: string;
};

export type AdminActionItem = {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  label: string;
  count: number;
  owner: "DAM Admin" | "Reviewer" | "Contributor";
  action: string;
  savedViewId?: string;
};

export type IntegrationReadinessItem = {
  id: string;
  label: string;
  ready: boolean;
  detail: string;
  owner: "ResourceSpace" | "Google Shared Drive" | "DAM Admin" | "Reviewers";
};

export type AssetGovernancePassport = {
  score: number;
  decision: string;
  portalReady: boolean;
  blockers: string[];
  warnings: string[];
  evidence: Array<{
    label: string;
    value: string;
    tone: "ok" | "warn" | "info";
  }>;
  auditTrail: Array<{
    event: string;
    actor: string;
    date: string;
    detail: string;
    tone: "ok" | "warn" | "info";
  }>;
  renditions: Array<{
    label: string;
    available: boolean;
    detail: string;
    intent: string;
  }>;
};

export type DamReadinessResult = {
  source: MediaSourceStatus;
  score: number;
  assetCount: number;
  metrics: {
    approvedPublic: number;
    portalReady: number;
    needsReview: number;
    rightsReview: number;
    missingSource: number;
    childrenYouth: number;
    aiEnrichment: number;
    taxonomyDrift: number;
    duplicateCandidates: number;
    renditionGaps: number;
    staleApprovals: number;
  };
  readiness: DamReadinessItem[];
  fieldMappings: FieldMappingStatus[];
  vocabulary: VocabularyInsight[];
  portalPolicy: PortalPolicyCheck[];
  actionBacklog: AdminActionItem[];
  integrationReadiness: IntegrationReadinessItem[];
};

export type SearchResult = {
  assets: StockMediaAsset[];
  total: number;
  pagination: {
    offset: number;
    limit: number;
    rangeStart: number;
    rangeEnd: number;
    hasPrevious: boolean;
    hasNext: boolean;
    previousOffset: number;
    nextOffset: number;
  };
  source: MediaSourceStatus;
  counts: {
    rawTotal: number;
    visibleToRole: number;
    currentlyShown: number;
    totalMatching: number;
    totalRendered: number;
    matching: number;
    rendered: number;
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
  metadataHealth: MetadataHealthSummary;
  appliedIntent?: {
    rawQuery: string;
    matchedView?: string;
    matchedCollection?: string;
    confidence: "exact" | "synonym" | "none";
  };
  zeroResultInsights: ZeroResultInsight[];
  operationalInsights: OperationalInsight[];
  savedViews: SavedViewSummary[];
  collections: CatalogCollection[];
};

export type MediaSourceStatus = {
  adapter: "resourcespace-api" | "exported-metadata" | "demo-fallback";
  label: string;
  detail: string;
  readOnly: boolean;
};
