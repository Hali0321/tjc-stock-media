"use client";

import { PaginationBar } from "@/components/PaginationBar";

type LibraryPaginationProps = {
  rangeStart: number;
  rangeEnd: number;
  total: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  loading?: boolean;
  pageSize?: number;
  onPage?: (page: number) => void;
};

export function LibraryPagination({
  rangeStart,
  rangeEnd,
  total,
  onPrevious,
  onNext,
  loading,
  pageSize,
  onPage
}: LibraryPaginationProps) {
  const effectivePageSize = pageSize || Math.max(1, rangeEnd - rangeStart + 1);
  return (
    <PaginationBar
      rangeStart={rangeStart}
      rangeEnd={rangeEnd}
      total={total}
      pageSize={effectivePageSize}
      loading={loading}
      onPage={(page) => {
        if (onPage) {
          onPage(page);
          return;
        }
        const currentPage = total ? Math.max(1, Math.ceil(rangeStart / Math.max(1, effectivePageSize))) : 1;
        if (page < currentPage) onPrevious();
        if (page > currentPage) onNext();
      }}
    />
  );
}
