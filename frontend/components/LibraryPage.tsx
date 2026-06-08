"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Archive, Check, CheckCircle2, Database, FileDown, FolderPlus, LayoutGrid, List, Search, ShieldAlert, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { AssetCard } from "@/components/AssetCard";
import { CollectionAlbumCard } from "@/components/CollectionAlbumCard";
import { EmptyState, ErrorState, SkeletonGrid } from "@/components/DamStates";
import { Dialog } from "@/components/Dialog";
import { DropdownActionMenu, type DropdownAction } from "@/components/DropdownActionMenu";
import { FilterSidebar } from "@/components/FilterSidebar";
import { FilterPills } from "@/components/FilterPills";
import { LibraryPagination } from "@/components/LibraryPagination";
import { SavedViewCard } from "@/components/SavedViewCard";
import { RawStatusBadge, UsageBadge } from "@/components/StatusBadge";
import { useDemoRole } from "@/components/RoleProvider";
import type { CatalogSort, SearchResult, StockMediaAsset } from "@/lib/types";
import { assetMetadataHealth } from "@/lib/asset-governance";
import { cn } from "@/lib/ui";
import { toastDraftSaved, toastSaveFailed, toastShareCopied } from "@/lib/tjc-toasts";

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
const viewerDefaultView = "approved-church-wide";

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
      <label className="grid h-9 w-9 place-items-center rounded-xl border border-tjc-line bg-white" aria-label={`Select ${asset.title}`}>
        <input className="h-4 w-4 accent-tjc-evergreen" type="checkbox" checked={selected} onChange={onToggle} />
      </label>
      <Link href={`/assets/${asset.id}`} className="block aspect-[4/3] overflow-hidden rounded-md bg-[#eef1ed]">
        <img className="h-full w-full object-cover" src={asset.thumbnail} alt={asset.thumbnailAlt} loading="lazy" />
      </Link>
      <div className="min-w-0">
        <Link href={`/assets/${asset.id}`} className="line-clamp-2 font-semibold leading-tight text-tjc-ink hover:text-tjc-evergreen">{asset.title}</Link>
        <p className="mt-1 truncate text-sm text-tjc-muted">{asset.collection}</p>
      </div>
      <span data-badge-slot="list-raw-status"><RawStatusBadge status={asset.status} size="xs" /></span>
      <span data-badge-slot="list-usage-scope"><UsageBadge scope={asset.usageScope} size="xs" /></span>
      <span className="truncate text-sm text-tjc-muted">{asset.reviewer && asset.reviewedDate ? `${asset.reviewer} / ${asset.reviewedDate}` : "Review pending"}</span>
      <span className={cn("rounded-md border px-2 py-1 text-xs font-semibold", healthTone(health.score))}>{health.score}% {health.state}</span>
    </article>
  );
}

