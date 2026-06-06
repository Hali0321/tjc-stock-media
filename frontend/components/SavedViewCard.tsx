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
        "group relative grid min-h-24 w-full min-w-0 overflow-hidden rounded-lg border border-[#c5d1c9] bg-white p-3 text-left transition duration-200 hover:border-[#85ad9a] hover:bg-[#f8fbf8] active:translate-y-px",
        active && "border-[#0b4b42] bg-[#f4faf6] text-tjc-evergreen shadow-[inset_3px_0_0_#0b4b42]"
      )}
      onClick={onOpen}
    >
      <span className="grid min-w-0 gap-2">
        <span className="flex items-start justify-between gap-3">
          <span className="truncate text-[13px] font-black leading-tight text-tjc-ink">{view.label}</span>
          <span className="text-xl font-black leading-none tabular-nums text-tjc-evergreen">{view.count.toLocaleString()}</span>
        </span>
        <span className="line-clamp-2 text-xs font-semibold leading-snug text-tjc-muted">{view.description}</span>
      </span>
      <span className="mt-3 flex items-center justify-between border-t border-[#dbe3dc] pt-2 text-[11px] font-black uppercase tracking-[.04em] text-tjc-evergreen">
        Open view
        <ArrowRight className="transition duration-200 group-hover:translate-x-1" size={15} strokeWidth={1.9} aria-hidden="true" />
      </span>
    </button>
  );
}
