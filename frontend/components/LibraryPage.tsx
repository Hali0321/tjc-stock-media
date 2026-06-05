"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Archive, CheckCircle2, Clock3, Database, Search, ShieldAlert, SlidersHorizontal, Users, X } from "lucide-react";
import { AssetCard } from "@/components/AssetCard";
import { CollectionAlbumCard } from "@/components/CollectionAlbumCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import { SavedViewCard } from "@/components/SavedViewCard";
import { useDemoRole } from "@/components/RoleProvider";
import type { SearchResult, StockMediaAsset } from "@/lib/types";
import { formatResultCount, normalizeAssetTitle } from "@/lib/display";
import { cn } from "@/lib/ui";

const sortOptions = ["Approved first", "Recently approved", "Newest", "A-Z"] as const;
type SortOption = (typeof sortOptions)[number];

const useCaseButtons = [
  { label: "Website hero", view: "website-hero" },
  { label: "Slides", view: "sermon-slides" },
  { label: "Newsletter", view: "newsletter" },
  { label: "Social", view: "social-media" },
  { label: "No people", view: "no-people" },
  { label: "Internal only", view: "internal-ministry" },
  { label: "Recently approved", view: "recently-approved" },
  { label: "Needs review", view: "needs-review", reviewerOnly: true }
] as const;

function AssetGridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" aria-hidden="true">
      {Array.from({ length: 15 }).map((_, index) => (
        <div key={index} className={cn("skeleton w-full", index % 4 === 0 ? "h-72" : index % 3 === 0 ? "h-60" : "h-64")} />
      ))}
    </div>
  );
}

function sortAssets(assets: StockMediaAsset[], sort: SortOption) {
  const sorted = [...assets];
  if (sort === "A-Z") {
    sorted.sort((a, b) => normalizeAssetTitle(a.title, a.originalFilename, a).localeCompare(normalizeAssetTitle(b.title, b.originalFilename, b)));
  }
  if (sort === "Newest") {
    sorted.sort((a, b) => (b.capturedDate || b.importDate || b.id || "").localeCompare(a.capturedDate || a.importDate || a.id || "", undefined, { numeric: true }));
  }
  if (sort === "Recently approved") {
    sorted.sort((a, b) => (b.reviewedDate || "").localeCompare(a.reviewedDate || ""));
  }
  if (sort === "Approved first") {
    sorted.sort((a, b) => {
      const aRank = a.status === "Approved Public" ? 0 : a.status === "Approved Internal" ? 1 : 2;
      const bRank = b.status === "Approved Public" ? 0 : b.status === "Approved Internal" ? 1 : 2;
      return aRank - bRank || (b.reviewedDate || "").localeCompare(a.reviewedDate || "");
    });
  }
  return sorted;
}

