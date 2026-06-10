import { auditLogDiagnostics } from "@/lib/audit-log";
import { betaFeedbackDiagnostics } from "@/lib/beta-feedback";
import {
  brandKitCollectionId,
  hasGoogleSharedDriveConfig,
  hasResourceSpaceApiConfig,
  hasS3DeliveryConfig,
  hasSsoConfig,
  resourceSpaceWritebackEnabled,
  trustedSsoHeadersEnabled
} from "@/lib/env";
import { pendingReviewWriteDiagnostics } from "@/lib/pending-review-writes";
import { resourceSpaceFieldMapDiagnostics, resourceSpaceWritebackFieldMapDiagnostics } from "@/lib/resourcespace-field-map";
import { usageAnalyticsDiagnostics } from "@/lib/usage-analytics";
import type { IntegrationReadinessItem, MediaSourceStatus } from "@/lib/types";

export function buildIntegrationReadiness({
  status,
  approvedPublic,
  portalReady,
  auditEvents
}: {
  status: MediaSourceStatus;
  approvedPublic: number;
  portalReady: number;
  auditEvents: ReturnType<typeof auditLogDiagnostics>;
}): IntegrationReadinessItem[] {
  const pending = pendingReviewWriteDiagnostics();
  const apiConfigured = hasResourceSpaceApiConfig();
  const fieldMap = resourceSpaceFieldMapDiagnostics();
  const s3Configured = hasS3DeliveryConfig();
  const driveConfigured = hasGoogleSharedDriveConfig();
  const ssoConfigured = hasSsoConfig();
  const analytics = usageAnalyticsDiagnostics();
  const feedback = betaFeedbackDiagnostics();
  const writebackFieldMap = resourceSpaceWritebackFieldMapDiagnostics();
  const liveWritebackReady = apiConfigured && resourceSpaceWritebackEnabled() && writebackFieldMap.valid;
  const brandHubConfigured = Boolean(brandKitCollectionId("BRAND_KIT_MVP_2024_COLLECTION_ID"));
  const sourceIsResourceSpace = status.adapter === "resourcespace-api" || status.adapter === "exported-metadata";
  return [
    {
      id: "metadata-source",
      label: "ResourceSpace metadata export",
      ready: sourceIsResourceSpace,
      owner: "ResourceSpace",
      state: status.adapter === "exported-metadata" ? "Read-only" : sourceIsResourceSpace ? "Operational" : "Blocked",
      detail: status.detail
    },
    {
      id: "resourcespace-live-api",
      label: "ResourceSpace live API",
      ready: status.adapter === "resourcespace-api",
      owner: "ResourceSpace",
      state: apiConfigured ? "Degraded" : "Not configured",
      detail: apiConfigured
        ? "Credentials are present, but live API read/write adapter still requires field and endpoint verification."
        : "Server-side ResourceSpace API credentials are not configured. Export mode remains read-only."
    },
    {
      id: "resourcespace-field-map",
      label: "ResourceSpace field map",
      ready: fieldMap.valid && fieldMap.missing.length === 0,
      owner: "ResourceSpace",
      state: fieldMap.configured ? (fieldMap.valid && fieldMap.missing.length === 0 ? "Operational" : "Degraded") : "Read-only",
      detail: fieldMap.configured
        ? fieldMap.valid
          ? `${fieldMap.configuredKeys.length.toLocaleString()} configured keys. Missing required keys: ${fieldMap.missing.join(", ") || "none"}.`
          : `Invalid RESOURCESPACE_FIELD_MAP_JSON: ${fieldMap.error}`
        : "Using built-in beta field map. Set RESOURCESPACE_FIELD_MAP_JSON after ResourceSpace metadata fields are finalized."
    },
    {
      id: "resourcespace-preview",
      label: "ResourceSpace preview proxy",
      ready: sourceIsResourceSpace,
      owner: "ResourceSpace",
      state: sourceIsResourceSpace ? "Operational" : "Blocked",
      detail: sourceIsResourceSpace
        ? "Previews route through backend thumbnail API and local derivative lookup. Missing derivatives show explicit unavailable states."
        : "Preview route falls back only when ResourceSpace/export data is unavailable."
    },
    {
      id: "review-writes",
      label: "ResourceSpace review writeback",
      ready: liveWritebackReady,
      owner: "ResourceSpace",
      state: liveWritebackReady ? "Degraded" : apiConfigured ? "Read-only" : "Not configured",
      detail: liveWritebackReady
        ? "Live writeback is enabled behind server-only env flags. Each decision still runs API smoke and records sync failure instead of faking success."
        : apiConfigured && resourceSpaceWritebackEnabled()
          ? `Writeback flags are enabled, but explicit review field refs are missing or invalid: ${writebackFieldMap.missing.join(", ") || writebackFieldMap.error || "unknown field map issue"}.`
        : apiConfigured
          ? "Credentials are present, but writeback is disabled until RESOURCESPACE_ENABLE_WRITEBACK=1 and RESOURCESPACE_WRITEBACK_MODE=live."
        : "Review decisions save as portal pending-sync events. They are not final ResourceSpace truth."
    },
    {
      id: "pending-review-writes",
      label: "Pending review write queue",
      ready: pending.count === 0,
      owner: "DAM Admin",
      state: pending.count === 0 ? "Operational" : "Degraded",
      detail: `${pending.count.toLocaleString()} pending write${pending.count === 1 ? "" : "s"}. Last attempt: ${pending.lastAttemptAt || "none"}. Last error: ${pending.lastError || "none"}.`
    },
    {
      id: "audit-log",
      label: "Portal audit log",
      ready: auditEvents.count > 0,
      owner: "Portal",
      state: auditEvents.count > 0 ? "Operational" : "Pending setup",
      detail: auditEvents.count
        ? `${auditEvents.count.toLocaleString()} recent audit event${auditEvents.count === 1 ? "" : "s"}. Latest event: ${auditEvents.latestAt || "none"}.`
        : "No local portal audit events recorded yet. Production still needs durable identity-backed audit storage."
    },
    {
      id: "auth",
      label: "Real authentication / SSO",
      ready: ssoConfigured && trustedSsoHeadersEnabled(),
      owner: "Identity Provider",
      state: ssoConfigured && trustedSsoHeadersEnabled() ? "Degraded" : "Pending setup",
      detail: ssoConfigured && trustedSsoHeadersEnabled()
        ? "Trusted-header SSO shim is enabled. Production still needs real IdP header/group claim verification."
        : "SSO-ready shim is implemented, but local role selection remains beta fallback until trusted IdP headers are enabled."
    },
    {
      id: "role-gates",
      label: "Role gates",
      ready: true,
      owner: "Portal",
      state: "Operational",
      detail: "Viewer, Contributor, Reviewer, and DAM Admin gates are enforced through backend decisions for sensitive actions."
    },
    {
      id: "master-originals",
      label: "Google Shared Drive master originals",
      ready: driveConfigured,
      owner: "Google Shared Drive",
      state: driveConfigured ? "Degraded" : "Not configured",
      detail: driveConfigured
        ? "Shared Drive env is configured. Production ingest and custody verification still need operational smoke tests."
        : "Master-original model is documented; production needs Shared Drive ID, service credentials, backup, and ownership confirmation."
    },
    {
      id: "s3-delivery",
      label: "Amazon S3 derivative delivery",
      ready: s3Configured,
      owner: "Amazon S3",
      state: s3Configured ? "Degraded" : "Not configured",
      detail: s3Configured
        ? "S3 env is present. Delivery privacy smoke protects browser payloads; signed URL generation still needs staging smoke before production."
        : "Approved derivative delivery is local/export-backed now. Delivery privacy smoke protects browser payloads; configure S3 bucket, region, and access role for production signed URLs."
    },
    {
      id: "approved-copy-delivery",
      label: "Approved copy delivery",
      ready: portalReady > 0,
      owner: "Portal",
      state: portalReady > 0 ? "Operational" : "Blocked",
      detail: portalReady
        ? `${portalReady.toLocaleString()} portal-ready asset${portalReady === 1 ? "" : "s"} can be downloaded as approved copies.`
        : `${approvedPublic.toLocaleString()} ResourceSpace-approved public asset${approvedPublic === 1 ? "" : "s"} still need portal reuse checks before copy delivery.`
    },
    {
      id: "public-portal",
      label: "Media Library UI",
      ready: portalReady > 0,
      owner: "Portal",
      state: portalReady > 0 ? "Operational" : "Degraded",
      detail: portalReady
        ? `${portalReady.toLocaleString()} asset${portalReady === 1 ? "" : "s"} pass the portal-ready policy.`
        : "No asset passes portal-ready policy until rights, people/minors, and derivative confidence improve."
    },
    {
      id: "usage-analytics",
      label: "Usage analytics",
      ready: analytics.enabled,
      owner: "Portal",
      state: analytics.enabled ? (analytics.totalEvents > 0 ? "Operational" : "Degraded") : "Pending setup",
      detail: analytics.enabled
        ? `SQLite usage analytics is enabled at ${analytics.dbPath}. Recorded events: ${analytics.totalEvents.toLocaleString()}.`
        : "Insights uses real ResourceSpace counts plus clearly labeled sample trend/package charts until portal event logging is connected."
    },
    {
      id: "beta-feedback-storage",
      label: "Beta feedback storage",
      ready: feedback.kvConfigured || feedback.count > 0,
      owner: "Portal",
      state: feedback.kvConfigured ? (feedback.blobConfigured ? "Operational" : "Degraded") : feedback.count > 0 ? "Degraded" : "Pending setup",
      detail: feedback.kvConfigured
        ? `Vercel KV feedback storage is configured. Blob attachments: ${feedback.blobConfigured ? "configured" : "not configured"}. Records: ${feedback.count.toLocaleString()}; open: ${feedback.openCount.toLocaleString()}; critical open: ${feedback.criticalOpenCount.toLocaleString()}.`
        : `Feedback is using ${feedback.primaryStorageMode}${feedback.hostedRuntime ? " in hosted runtime" : ""}; this is suitable for local/private beta rehearsal only, not wider rollout. Records: ${feedback.count.toLocaleString()}; open: ${feedback.openCount.toLocaleString()}; critical open: ${feedback.criticalOpenCount.toLocaleString()}. Configure Vercel KV for durable hosted feedback and Blob for attachments before larger testing.`
    },
    {
      id: "brand-kit-collections",
      label: "Brand Kit collection mapping",
      ready: brandHubConfigured,
      owner: "DAM Admin",
      state: brandHubConfigured ? "Degraded" : "Pending setup",
      detail: brandHubConfigured
        ? "BRAND_KIT_MVP_2024_COLLECTION_ID is configured. Verify ResourceSpace collection assets and download gates."
        : "Set BRAND_KIT_MVP_2024_COLLECTION_ID before Brand Hub downloads appear."
    },
    {
      id: "package-publishing",
      label: "Package publishing",
      ready: false,
      owner: "DAM Admin",
      state: "Read-only",
      detail: "Package builder stores ResourceSpace references in portal state. Publishing remains blocked until share links, audit, and all-item rights checks are wired."
    }
  ];
}
