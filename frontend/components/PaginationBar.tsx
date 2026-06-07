"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/ui";

type PaginationBarProps = {
  rangeStart: number;
  rangeEnd: number;
  total: number;
  pageSize: number;
  loading?: boolean;
  onPage: (page: number) => void;
};

function paginationRange(currentPage: number, totalPages: number, slots = 5) {
  if (totalPages <= slots) return { pages: Array.from({ length: totalPages }, (_, index) => index + 1), left: false, right: false };
  const half = Math.floor(slots / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, currentPage + half);
  if (start === 1) end = slots;
  if (end === totalPages) start = totalPages - slots + 1;
  const left = start > 1;
  const right = end < totalPages;
  if (left) start += 1;
  if (right) end -= 1;
  return { pages: Array.from({ length: end - start + 1 }, (_, index) => start + index), left, right };
}

export function PaginationBar({ rangeStart, rangeEnd, total, pageSize, loading, onPage }: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const currentPage = total ? Math.max(1, Math.ceil(rangeStart / Math.max(1, pageSize))) : 1;
  const disabledPrevious = loading || currentPage <= 1;
  const disabledNext = loading || currentPage >= totalPages;
  const rangeText = total ? `Showing ${rangeStart.toLocaleString()}-${rangeEnd.toLocaleString()} of ${total.toLocaleString()}` : "No matching assets";
  const pageModel = paginationRange(currentPage, totalPages, 5);

  function pageButton(page: number) {
    const selected = page === currentPage;
    return (
      <button
        key={page}
        type="button"
        className={cn(
          "grid h-9 min-w-9 place-items-center rounded-full border px-2 text-sm font-black tabular-nums transition active:translate-y-px",
          selected ? "border-[#007da4] bg-[#e6f0eb] text-tjc-evergreen" : "border-tjc-line bg-white text-[#3e4741] hover:bg-[#eef7f1]"
        )}
        aria-current={selected ? "page" : undefined}
        disabled={loading || selected}
        onClick={() => onPage(page)}
      >
        {page}
      </button>
    );
  }

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-[#d8dfd5] bg-white/95 px-3 py-2.5 shadow-[0_1px_0_rgba(32,34,31,.04)]" aria-label="Pagination">
      <div className="grid gap-0.5">
        <strong className="text-sm font-black text-tjc-ink">{loading ? "Loading results" : rangeText}</strong>
        <span className="text-xs font-semibold text-tjc-muted">Page {currentPage.toLocaleString()} of {totalPages.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={cn(
            "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-tjc-line px-3 text-sm font-black transition",
            disabledPrevious ? "cursor-not-allowed bg-[#f6f7f5] text-[#8b958d]" : "bg-white text-tjc-evergreen hover:bg-[#eef7f1] active:translate-y-px"
          )}
          onClick={() => onPage(currentPage - 1)}
          disabled={disabledPrevious}
        >
          <ChevronLeft size={15} strokeWidth={1.8} aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <div className="hidden items-center gap-1 md:flex" aria-label="Page numbers">
          {pageModel.left ? (
            <>
              {pageButton(1)}
              <span className="grid h-9 w-7 place-items-center text-tjc-muted"><MoreHorizontal size={15} aria-hidden="true" /></span>
            </>
          ) : null}
          {pageModel.pages.map(pageButton)}
          {pageModel.right ? (
            <>
              <span className="grid h-9 w-7 place-items-center text-tjc-muted"><MoreHorizontal size={15} aria-hidden="true" /></span>
              {pageButton(totalPages)}
            </>
          ) : null}
        </div>
        <button
          type="button"
          className={cn(
            "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-tjc-line px-3 text-sm font-black transition",
            disabledNext ? "cursor-not-allowed bg-[#f6f7f5] text-[#8b958d]" : "bg-white text-tjc-evergreen hover:bg-[#eef7f1] active:translate-y-px"
          )}
          onClick={() => onPage(currentPage + 1)}
          disabled={disabledNext}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={15} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
