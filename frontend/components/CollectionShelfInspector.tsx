"use client";

import { ArrowUpRight, CheckCircle2, FolderOpen, ShieldAlert } from "lucide-react";
import { MediaPreview } from "@/components/MediaPreview";
import type { CatalogCollection } from "@/lib/types";

type CollectionShelfInspectorProps = {
  collection?: CatalogCollection;
  totalCollections: number;
  onOpen: (collection: CatalogCollection) => void;
};

export function CollectionShelfInspector({ collection, totalCollections, onOpen }: CollectionShelfInspectorProps) {
  if (!collection) {
    return (
      <section className="grid min-h-64 place-items-center rounded-md border border-[#d4ded7] bg-white p-4 text-center" aria-label="Selected collection">
        <div className="grid max-w-xs justify-items-center gap-2">
          <FolderOpen size={30} strokeWidth={1.8} className="text-tjc-evergreen" aria-hidden="true" />
          <h2 className="text-base font-semibold text-tjc-ink">Select an album shelf</h2>
          <p className="text-sm leading-relaxed text-tjc-muted">
            Album context loads from the same ResourceSpace export as Library search.
          </p>
        </div>
      </section>
    );
  }

  const hasPeopleWarning = Boolean(collection.peopleWarning);

  return (
    <section className="rounded-[1.45rem] border border-[#d4ded7] bg-white p-4 shadow-[0_12px_30px_rgba(25,34,29,.035)]" aria-label={`${collection.name} collection inspector`}>
      <div className="grid gap-4">
        <div className="overflow-hidden rounded-[1.2rem] border border-[#d6e0d8] bg-[#f6f8f5]" aria-hidden="true">
          {collection.images.length ? (
            <div className="grid grid-cols-[1.5fr_1fr] gap-1.5 p-1.5">
              <span className="row-span-2 block aspect-[4/3] overflow-hidden rounded-[1rem] bg-[#eef3ef]">
                <MediaPreview src={collection.images[0]?.src} alt="" imgClassName="h-full w-full object-cover" />
              </span>
              {collection.images.slice(1, 3).map((image, index) => (
                <span className="block aspect-[4/3] overflow-hidden rounded-[.85rem] bg-[#eef3ef]" key={`${image.src}-${index}`}>
                  <MediaPreview src={image.src} alt="" imgClassName="h-full w-full object-cover" />
                </span>
              ))}
            </div>
          ) : (
            <div className="grid min-h-40 place-items-center p-4 text-center text-sm font-semibold text-tjc-muted">
              Preview export pending
            </div>
          )}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[.08em] text-tjc-muted">
            <span>Selected collection</span>
            <span aria-hidden="true">/</span>
            <span>{collection.id}</span>
          </div>
          <h2 className="mt-2 text-2xl font-black leading-tight text-tjc-ink">{collection.name}</h2>
          <p className="mt-1 text-sm leading-relaxed text-tjc-muted">{collection.description}</p>
        </div>

        <dl className="grid gap-2 border-y border-[#dce5de] py-3 text-sm">
          <div className="grid grid-cols-[7rem_1fr] gap-3">
            <dt className="font-bold text-tjc-muted">Assets</dt>
            <dd className="font-semibold text-tjc-ink">{collection.countLabel}</dd>
          </div>
          <div className="grid grid-cols-[7rem_1fr] gap-3">
            <dt className="font-bold text-tjc-muted">Approval</dt>
            <dd className="font-semibold text-tjc-ink">{collection.approvalSummary}</dd>
          </div>
          <div className="grid grid-cols-[7rem_1fr] gap-3">
            <dt className="font-bold text-tjc-muted">Range</dt>
            <dd className="font-semibold text-tjc-ink">{collection.dateRange}</dd>
          </div>
          <div className="grid grid-cols-[7rem_1fr] gap-3">
            <dt className="font-bold text-tjc-muted">Source</dt>
            <dd className="font-semibold text-tjc-ink">{collection.ministry}</dd>
          </div>
        </dl>

        <div className={hasPeopleWarning ? "border-l-2 border-[#c9922e] pl-3 text-[#725216]" : "border-l-2 border-[#7db58f] pl-3 text-[#22563a]"}>
          <div className="flex items-start gap-2">
            {hasPeopleWarning ? <ShieldAlert size={17} strokeWidth={1.8} aria-hidden="true" /> : <CheckCircle2 size={17} strokeWidth={1.8} aria-hidden="true" />}
            <div>
              <strong className="block text-sm font-semibold">{hasPeopleWarning ? collection.peopleWarning : "No collection-level people/minors warning"}</strong>
              <span className="mt-1 block text-xs leading-relaxed">Confirm per-asset reuse in Library before publication.</span>
            </div>
          </div>
        </div>

        <p className="text-xs font-semibold leading-relaxed text-tjc-muted">
          Search intent: {collection.searchQuery}. {totalCollections} album shelves in current export.
        </p>

        <button className="dam-button-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition active:translate-y-px" type="button" onClick={() => onOpen(collection)}>
          Open Library results
          <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
