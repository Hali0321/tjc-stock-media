import type { StockMediaAsset } from "@/lib/types";
import { buildReuseDecision } from "@/lib/portal-reuse-decision";

export type EnterpriseStatus =
  | "Approved"
  | "Needs Review"
  | "Restricted"
  | "Missing Consent"
  | "Expiring Soon"
  | "Active"
  | "Compliant"
  | "Operational"
  | "Read-only"
  | "Not configured"
  | "Degraded"
  | "Pending setup"
  | "Blocked"
  | "Draft"
  | "Approved only";

export type EnterpriseStatusTone = "success" | "warning" | "danger";

export function assetEnterpriseStatus(asset?: StockMediaAsset): EnterpriseStatus {
  if (!asset) return "Not configured";
  const reuse = buildReuseDecision(asset);
  if (reuse.state === "portal-ready" || reuse.state === "internal-ready") return "Approved";
  if (reuse.state === "blocked-people-minors") return "Missing Consent";
  if (reuse.state === "blocked-do-not-use" || reuse.state === "blocked-archive") return "Restricted";
  if (asset.status === "Approved Public" || asset.status === "Approved Internal") return "Needs Review";
  if (asset.status === "Possible Minors") return "Missing Consent";
  if (asset.status === "Do Not Use" || asset.status === "Searchable Archive") return "Restricted";
  return "Needs Review";
}

export function statusTone(status: EnterpriseStatus): EnterpriseStatusTone {
  if (status === "Approved" || status === "Active" || status === "Compliant" || status === "Operational" || status === "Approved only") {
    return "success";
  }
  if (status === "Restricted" || status === "Missing Consent" || status === "Not configured") {
    return "danger";
  }
  return "warning";
}

export function statusToneClass(status: EnterpriseStatus) {
  const tone = statusTone(status);
  if (tone === "success") return "is-success";
  if (tone === "danger") return "is-danger";
  return "is-warning";
}
