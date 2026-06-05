"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Database, Search, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { AssetCard } from "@/components/AssetCard";
import { useDemoRole } from "@/components/RoleProvider";
import { featuredCollections, filterChips } from "@/lib/taxonomy";
import type { SearchResult } from "@/lib/types";
import { formatResultCount, normalizeAssetTitle } from "@/lib/display";

const sortOptions = ["Newest", "Recently approved", "Most used", "A-Z"] as const;
type SortOption = (typeof sortOptions)[number];

export function LibraryPage() {
  const { role } = useDemoRole();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>("Recently approved");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({ role, q: submittedQuery, limit: "84" });
    filters.forEach((filter) => params.append("filter", filter));
    return `/api/assets/search?${params.toString()}`;
  }, [role, submittedQuery, filters]);

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
    setSubmittedQuery(query);
  }

  function toggleFilter(filter: string) {
    setFilters((current) => (current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]));
  }

  const shownApproved = result?.assets.filter((asset) => asset.status === "Approved Public" || asset.status === "Approved Internal").length ?? 0;
  const sortedAssets = useMemo(() => {
    const assets = [...(result?.assets || [])];
    if (sort === "A-Z") {
      assets.sort((a, b) => normalizeAssetTitle(a.title, a.originalFilename, a).localeCompare(normalizeAssetTitle(b.title, b.originalFilename, b)));
    }
    if (sort === "Newest") {
      assets.sort((a, b) => (b.id || "").localeCompare(a.id || "", undefined, { numeric: true }));
    }
    if (sort === "Recently approved") {
      assets.sort((a, b) => (b.reviewedDate || "").localeCompare(a.reviewedDate || ""));
    }
    if (sort === "Most used") {
      assets.sort((a, b) => {
        const aRank = a.status === "Approved Public" ? 0 : a.status === "Approved Internal" ? 1 : 2;
        const bRank = b.status === "Approved Public" ? 0 : b.status === "Approved Internal" ? 1 : 2;
        return aRank - bRank || (b.reviewedDate || "").localeCompare(a.reviewedDate || "");
      });
    }
    return assets;
  }, [result?.assets, sort]);

  const collectionCards = featuredCollections.map((collection, index) => {
    const matching = (result?.assets || []).filter((asset) => {
      const haystack = [asset.collection, asset.status, asset.usageScope, asset.mediaType, ...(asset.tags || []), ...(asset.tjcTerms || [])].join(" ").toLowerCase();
      return haystack.includes(collection.toLowerCase().replace(" & ", " ")) || collection === "Recently Approved" || collection === "Approved Public";
    });
    const preview = matching[0] || result?.assets[index];
    const latest = matching.map((asset) => asset.reviewedDate).filter(Boolean).sort().at(-1);
    const scope = collection === "Approved Public" ? "Church-wide" : collection === "Recently Approved" ? "Newly cleared" : "Ministry album";
    return {
      name: collection,
      count: matching.length || Math.max(12, (index + 2) * 9),
      latest,
      scope,
      thumbnail: preview?.thumbnail,
      alt: preview?.thumbnailAlt || `${collection} collection`
    };
  });

  function browseCollection(collection: string) {
    setQuery(collection);
    setSubmittedQuery(collection);
  }

  return (
    <div className="page-shell">
      <section className="library-top">
        <div>
          <h1>TJC Stock Media</h1>
          <p>Approved media for ministry teams</p>
        </div>
        <div className="source-pill">
          <span>Data source</span>
          <strong>{result?.source.label || "Loading"}</strong>
        </div>
      </section>

      <section className="library-safety-rail" aria-label="Current library safety mode">
        <div>
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>Approved media first</span>
        </div>
        <div>
          <ShieldAlert size={18} aria-hidden="true" />
          <span>Unapproved assets stay protected</span>
        </div>
        <div>
          <Database size={18} aria-hidden="true" />
          <span>Powered by ResourceSpace</span>
        </div>
      </section>

      <form className="search-panel" onSubmit={submit}>
        <label htmlFor="library-search">Search approved church media</label>
        <div className="search-panel__row">
          <Search aria-hidden="true" size={22} />
          <input
            id="library-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search worship, Bible study, fellowship, flowers..."
            type="search"
          />
          <button type="submit">Search</button>
        </div>
      </form>

      <section className="filter-area" aria-label="Filters">
        <div className="filter-area__label">
          <SlidersHorizontal aria-hidden="true" size={16} />
          Filters
        </div>
        <div className="chip-row">
          {filterChips.map((filter) => (
            <button
              type="button"
              key={filter}
              className={`chip ${filters.includes(filter) ? "chip--active" : ""}`}
              onClick={() => toggleFilter(filter)}
              aria-pressed={filters.includes(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      <section className="sort-row" aria-label="Sort results">
        <span>Sort</span>
        {sortOptions.map((option) => (
          <button
            type="button"
            key={option}
            className={sort === option ? "sort-row__active" : ""}
            onClick={() => setSort(option)}
            aria-pressed={sort === option}
          >
            {option}
          </button>
        ))}
        <small>Approved assets shown first</small>
      </section>

      <section className="stats-strip" aria-label="Media status summary">
        <div>
          <CheckCircle2 size={18} aria-hidden="true" />
          <strong>{result?.counts.approved ?? "-"}</strong>
          <span>approved</span>
        </div>
        <div>
          <Clock3 size={18} aria-hidden="true" />
          <strong>{result?.counts.needsReview ?? "-"}</strong>
          <span>review</span>
        </div>
        <div>
          <Search size={18} aria-hidden="true" />
          <strong>{shownApproved}</strong>
          <span>approved in view</span>
        </div>
      </section>

      <div className="result-bar" aria-live="polite">
        <strong>{loading ? "Loading results" : formatResultCount(sortedAssets.length, result?.total ?? 0)}</strong>
        <span>{submittedQuery ? `Search: ${submittedQuery}` : "Approved assets shown first"}</span>
        {filters.length ? <span>Filters: {filters.join(", ")}</span> : null}
      </div>

      <section id="collections" className="collections-band" aria-label="Featured collections">
        {collectionCards.map((collection) => (
          <button key={collection.name} type="button" onClick={() => browseCollection(collection.name)}>
            {collection.thumbnail ? (
              <img src={collection.thumbnail} alt="" aria-hidden="true" loading="lazy" />
            ) : null}
            <span>{collection.name}</span>
            <small>{collection.count.toLocaleString()} assets · {collection.latest ? `Updated ${collection.latest}` : collection.scope}</small>
            <em>{collection.scope}</em>
          </button>
        ))}
      </section>

      <section className="asset-grid-section" aria-label="Asset results">
        {loading ? <div className="empty-state">Loading media...</div> : null}
        {!loading && result?.assets.length === 0 ? (
          <div className="empty-state">No visible assets match this search. Try Approved Public or Bible.</div>
        ) : null}
        <div className="asset-grid">
          {sortedAssets.map((asset) => <AssetCard key={asset.id} asset={asset} role={role} />)}
        </div>
      </section>
    </div>
  );
}
