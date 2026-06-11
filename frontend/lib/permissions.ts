import type { DemoRole, StockMediaAsset } from "@/lib/types";
import { decideAccess } from "@/lib/access-decisions";

export const roles: DemoRole[] = ["Viewer", "Contributor", "Reviewer", "DAM Admin"];

export function normalizeRole(value: string | null | undefined): DemoRole {
  if (value && roles.includes(value as DemoRole)) {
    return value as DemoRole;
  }
  return "Viewer";
}

export function normalizeRoleWithFallback(value: unknown, fallback: DemoRole = "Viewer"): DemoRole {
  return roles.includes(value as DemoRole) ? value as DemoRole : fallback;
}

export function canReview(role: DemoRole) {
  return decideAccess(role, "reviewAsset").allowed;
}

export function canContribute(role: DemoRole) {
  return role === "Contributor" || canReview(role);
}

export function canAdmin(role: DemoRole) {
  return role === "DAM Admin";
}

export function canUpload(role: DemoRole) {
  return decideAccess(role, "uploadAsset").allowed;
}

export function canOpenResourceSpace(role: DemoRole) {
  return decideAccess(role, "viewResourceSpaceAdminLink").allowed;
}

export function canSeeAsset(role: DemoRole, asset: StockMediaAsset) {
  return decideAccess(role, "viewAsset", asset).allowed;
}

export function canDownloadApprovedCopy(role: DemoRole, asset: StockMediaAsset) {
  return decideAccess(role, "downloadApprovedCopy", asset).allowed;
}