export function LibraryPage() {
  const { role, ready } = useDemoRole();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [selectedView, setSelectedView] = useState("");
  const [sort, setSort] = useState<SortOption>("Approved first");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({ role, q: submittedQuery, limit: "84" });
    if (selectedView) params.set("view", selectedView);
    filters.forEach((filter) => params.append("filter", filter));
    return `/api/assets/search?${params.toString()}`;
  }, [role, submittedQuery, filters, selectedView]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    fetch(apiUrl)
      .then((response) => response.json())
      .then((data: SearchResult) => {
        if (!cancelled) setResult(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiUrl, ready]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const nextQuery = String(new FormData(form).get("q") || "").trim();
    setSelectedView("");
    setQuery(nextQuery);
    setSubmittedQuery(nextQuery);
  }

  function toggleFilter(filter: string) {
    setFilters((current) => (current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]));
  }

  function openSavedView(viewId: string) {
    setSelectedView(viewId);
    setQuery("");
    setSubmittedQuery("");
  }

  function clearSearchState() {
    setSelectedView("");
    setSubmittedQuery("");
    setQuery("");
    setFilters([]);
  }

  function openUseCase(item: (typeof useCaseButtons)[number]) {
    openSavedView(item.view);
  }

  function browseCollection(searchQuery: string, name: string) {
    setSelectedView("");
    setQuery(name);
    setSubmittedQuery(searchQuery || name);
  }

  const reviewer = role === "Reviewer" || role === "DAM Admin";
  const sortedAssets = useMemo(() => sortAssets(result?.assets || [], sort), [result?.assets, sort]);
  const activeView = result?.savedViews.find((view) => view.id === selectedView);
  const shortcuts = result?.savedViews.filter((view) => reviewer || view.id !== "needs-review" && view.id !== "children-youth") || [];
  const visibleUseCases = useCaseButtons.filter((item) => !("reviewerOnly" in item) || reviewer);
  const hasActiveSearch = Boolean(activeView || submittedQuery || filters.length);

  return (
    <div className="mx-auto w-full max-w-[1760px] px-3 py-4 md:px-5 md:py-5">
      <section className="grid gap-4 border-b border-tjc-line pb-4 xl:grid-cols-[minmax(0,1fr)_30rem]" aria-label="Library workspace">
        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-.02em] text-tjc-ink md:text-3xl">Library</h1>
              <p className="mt-1 max-w-[68ch] text-sm leading-relaxed text-tjc-muted">
                Find approved media by ministry need, collection, people risk, date, status, and TJC terms.
              </p>
            </div>
            {hasActiveSearch ? (
              <button className="inline-flex min-h-9 items-center gap-2 rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef5f1] active:translate-y-px" type="button" onClick={clearSearchState}>
                <X size={15} strokeWidth={1.8} aria-hidden="true" />
                Reset
              </button>
            ) : null}
          </div>
          <form className="mt-4 grid gap-2 rounded-lg border border-tjc-line bg-white p-2 shadow-[0_1px_0_rgba(32,34,31,.04)] md:grid-cols-[auto_1fr_auto]" onSubmit={submit} aria-label="Library search">
            <Search aria-hidden="true" className="ml-1 mt-2 text-tjc-evergreen" size={20} strokeWidth={1.8} />
            <label className="sr-only" htmlFor="library-search">Search approved media</label>
            <input
              id="library-search"
              className="min-h-10 min-w-0 bg-transparent px-1 text-base text-tjc-ink placeholder:text-[#7f8a82]"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Bible, fellowship, baptism, flowers, no people, website hero..."
              name="q"
              type="search"
            />
            <button className="min-h-10 rounded-md bg-tjc-evergreen px-5 text-sm font-semibold text-white transition hover:bg-tjc-evergreen-2 active:translate-y-px" type="submit">Search</button>
          </form>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Use-case shortcuts">
            {visibleUseCases.map((item) => (
              <button
                key={item.label}
                type="button"
                className="inline-flex min-h-9 shrink-0 items-center rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-[#3f4a43] transition hover:border-[#9bc5b5] hover:bg-[#eef7f1] active:translate-y-px"
                onClick={() => openUseCase(item)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid min-w-0 content-start gap-3 rounded-lg border border-tjc-line bg-white/74 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-sm font-semibold text-tjc-evergreen">Source and count truth</span>
              <strong className="mt-1 block text-sm font-semibold text-tjc-ink">{result?.source.label || "Loading source"}</strong>
              <p className="mt-1 text-xs leading-relaxed text-tjc-muted">{result?.source.detail || "Loading ResourceSpace source state."}</p>
            </div>
            <Database className="shrink-0 text-tjc-evergreen" size={19} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Catalog summary">
            {[
              { icon: CheckCircle2, value: result?.counts.approved ?? "-", label: "approved" },
              { icon: Clock3, value: result?.counts.needsReview ?? "-", label: "review" },
              { icon: ShieldAlert, value: result?.counts.rightsReview ?? "-", label: "rights" },
              { icon: Users, value: result?.counts.childrenYouth ?? "-", label: "youth" },
              { icon: Archive, value: result?.counts.archive ?? "-", label: "archive" },
              { icon: Database, value: result?.counts.visibleToRole ?? "-", label: "visible" }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div className="grid min-h-16 content-center rounded-md border border-tjc-line bg-[#fbfcfa] p-2" key={item.label}>
                  <Icon className="text-tjc-evergreen" size={14} strokeWidth={1.8} aria-hidden="true" />
                  <strong className="mt-1 text-lg font-semibold tabular-nums text-tjc-ink">{item.value}</strong>
                  <span className="text-[11px] font-medium leading-tight text-tjc-muted">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[20rem_minmax(0,1fr)]" aria-label="Library controls and results">
        <aside className="order-2 grid gap-4 xl:order-1 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-lg border border-tjc-line bg-white/82" aria-label="Saved DAM views">
            <div className="border-b border-tjc-line px-3 py-3">
              <h2 className="text-sm font-semibold text-tjc-evergreen">Saved DAM views</h2>
              <p className="mt-1 text-xs leading-relaxed text-tjc-muted">Operational shortcuts backed by ResourceSpace export fields.</p>
            </div>
            <div className="flex gap-2 overflow-x-auto p-2 lg:block lg:p-0">
              {shortcuts.slice(0, 10).map((view) => (
                <SavedViewCard key={view.id} view={view} active={selectedView === view.id} onOpen={() => openSavedView(view.id)} />
              ))}
            </div>
          </section>
          <div className="xl:hidden">
            <button className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen" type="button" onClick={() => setFiltersOpen((value) => !value)}>
              <SlidersHorizontal size={16} strokeWidth={1.8} aria-hidden="true" />
              {filtersOpen ? "Hide filters" : "Show filters"}
            </button>
          </div>
          <div className={cn("xl:block", filtersOpen ? "block" : "hidden")}>
            <FilterSidebar filters={filters} onToggle={toggleFilter} onClear={() => setFilters([])} />
          </div>
        </aside>

        <div className="order-1 min-w-0 xl:order-2">
          <section className="min-w-0" aria-label="Asset results">
            <div className="mb-3 grid gap-2 rounded-lg border border-tjc-line bg-white/82 px-3 py-3 text-sm text-tjc-muted" aria-live="polite">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="font-semibold text-tjc-ink">{loading ? "Loading results" : formatResultCount(sortedAssets.length, result?.total ?? 0)}</strong>
                <span>Rendered {result?.counts.rendered ?? sortedAssets.length} / matching {result?.counts.matching ?? result?.total ?? 0} / visible {result?.counts.visibleToRole ?? 0}</span>
              </div>
              {activeView ? (
                <p>
                  View: <strong className="font-semibold text-tjc-evergreen">{activeView.label}</strong>. This view is based on available ResourceSpace export metadata. Reviewer should confirm before production use.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-1.5">
                {submittedQuery ? <span className="rounded-md bg-[#eef4f1] px-2 py-1 text-xs font-semibold text-[#536058]">Search: {submittedQuery}</span> : null}
                {filters.map((filter) => (
                  <button key={filter} className="inline-flex min-h-7 items-center gap-1 rounded-md bg-[#eef4f1] px-2 text-xs font-semibold text-[#536058]" type="button" onClick={() => toggleFilter(filter)}>
                    {filter}
                    <X size={12} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>

            <section className="mb-3 flex flex-wrap items-center gap-2 text-sm text-tjc-muted" aria-label="Sort results">
              <span className="font-semibold text-tjc-ink">Sort</span>
              {sortOptions.map((option) => (
                <button type="button" key={option} className={cn("min-h-9 rounded-md border border-tjc-line bg-white px-3 font-semibold text-[#3e4741] transition hover:bg-[#eef7f1] active:translate-y-px", sort === option && "border-[#9bc5b5] bg-[#e8f5ef] text-tjc-evergreen")} onClick={() => setSort(option)} aria-pressed={sort === option}>
                  {option}
                </button>
              ))}
            </section>

            {loading ? <AssetGridSkeleton /> : null}
            {!loading && result?.assets.length === 0 ? (
              <div className="rounded-lg border border-tjc-line bg-white/76 p-8 text-tjc-muted">No visible assets match this workspace. Try Approved for church-wide use, No people, or Bible Study.</div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {sortedAssets.map((asset) => <AssetCard key={asset.id} asset={asset} role={role} />)}
            </div>
          </section>

          <section id="collections" className="mt-6 scroll-mt-24" aria-label="Featured collections">
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold tracking-[-.01em] text-tjc-ink">Collections</h2>
                <p className="text-sm text-tjc-muted">Albums and ministry contexts with approval summaries.</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {(result?.collections || []).map((collection) => (
                <CollectionAlbumCard
                  key={collection.id}
                  name={collection.name}
                  description={collection.description}
                  countLabel={collection.countLabel}
                  dateRange={collection.dateRange}
                  ministry={collection.ministry}
                  approvalSummary={collection.approvalSummary}
                  peopleWarning={collection.peopleWarning}
                  images={collection.images}
                  onOpen={() => browseCollection(collection.searchQuery, collection.name)}
                />
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
