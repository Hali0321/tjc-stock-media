import path from "node:path";

export function repoRoot() {
  return process.env.TJC_STOCK_MEDIA_ROOT || path.resolve(process.cwd(), "..");
}

export function resourceSpaceBaseUrl() {
  return process.env.RS_BASE_URL || "http://localhost:8088";
}

export function hasResourceSpaceApiConfig() {
  return Boolean(process.env.RS_BASE_URL && process.env.RS_API_USER && process.env.RS_API_KEY);
}
