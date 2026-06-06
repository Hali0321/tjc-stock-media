"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/ui";

type LibraryPaginationProps = {
  rangeStart: number;
  rangeEnd: number;
  total: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  loading?: boolean;
};

export function LibraryPagination({
  rangeStart,
  rangeEnd,
  total,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  loading
}: LibraryPaginationProps) {
  const disabledPrevious = loading || !hasPrevious;
  const disabledNext = loading || !hasNext;
  const totalText = total.toLocaleString();
  const rangeText = total ? `Showing ${rangeStart.toLocaleString()}-${rangeEnd.toLocaleString()} of ${totalText}` : "No matching assets";

  return (
    <nav className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#d8dfd5] bg-white/95 px-3 py-2.5 shadow-[0_1px_0_rgba(32,34,31,.04)]" aria-label="Asset result pagination">
      <strong className="text-sm font-semibold text-tjc-ink">{loading ? "Loading results" : rangeText}</strong>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={cn(
            "inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-tjc-line px-3 text-sm font-semibold transition",
            disabledPrevious ? "cursor-not-allowed bg-[#f6f7f5] text-[#8b958d]" : "bg-white text-tjc-evergreen hover:bg-[#eef7f1] active:translate-y-px"
          )}
          onClick={onPrevious}
          disabled={disabledPrevious}
        >
          <ChevronLeft size={15} strokeWidth={1.8} aria-hidden="true" />
          Previous
        </button>
        <button
          type="button"
          className={cn(
            "inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-tjc-line px-3 text-sm font-semibold transition",
            disabledNext ? "cursor-not-allowed bg-[#f6f7f5] text-[#8b958d]" : "bg-white text-tjc-evergreen hover:bg-[#eef7f1] active:translate-y-px"
          )}
          onClick={onNext}
          disabled={disabledNext}
        >
          Next
          <ChevronRight size={15} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
