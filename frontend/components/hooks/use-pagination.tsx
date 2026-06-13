type UsePaginationProps = {
  currentPage: number;
  totalPages: number;
  paginationItemsToDisplay: number;
};

type UsePaginationReturn = {
  pages: number[];
  showLeftEllipsis: boolean;
  showRightEllipsis: boolean;
};

export function usePagination({
  currentPage,
  totalPages,
  paginationItemsToDisplay,
}: UsePaginationProps): UsePaginationReturn {
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
  const safeTotalPages = Math.max(totalPages, 1);
  const safeItemsToDisplay = Math.max(paginationItemsToDisplay, 3);
  const showLeftEllipsis = safeCurrentPage - 1 > safeItemsToDisplay / 2;
  const showRightEllipsis = safeTotalPages - safeCurrentPage + 1 > safeItemsToDisplay / 2;

  function calculatePaginationRange(): number[] {
    if (safeTotalPages <= safeItemsToDisplay) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }

    const halfDisplay = Math.floor(safeItemsToDisplay / 2);
    const initialRange = {
      start: safeCurrentPage - halfDisplay,
      end: safeCurrentPage + halfDisplay,
    };

    const adjustedRange = {
      start: Math.max(1, initialRange.start),
      end: Math.min(safeTotalPages, initialRange.end),
    };

    if (adjustedRange.start === 1) {
      adjustedRange.end = safeItemsToDisplay;
    }
    if (adjustedRange.end === safeTotalPages) {
      adjustedRange.start = safeTotalPages - safeItemsToDisplay + 1;
    }

    if (showLeftEllipsis) adjustedRange.start++;
    if (showRightEllipsis) adjustedRange.end--;

    return Array.from(
      { length: adjustedRange.end - adjustedRange.start + 1 },
      (_, i) => adjustedRange.start + i,
    );
  }

  const pages = calculatePaginationRange();

  return {
    pages,
    showLeftEllipsis,
    showRightEllipsis,
  };
}
