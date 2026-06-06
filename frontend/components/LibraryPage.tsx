"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Archive, CheckCircle2, Clock3, Database, FileDown, FolderPlus, LayoutGrid, List, Search, ShieldAlert, ShieldCheck, SlidersHorizontal, Users, X } from "lucide-react";
import Link from "next/link";
import { AssetCard } from "@/components/AssetCard";
import { CollectionAlbumCard } from "@/components/CollectionAlbumCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import { SavedViewCard } from "@/components/SavedViewCard";
import { useDemoRole } from "@/components/RoleProvider";
import type { CatalogSort, SearchResult, StockMediaAsset } from "@/lib/types";
import { formatResultCount } from "@/lib/display";
import { assetMetadataHealth } from "@/lib/asset-governance";
import { cn } from "@/lib/ui";

const sortOptions: CatalogSort[] = ["Approved first", "Recently approved", "Newest", "A-Z"];

const useCaseButtons = [
  { label: "Website hero", view: "website-hero" },
  { label: "Slides", view: "sermon-slides" },
  { label: "Newsletter", view: "newsletter" },
  { label: "Social", view: "social-media" },
  { label: "No people", view: "no-people" },
  { label: "Internal only", view: "internal-ministry", contributorOnly: true },
  { label: "Recently approved", view: "recently-approved" },
  { label: "Needs review", view: "needs-review", reviewerOnly: true }
] as const;

const viewerShortcutIds = new Set(["approved-church-wide", "website-hero", "sermon-slides", "newsletter", "social-media", "no-people", "recently-approved"]);
const contributorShortcutIds = new Set([...viewerShortcutIds, "internal-ministry"]);

function AssetGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" aria-hidden="true">
      {Array.from({ length: 15 }).map((_, index) => (
        <div key={index} className={cn("skeleton w-full", index % 4 === 0 ? "h-48" : index % 3 === 0 ? "h-44" : "h-[11.5rem]")} />
      ))}
    </div>
  );
}

function healthTone(score: number) {
  if (score >= 90) return "border-[#b8d9c6] bg-[#edf8f1] text-[#22563a]";
  if (score >= 70) return "border-[#ead6a8] bg-[#fff7e5] text-[#725216]";
  return "border-[#e5b7b5] bg-[#fff0ef] text-[#7d2d2a]";
}

function insightTone(tone: "ok" | "warn" | "info") {
  if (tone === "ok") return "border-[#b8d9c6] bg-[#edf8f1] text-[#22563a]";
  if (tone === "warn") return "border-[#ead6a8] bg-[#fff7e5] text-[#725216]";
  return "border-[#c8d7e6] bg-[#f2f7fb] text-[#27435b]";
}

function AssetListRow({
  asset,
  selected,
  onToggle
}: {
  asset: StockMediaAsset;
  selected: boolean;
  onToggle: () => void;
}) {
  const health = assetMetadataHealth(asset);
  return (
    <article className={cn("grid gap-3 border-b border-tjc-line bg-white px-3 py-2.5 last:border-b-0 lg:grid-cols-[auto_5rem_minmax(12rem,1.2fr)_9rem_10rem_12rem_9rem]", selected && "bg-[#f4fbf7]")}>
      <label className="grid h-9 w-9 place-items-center rounded-md border border-tjc-line bg-white" aria-label={`Select ${asset.title}`}>
        <input className="h-4 w-4 accent-tjc-evergreen" type="checkbox" checked={selected} onChange={onToggle} />
      </label>
      <Link href={`/assets/${asset.id}`} className="block aspect-[4/3] overflow-hidden rounded-md bg-[#eef1ed]">
        <img className="h-full w-full object-cover" src={asset.thumbnail} alt={asset.thumbnailAlt} loading="lazy" />
      </Link>
      <div className="min-w-0">
        <Link href={`/assets/${asset.id}`} className="line-clamp-2 font-semibold leading-tight text-tjc-ink hover:text-tjc-evergreen">{asset.title}</Link>
        <p className="mt-1 truncate text-sm text-tjc-muted">{asset.collection}</p>
      </div>
      <span className="rounded-md border border-tjc-line bg-white px-2 py-1 text-xs font-semibold text-[#4d554d]">{asset.status}</span>
      <span className="rounded-md border border-tjc-line bg-white px-2 py-1 text-xs font-semibold text-[#4d554d]">{asset.usageScope}</span>
      <span className="truncate text-sm text-tjc-muted">{asset.reviewer && asset.reviewedDate ? `${asset.reviewer} / ${asset.reviewedDate}` : "Review pending"}</span>
      <span className={cn("rounded-md border px-2 py-1 text-xs font-semibold", healthTone(health.score))}>{health.score}% {health.state}</span>
    </article>
  );
}

