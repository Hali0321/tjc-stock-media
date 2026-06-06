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
        "group grid min-h-[4.6rem] w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-tjc-line px-3 py-2 text-left transition hover:bg-white active:translate-y-px lg:rounded-none lg:border-x-0 lg:border-t-0",
        active && "bg-white text-tjc-evergreen shadow-[inset_3px_0_0_#123f3a]"
      )}
      onClick={onOpen}
    >
      <span className="grid min-w-0 gap-1">
        <span className="truncate text-[14px] font-semibold leading-tight text-tjc-ink">{view.label}</span>
        <span className="line-clamp-2 text-xs leading-snug text-tjc-muted">{view.description}</span>
      </span>
      <span className="grid justify-items-end gap-1">
        <span className="text-base font-semibold tabular-nums text-tjc-evergreen">{view.count.toLocaleString()}</span>
        <ArrowRight className="text-tjc-evergreen transition group-hover:translate-x-1" size={15} strokeWidth={1.8} aria-hidden="true" />
      </span>
    </button>
  );
}
