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
        "group grid min-h-16 w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-[#d8dfd5] bg-white px-3 py-2.5 text-left shadow-[0_1px_0_rgba(255,255,255,.85)_inset] transition duration-200 hover:-translate-y-0.5 hover:border-[#9fb8ae] hover:bg-[#f7fbf8] active:translate-y-px lg:rounded-none lg:border-x-0 lg:border-t-0 lg:bg-transparent lg:shadow-none",
        active && "bg-[#edf7f2] text-tjc-evergreen shadow-[inset_4px_0_0_#123f3a,0_1px_0_rgba(32,34,31,.035)] lg:bg-[#edf7f2]"
      )}
      onClick={onOpen}
    >
      <span className="grid min-w-0 gap-1">
        <span className="truncate text-[13px] font-bold leading-tight text-tjc-ink">{view.label}</span>
        <span className="line-clamp-1 text-[11px] leading-snug text-tjc-muted">{view.description}</span>
      </span>
      <span className="grid justify-items-end gap-1">
        <span className="text-sm font-semibold tabular-nums text-tjc-evergreen">{view.count.toLocaleString()}</span>
        <ArrowRight className="text-tjc-evergreen transition duration-200 group-hover:translate-x-1" size={15} strokeWidth={1.8} aria-hidden="true" />
      </span>
    </button>
  );
}
