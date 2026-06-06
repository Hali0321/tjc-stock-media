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
        "group relative grid min-h-28 w-full min-w-0 overflow-hidden rounded-2xl border border-[#c5d1c9] bg-[linear-gradient(180deg,#fff,#f7faf7)] p-3 text-left shadow-[0_1px_0_rgba(255,255,255,.9)_inset,0_18px_44px_rgba(25,34,29,.07)] transition duration-200 hover:-translate-y-0.5 hover:border-[#85ad9a] hover:shadow-[0_24px_62px_rgba(25,34,29,.12)] active:translate-y-px",
        active && "border-[#75ad97] bg-[linear-gradient(180deg,#f3fff7,#dff3e8)] text-tjc-evergreen shadow-[inset_0_0_0_1px_rgba(6,63,57,.1),0_24px_64px_rgba(6,63,57,.14)]"
      )}
      onClick={onOpen}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#063f39,#6fb48f,#f0c66f)] opacity-80" aria-hidden="true" />
      <span className="grid min-w-0 gap-2">
        <span className="flex items-start justify-between gap-3">
          <span className="truncate text-[13px] font-black leading-tight text-tjc-ink">{view.label}</span>
          <span className="text-xl font-black leading-none tabular-nums text-tjc-evergreen">{view.count.toLocaleString()}</span>
        </span>
        <span className="line-clamp-2 text-xs font-semibold leading-snug text-tjc-muted">{view.description}</span>
      </span>
      <span className="mt-3 flex items-center justify-between border-t border-[#dbe3dc] pt-2 text-[11px] font-black uppercase tracking-[.08em] text-tjc-evergreen">
        Open view
        <ArrowRight className="transition duration-200 group-hover:translate-x-1" size={15} strokeWidth={1.9} aria-hidden="true" />
      </span>
    </button>
  );
}
