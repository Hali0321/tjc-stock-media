import type { DemoRole, StockMediaAsset } from "@/lib/types";

export const roles: DemoRole[] = ["Viewer", "Contributor", "Reviewer", "DAM Admin"];

export function normalizeRole(value: string | null | undefined): DemoRole {
  if (value && roles.includes(value as DemoRole)) {
    return value as DemoRole;
  }
  return "Viewer";
}

export function canReview(role: DemoRole) {
  return role === "Reviewer" || role === "DAM Admin";
}

export function canUpload(role: DemoRole) {
  return role === "Contributor" || canReview(role);
}

export function canOpenResourceSpace(role: DemoRole) {
  return role === "DAM Admin" || role === "Reviewer";
}

export function canSeeAsset(role: DemoRole, asset: StockMediaAsset) {
  if (role === "DAM Admin" || role === "Reviewer") return true;
  if (asset.status === "Approved Public") return true;
  if (asset.status === "Approved Internal" && role === "Contributor") return true;
  return false;
}

export function canDownloadApprovedCopy(role: DemoRole, asset: StockMediaAsset) {
  if (asset.downloadPolicy === "approved-copy-allowed" && asset.status === "Approved Public") {
    return true;
  }
  if (
    asset.downloadPolicy === "internal-approved-copy-allowed" &&
    asset.status === "Approved Internal" &&
    role !== "Viewer"
  ) {
    return true;
  }
  return false;
}
