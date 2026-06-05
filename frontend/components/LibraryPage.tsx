"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Search, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { AssetCard } from "@/components/AssetCard";
import { CollectionAlbumCard } from "@/components/CollectionAlbumCard";
import { useDemoRole } from "@/components/RoleProvider";
import { featuredCollections, filterChips } from "@/lib/taxonomy";
import type { SearchResult, StockMediaAsset } from "@/lib/types";
import { collectionImageUrl, formatResultCount, normalizeAssetTitle } from "@/lib/display";

const sortOptions = ["Newest", "Recently approved", "Most used", "A-Z"] as const;
type SortOption = (typeof sortOptions)[number];

function assetHaystack(asset: StockMediaAsset) {
  return [asset.title, asset.collection, asset.status, asset.usageScope, asset.mediaType, asset.peopleRisk, ...(asset.tags || []), ...(asset.tjcTerms || [])]
    .join(" ")
    .toLowerCase();
}

function matchesCollection(asset: StockMediaAsset, collection: (typeof featuredCollections)[number]) {
  const haystack = assetHaystack(asset);
  if (collection.name === "Approved Public") return asset.status === "Approved Public";
  if (collection.name === "Recently Approved") return asset.status === "Approved Public" || asset.status === "Approved Internal";
  return collection.terms.some((term) => haystack.includes(term.toLowerCase()));
}

function latestReviewedDate(assets: StockMediaAsset[]) {
  return assets.map((asset) => asset.reviewedDate).filter(Boolean).sort().at(-1);
}

function diversityKey(asset: StockMediaAsset) {
  const haystack = assetHaystack(asset);
  if (haystack.includes("bible") || haystack.includes("scripture")) return "bible";
  if (haystack.includes("flower") || haystack.includes("plant") || haystack.includes("seasonal")) return "details";
  if (haystack.includes("fellowship") || haystack.includes("people") || haystack.includes("welcome")) return "fellowship";
  if (haystack.includes("graphic") || haystack.includes("slide") || haystack.includes("stage")) return "graphics";
  if (haystack.includes("water") || haystack.includes("fountain")) return "water";
  return asset.collection || asset.mediaType;
}

function diversifyAssets(assets: StockMediaAsset[]) {
  const buckets = new Map<string, StockMediaAsset[]>();
  assets.forEach((asset) => {
    const key = diversityKey(asset);
    buckets.set(key, [...(buckets.get(key) || []), asset]);
  });
  const orderedKeys = [...buckets.keys()].sort((a, b) => (buckets.get(b)?.length || 0) - (buckets.get(a)?.length || 0));
  const diversified: StockMediaAsset[] = [];
  let cursor = 0;
  while (diversified.length < assets.length && orderedKeys.length) {
    const key = orderedKeys[cursor % orderedKeys.length];
    const bucket = buckets.get(key);
    const next = bucket?.shift();
    if (next) diversified.push(next);
    if (!bucket?.length) orderedKeys.splice(cursor % orderedKeys.length, 1);
    else cursor += 1;
  }
  return diversified;
}

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
    return diversifyAssets(assets);
  }, [result?.assets, sort]);

  const collectionCards = featuredCollections.map((collection, index) => {
    const approvedAssets = (result?.assets || []).filter((asset) => asset.status === "Approved Public" || asset.status === "Approved Internal");
    const matching = approvedAssets.filter((asset) => matchesCollection(asset, collection));
    const representative = matching.length ? matching : approvedAssets.slice(index, index + 5);
    const images = representative
      .slice(0, 5)
      .map((asset) => ({ src: collectionImageUrl(asset), alt: asset.thumbnailAlt }))
      .filter((image) => Boolean(image.src));
    const latest = latestReviewedDate(matching);
    const scope = collection.name === "Approved Public" ? "Church-wide" : collection.name === "Recently Approved" ? "Newly cleared" : "Ministry album";
    return {
      ...collection,
      countLabel: matching.length ? `${matching.length.toLocaleString()} shown` : "Curated set",
      latest,
      scope,
      images
    };
  });

  function browseCollection(collection: string) {
    const item = featuredCollections.find((candidate) => candidate.name === collection);
    const queryText = item?.searchQuery ?? collection;
    setQuery(collection);
    setSubmittedQuery(queryText);
  }

  return (
    <div className="page-shell">
      <section className="library-top">
        <div>
          <p className="eyebrow">Library</p>
          <h1>Search approved church media</h1>
          <p>Find photos, graphics, and ministry assets cleared for reuse.</p>
        </div>
        <div className="source-pill">
          <span>Source</span>
          <strong>{result?.source.label || "Loading"}</strong>
        </div>
      </section>

      <section className="library-toolbar" aria-label="Library search and filters">
        <form className="search-panel" onSubmit={submit}>
          <label htmlFor="library-search">Search approved church media</label>
          <div className="search-panel__row">
            <Search aria-hidden="true" size={20} />
            <input
              id="library-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Bible, worship, fellowship, flowers, youth..."
              type="search"
            />
            <button type="submit">Search</button>
          </div>
        </form>

        <div className="library-toolbar__meta">
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
          <div className="mini-stat mini-stat--safe">
            <ShieldAlert size={16} aria-hidden="true" />
            <span>Protected</span>
          </div>
        </div>

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
      </section>

      <section id="collections" className="collections-band" aria-label="Featured collections">
        {collectionCards.map((collection) => (
          <CollectionAlbumCard
            key={collection.name}
            name={collection.name}
            description={collection.description}
            countLabel={collection.countLabel}
            latestLabel={collection.latest ? `Updated ${collection.latest}` : "Recently updated"}
            scope={collection.scope}
            images={collection.images}
            onOpen={() => browseCollection(collection.name)}
          />
        ))}
      </section>

      <div className="result-bar" aria-live="polite">
        <strong>{loading ? "Loading results" : formatResultCount(sortedAssets.length, result?.total ?? 0)}</strong>
        <span>{submittedQuery ? `Search: ${submittedQuery}` : `${shownApproved} approved assets in current view`}</span>
        {filters.length ? <span>Filters: {filters.join(", ")}</span> : null}
      </div>

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
