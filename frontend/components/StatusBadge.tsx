import type { StockMediaAsset } from "@/lib/types";
import { cn } from "@/lib/ui";

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
  const tone =
    status === "Approved Public"
      ? "border-[#b8d9c6] bg-[#edf8f1] text-[#22563a]"
      : status === "Approved Internal"
        ? "border-[#c8d7e6] bg-[#eef5fb] text-[#264a67]"
        : status === "Needs Review" || status === "Possible Minors"
          ? "border-[#ead6a8] bg-[#fff7e5] text-[#725216]"
          : status === "Do Not Use"
            ? "border-[#e5c0bc] bg-[#fff0ee] text-[#863530]"
            : "border-[#d8d2e4] bg-[#f4f1f8] text-[#5f5275]";
  return (
    <span className={cn("inline-flex min-h-7 items-center rounded-md border px-2.5 text-xs font-semibold leading-none", tone)} title={`Backend status: ${status}`}>
      {statusLabels[status]}
    </span>
  );
}

export function UsageBadge({ scope }: { scope: StockMediaAsset["usageScope"] }) {
  return <span className="inline-flex min-h-7 items-center rounded-md border border-tjc-line bg-white/80 px-2.5 text-xs font-semibold leading-none text-[#405048]">{usageLabels[scope]}</span>;
}
