"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Database, FolderOpen, Search, ShieldCheck, Users } from "lucide-react";
import { CollectionAlbumCard } from "@/components/CollectionAlbumCard";
import { CollectionShelfInspector } from "@/components/CollectionShelfInspector";
import { useDemoRole } from "@/components/RoleProvider";
import type { CatalogCollection, SearchResult } from "@/lib/types";
import { cn } from "@/lib/ui";

function matchesCollection(collection: CatalogCollection, query: string) {
  if (!query.trim()) return true;
  const haystack = [
    collection.name,
    collection.description,
    collection.countLabel,
    collection.dateRange,
    collection.ministry,
    collection.approvalSummary,
    collection.peopleWarning,
    collection.searchQuery
  ].join(" ").toLowerCase();
  return query.toLowerCase().split(/\s+/).filter(Boolean).every((term) => haystack.includes(term));
}

function metricTone(tone: "ok" | "warn" | "info") {
  if (tone === "ok") return "border-[#b8d9c6] bg-[#edf8f1] text-[#22563a]";
  if (tone === "warn") return "border-[#ead6a8] bg-[#fff7e5] text-[#725216]";
  return "border-[#c8d7e6] bg-[#f2f7fb] text-[#27435b]";
}

export function CollectionsPage() {
  const router = useRouter();
  const { role, ready } = useDemoRole();
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState("");

  const apiUrl = useMemo(() => `/api/assets/search?role=${encodeURIComponent(role)}&sort=Approved+first&limit=36`, [role]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(apiUrl)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load collections.");
        return data as SearchResult;
      })
      .then((data) => {
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

  const collections = useMemo(
    () => (result?.collections || []).filter((collection) => matchesCollection(collection, submittedQuery)),
    [result?.collections, submittedQuery]
  );
  const totalCollectionAssets = collections.reduce((sum, collection) => sum + collection.count, 0);
  const peopleWarnings = collections.filter((collection) => collection.peopleWarning).length;
  const strongestCollection = collections.toSorted((a, b) => b.count - a.count)[0];
  const selectedCollection = collections.find((collection) => collection.id === selectedCollectionId) || strongestCollection;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  }

  function openCollection(collection: CatalogCollection) {
    router.push(`/?collection=${encodeURIComponent(collection.id)}`);
  }

  return (
    <div className="dam-shell">
      <section className="dam-workbench grid gap-4 p-3 md:p-4 xl:grid-cols-[minmax(0,1fr)_30rem]" aria-label="Collections workspace">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-tjc-evergreen">
            <FolderOpen size={17} strokeWidth={1.8} aria-hidden="true" />
            Albums and ministry contexts
          </div>
          <h1 className="mt-2 dam-page-title">Collections</h1>
          <p className="mt-1 max-w-[72ch] text-sm leading-relaxed text-tjc-muted">
            Browse Sabbath, study, seasonal, welcome, fellowship, and web/slide albums using live ResourceSpace export metadata.
          </p>
          <form className="mt-4 grid gap-2 rounded-2xl border border-[#c8d8cc] bg-white/95 p-2 shadow-[0_16px_40px_rgba(49,60,52,.08)] md:grid-cols-[auto_1fr_auto]" onSubmit={submit} aria-label="Collection search">
            <Search aria-hidden="true" className="ml-1 mt-2 text-tjc-evergreen" size={20} strokeWidth={1.8} />
            <label className="sr-only" htmlFor="collection-search">Search collections</label>
            <input
              id="collection-search"
              className="min-h-10 min-w-0 bg-transparent px-1 text-base text-tjc-ink placeholder:text-[#7f8a82]"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Sabbath, Bible study, flowers, fellowship, website..."
              name="q"
              type="search"
            />
            <button className="min-h-10 dam-button-primary px-5 text-sm font-semibold transition active:translate-y-px" type="submit">Search</button>
          </form>
          {submittedQuery ? (
            <button className="mt-2 inline-flex min-h-8 items-center rounded-xl border border-tjc-line bg-white px-2.5 text-xs font-semibold text-tjc-evergreen" type="button" onClick={() => {
              setQuery("");
              setSubmittedQuery("");
              setSelectedCollectionId("");
            }}>
              Clear search: {submittedQuery}
            </button>
          ) : null}
        </div>

        <div className="grid min-w-0 content-start gap-3 dam-lift p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-sm font-semibold text-tjc-evergreen">Collection truth</span>
              <strong className="mt-1 block text-sm font-semibold text-tjc-ink">{result?.source.label || "Loading source"}</strong>
              <p className="mt-1 text-xs leading-relaxed text-tjc-muted">{result?.source.detail || "Loading ResourceSpace source state."}</p>
            </div>
            <Database className="shrink-0 text-tjc-evergreen" size={19} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "collections", value: collections.length, tone: "ok" as const, icon: FolderOpen },
              { label: "album assets", value: totalCollectionAssets, tone: "info" as const, icon: Database },
              { label: "people flags", value: peopleWarnings, tone: peopleWarnings ? "warn" as const : "ok" as const, icon: Users },
              { label: "approved", value: result?.counts.approved ?? "-", tone: "ok" as const, icon: ShieldCheck }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div className={cn("grid min-h-16 content-center rounded-md border p-2", metricTone(item.tone))} key={item.label}>
                  <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
                  <strong className="mt-1 text-lg font-semibold tabular-nums">{item.value}</strong>
                  <span className="text-[11px] font-medium leading-tight">{item.label}</span>
                </div>
              );
            })}
          </div>
          {strongestCollection ? (
            <button className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-tjc-line bg-[#fbfcfa] p-3 text-left transition hover:bg-[#eef7f1]" type="button" onClick={() => openCollection(strongestCollection)}>
              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-[.08em] text-tjc-muted">Largest album</span>
                <strong className="mt-1 block truncate text-sm font-semibold text-tjc-ink">{strongestCollection.name}</strong>
                <span className="mt-1 block text-xs text-tjc-muted">{strongestCollection.countLabel} / {strongestCollection.approvalSummary}</span>
              </span>
              <ArrowUpRight className="shrink-0 text-tjc-evergreen" size={17} strokeWidth={1.8} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </section>

      {error ? (
        <div className="mt-4 rounded-lg border border-[#e5b7b5] bg-[#fff0ef] p-3 text-sm font-semibold text-[#7d2d2a]" role="status">
          {error}
        </div>
      ) : null}

      <section className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_26rem]" aria-label="Collection album grid">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 dam-section-bar px-3 py-2.5">
            <div>
              <h2 className="text-sm font-semibold text-tjc-evergreen">Album shelves</h2>
              <p className="mt-1 text-xs leading-relaxed text-tjc-muted">Counts, dates, source, approval summary, and people/minors warning come from current export metadata.</p>
            </div>
            <span className="rounded-xl border border-tjc-line bg-[#fbfcfa] px-2.5 py-1.5 text-xs font-semibold text-tjc-muted">
              {loading ? "Loading albums" : `${collections.length} shown`}
            </span>
          </div>
          {loading ? (
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, index) => (
                <div className="skeleton h-52 rounded-lg" key={index} />
              ))}
            </div>
          ) : null}
          {!loading && !collections.length ? (
            <div className="rounded-xl border border-tjc-line bg-white p-8 text-sm text-tjc-muted">No collections match this search.</div>
          ) : null}
          <div className="dam-workbench grid gap-3 p-2 md:grid-cols-2 2xl:grid-cols-3">
            {collections.map((collection) => (
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
                isActive={selectedCollection?.id === collection.id}
                onInspect={() => setSelectedCollectionId(collection.id)}
                onOpen={() => openCollection(collection)}
              />
            ))}
          </div>
        </div>

        <aside className="grid min-w-0 gap-3 lg:sticky lg:top-24 lg:self-start" aria-label="Collection governance">
          <CollectionShelfInspector collection={selectedCollection} totalCollections={collections.length} onOpen={openCollection} />
          <section className="dam-lift p-3">
            <h2 className="text-sm font-semibold text-tjc-evergreen">Before sharing an album</h2>
            <div className="mt-3 grid gap-2 text-sm text-[#4e5a52]">
              <div className="rounded-xl border border-tjc-line bg-[#fbfcfa] p-2">
                <strong className="block text-tjc-ink">Approval summary is not a shortcut</strong>
                <span className="mt-1 block text-xs leading-relaxed text-tjc-muted">Open the Library result before reuse; unknown people, rights, or source fields still need reviewer confirmation.</span>
              </div>
              <div className="rounded-md border border-[#ead6a8] bg-[#fff7e5] p-2 text-[#725216]">
                <strong className="block">People/minors warning</strong>
                <span className="mt-1 block text-xs leading-relaxed">Any album with visible people or possible youth should be reviewed before public publication.</span>
              </div>
              <div className="rounded-md border border-[#c8d7e6] bg-[#f2f7fb] p-2 text-[#27435b]">
                <strong className="block">Draft collection persistence</strong>
                <span className="mt-1 block text-xs leading-relaxed">Shareable collection publishing remains blocked until ResourceSpace portal/write mapping is configured.</span>
              </div>
            </div>
          </section>
          <section className="dam-lift p-3">
            <h2 className="text-sm font-semibold text-tjc-evergreen">Use-case shortcuts</h2>
            <div className="mt-2 grid gap-2">
              {[
                ["Website hero", "website-hero"],
                ["Slides", "sermon-slides"],
                ["Newsletter", "newsletter"],
                ["No people", "no-people"]
              ].map(([label, view]) => (
                <button key={view} type="button" className="flex min-h-9 items-center justify-between gap-2 rounded-xl border border-tjc-line bg-white px-3 text-sm font-semibold text-[#3f4a43] transition hover:border-[#9bc5b5] hover:bg-[#eef7f1]" onClick={() => router.push(`/?view=${view}`)}>
                  {label}
                  <ArrowUpRight size={14} strokeWidth={1.8} aria-hidden="true" />
                </button>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