export function LibraryPage() {
  const { role, ready } = useDemoRole();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [selectedView, setSelectedView] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [sort, setSort] = useState<CatalogSort>("Approved first");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchMessage, setBatchMessage] = useState("");
  const [collectionTitle, setCollectionTitle] = useState("");
  const [collectionAudience, setCollectionAudience] = useState("Internal ministry");
  const [collectionExpiry, setCollectionExpiry] = useState("");
  const [collectionOwner, setCollectionOwner] = useState("Ministry media");

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({ role, q: submittedQuery, sort, limit: "84" });
    if (selectedView) params.set("view", selectedView);
    if (selectedCollection) params.set("collection", selectedCollection);
    filters.forEach((filter) => params.append("filter", filter));
    return `/api/assets/search?${params.toString()}`;
  }, [role, submittedQuery, filters, selectedView, selectedCollection, sort]);

  useEffect(() => {
    if (!ready) return;
	    let cancelled = false;
	    setLoading(true);
	    setError("");
	    fetch(apiUrl)
	      .then(async (response) => {
	        const data = await response.json();
	        if (!response.ok) throw new Error(data.error || "Unable to load library assets.");
	        return data as SearchResult;
	      })
	      .then((data: SearchResult) => {
	        if (!cancelled) setResult(data);
	      })
	      .catch((err: Error) => {
	        if (!cancelled) {
	          setError(err.message);
	          setResult(null);
	        }
	      })
	      .finally(() => {
	        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiUrl, ready]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialView = params.get("view");
    const initialCollection = params.get("collection");
    const initialQuery = params.get("q");
    if (initialView) {
      setSelectedView(initialView);
      setSelectedCollection("");
      setQuery("");
      setSubmittedQuery("");
      return;
    }
    if (initialCollection) {
      setSelectedView("");
      setSelectedCollection(initialCollection);
      setQuery("");
      setSubmittedQuery("");
      return;
    }
    if (initialQuery) {
      setSelectedView("");
      setQuery(initialQuery);
      setSubmittedQuery(initialQuery);
    }
  }, []);

  useEffect(() => {
    setSelectedIds([]);
    setBatchMessage("");
  }, [apiUrl]);

  function replaceLibraryViewParam(viewId?: string) {
    if (window.location.pathname !== "/") return;
    if (!viewId) {
      window.history.replaceState(null, "", "/");
      return;
    }
    const params = new URLSearchParams();
    params.set("view", viewId);
    window.history.replaceState(null, "", `/?${params.toString()}`);
  }

  function replaceLibraryCollectionParam(collectionId?: string) {
    if (window.location.pathname !== "/") return;
    if (!collectionId) {
      window.history.replaceState(null, "", "/");
      return;
    }
    const params = new URLSearchParams();
    params.set("collection", collectionId);
    window.history.replaceState(null, "", `/?${params.toString()}`);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const nextQuery = String(new FormData(form).get("q") || "").trim();
    setSelectedView("");
    setSelectedCollection("");
    setQuery(nextQuery);
    setSubmittedQuery(nextQuery);
    replaceLibraryViewParam();
  }

  function toggleFilter(filter: string) {
    setFilters((current) => (current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]));
  }

  function openSavedView(viewId: string) {
    setSelectedView(viewId);
    setSelectedCollection("");
    setQuery("");
    setSubmittedQuery("");
    replaceLibraryViewParam(viewId);
  }

  function clearSearchState() {
    setSelectedView("");
    setSelectedCollection("");
    setSubmittedQuery("");
    setQuery("");
    setFilters([]);
    replaceLibraryViewParam();
  }

  function openUseCase(item: (typeof useCaseButtons)[number]) {
    openSavedView(item.view);
  }

  function browseCollection(collectionId: string, name: string) {
    setSelectedView("");
    setSelectedCollection(collectionId);
    setQuery(name);
    setSubmittedQuery("");
    replaceLibraryCollectionParam(collectionId);
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function selectVisibleAssets() {
    const visible = (result?.assets || []).map((asset) => asset.id);
    setSelectedIds((current) => (current.length === visible.length ? [] : visible));
  }

  async function runBatchAction(action: string) {
    if (!selectedIds.length) return;
    const response = await fetch("/api/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, action, assetIds: selectedIds })
    });
    const body = await response.json();
    setBatchMessage(body.message || body.error || "Batch route responded.");
  }

  function exportCsv() {
    const selected = (result?.assets || []).filter((asset) => selectedIds.includes(asset.id));
    const rows = [
      ["id", "title", "status", "usageScope", "peopleRisk", "sourceSystem", "sourceAccount", "reviewer", "reviewedDate", "resourceSpaceId"],
      ...selected.map((asset) => [
        asset.id,
        asset.title,
        asset.status,
        asset.usageScope,
        asset.peopleRisk || "",
        asset.sourceSystem || "",
        asset.sourceAccount || "",
        asset.reviewer || "",
        asset.reviewedDate || "",
        asset.resourceSpaceId || ""
      ])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "tjc-stock-media-selection.csv";
    link.click();
    URL.revokeObjectURL(url);
    setBatchMessage(`Exported ${selected.length} selected asset records as CSV.`);
  }

  async function createCollectionDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedIds.length) return;
    const response = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role,
        assetIds: selectedIds,
        title: collectionTitle || "Untitled ministry collection",
        audience: collectionAudience,
        expiry: collectionExpiry,
        owner: collectionOwner
      })
    });
    const body = await response.json();
    setBatchMessage(body.message || body.error || "Collection route responded.");
  }

  const reviewer = role === "Reviewer" || role === "DAM Admin";
  const contributor = role === "Contributor" || reviewer;
  const activeView = result?.savedViews.find((view) => view.id === selectedView);
  const shortcuts =
    result?.savedViews.filter((view) => reviewer || (contributor ? contributorShortcutIds : viewerShortcutIds).has(view.id)) || [];
  const visibleUseCases = useCaseButtons.filter((item) => {
    if ("reviewerOnly" in item && item.reviewerOnly) return reviewer;
    if ("contributorOnly" in item && item.contributorOnly) return contributor;
    return true;
  });
  const activeCollection = result?.collections.find((collection) => collection.id === selectedCollection);
  const hasActiveSearch = Boolean(activeView || activeCollection || submittedQuery || filters.length);
  const visibleAssets = result?.assets || [];

  return (
    <div className="dam-shell">
      <section className="grid gap-4 border-b border-tjc-line pb-4 xl:grid-cols-[minmax(0,1fr)_30rem]" aria-label="Library workspace">
        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="dam-page-title">Library</h1>
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
          <form className="mt-4 grid gap-2 rounded-md border border-tjc-line bg-white p-2 shadow-[0_1px_0_rgba(32,34,31,.04)] md:grid-cols-[auto_1fr_auto]" onSubmit={submit} aria-label="Library search">
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
          <div className="mt-3 flex max-w-full min-w-0 flex-wrap gap-2 pb-1" aria-label="Use-case shortcuts">
            {visibleUseCases.map((item) => (
              <button
                key={item.label}
                type="button"
                className="inline-flex min-h-9 items-center rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-[#3f4a43] transition hover:border-[#9bc5b5] hover:bg-[#eef7f1] active:translate-y-px"
                onClick={() => openUseCase(item)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="dam-panel grid min-w-0 content-start gap-3 p-3">
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
              { icon: Database, value: result?.counts.visibleToRole ?? "-", label: "role-visible" }
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

	      {error ? (
	        <div className="mt-4 rounded-lg border border-[#e5b7b5] bg-[#fff0ef] p-3 text-sm font-semibold text-[#7d2d2a]" role="status">
	          {error}
	        </div>
	      ) : null}

	      <details className="mt-3 rounded-md border border-tjc-line bg-white/88">
        <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm font-semibold text-tjc-evergreen">
          <span>Production signals</span>
          <span className="text-xs font-medium text-tjc-muted">Metadata health, operational signals, search gaps</span>
        </summary>
        <div className="grid gap-3 border-t border-tjc-line p-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.55fr)_minmax(20rem,.6fr)]" aria-label="Production DAM health">
        <div className="grid gap-2 rounded-md border border-tjc-line bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-tjc-evergreen">Metadata health</h2>
              <p className="mt-1 text-xs leading-relaxed text-tjc-muted">Production confidence: source, people, rights, usage, and review completeness.</p>
            </div>
            <span className={cn("rounded-md border px-3 py-2 text-sm font-semibold", healthTone(result?.metadataHealth.averageScore ?? 0))}>{result?.metadataHealth.averageScore ?? "-"}% avg</span>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
            {[
              ["Complete", result?.metadataHealth.complete],
              ["Needs source", result?.metadataHealth.needsSource],
              ["Needs people", result?.metadataHealth.needsPeople],
              ["Needs rights", result?.metadataHealth.needsRights],
              ["Needs usage", result?.metadataHealth.needsUsage],
              ["Review pending", result?.metadataHealth.reviewPending]
            ].map(([label, value]) => (
              <div className="rounded-md border border-tjc-line bg-[#fbfcfa] p-2" key={label}>
                <strong className="block text-lg font-semibold tabular-nums text-tjc-ink">{value ?? "-"}</strong>
                <span className="text-[11px] font-medium text-tjc-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-tjc-line bg-white p-3">
          <h2 className="text-sm font-semibold text-tjc-evergreen">Operational signals</h2>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(result?.operationalInsights || []).slice(0, 6).map((insight) => {
              const content = (
                <>
                  <strong className="block text-lg font-semibold tabular-nums">{insight.value.toLocaleString()}</strong>
                  <span className="block text-[11px] font-semibold leading-tight">{insight.label}</span>
                </>
              );
              const className = cn("rounded-md border p-2 text-left transition", insightTone(insight.tone), insight.savedViewId && "hover:brightness-[.98] active:translate-y-px");
              return insight.savedViewId ? (
                <button className={className} key={insight.id} type="button" title={insight.detail} onClick={() => openSavedView(insight.savedViewId || "")}>
                  {content}
                </button>
              ) : (
                <div className={className} key={insight.id} title={insight.detail}>
                  {content}
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-md border border-tjc-line bg-white p-3">
          <h2 className="text-sm font-semibold text-tjc-evergreen">Search gaps</h2>
          <div className="mt-2 grid gap-2">
            {(result?.zeroResultInsights || []).slice(0, 3).map((insight) => (
              <button key={insight.query} type="button" className="grid rounded-md border border-tjc-line bg-[#fbfcfa] p-2 text-left text-xs transition hover:bg-[#eef7f1]" onClick={() => insight.savedViewId && openSavedView(insight.savedViewId)}>
                <span className="font-semibold text-tjc-ink">{insight.query}: raw {insight.rawCount} / mapped {insight.savedViewCount}</span>
                <span className="mt-1 text-tjc-muted">{insight.recommendation}</span>
              </button>
            ))}
          </div>
        </div>
        </div>
      </details>

      <section className="mt-4 grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]" aria-label="Library controls and results">
        <aside className="order-2 grid min-w-0 gap-4 xl:order-1 xl:sticky xl:top-24 xl:self-start">
          <section className="min-w-0 overflow-hidden rounded-md border border-tjc-line bg-white" aria-label="Saved DAM views">
            <div className="border-b border-tjc-line px-3 py-3">
              <h2 className="text-sm font-semibold text-tjc-evergreen">Saved DAM views</h2>
              <p className="mt-1 text-xs leading-relaxed text-tjc-muted">Operational shortcuts backed by ResourceSpace export fields.</p>
            </div>
            <div className="grid max-w-full min-w-0 gap-2 p-2 sm:grid-cols-2 lg:block lg:p-0">
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
            <section className="mb-3 grid gap-3 rounded-md border border-tjc-line bg-white p-2.5" aria-label="Selection and batch actions">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button className="inline-flex min-h-9 items-center gap-2 rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1]" type="button" onClick={selectVisibleAssets}>
                    <CheckCircle2 size={15} strokeWidth={1.8} aria-hidden="true" />
                    {selectedIds.length ? "Clear selection" : "Select visible"}
                  </button>
                  <span className="text-sm font-semibold text-tjc-muted">{selectedIds.length} selected</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className={cn("inline-flex min-h-9 items-center gap-2 rounded-md border border-tjc-line px-3 text-sm font-semibold transition", viewMode === "grid" ? "bg-[#e8f5ef] text-tjc-evergreen" : "bg-white text-[#3e4741]")} type="button" onClick={() => setViewMode("grid")} aria-pressed={viewMode === "grid"}>
                    <LayoutGrid size={15} strokeWidth={1.8} aria-hidden="true" />
                    Grid
                  </button>
                  <button className={cn("inline-flex min-h-9 items-center gap-2 rounded-md border border-tjc-line px-3 text-sm font-semibold transition", viewMode === "list" ? "bg-[#e8f5ef] text-tjc-evergreen" : "bg-white text-[#3e4741]")} type="button" onClick={() => setViewMode("list")} aria-pressed={viewMode === "list"}>
                    <List size={15} strokeWidth={1.8} aria-hidden="true" />
                    List
                  </button>
                </div>
              </div>
              {selectedIds.length ? (
                <div className="grid gap-3 border-t border-tjc-line pt-3">
                  <div className="flex flex-wrap gap-2">
                    <button className="inline-flex min-h-9 items-center gap-2 rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1]" type="button" onClick={exportCsv}>
                      <FileDown size={15} strokeWidth={1.8} aria-hidden="true" />
                      Export CSV
                    </button>
                    <button className="inline-flex min-h-9 items-center gap-2 rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1] disabled:opacity-50" type="button" disabled={!reviewer} onClick={() => runBatchAction("request-review")}>
                      <ShieldAlert size={15} strokeWidth={1.8} aria-hidden="true" />
                      Preview review
                    </button>
                    <button className="inline-flex min-h-9 items-center gap-2 rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1] disabled:opacity-50" type="button" disabled={!reviewer} onClick={() => runBatchAction("mark-internal")}>
                      <ShieldCheck size={15} strokeWidth={1.8} aria-hidden="true" />
                      Preview internal
                    </button>
                    <button className="inline-flex min-h-9 items-center gap-2 rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1] disabled:opacity-50" type="button" disabled={!reviewer} onClick={() => runBatchAction("archive")}>
                      <Archive size={15} strokeWidth={1.8} aria-hidden="true" />
                      Preview archive
                    </button>
                  </div>
                  <form className="grid gap-2 rounded-md border border-tjc-line bg-[#fbfcfa] p-3 md:grid-cols-[minmax(10rem,1fr)_11rem_10rem_minmax(9rem,.7fr)_auto]" onSubmit={createCollectionDraft}>
                    <input className="min-h-9 rounded-md border border-tjc-line bg-white px-3 text-sm font-medium" value={collectionTitle} onChange={(event) => setCollectionTitle(event.target.value)} placeholder="Collection name" aria-label="Collection name" />
                    <select className="min-h-9 rounded-md border border-tjc-line bg-white px-3 text-sm font-medium" value={collectionAudience} onChange={(event) => setCollectionAudience(event.target.value)} aria-label="Collection audience">
                      <option>Private draft</option>
                      <option>Internal ministry</option>
                      <option>Public-approved portal</option>
                    </select>
                    <input className="min-h-9 rounded-md border border-tjc-line bg-white px-3 text-sm font-medium" type="date" value={collectionExpiry} onChange={(event) => setCollectionExpiry(event.target.value)} aria-label="Expiry date" />
                    <input className="min-h-9 rounded-md border border-tjc-line bg-white px-3 text-sm font-medium" value={collectionOwner} onChange={(event) => setCollectionOwner(event.target.value)} placeholder="Owner" aria-label="Collection owner" />
                    <button className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-tjc-evergreen px-3 text-sm font-semibold text-white transition hover:bg-tjc-evergreen-2 disabled:opacity-50" type="submit" disabled={!contributor}>
                      <FolderPlus size={15} strokeWidth={1.8} aria-hidden="true" />
                      Preview draft
                    </button>
                  </form>
                  {batchMessage ? <div className="rounded-md border border-[#c8d7e6] bg-[#f2f7fb] p-2 text-sm font-semibold text-[#27435b]">{batchMessage}</div> : null}
                </div>
              ) : null}
            </section>

            <div className="mb-3 grid gap-2 rounded-md border border-tjc-line bg-white px-3 py-2.5 text-sm text-tjc-muted" aria-live="polite">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="font-semibold text-tjc-ink">{loading ? "Loading results" : formatResultCount(result?.assets.length ?? 0, result?.total ?? 0)}</strong>
                <span>Rendered {result?.counts.rendered ?? result?.assets.length ?? 0} / matching {result?.counts.matching ?? result?.total ?? 0} / role-visible {result?.counts.visibleToRole ?? 0}</span>
              </div>
              {activeView ? (
                <p>
                  View: <strong className="font-semibold text-tjc-evergreen">{activeView.label}</strong>. This view is based on available ResourceSpace export metadata. Reviewer should confirm before production use.
                </p>
              ) : null}
              {!activeView && result?.appliedIntent?.matchedView ? (
                <p>
                  Search intent: <strong className="font-semibold text-tjc-evergreen">{result.appliedIntent.rawQuery}</strong> mapped to <strong className="font-semibold text-tjc-evergreen">{result.appliedIntent.matchedView}</strong>.
                </p>
              ) : null}
              {activeCollection ? (
                <p>
                  Collection: <strong className="font-semibold text-tjc-evergreen">{activeCollection.name}</strong>. Opened by stable collection ID, not raw keyword search.
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
              <div className="rounded-md border border-tjc-line bg-white p-8 text-tjc-muted">No visible assets match this workspace. Try Portal ready, Needs portal review, No people, or Bible Study.</div>
            ) : null}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {visibleAssets.map((asset) => (
                  <div className="relative" key={asset.id}>
                    <label className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-md border border-tjc-line bg-white/92 shadow-sm" aria-label={`Select ${asset.title}`}>
                      <input className="h-4 w-4 accent-tjc-evergreen" type="checkbox" checked={selectedIds.includes(asset.id)} onChange={() => toggleSelected(asset.id)} />
                    </label>
                    <AssetCard asset={asset} role={role} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-tjc-line">
                <div className="hidden grid-cols-[auto_5rem_minmax(12rem,1.2fr)_9rem_10rem_12rem_9rem] gap-3 border-b border-tjc-line bg-[#f5f7f4] px-3 py-2 text-xs font-semibold text-tjc-muted lg:grid">
                  <span>Select</span><span>Preview</span><span>Asset</span><span>Status</span><span>Use</span><span>Reviewer</span><span>Health</span>
                </div>
                {visibleAssets.map((asset) => <AssetListRow key={asset.id} asset={asset} selected={selectedIds.includes(asset.id)} onToggle={() => toggleSelected(asset.id)} />)}
              </div>
            )}
          </section>

          <section id="collections" className="mt-6 scroll-mt-24" aria-label="Featured collections">
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-tjc-ink">Collections</h2>
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
                  onOpen={() => browseCollection(collection.id, collection.name)}
                />
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
