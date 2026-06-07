"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Database, FolderOpen, Search, ShieldCheck, Users } from "lucide-react";
import { CollectionAlbumCard } from "@/components/CollectionAlbumCard";
import { CollectionShelfInspector } from "@/components/CollectionShelfInspector";
import { useDemoRole } from "@/components/RoleProvider";
import type { CatalogCollection, SearchResult } from "@/lib/types";

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
      <section className="grid gap-5 border-b border-[#d6dfd8] pb-5 xl:grid-cols-[minmax(0,1fr)_30rem]" aria-label="Collections workspace">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-black text-tjc-evergreen">
            <FolderOpen size={17} strokeWidth={1.8} aria-hidden="true" />
            Albums and ministry contexts
          </div>
          <h1 className="mt-2 dam-page-title">Collections</h1>
          <p className="mt-2 max-w-[64ch] text-base font-semibold leading-relaxed text-tjc-muted">
            Browse ministry albums first, then open Library to confirm per-asset reuse before publication.
          </p>
          <form className="mt-4 grid gap-2 rounded-lg border border-[#cad8cf] bg-white p-2 md:grid-cols-[auto_1fr_auto]" onSubmit={submit} aria-label="Collection search">
            <Search aria-hidden="true" className="ml-1 mt-2 text-tjc-evergreen" size={19} strokeWidth={1.8} />
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

        <div className="hidden min-w-0 content-start gap-3 border-t border-[#d6dfd8] pt-4 xl:grid xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-sm font-black text-tjc-evergreen">ResourceSpace export</span>
              <strong className="mt-1 block text-sm font-semibold text-tjc-ink">{result?.source.label || "Loading source"}</strong>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-tjc-muted">{result?.source.detail || "Loading ResourceSpace source state."}</p>
            </div>
            <Database className="shrink-0 text-tjc-evergreen" size={19} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-2 border-y border-[#d6dfd8] py-3 text-sm sm:grid-cols-4">
            {[
              { label: "collections", value: collections.length, tone: "ok" as const, icon: FolderOpen },
              { label: "album assets", value: totalCollectionAssets, tone: "info" as const, icon: Database },
              { label: "people flags", value: peopleWarnings, tone: peopleWarnings ? "warn" as const : "ok" as const, icon: Users },
              { label: "approved", value: result?.counts.approved ?? "-", tone: "ok" as const, icon: ShieldCheck }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div className="min-w-0" key={item.label}>
                  <div className="flex items-center gap-1.5 text-tjc-muted">
                    <Icon size={13} strokeWidth={1.8} aria-hidden="true" />
                    <span className="truncate text-[11px] font-semibold uppercase">{item.label}</span>
                  </div>
                  <strong className="mt-0.5 block text-lg font-black tabular-nums text-tjc-ink">{item.value}</strong>
                </div>
              );
            })}
          </div>
          {strongestCollection ? (
            <button className="flex min-w-0 items-center justify-between gap-3 rounded-md px-0 py-2 text-left transition hover:bg-[#eef7f1] hover:px-2" type="button" onClick={() => openCollection(strongestCollection)}>
              <span className="min-w-0">
                <span className="block text-xs font-black uppercase tracking-[.08em] text-tjc-muted">Largest album</span>
                <strong className="mt-1 block truncate text-sm font-black text-tjc-ink">{strongestCollection.name}</strong>
                <span className="mt-1 block text-xs font-semibold text-tjc-muted">{strongestCollection.countLabel} / {strongestCollection.approvalSummary}</span>
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
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-[#d6dfd8] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-tjc-evergreen">Album shelves</h2>
              <p className="mt-1 text-xs leading-relaxed text-tjc-muted">Counts, dates, source, approval summary, and people/minors warning come from current export metadata.</p>
            </div>
            <span className="text-xs font-semibold text-tjc-muted">
              {loading ? "Loading albums" : `${collections.length} shown`}
            </span>
          </div>
          <nav className="mb-3 flex flex-wrap gap-2 border-b border-[#d6dfd8] pb-3 text-sm font-semibold" aria-label="Collection use cases">
            {[
              ["Website hero", "website-hero"],
              ["Slides", "sermon-slides"],
              ["Newsletter", "newsletter"],
              ["No people", "no-people"]
            ].map(([label, view]) => (
              <button key={view} type="button" className="shrink-0 rounded-full bg-white px-3 py-2 text-[#3f4a43] ring-1 ring-[#d8e1da] transition hover:bg-[#eef7f1] hover:text-tjc-evergreen" onClick={() => router.push(`/?view=${view}`)}>
                {label}
              </button>
            ))}
          </nav>
          {loading ? (
            <div className="grid gap-2" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, index) => (
                <div className="skeleton h-28 rounded-md" key={index} />
              ))}
            </div>
          ) : null}
          {!loading && !collections.length ? (
            <div className="rounded-xl border border-tjc-line bg-white p-8 text-sm text-tjc-muted">No collections match this search.</div>
          ) : null}
          <div className="grid gap-3">
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
          <details className="rounded-[1.2rem] border border-[#d6dfd8] bg-white p-4 text-sm lg:hidden">
            <summary className="cursor-pointer font-black text-tjc-evergreen">ResourceSpace export</summary>
            <div className="mt-3 grid gap-2 text-tjc-muted">
              <strong className="text-tjc-ink">{result?.source.label || "Loading source"}</strong>
              <p className="text-xs font-semibold leading-relaxed">{result?.source.detail || "Loading ResourceSpace source state."}</p>
              <div className="grid grid-cols-2 gap-2">
                <span>{collections.length} collections</span>
                <span>{totalCollectionAssets} album assets</span>
                <span>{peopleWarnings} people flags</span>
                <span>{result?.counts.approved ?? "-"} approved</span>
              </div>
            </div>
          </details>
          <details className="border-y border-[#d6dfd8] py-3 text-sm">
            <summary className="cursor-pointer font-semibold text-tjc-evergreen">Before sharing an album</summary>
            <ul className="mt-3 grid gap-2 text-xs leading-relaxed text-tjc-muted">
              <li><strong className="text-tjc-ink">Approval summary is not a shortcut.</strong> Open Library result before reuse.</li>
              <li><strong className="text-[#725216]">People/minors warning.</strong> Visible people or possible youth need review before public publication.</li>
              <li><strong className="text-[#27435b]">Draft collection publishing blocked.</strong> ResourceSpace portal/write mapping must be configured first.</li>
            </ul>
          </details>
        </aside>
      </section>
    </div>
  );
}
