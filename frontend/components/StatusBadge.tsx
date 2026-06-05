import type { StockMediaAsset } from "@/lib/types";

export function StatusBadge({ status }: { status: StockMediaAsset["status"] }) {
  return <span className={`status-badge status-badge--${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span>;
}

export function UsageBadge({ scope }: { scope: StockMediaAsset["usageScope"] }) {
  return <span className="usage-badge">{scope}</span>;
}
