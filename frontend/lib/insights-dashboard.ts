import { Box, Database, Eye, PackageCheck, Shield, Users, type LucideIcon } from "lucide-react";
import type { SearchResult } from "@/lib/types";

export type InsightKpi = {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
  danger?: boolean;
};

export type InsightChart = {
  id: string;
  title: string;
  large?: boolean;
  sample?: boolean;
  tone?: "indigo" | "green" | "orange" | "red";
  rows?: string[];
};

export type InsightHealthRow = {
  label: string;
  value: number;
  tone: "indigo" | "green" | "orange" | "red";
};

type InsightCounts = SearchResult["counts"] | undefined;

export function insightKpis(counts: InsightCounts): InsightKpi[] {
  return [
    { label: "ResourceSpace Records", value: (counts?.rawTotal || 0).toLocaleString(), delta: "from DAM source", icon: Database },
    { label: "Visible to Role", value: (counts?.visibleToRole || 0).toLocaleString(), delta: "permission-filtered", icon: Users },
    { label: "Approved Public", value: (counts?.approvedRaw || 0).toLocaleString(), delta: "raw approval", icon: Eye },
    { label: "Needs Review", value: (counts?.needsReview || 0).toLocaleString(), delta: "review queue", icon: Box },
    { label: "Portal Ready", value: (counts?.portalReady || 0).toLocaleString(), delta: "policy cleared", icon: PackageCheck },
    { label: "Blocked / Risk", value: (counts?.rightsReview || 0).toLocaleString(), delta: "rights review", icon: Shield, danger: true }
  ];
}

export const insightCharts: InsightChart[] = [
  { id: "review-load", title: "Review Load", large: true, tone: "orange" },
  { id: "usage-trend", title: "Usage Trend", large: true, sample: true, tone: "green" },
  { id: "top-assets", title: "Top Assets" },
  { id: "top-searches", title: "Top Searches", sample: true, rows: ["Bible", "worship", "fellowship", "Sabbath", "newsletter"] },
  { id: "zero-result-searches", title: "Zero-Result Searches", sample: true, rows: ["Usage logging not connected", "Sample analytics only"] },
  { id: "package-performance", title: "Package Performance", sample: true, rows: ["Portal package logging not connected"] }
];

export function insightHealthRows(counts: InsightCounts): InsightHealthRow[] {
  return [
    { label: "Missing Metadata", value: counts?.pendingReview || 0, tone: "indigo" },
    { label: "Rights Review", value: counts?.rightsReview || 0, tone: "orange" },
    { label: "Children/Youth", value: counts?.childrenYouth || 0, tone: "indigo" },
    { label: "Missing Source", value: counts?.missingSource || 0, tone: "orange" },
    { label: "Archive", value: counts?.archive || 0, tone: "indigo" },
    { label: "Portal Ready", value: counts?.portalReady || 0, tone: "green" }
  ];
}
