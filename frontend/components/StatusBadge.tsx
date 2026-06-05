import type { StockMediaAsset } from "@/lib/types";

const statusLabels: Record<StockMediaAsset["status"], string> = {
  "Approved Public": "Approved for church-wide use",
  "Approved Internal": "Internal ministry use only",
  "Needs Review": "Please review before public sharing",
  "Searchable Archive": "Archive only",
  "Do Not Use": "Do not publish externally",
  "Possible Minors": "Contains children/youth"
};

const usageLabels: Record<StockMediaAsset["usageScope"], string> = {
  Public: "Church-wide use",
  Internal: "Internal ministry use",
  "Public and Internal": "Church-wide and internal",
  "Archive Only": "Archive only",
  "Do Not Publish": "Do not publish yet",
  "Do Not Use": "Do not use"
};

export function StatusBadge({ status }: { status: StockMediaAsset["status"] }) {
  return (
    <span className={`status-badge status-badge--${status.toLowerCase().replaceAll(" ", "-")}`} title={`Backend status: ${status}`}>
      {statusLabels[status]}
    </span>
  );
}

export function UsageBadge({ scope }: { scope: StockMediaAsset["usageScope"] }) {
  return <span className="usage-badge">{usageLabels[scope]}</span>;
}
