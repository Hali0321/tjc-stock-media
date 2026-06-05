"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Archive, CheckCircle2, Clock3, Search, ShieldAlert, Sparkles, Users } from "lucide-react";
import { AssetCard } from "@/components/AssetCard";
import { CollectionAlbumCard } from "@/components/CollectionAlbumCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import { SavedViewCard } from "@/components/SavedViewCard";
import { useDemoRole } from "@/components/RoleProvider";
import type { SearchResult, StockMediaAsset } from "@/lib/types";
import { formatResultCount, normalizeAssetTitle } from "@/lib/display";

const sortOptions = ["Approved first", "Recently approved", "Newest", "A-Z"] as const;
type SortOption = (typeof sortOptions)[number];

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
  const { role } = useDemoRole();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [selectedView, setSelectedView] = useState("");
  const [sort, setSort] = useState<SortOption>("Approved first");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({ role, q: submittedQuery, limit: "84" });
    if (selectedView) params.set("view", selectedView);
    filters.forEach((filter) => params.append("filter", filter));
    return `/api/assets/search?${params.toString()}`;
  }, [role, submittedQuery, filters, selectedView]);

  useEffect(() => {
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
  }, [apiUrl]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSelectedView("");
    setSubmittedQuery(query);
  }

  function toggleFilter(filter: string) {
    setFilters((current) => (current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]));
  }

  function openSavedView(viewId: string) {
    setSelectedView(viewId);
    setQuery("");
    setSubmittedQuery("");
  }

  function browseCollection(searchQuery: string, name: string) {
    setSelectedView("");
    setQuery(name);
    setSubmittedQuery(searchQuery || name);
  }

  const sortedAssets = useMemo(() => sortAssets(result?.assets || [], sort), [result?.assets, sort]);
  const activeView = result?.savedViews.find((view) => view.id === selectedView);

  return (
    <div className="page-shell">
      <section className="dam-hero">
        <div>
          <p className="eyebrow">Library</p>
          <h1>Find trusted media for ministry reuse</h1>
          <p>Search by use case, collection, status, people/minors risk, date, tag, and media type.</p>
        </div>
        <div className="source-pill">
          <span>Source</span>
          <strong>{result?.source.label || "Loading"}</strong>
        </div>
      </section>

      <section className="library-command" aria-label="Library search">
        <form className="search-panel search-panel--large" onSubmit={submit}>
          <label htmlFor="library-search">What kind of media do you need?</label>
          <div className="search-panel__row">
            <Search aria-hidden="true" size={20} />
            <input
              id="library-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Bible, fellowship, baptism, flowers, no people, website hero..."
              type="search"
            />
            <button type="submit">Search</button>
          </div>
        </form>

        <div className="dam-metrics" aria-label="Catalog summary">
          <div className="mini-stat">
            <CheckCircle2 size={16} aria-hidden="true" />
            <strong>{result?.counts.approved ?? "-"}</strong>
            <span>approved</span>
          </div>
          <div className="mini-stat">
            <Clock3 size={16} aria-hidden="true" />
            <strong>{result?.counts.needsReview ?? "-"}</strong>
            <span>review</span>
          </div>
          <div className="mini-stat">
            <Users size={16} aria-hidden="true" />
            <strong>{result?.counts.childrenYouth ?? "-"}</strong>
            <span>children/youth</span>
          </div>
          <div className="mini-stat">
            <Archive size={16} aria-hidden="true" />
            <strong>{result?.counts.archive ?? "-"}</strong>
            <span>archive</span>
          </div>
          <div className="mini-stat mini-stat--safe">
            <ShieldAlert size={16} aria-hidden="true" />
            <strong>{result?.counts.missingSource ?? "-"}</strong>
            <span>missing source</span>
          </div>
        </div>
      </section>

      <section className="saved-views-section" aria-label="Quick DAM views">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Quick DAM Views</p>
            <h2>Start from ministry jobs, not metadata</h2>
          </div>
          {selectedView ? <button type="button" onClick={() => setSelectedView("")}>Clear view</button> : null}
        </div>
        <div className="saved-view-grid">
          {(result?.savedViews || []).slice(0, 10).map((view) => (
            <SavedViewCard key={view.id} view={view} active={selectedView === view.id} onOpen={() => openSavedView(view.id)} />
          ))}
        </div>
      </section>

      <section id="collections" className="collections-section" aria-label="Featured collections">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Collections</p>
            <h2>Albums, events, and ministry sets</h2>
          </div>
          <span><Sparkles size={15} aria-hidden="true" /> Real approved representatives</span>
        </div>
        <div className="collections-band">
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

      <div className="library-workspace">
        <FilterSidebar filters={filters} onToggle={toggleFilter} onClear={() => setFilters([])} />
        <section className="asset-results-panel" aria-label="Asset results">
          <div className="result-bar result-bar--workspace" aria-live="polite">
            <strong>{loading ? "Loading results" : formatResultCount(sortedAssets.length, result?.total ?? 0)}</strong>
            {activeView ? <span>View: {activeView.label}</span> : null}
            {submittedQuery ? <span>Search: {submittedQuery}</span> : null}
            {filters.length ? <span>Filters: {filters.join(", ")}</span> : null}
          </div>

          <section className="sort-row" aria-label="Sort results">
            <span>Sort</span>
            {sortOptions.map((option) => (
              <button type="button" key={option} className={sort === option ? "sort-row__active" : ""} onClick={() => setSort(option)} aria-pressed={sort === option}>
                {option}
              </button>
            ))}
            <small>Approved assets remain prioritized by catalog policy.</small>
          </section>

          {loading ? <div className="empty-state">Loading media...</div> : null}
          {!loading && result?.assets.length === 0 ? (
            <div className="empty-state">No visible assets match this workspace. Try Approved for church-wide use, No people, or Bible Study.</div>
          ) : null}
          <div className="asset-grid">
            {sortedAssets.map((asset) => <AssetCard key={asset.id} asset={asset} role={role} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
