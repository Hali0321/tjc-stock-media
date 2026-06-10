import type { EnterpriseStatus } from "@/lib/enterprise-status";
import type { DamReadinessResult, IntegrationReadinessItem } from "@/lib/types";

export type AdminNavItem = {
  id: string;
  label: string;
};

export type AdminMetricRow = {
  label: string;
  value: number;
};

export type AdminHealthRow = {
  id: string;
  label: string;
  state: EnterpriseStatus;
};

export const adminNavItems: AdminNavItem[] = [
  { id: "overview", label: "Overview" },
  { id: "users-roles", label: "Users & Roles" },
  { id: "roles-permissions", label: "Roles & Permissions" },
  { id: "teams", label: "Teams" },
  { id: "taxonomy", label: "Taxonomy" },
  { id: "metadata-schemas", label: "Metadata Schemas" },
  { id: "rights-policies", label: "Rights & Policies" },
  { id: "review-workflows", label: "Review Workflows" },
  { id: "storage-retention", label: "Storage & Retention" },
  { id: "ai-moderation", label: "AI Moderation" },
  { id: "integrations", label: "Integrations" },
  { id: "audit-logs", label: "Audit Logs" },
  { id: "system-settings", label: "System Settings" }
];

export const integrationReadinessColumns = ["Module", "Owner", "Status", "Detail"];

export function adminNavLabel(activeId: string) {
  return adminNavItems.find((item) => item.id === activeId)?.label || adminNavItems[0].label;
}

export function integrationState(row: IntegrationReadinessItem): EnterpriseStatus {
  return row.state || (row.ready ? "Operational" : "Not configured");
}

export function policySummaryRows(readiness?: DamReadinessResult | null): AdminMetricRow[] {
  return [
    { label: "Approved public", value: readiness?.metrics.approvedPublic || 0 },
    { label: "Portal ready", value: readiness?.metrics.portalReady || 0 },
    { label: "Rights review", value: readiness?.metrics.rightsReview || 0 },
    { label: "Missing source", value: readiness?.metrics.missingSource || 0 },
    { label: "Rendition gaps", value: readiness?.metrics.renditionGaps || 0 }
  ];
}

export function systemHealthRows(readiness?: DamReadinessResult | null): AdminHealthRow[] {
  return (readiness?.integrationReadiness || []).slice(0, 5).map((item) => ({
    id: item.id,
    label: item.label,
    state: integrationState(item)
  }));
}
