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
  onPageSize?: (pageSize: number) => void;
  density?: "default" | "secondary";
};

const pageSizeOptions = [12, 24, 36, 48];

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

export function PaginationBar({ rangeStart, rangeEnd, total, pageSize, loading, onPage, onPageSize, density = "default" }: PaginationBarProps) {
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
          "grid h-9 min-w-9 place-items-center rounded-md border px-2 text-sm font-black tabular-nums transition active:translate-y-px",
          selected ? "border-[#8fb2a5] bg-[#e6f0eb] text-tjc-evergreen" : "border-tjc-line bg-white text-[#3e4741] hover:bg-[#eef7f1]"
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
    <nav className={cn("flex flex-wrap items-center justify-between gap-3 rounded-md border bg-white px-3 py-2.5", density === "secondary" ? "border-[#e0e6df] text-sm shadow-none" : "border-[#d8dfd5]")} aria-label="Pagination">
      <div className="grid gap-0.5">
        <strong className="text-sm font-black text-tjc-ink">{loading ? "Loading results" : rangeText}</strong>
        <span className="text-xs font-semibold text-tjc-muted">Page {currentPage.toLocaleString()} of {totalPages.toLocaleString()}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {onPageSize ? (
          <label className="inline-flex min-h-9 items-center gap-2 rounded-md border border-tjc-line bg-white px-2 text-xs font-black text-[#3e4741]">
            <span className="hidden sm:inline">Per page</span>
            <select
              className="bg-transparent text-sm font-black text-tjc-evergreen outline-none"
              value={pageSize}
              disabled={loading}
              onChange={(event) => onPageSize(Number(event.target.value))}
              aria-label="Results per page"
            >
              {pageSizeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        ) : null}
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-md border border-tjc-line px-3 text-sm font-black transition",
              disabledPrevious ? "cursor-not-allowed bg-[#f6f7f5] text-[#8b958d]" : "bg-white text-tjc-evergreen hover:bg-[#eef7f1] active:translate-y-px"
            )}
            onClick={() => onPage(currentPage - 1)}
            disabled={disabledPrevious}
          >
            <ChevronLeft size={15} strokeWidth={1.8} aria-hidden="true" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          <span className="px-2 text-xs font-black text-tjc-muted md:hidden">{currentPage} / {totalPages}</span>
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
              "inline-flex min-h-9 items-center gap-1.5 rounded-md border border-tjc-line px-3 text-sm font-black transition",
              disabledNext ? "cursor-not-allowed bg-[#f6f7f5] text-[#8b958d]" : "bg-white text-tjc-evergreen hover:bg-[#eef7f1] active:translate-y-px"
            )}
            onClick={() => onPage(currentPage + 1)}
            disabled={disabledNext}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={15} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
      </div>
    </nav>
  );
}
