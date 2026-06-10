import path from "node:path";

export function repoRoot() {
  return process.env.TJC_STOCK_MEDIA_ROOT || path.resolve(process.cwd(), "..");
}

export function resourceSpaceBaseUrl() {
  return process.env.RESOURCESPACE_BASE_URL || process.env.RS_BASE_URL || "http://localhost:8088";
}

export function hasResourceSpaceApiConfig() {
  return Boolean(
    resourceSpaceBaseUrl()
    && (process.env.RESOURCESPACE_API_USER || process.env.RS_API_USER)
    && (process.env.RESOURCESPACE_API_KEY || process.env.RS_API_KEY)
  );
}

export function resourceSpaceApiUser() {
  return process.env.RESOURCESPACE_API_USER || process.env.RS_API_USER || "";
}

export function resourceSpaceApiKey() {
  return process.env.RESOURCESPACE_API_KEY || process.env.RS_API_KEY || "";
}

export function resourceSpaceWritebackEnabled() {
  return process.env.RESOURCESPACE_ENABLE_WRITEBACK === "1" && process.env.RESOURCESPACE_WRITEBACK_MODE === "live";
}

export function hasResourceSpaceFieldMapConfig() {
  return Boolean(process.env.RESOURCESPACE_FIELD_MAP_JSON);
}

export function hasS3DeliveryConfig() {
  return Boolean(process.env.S3_BUCKET && process.env.S3_REGION && (process.env.S3_ACCESS_ROLE || process.env.AWS_ACCESS_KEY_ID));
}

export function hasGoogleSharedDriveConfig() {
  return Boolean(process.env.GOOGLE_SHARED_DRIVE_ID && process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

export function hasSsoConfig() {
  return Boolean(process.env.SSO_PROVIDER && (process.env.SSO_CLIENT_ID || process.env.AUTH_CLIENT_ID));
}

export function trustedSsoHeadersEnabled() {
  return process.env.SSO_TRUSTED_HEADERS === "1" || process.env.SSO_PROVIDER === "cloudflare-access";
}

export function hasUsageAnalyticsConfig() {
  return Boolean(process.env.PORTAL_USAGE_LOGGING === "1" || process.env.USAGE_ANALYTICS_DSN);
}

export function usageAnalyticsEnabled() {
  return process.env.PORTAL_USAGE_LOGGING === "1";
}

export function usageAnalyticsDbPath() {
  return process.env.USAGE_ANALYTICS_DB_PATH || "";
}

export function brandKitCollectionId(key: string) {
  return process.env[key] || "";
}
