"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Search, ShieldCheck } from "lucide-react";
import { EmptyState, HeroSearch, PackageCard, PackageInspector, PrimaryAction, UseCaseCard } from "@/components/DamExperience";
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

const packageUseCases = [
  { label: "Website image", detail: "Open approved web-ready package media.", view: "website-hero", icon: Search },
  { label: "Slide background", detail: "Find visuals for worship, class, or sermon decks.", view: "sermon-slides", icon: FolderOpen },
  { label: "Newsletter/social", detail: "Start from announcement and recap media.", view: "newsletter", icon: ShieldCheck }
] as const;

export function CollectionsPage() {
  const router = useRouter();
  const { role, ready } = useDemoRole();
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const mobileInspectorRef = useRef<HTMLDivElement>(null);
  const opsView = role === "Reviewer" || role === "DAM Admin";

  const apiUrl = useMemo(() => `/api/assets/search?role=${encodeURIComponent(role)}&sort=Approved+first&limit=36`, [role]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(apiUrl)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load packages.");
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
  const selectedCollection = collections.find((collection) => collection.id === selectedCollectionId) || collections[0];
  const readyTotal = result?.counts.portalReady ?? 0;
  const reviewTotal = opsView
    ? result?.counts.needsReview ?? 0
    : result?.counts.batchApprovedWithBlockers || result?.counts.needsReview || 0;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  }

  function openCollection(collection: CatalogCollection) {
    router.push(`/?collection=${encodeURIComponent(collection.id)}`);
  }

  function inspectCollection(collectionId: string) {
    setSelectedCollectionId(collectionId);
    window.setTimeout(() => {
      if (window.innerWidth < 1024) mobileInspectorRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 0);
  }

  return (
    <div className="dam-shell grid gap-5">
      <section className="find-hero asset-bank-header p-3 sm:p-4 lg:p-5" aria-label="Packages front door">
        <div className="relative z-[1] grid gap-4 xl:grid-cols-[minmax(0,.72fr)_minmax(22rem,.28fr)] xl:items-end">
          <div>
            <span className="dam-kicker">Ministry portals</span>
            <h1 className="dam-page-title mt-1">Packages</h1>
            <p className="mt-2 max-w-[60ch] text-sm font-semibold leading-relaxed text-tjc-muted sm:text-base">
              Curated ministry kits for websites, slides, newsletters, and safe reuse.
            </p>
            <p className="mt-2 max-w-[64ch] text-sm font-semibold text-[#53615a]">
              Open each media record to confirm item-level approval before reuse.
            </p>
            <div className="mt-4">
              <HeroSearch value={query} onChange={setQuery} onSubmit={submit} placeholder="Search Sabbath, Bible study, fellowship, youth-safe..." />
            </div>
          </div>
          <div className="asset-bank-rule rounded-[10px] border border-[#e5e7eb] bg-[#fbfcfb] p-3 text-sm font-semibold leading-relaxed text-tjc-muted">
            <strong className="block text-tjc-evergreen">Package approval is not item approval.</strong>
            <span>Use package context to start faster, then open each media record for the final reuse decision.</span>
          </div>
        </div>
      </section>

      <section className="find-usecase-grid grid gap-2 sm:grid-cols-3" aria-label="Package use cases">
        {packageUseCases.map((item) => (
          <UseCaseCard
            key={item.label}
            label={item.label}
            detail={item.detail}
            icon={item.icon}
            onClick={() => router.push(`/?view=${item.view}`)}
          />
        ))}
      </section>

      {error ? (
        <section className="rounded-[12px] border border-[#dfb9b5] bg-[#fff1ef] p-4 text-sm font-semibold text-[#7b332f]" role="alert">{error}</section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]" aria-label="Ministry packages">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-tjc-ink">Ministry kits</h2>
              <p className="mt-1 text-sm font-semibold text-tjc-muted">
                {loading ? "Loading packages" : `${collections.length} packages shown. ${readyTotal.toLocaleString()} ready items, ${reviewTotal.toLocaleString()} needing review.`}
              </p>
            </div>
            {submittedQuery ? (
              <PrimaryAction tone="secondary" onClick={() => {
                setQuery("");
                setSubmittedQuery("");
                setSelectedCollectionId("");
              }}>
                Clear search
              </PrimaryAction>
            ) : null}
          </div>

          {loading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => <div className="skeleton h-72 rounded-[14px]" key={index} />)}
            </div>
          ) : null}

          {!loading && !collections.length ? (
            <EmptyState
              title="No packages match this search"
              description="Try a ministry, event, or media use. Packages stay curated, and each media record still controls reuse."
              primary={<PrimaryAction onClick={() => { setQuery(""); setSubmittedQuery(""); }} icon={Search}>Search packages</PrimaryAction>}
            />
          ) : null}

          {!loading && collections.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {collections.map((collection) => (
                <div key={collection.id}>
                  <PackageCard
                    collection={collection}
                    role={role}
                    active={selectedCollection?.id === collection.id}
                    onInspect={() => inspectCollection(collection.id)}
                    onOpen={() => openCollection(collection)}
                  />
                  {selectedCollection?.id === collection.id ? (
                    <div ref={mobileInspectorRef} className="mt-4 scroll-mt-24 xl:hidden">
                      <PackageInspector collection={selectedCollection} totalCollections={collections.length} onOpen={openCollection} opsView={opsView} />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="hidden xl:block">
          <div className="sticky top-[calc(var(--app-header-height)+1rem)]">
            <PackageInspector collection={selectedCollection} totalCollections={collections.length} onOpen={openCollection} opsView={opsView} />
          </div>
        </div>
      </section>
    </div>
  );
}
