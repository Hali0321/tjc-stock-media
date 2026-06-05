"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Database, Search, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { AssetCard } from "@/components/AssetCard";
import { useDemoRole } from "@/components/RoleProvider";
import { featuredCollections, filterChips } from "@/lib/taxonomy";
import type { SearchResult } from "@/lib/types";

export function LibraryPage() {
  const { role } = useDemoRole();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
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
          <span>Approved first</span>
        </div>
        <div>
          <ShieldAlert size={18} aria-hidden="true" />
          <span>Unsafe downloads blocked</span>
        </div>
        <div>
          <Database size={18} aria-hidden="true" />
          <span>ResourceSpace source of truth</span>
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
          <strong>{result?.total ?? "-"}</strong>
          <span>{shownApproved} shown</span>
        </div>
      </section>

      <div className="result-bar" aria-live="polite">
        <strong>{loading ? "Loading results" : `${result?.total ?? 0} visible results`}</strong>
        <span>{submittedQuery ? `Search: ${submittedQuery}` : "Showing approved media first"}</span>
        {filters.length ? <span>Filters: {filters.join(", ")}</span> : null}
      </div>

      <section id="collections" className="collections-band" aria-label="Featured collections">
        {featuredCollections.map((collection) => (
          <button key={collection} type="button" onClick={() => setSubmittedQuery(collection)}>
            <span>{collection}</span>
            <small>{collection === "Approved Public" ? "safe" : collection === "Recently Approved" ? "new" : "browse"}</small>
          </button>
        ))}
      </section>

      <section className="asset-grid-section" aria-label="Asset results">
        {loading ? <div className="empty-state">Loading media...</div> : null}
        {!loading && result?.assets.length === 0 ? (
          <div className="empty-state">No visible assets match this search. Try Approved Public or Bible.</div>
        ) : null}
        <div className="asset-grid">
          {result?.assets.map((asset) => <AssetCard key={asset.id} asset={asset} role={role} />)}
        </div>
      </section>
    </div>
  );
}
