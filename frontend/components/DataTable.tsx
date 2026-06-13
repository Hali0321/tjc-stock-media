"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/ui";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  sortable?: boolean;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  gridTemplateColumns: string;
  mobileCard?: (row: T) => ReactNode;
  getRowHref?: (row: T) => string | undefined;
  getSearchText?: (row: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  className?: string;
  label: string;
};

const defaultPageSizeOptions = [10, 25, 50];

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  gridTemplateColumns,
  mobileCard,
  getRowHref,
  getSearchText,
  searchable = false,
  searchPlaceholder = "Filter rows...",
  initialPageSize,
  pageSizeOptions = defaultPageSizeOptions,
  className,
  label
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(columns.find((column) => column.sortable || column.sortValue)?.key || null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSizeOptionKey = pageSizeOptions.join(",");
  const normalizedPageSizeOptions = Array.from(new Set(pageSizeOptions.filter((option) => option > 0))).sort((a, b) => a - b);
  const [pageSize, setPageSize] = useState(initialPageSize || normalizedPageSizeOptions[0] || rows.length || 1);

  useEffect(() => {
    setPageSize(initialPageSize || normalizedPageSizeOptions[0] || rows.length || 1);
    setPage(1);
  }, [initialPageSize, pageSizeOptionKey, rows.length]);

  const filteredRows = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return rows;
    return rows.filter((row) => {
      const text = (getSearchText?.(row) || columns.map((column) => {
        const sort = column.sortValue?.(row);
        return sort == null ? "" : String(sort);
      }).join(" ")).toLowerCase();
      return terms.every((term) => text.includes(term));
    });
  }, [columns, getSearchText, query, rows]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;
    const column = columns.find((item) => item.key === sortKey);
    if (!column?.sortValue) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const aValue = column.sortValue?.(a);
      const bValue = column.sortValue?.(b);
      const result = typeof aValue === "number" && typeof bValue === "number"
        ? aValue - bValue
        : String(aValue ?? "").localeCompare(String(bValue ?? ""), undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? result : -result;
    });
  }, [columns, filteredRows, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = sortedRows.length ? (safePage - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(safePage * pageSize, sortedRows.length);

  function toggleSort(column: DataTableColumn<T>) {
    if (!column.sortValue && !column.sortable) return;
    setPage(1);
    if (sortKey === column.key) {
      setSortDirection((current) => current === "asc" ? "desc" : "asc");
    } else {
      setSortKey(column.key);
      setSortDirection("asc");
    }
  }

  return (
    <section className={cn("dam-data-table", className)} aria-label={label}>
      {searchable || rows.length > pageSize ? (
        <div className="grid gap-3 border-b border-tjc-line bg-white px-3 py-3 text-sm md:grid-cols-[minmax(0,1fr)_auto]">
          {searchable ? (
            <label className="relative min-w-0">
              <span className="sr-only">{searchPlaceholder}</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tjc-muted" size={15} strokeWidth={1.8} aria-hidden="true" />
              <input
                className="min-h-10 w-full rounded-xl border border-tjc-line bg-[#fbfcfa] pl-9 pr-3 text-sm font-semibold text-tjc-ink placeholder:text-tjc-muted"
                value={query}
                onChange={(event) => {
                  setQuery(event.currentTarget.value);
                  setPage(1);
                }}
                placeholder={searchPlaceholder}
              />
            </label>
          ) : <span />}
          <div className="flex flex-wrap items-center gap-2 text-xs font-black text-tjc-muted" aria-live="polite">
            <span>Showing {rangeStart.toLocaleString()}-{rangeEnd.toLocaleString()} of {sortedRows.length.toLocaleString()}</span>
            {rows.length > (normalizedPageSizeOptions[0] || pageSize) ? (
              <select
                className="min-h-9 rounded-lg border border-tjc-line bg-white px-2 text-xs font-black text-tjc-ink"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.currentTarget.value));
                  setPage(1);
                }}
                aria-label="Rows per page"
              >
                {Array.from(new Set([pageSize, ...normalizedPageSizeOptions]))
                  .filter((option) => option > 0)
                  .sort((a, b) => a - b)
                  .map((option) => <option key={option} value={option}>{option} rows</option>)}
              </select>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="hidden border-b border-tjc-line bg-[#f8faf8] px-3 py-2 text-xs font-black text-tjc-muted md:grid" style={{ gridTemplateColumns }}>
        {columns.map((column) => (
          <button
            className={cn("inline-flex items-center gap-1 text-left font-black disabled:cursor-default", column.className)}
            key={column.key}
            type="button"
            onClick={() => toggleSort(column)}
            disabled={!column.sortValue && !column.sortable}
            aria-sort={sortKey === column.key ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
          >
            <span>{column.header}</span>
            {sortKey === column.key ? (sortDirection === "asc" ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />) : null}
          </button>
        ))}
      </div>
      <div className="hidden md:block">
        {visibleRows.map((row) => {
          const href = getRowHref?.(row);
          const content = (
            <div className="dam-data-row items-center text-sm" style={{ gridTemplateColumns }}>
              {columns.map((column) => (
                <span className={cn("min-w-0", column.className)} key={column.key}>{column.render(row)}</span>
              ))}
            </div>
          );
          return href ? <Link className="block transition hover:bg-[#f8fbf8]" href={href} key={getRowKey(row)}>{content}</Link> : <div key={getRowKey(row)}>{content}</div>;
        })}
        {!visibleRows.length ? <div className="px-3 py-8 text-center text-sm font-semibold text-tjc-muted">No rows match current filters.</div> : null}
      </div>
      <div className="grid gap-2 p-2 md:hidden">
        {visibleRows.map((row) => (
          <div className="rounded-xl border border-tjc-line bg-white p-3" key={getRowKey(row)}>
            {mobileCard ? mobileCard(row) : (
              <dl className="grid gap-2">
                {columns.map((column) => (
                  <div key={column.key}>
                    <dt className="text-xs font-black text-tjc-muted">{column.header}</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-tjc-ink">{column.render(row)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        ))}
        {!visibleRows.length ? <div className="rounded-xl border border-tjc-line bg-white p-4 text-sm font-semibold text-tjc-muted">No rows match current filters.</div> : null}
      </div>
      {sortedRows.length > pageSize ? (
        <nav className="flex flex-wrap items-center justify-between gap-2 border-t border-tjc-line bg-[#fbfcfa] px-3 py-3 text-sm" aria-label={`${label} pagination`}>
          <span className="font-black text-tjc-muted">Page {safePage} of {totalPages}</span>
          <div className="flex gap-2">
            <button className="min-h-9 rounded-lg border border-tjc-line bg-white px-3 font-black text-tjc-evergreen disabled:opacity-45" type="button" disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              Previous
            </button>
            <button className="min-h-9 rounded-lg border border-tjc-line bg-white px-3 font-black text-tjc-evergreen disabled:opacity-45" type="button" disabled={safePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
              Next
            </button>
          </div>
        </nav>
      ) : null}
    </section>
  );
}
