const defaultResourceSpaceFieldMap = {
  title: "title",
  description: "description",
  approvalStatus: "publish_status",
  usageRights: "usage_terms",
  licenseType: "license_type",
  territory: "territory",
  modelRelease: "model_release",
  propertyRelease: "property_release",
  categories: "tjc_terms",
  keywords: "visible_content_tags",
  ministry: "ministry",
  campaign: "campaign",
  usageChannels: "usage_terms",
  originalFilename: "original_filename",
  sourcePlatform: "source_platform",
  sourceSystem: "source_system",
  sourceAccount: "source_account",
  sourceAlbum: "source_album",
  sourceAlbumPath: "source_album_path",
  sourceAlbumMemberships: "source_album_memberships",
  sourcePath: "source_path",
  masterDrivePath: "master_drive_path",
  eventName: "event_name",
  eventDate: "event_date",
  capturedDate: "captured_date",
  importDate: "import_date",
  imageDimensions: "image_dimensions",
  rightsStatus: "rights_status",
  workflowState: "workflow_state",
  qualityStatus: "quality_status",
  sensitiveContext: "sensitive_context",
  consentStatus: "consent_status",
  publishStatus: "publish_status",
  usageScope: "usage_scope",
  publicSafe: "public_safe",
  peopleVisible: "people_visible",
  minorsVisible: "minors_visible",
  visibleTags: "visible_content_tags",
  tjcTerms: "tjc_terms",
  reviewer: "reviewed_by",
  reviewedDate: "reviewed_date",
  notes: "approval_notes",
  usageTerms: "usage_terms",
  duplicateGroup: "duplicate_group",
  checksumSha256: "checksum_sha256",
  collection: "import_batch"
} as const;

type FieldMap = Record<string, string | number>;

function normalizeFieldMapValue(value: unknown): string | number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text : null;
}

function parseConfiguredFieldMap() {
  const raw = process.env.RESOURCESPACE_FIELD_MAP_JSON;
  if (!raw) {
    return {
      configured: false,
      valid: false,
      map: {} as FieldMap,
      error: undefined
    };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("RESOURCESPACE_FIELD_MAP_JSON must be a JSON object.");
    }
    const entries = Object.entries(parsed)
      .map(([key, value]) => [key, normalizeFieldMapValue(value)] as const)
      .filter((entry): entry is readonly [string, string | number] => entry[1] !== null);
    return {
      configured: true,
      valid: true,
      map: Object.fromEntries(entries) as FieldMap,
      error: undefined
    };
  } catch (error) {
    return {
      configured: true,
      valid: false,
      map: {} as FieldMap,
      error: error instanceof Error ? error.message : "Invalid ResourceSpace field map JSON."
    };
  }
}

const configured = parseConfiguredFieldMap();

export const configuredResourceSpaceFieldMap = configured.map;

export const resourceSpaceFieldMap = {
  ...defaultResourceSpaceFieldMap,
  ...configuredResourceSpaceFieldMap
} as const;

export function resourceSpaceWritebackFieldMapDiagnostics() {
  const required = ["approvalStatus", "reviewer", "reviewedDate", "notes"];
  const configuredKeys = Object.keys(configuredResourceSpaceFieldMap);
  const missing = required.filter((key) => !configuredResourceSpaceFieldMap[key]);
  return {
    configured: configured.configured,
    valid: configured.configured && configured.valid && missing.length === 0,
    error: configured.error,
    required,
    missing,
    configuredKeys
  };
}

export function resourceSpaceFieldMapDiagnostics() {
  const required = [
    "title",
    "approvalStatus",
    "usageRights",
    "licenseType",
    "territory",
    "modelRelease",
    "propertyRelease",
    "categories",
    "keywords",
    "usageChannels"
  ];
  const missing = required.filter((key) => !resourceSpaceFieldMap[key as keyof typeof resourceSpaceFieldMap]);
  return {
    configured: configured.configured,
    valid: configured.configured ? configured.valid : true,
    error: configured.error,
    required,
    missing,
    configuredKeys: Object.keys(configuredResourceSpaceFieldMap),
    effectiveKeys: Object.keys(resourceSpaceFieldMap)
  };
}
