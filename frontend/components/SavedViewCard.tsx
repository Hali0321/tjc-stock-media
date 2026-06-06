import { ArrowRight } from "lucide-react";
import type { SavedViewSummary } from "@/lib/types";
import { cn } from "@/lib/ui";

export function SavedViewCard({
  view,
  active,
  onOpen
}: {
  view: SavedViewSummary;
  active: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "group grid min-h-14 w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-tjc-line bg-white px-2.5 py-2 text-left transition hover:border-[#9fb8ae] hover:bg-[#fbfcfa] active:translate-y-px lg:rounded-none lg:border-x-0 lg:border-t-0",
        active && "bg-[#edf4f0] text-tjc-evergreen shadow-[inset_3px_0_0_#123f3a]"
      )}
      onClick={onOpen}
    >
      <span className="grid min-w-0 gap-1">
        <span className="truncate text-[13px] font-semibold leading-tight text-tjc-ink">{view.label}</span>
        <span className="line-clamp-1 text-[11px] leading-snug text-tjc-muted">{view.description}</span>
      </span>
      <span className="grid justify-items-end gap-1">
        <span className="text-sm font-semibold tabular-nums text-tjc-evergreen">{view.count.toLocaleString()}</span>
        <ArrowRight className="text-tjc-evergreen transition group-hover:translate-x-1" size={15} strokeWidth={1.8} aria-hidden="true" />
      </span>
    </button>
  );
}