function LibrarySavedRail({
  shortcuts,
  visibleUseCases,
  selectedView,
  onOpenView,
  onOpenUseCase
}: {
  shortcuts: NonNullable<SearchResult["savedViews"]>;
  visibleUseCases: Array<(typeof useCaseButtons)[number]>;
  selectedView: string;
  onOpenView: (id: string) => void;
  onOpenUseCase: (item: (typeof useCaseButtons)[number]) => void;
}) {
  return (
    <aside className="hidden min-w-0 xl:block" aria-label="Saved views and browse shortcuts">
      <div className="sticky top-24 grid gap-4">
        <section className="dam-soft-card p-3">
          <div className="mb-3">
            <h2 className="text-sm font-black text-tjc-evergreen">Saved views</h2>
            <p className="mt-1 text-xs font-semibold leading-snug text-tjc-muted">Church media cuts backed by ResourceSpace metadata.</p>
          </div>
          <div className="grid gap-1.5">
            {shortcuts.slice(0, 9).map((view) => (
              <button
                key={view.id}
                type="button"
                className={cn(
                  "grid min-h-12 grid-cols-[1fr_auto] items-center gap-2 rounded-2xl px-3 text-left text-sm transition hover:bg-[#f1f7f3] active:translate-y-px",
                  selectedView === view.id ? "bg-[#e6f0eb] text-tjc-evergreen shadow-[inset_3px_0_0_#0f3d2e]" : "text-[#3f4a43]"
                )}
                onClick={() => onOpenView(view.id)}
                aria-pressed={selectedView === view.id}
              >
                <span className="min-w-0">
                  <strong className="block truncate font-black">{view.label}</strong>
                  <span className="line-clamp-1 text-xs font-semibold text-tjc-muted">{view.reason}</span>
                </span>
                <span className="rounded-full border border-[#d9e3dc] bg-white px-2 py-0.5 text-xs font-black tabular-nums text-tjc-evergreen">{view.count}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="rounded-[1.4rem] border border-[#dde6df] bg-[#f8faf8] p-3">
          <h2 className="text-sm font-black text-tjc-evergreen">Browse</h2>
          <div className="mt-3 grid gap-1.5">
            {visibleUseCases.map((item) => (
              <button
                key={item.label}
                type="button"
                className="min-h-10 rounded-full px-3 text-left text-sm font-black text-[#3f4a43] transition hover:bg-white hover:text-tjc-evergreen active:translate-y-px"
                onClick={() => onOpenUseCase(item)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

export function LibraryPage() {
  const { role, ready } = useDemoRole();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [selectedView, setSelectedView] = useState(viewerDefaultView);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [sort, setSort] = useState<CatalogSort>("Approved first");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pageOffset, setPageOffset] = useState(0);
  const [batchMessage, setBatchMessage] = useState("");
  const [collectionTitle, setCollectionTitle] = useState("");
  const [collectionAudience, setCollectionAudience] = useState("Internal ministry");
  const [collectionExpiry, setCollectionExpiry] = useState("");
  const [collectionOwner, setCollectionOwner] = useState("Ministry media");
  const [pageLimit, setPageLimit] = useState(24);
  const [filterSheetPlacement, setFilterSheetPlacement] = useState<"right" | "bottom">("right");

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({ role, q: submittedQuery, sort, limit: String(pageLimit), offset: String(pageOffset) });
    if (selectedView) params.set("view", selectedView);
    if (selectedCollection) params.set("collection", selectedCollection);
    filters.forEach((filter) => params.append("filter", filter));
    return `/api/assets/search?${params.toString()}`;
  }, [role, submittedQuery, filters, selectedView, selectedCollection, sort, pageOffset, pageLimit]);

  useEffect(() => {
    function updatePageLimit() {
      const width = window.innerWidth;
      setPageLimit(width < 640 ? 12 : width >= 1536 ? 36 : 24);
      setFilterSheetPlacement(width < 768 ? "bottom" : "right");
    }
    updatePageLimit();
    window.addEventListener("resize", updatePageLimit);
    return () => window.removeEventListener("resize", updatePageLimit);
  }, []);

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
      setPageOffset(0);
      return;
    }
    if (initialCollection) {
      setSelectedView("");
      setSelectedCollection(initialCollection);
      setQuery("");
      setSubmittedQuery("");
      setPageOffset(0);
      return;
    }
    if (initialQuery) {
      setSelectedView("");
      setQuery(initialQuery);
      setSubmittedQuery(initialQuery);
      setPageOffset(0);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(window.location.search);
    if (params.has("view") || params.has("collection") || params.has("q")) return;
    if (role === "Viewer") {
      setSelectedView((current) => current || viewerDefaultView);
    } else {
      setSelectedView((current) => current === viewerDefaultView ? "" : current);
    }
  }, [ready, role]);

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
    setPageOffset(0);
    replaceLibraryViewParam();
  }

  function toggleFilter(filter: string) {
    setFilters((current) => (current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]));
    setPageOffset(0);
  }

  function openSavedView(viewId: string) {
    setSelectedView(viewId);
    setSelectedCollection("");
    setQuery("");
    setSubmittedQuery("");
    setPageOffset(0);
    replaceLibraryViewParam(viewId);
  }

  function clearSearchState() {
    const defaultView = role === "Viewer" ? viewerDefaultView : "";
    setSelectedView(defaultView);
    setSelectedCollection("");
    setSubmittedQuery("");
    setQuery("");
    setFilters([]);
    setPageOffset(0);
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
    setPageOffset(0);
    replaceLibraryCollectionParam(collectionId);
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function removeActivePill(id: string) {
    if (id === "search") {
      setQuery("");
      setSubmittedQuery("");
      return;
    }
    if (id === "view") {
      setSelectedView(role === "Viewer" ? viewerDefaultView : "");
      replaceLibraryViewParam(role === "Viewer" ? viewerDefaultView : undefined);
      return;
    }
    if (id === "collection") {
      setSelectedCollection("");
      setQuery("");
      replaceLibraryCollectionParam();
      return;
    }
    toggleFilter(id);
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
    if (response.ok) toastDraftSaved("Batch preview ready. No ResourceSpace write was attempted.");
    else toastSaveFailed(body.error || "Selection could not be processed.");
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
    toastShareCopied(`CSV exported: ${selected.length} selected asset records`);
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
    if (response.ok) toastDraftSaved("Collection draft remains local until publishing is configured.");
    else toastSaveFailed(body.error || "No draft was queued.");
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
  const hasVisibleAssets = visibleAssets.length > 0;
  const pagination = result?.pagination;
  const activeFilterPills = [
    ...(submittedQuery ? [{ id: "search", label: `Search: ${submittedQuery}`, active: true }] : []),
    ...(activeView && selectedView !== viewerDefaultView ? [{ id: "view", label: activeView.label, active: true }] : []),
    ...(activeCollection ? [{ id: "collection", label: activeCollection.name, active: true }] : []),
    ...filters.map((filter) => ({ id: filter, label: filter, active: true }))
  ];
  const sortActions: DropdownAction[] = sortOptions.map((option) => ({
    id: option,
    label: option,
    detail: option === "Approved first" ? "Portal-safe and reviewed items first" : option === "Recently approved" ? "Newest ResourceSpace approvals" : option === "Newest" ? "Newest captures or imports" : "Alphabetical title order",
    icon: sort === option ? <Check size={15} strokeWidth={2} aria-hidden="true" /> : <span className="h-[15px] w-[15px]" aria-hidden="true" />,
    onSelect: () => {
      setSort(option);
      setPageOffset(0);
    }
  }));
  const emptyStateTitle = submittedQuery || filters.length
    ? "No matching approved assets"
    : activeCollection
      ? "No assets in this collection yet"
      : selectedView
        ? "No assets in this view yet"
        : "No assets in this Library view";
  const emptyStateDetail = activeCollection
    ? "This collection can still exist while individual assets wait for portal reuse approval."
    : "Browse collections to find approved groups before opening individual assets.";

  return (
    <div className="dam-shell">
      <section className="grid gap-4 border-b border-[#d6dfd8] pb-4" aria-label="Library workspace">
        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="dam-page-title">Library</h1>
              <p className="mt-2 max-w-[68ch] text-base font-semibold leading-relaxed text-tjc-muted">
                Find, trust, and reuse ministry media from a ResourceSpace-backed contact sheet.
              </p>
            </div>
            {hasActiveSearch ? (
              <button className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef5f1] active:translate-y-px" type="button" onClick={clearSearchState}>
                <X size={15} strokeWidth={1.8} aria-hidden="true" />
                Reset
              </button>
            ) : null}
          </div>
          <form className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-1.5 rounded-xl border border-[#cad8cf] bg-white p-1.5 shadow-[0_12px_30px_rgba(35,53,111,.045)] sm:mt-5 sm:gap-2 sm:rounded-[1.25rem] sm:p-2.5 md:grid-cols-[auto_1fr_auto]" onSubmit={submit} aria-label="Library search">
            <Search aria-hidden="true" className="ml-1 mt-2.5 hidden text-tjc-evergreen md:block" size={22} strokeWidth={1.9} />
            <label className="sr-only" htmlFor="library-search">Search approved media</label>
            <input
              id="library-search"
              className="min-h-11 min-w-0 bg-transparent px-2 text-sm font-semibold text-tjc-ink placeholder:text-[#7f8a82] sm:min-h-12 sm:px-1 sm:text-lg"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search approved media..."
              name="q"
              type="search"
            />
            <button className="min-h-11 dam-button-primary px-4 text-sm font-black transition active:translate-y-px sm:min-h-12 sm:px-6" type="submit">Search</button>
          </form>
          {activeFilterPills.length ? (
            <FilterPills
              className="mt-3"
              ariaLabel="Active library filters"
              pills={activeFilterPills}
              onRemove={removeActivePill}
            />
          ) : null}
          <FilterPills
            className="mt-3 hidden pb-1 sm:flex"
            ariaLabel="Use-case shortcuts"
            pills={visibleUseCases.map((item) => ({ id: item.view, label: item.label, active: selectedView === item.view }))}
            onSelect={(id) => {
              const item = visibleUseCases.find((useCase) => useCase.view === id);
              if (item) openUseCase(item);
            }}
          />
        </div>

        <details className="hidden rounded-2xl border border-[#d6dfd8] bg-white/72 px-3 py-2 text-sm text-tjc-muted sm:block">
          <summary className="cursor-pointer font-black text-tjc-evergreen">Source/count truth</summary>
          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_26rem]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <strong className="block text-sm font-semibold text-tjc-ink">{result?.source.label || "Loading source"}</strong>
                <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-tjc-muted">{result?.source.detail || "Loading ResourceSpace source state."}</p>
              </div>
              <Database className="shrink-0 text-tjc-evergreen" size={18} strokeWidth={1.9} aria-hidden="true" />
            </div>
            <div className="grid grid-cols-3 gap-2" aria-label="Catalog summary">
            {[
              { value: result?.counts.approved ?? "-", label: "RS approved", tone: "border-[#b8d9c6] bg-[#edf8f1] text-[#22563a]" },
              { value: result?.counts.rightsReview ?? "-", label: "Rights review", tone: "border-[#ead6a8] bg-[#fff7e5] text-[#725216]" },
              { value: result?.counts.visibleToRole ?? "-", label: "Visible here", tone: "border-[#bdd9e2] bg-[#eef8fb] text-[#0b5f7a]" }
            ].map((item) => (
              <div key={item.label} className={cn("rounded-xl border px-3 py-2", item.tone)}>
                <strong className="block text-lg font-black tabular-nums">{item.value}</strong>
                <span className="text-xs font-bold">{item.label}</span>
              </div>
            ))}
            </div>
          </div>
        </details>
	      </section>

	      {error ? (
	        <ErrorState className="mt-4" title="Library did not load" detail={error} />
	      ) : null}

	      <details className="mt-3 hidden rounded-2xl border border-[#d1ddd2] bg-white/80 shadow-[0_10px_26px_rgba(49,60,52,.035)] sm:block">
        <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm font-semibold text-tjc-evergreen">
          <span>Production signals</span>
          <span className="text-xs font-medium text-tjc-muted">Metadata health, operational signals, search gaps</span>
        </summary>
        <div className="grid gap-3 border-t border-tjc-line p-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.55fr)_minmax(20rem,.6fr)]" aria-label="Production DAM health">
        <div className="grid gap-2 rounded-xl border border-tjc-line bg-white p-3">
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
              <div className="rounded-xl border border-tjc-line bg-[#fbfcfa] p-2" key={label}>
                <strong className="block text-lg font-semibold tabular-nums text-tjc-ink">{value ?? "-"}</strong>
                <span className="text-[11px] font-medium text-tjc-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-tjc-line bg-white p-3">
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
        <div className="rounded-xl border border-tjc-line bg-white p-3">
          <h2 className="text-sm font-semibold text-tjc-evergreen">Search gaps</h2>
          <div className="mt-2 grid gap-2">
            {(result?.zeroResultInsights || []).slice(0, 3).map((insight) => (
              <button key={insight.query} type="button" className="grid rounded-xl border border-tjc-line bg-[#fbfcfa] p-2 text-left text-xs transition hover:bg-[#eef7f1]" onClick={() => insight.savedViewId && openSavedView(insight.savedViewId)}>
                <span className="font-semibold text-tjc-ink">{insight.query}: raw {insight.rawCount} / mapped {insight.savedViewCount}</span>
                <span className="mt-1 text-tjc-muted">{insight.recommendation}</span>
              </button>
            ))}
          </div>
        </div>
        </div>
      </details>

      <section className="mt-4 hidden sm:block xl:hidden" aria-label="Saved DAM views">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-black text-tjc-evergreen">Saved DAM views</h2>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-tjc-muted">ResourceSpace-backed shortcuts for common church media needs.</p>
          </div>
          <button className="inline-flex min-h-9 items-center gap-2 rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen xl:hidden" type="button" onClick={() => setFiltersOpen(true)} aria-haspopup="dialog">
            <SlidersHorizontal size={16} strokeWidth={1.8} aria-hidden="true" />
            Filters
            {filters.length ? <span className="rounded-full bg-tjc-evergreen px-1.5 text-[11px] text-white">{filters.length}</span> : null}
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {shortcuts.slice(0, 6).map((view) => (
            <SavedViewCard key={view.id} view={view} active={selectedView === view.id} onOpen={() => openSavedView(view.id)} />
          ))}
        </div>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[15rem_minmax(0,1fr)]" aria-label="Library controls and results">
        <LibrarySavedRail
          shortcuts={shortcuts}
          visibleUseCases={visibleUseCases}
          selectedView={selectedView}
          onOpenView={openSavedView}
          onOpenUseCase={openUseCase}
        />
        <div className="min-w-0">
          <section className="min-w-0" aria-label="Asset results">
            {(hasVisibleAssets || filters.length > 0) ? (
            <section className="mb-3 grid gap-3 dam-contact-sheet p-2 sm:p-3" aria-label="Selection and batch actions">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {hasVisibleAssets ? <button className="hidden min-h-9 items-center gap-2 rounded-xl border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1] sm:inline-flex" type="button" onClick={selectVisibleAssets}>
                    <CheckCircle2 size={15} strokeWidth={1.8} aria-hidden="true" />
                    {selectedIds.length ? "Clear selection" : "Select visible"}
                  </button> : null}
                  {hasVisibleAssets ? <span className="text-sm font-semibold text-tjc-muted">{selectedIds.length} selected</span> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(filters.length > 0 || hasVisibleAssets) ? <button className={cn("inline-flex min-h-9 items-center gap-2 rounded-md border border-tjc-line px-3 text-sm font-semibold transition", filtersOpen ? "bg-[#e8f5ef] text-tjc-evergreen" : "bg-white text-[#3e4741]")} type="button" onClick={() => setFiltersOpen(true)} aria-expanded={filtersOpen} aria-haspopup="dialog">
                    <SlidersHorizontal size={15} strokeWidth={1.8} aria-hidden="true" />
                    Filters
                    {filters.length ? <span className="rounded-full bg-tjc-evergreen px-1.5 text-[11px] text-white">{filters.length}</span> : null}
                  </button> : null}
                  {hasVisibleAssets ? <button className={cn("inline-flex min-h-9 items-center gap-2 rounded-md border border-tjc-line px-3 text-sm font-semibold transition", viewMode === "grid" ? "bg-[#e8f5ef] text-tjc-evergreen" : "bg-white text-[#3e4741]")} type="button" onClick={() => setViewMode("grid")} aria-pressed={viewMode === "grid"}>
                    <LayoutGrid size={15} strokeWidth={1.8} aria-hidden="true" />
                    Grid
                  </button> : null}
                  {hasVisibleAssets ? <button className={cn("hidden min-h-9 items-center gap-2 rounded-md border border-tjc-line px-3 text-sm font-semibold transition sm:inline-flex", viewMode === "list" ? "bg-[#e8f5ef] text-tjc-evergreen" : "bg-white text-[#3e4741]")} type="button" onClick={() => setViewMode("list")} aria-pressed={viewMode === "list"}>
                    <List size={15} strokeWidth={1.8} aria-hidden="true" />
                    List
                  </button> : null}
                </div>
              </div>
              {selectedIds.length ? (
                <div className="grid gap-3 border-t border-tjc-line pt-3">
                  <div className="flex flex-wrap gap-2">
                    <button className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1]" type="button" onClick={exportCsv}>
                      <FileDown size={15} strokeWidth={1.8} aria-hidden="true" />
                      Export CSV
                    </button>
                    <button className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1] disabled:opacity-50" type="button" disabled={!reviewer} onClick={() => runBatchAction("request-review")}>
                      <ShieldAlert size={15} strokeWidth={1.8} aria-hidden="true" />
                      Preview review
                    </button>
                    <button className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1] disabled:opacity-50" type="button" disabled={!reviewer} onClick={() => runBatchAction("mark-internal")}>
                      <ShieldCheck size={15} strokeWidth={1.8} aria-hidden="true" />
                      Preview internal
                    </button>
                    <button className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1] disabled:opacity-50" type="button" disabled={!reviewer} onClick={() => runBatchAction("archive")}>
                      <Archive size={15} strokeWidth={1.8} aria-hidden="true" />
                      Preview archive
                    </button>
                  </div>
                  <form className="grid gap-2 rounded-xl border border-tjc-line bg-[#fbfcfa] p-3 md:grid-cols-[minmax(10rem,1fr)_11rem_10rem_minmax(9rem,.7fr)_auto]" onSubmit={createCollectionDraft}>
                    <input className="min-h-9 rounded-xl border border-tjc-line bg-white px-3 text-sm font-medium" value={collectionTitle} onChange={(event) => setCollectionTitle(event.target.value)} placeholder="Collection name" aria-label="Collection name" />
                    <select className="min-h-9 rounded-xl border border-tjc-line bg-white px-3 text-sm font-medium" value={collectionAudience} onChange={(event) => setCollectionAudience(event.target.value)} aria-label="Collection audience">
                      <option>Private draft</option>
                      <option>Internal ministry</option>
                      <option>Public-approved portal</option>
                    </select>
                    <input className="min-h-9 rounded-xl border border-tjc-line bg-white px-3 text-sm font-medium" type="date" value={collectionExpiry} onChange={(event) => setCollectionExpiry(event.target.value)} aria-label="Expiry date" />
                    <input className="min-h-9 rounded-xl border border-tjc-line bg-white px-3 text-sm font-medium" value={collectionOwner} onChange={(event) => setCollectionOwner(event.target.value)} placeholder="Owner" aria-label="Collection owner" />
                    <button className="inline-flex min-h-9 items-center justify-center gap-2 dam-button-primary px-3 text-sm font-semibold transition disabled:opacity-50" type="submit" disabled={!contributor}>
                      <FolderPlus size={15} strokeWidth={1.8} aria-hidden="true" />
                      Preview draft
                    </button>
                  </form>
                  {batchMessage ? <div className="rounded-md border border-[#c8d7e6] bg-[#f2f7fb] p-2 text-sm font-semibold text-[#27435b]">{batchMessage}</div> : null}
                </div>
              ) : null}
            </section>
            ) : null}

            {hasVisibleAssets ? (
            <div className="mb-3 grid gap-2 rounded-2xl border border-[#c8d5cd] bg-[#fbfcfa] px-3 py-3 text-sm font-semibold text-tjc-muted shadow-[0_1px_0_rgba(255,255,255,.85)_inset] max-sm:text-xs" aria-live="polite">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="font-semibold text-tjc-ink">
                  {loading
                    ? "Loading results"
                    : pagination && result?.total
                      ? `Showing ${pagination.rangeStart.toLocaleString()}-${pagination.rangeEnd.toLocaleString()} of ${result.total.toLocaleString()} matching assets`
                      : "No matching assets"}
                </strong>
                {pagination && result?.total ? <span>Page {Math.floor(pagination.offset / pagination.limit) + 1} of {Math.max(1, Math.ceil(result.total / pagination.limit))}</span> : null}
              </div>
              {activeView ? (
                <p>
                  View: <strong className="font-semibold text-tjc-evergreen">{activeView.label}</strong>. ResourceSpace remains truth; downloads stay blocked until portal reuse checks pass.
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
              <FilterPills
                ariaLabel="Active filters"
                pills={[
                  ...filters.map((filter) => ({ id: filter, label: filter, active: true }))
                ]}
                onRemove={(id) => {
                  if (id === "search") {
                    setQuery("");
                    setSubmittedQuery("");
                    return;
                  }
	                  toggleFilter(id);
	                }}
	              />
	            </div>
            ) : null}

            {hasVisibleAssets ? (
            <section className="mb-3 flex items-center justify-between gap-2 rounded-2xl bg-[#e9f0eb] p-2 text-sm text-tjc-muted" aria-label="Sort results">
              <span className="px-2 font-semibold text-tjc-ink">Sort</span>
              <DropdownActionMenu label={`Sort: ${sort}`} actions={sortActions} align="right" />
            </section>
            ) : null}

            {hasVisibleAssets && pagination ? (
              <div className="mb-3">
                <LibraryPagination
                  rangeStart={pagination.rangeStart}
                  rangeEnd={pagination.rangeEnd}
                  total={result?.total ?? 0}
                  hasPrevious={pagination.hasPrevious}
                  hasNext={pagination.hasNext}
                  loading={loading}
                  onPrevious={() => setPageOffset(pagination.previousOffset)}
                  onNext={() => setPageOffset(pagination.nextOffset)}
                  pageSize={pageLimit}
                  onPage={(page) => setPageOffset(Math.max(0, (page - 1) * pageLimit))}
                />
              </div>
            ) : null}

            {loading ? <SkeletonGrid count={pageLimit < 24 ? 8 : 12} /> : null}
            {!loading && result?.assets.length === 0 ? (
              <div className="grid gap-3" data-testid="library-empty-state">
                <EmptyState
                  title={emptyStateTitle}
                  detail={emptyStateDetail}
                />
                <div className="rounded-2xl border border-[#d6dfd8] bg-white p-3 text-sm font-semibold text-tjc-muted lg:hidden" role="status">
                  <strong className="block text-base font-black text-tjc-ink">Keep browsing</strong>
                  <p className="mt-1 leading-relaxed">Collections can help you find approved groups before opening individual assets.</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Link className="inline-flex min-h-11 items-center justify-center rounded-full bg-tjc-evergreen px-4 text-sm font-black text-white transition hover:bg-[#062d24] active:translate-y-px" href="/collections">
                      Browse collections
                    </Link>
                    <button className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#c5d1c9] bg-white px-4 text-sm font-black text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px" type="button" onClick={clearSearchState}>
                      {submittedQuery || filters.length ? "Clear search" : "Reset view"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            {hasVisibleAssets && viewMode === "grid" ? (
              <div className="contact-sheet-board dam-contact-grid auto-rows-auto gap-3 p-3">
                {visibleAssets.map((asset, index) => (
                  <div className="relative min-w-0" key={asset.id}>
                    <label className="dam-contact-select absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-xl border border-white/70 bg-white/92 shadow-[0_10px_22px_rgba(7,16,13,.14)]" aria-label={`Select ${asset.title}`}>
                      <input className="h-4 w-4 accent-tjc-evergreen" type="checkbox" checked={selectedIds.includes(asset.id)} onChange={() => toggleSelected(asset.id)} />
                    </label>
                    <AssetCard asset={asset} role={role} variant={index % 11 === 0 ? "wide" : index % 7 === 0 ? "tall" : "standard"} />
                  </div>
                ))}
              </div>
            ) : hasVisibleAssets ? (
              <div className="overflow-hidden rounded-lg border border-tjc-line">
                <div className="hidden grid-cols-[auto_5rem_minmax(12rem,1.2fr)_9rem_10rem_12rem_9rem] gap-3 border-b border-tjc-line bg-[#f5f7f4] px-3 py-2 text-xs font-semibold text-tjc-muted lg:grid">
                  <span>Select</span><span>Preview</span><span>Asset</span><span>Status</span><span>Use</span><span>Reviewer</span><span>Health</span>
                </div>
                {visibleAssets.map((asset) => <AssetListRow key={asset.id} asset={asset} selected={selectedIds.includes(asset.id)} onToggle={() => toggleSelected(asset.id)} />)}
              </div>
            ) : null}
            {hasVisibleAssets && pagination && result?.total ? (
              <div className="mt-3">
                <LibraryPagination
                  rangeStart={pagination.rangeStart}
                  rangeEnd={pagination.rangeEnd}
                  total={result.total}
                  hasPrevious={pagination.hasPrevious}
                  hasNext={pagination.hasNext}
                  loading={loading}
                  onPrevious={() => setPageOffset(pagination.previousOffset)}
                  onNext={() => setPageOffset(pagination.nextOffset)}
                  pageSize={pageLimit}
                  onPage={(page) => setPageOffset(Math.max(0, (page - 1) * pageLimit))}
                />
              </div>
            ) : null}
          </section>

          <section id="collections" className="mt-6 hidden scroll-mt-24 lg:block" aria-label="Featured collections">
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-tjc-ink">{hasVisibleAssets ? "Collections" : "Browse collections instead"}</h2>
                <p className="text-sm text-tjc-muted">
                  {hasVisibleAssets
                    ? "Collections and ministry contexts with approval summaries."
                    : "Collections summarize the ResourceSpace export while assets wait for reuse confirmation."}
                </p>
              </div>
            </div>
            <div className="grid gap-3 min-[1200px]:grid-cols-2">
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
      <Dialog
        open={filtersOpen}
        title="Filter library"
        description="Primary filters stay visible first. Governance, source, and date filters stay tucked under Advanced."
        onClose={() => setFiltersOpen(false)}
        placement={filterSheetPlacement}
        maxWidthClassName={filterSheetPlacement === "right" ? "max-w-[28rem]" : "max-w-full"}
        className={filterSheetPlacement === "right" ? "sm:mr-0" : ""}
        initialFocus="first"
        footer={(
          <>
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-tjc-line bg-white px-4 text-sm font-black text-tjc-evergreen transition hover:bg-[#eef7f1] disabled:opacity-50"
              type="button"
              disabled={!filters.length}
              onClick={() => setFilters([])}
            >
              Clear filters
            </button>
            <button className="inline-flex min-h-10 items-center justify-center rounded-xl bg-tjc-evergreen px-4 text-sm font-black text-white transition hover:bg-[#0d4a37]" type="button" onClick={() => setFiltersOpen(false)}>
              Show results
            </button>
          </>
        )}
      >
        {activeFilterPills.length ? (
          <div className="mb-3 rounded-2xl border border-[#d6dfd8] bg-[#fbfcfa] p-3">
            <h3 className="mb-2 text-xs font-black uppercase text-tjc-muted">Active chips</h3>
            <FilterPills ariaLabel="Active drawer filters" pills={activeFilterPills} onRemove={removeActivePill} />
          </div>
        ) : null}
        <FilterSidebar filters={filters} onToggle={toggleFilter} onClear={() => setFilters([])} variant="drawer" />
      </Dialog>
    </div>
  );
}
