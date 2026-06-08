"use client";

import { ArrowUpRight, CalendarDays, CheckCircle2, Database, FolderOpen, Images, ShieldAlert } from "lucide-react";
import { CollectionPreviewPlaceholder } from "@/components/DamStates";
import { MediaPreview } from "@/components/MediaPreview";
import { TjcStatusBadge } from "@/components/StatusBadge";
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
          <h2 className="text-base font-semibold text-tjc-ink">Select a collection</h2>
          <p className="text-sm leading-relaxed text-tjc-muted">
            Deliver package context loads from the same ResourceSpace export as Find.
          </p>
        </div>
      </section>
    );
  }

  const hasPeopleWarning = Boolean(collection.peopleWarning);
  const hasAssets = collection.count > 0;

  return (
    <section className="overflow-hidden rounded-md border border-[#d4ded7] bg-white" aria-label={`${collection.name} collection inspector`}>
      <div className="grid gap-4">
        <div className="relative overflow-hidden bg-[#f6f8f5]" aria-hidden="true">
          {collection.images.length ? (
            <div className="grid grid-cols-[1.5fr_1fr] gap-1.5 p-2">
              <span className="row-span-2 block aspect-[4/3] overflow-hidden rounded-md bg-[#eef3ef]">
                <MediaPreview src={collection.images[0]?.src} alt="" imgClassName="h-full w-full object-cover" />
              </span>
              {collection.images.slice(1, 3).map((image, index) => (
                <span className="block aspect-[4/3] overflow-hidden rounded-md bg-[#eef3ef]" key={`${image.src}-${index}`}>
                  <MediaPreview src={image.src} alt="" imgClassName="h-full w-full object-cover" />
                </span>
              ))}
            </div>
          ) : (
            <CollectionPreviewPlaceholder className="min-h-64 rounded-none" title={collection.name} detail="Cover pending" />
          )}
          <span className="absolute left-4 top-4 rounded-md border border-[#d6dfd8] bg-white px-3 py-1 text-xs font-black text-tjc-evergreen">
            Selected collection
          </span>
        </div>
        <div className="px-4">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[.08em] text-tjc-muted">
            <span>{collection.id}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-2xl font-black leading-tight text-tjc-ink">{collection.name}</h2>
            <TjcStatusBadge
              domain="reuse"
              status={hasPeopleWarning ? "people-review" : "selected"}
              tone={hasPeopleWarning ? "warning" : "success"}
              icon={hasPeopleWarning ? ShieldAlert : CheckCircle2}
              label={hasPeopleWarning ? "Needs people review" : "Collection selected"}
              size="xs"
            />
          </div>
          <p className="mt-1 text-sm leading-relaxed text-tjc-muted">{collection.description}</p>
        </div>

        <div className="grid gap-2 px-4 sm:grid-cols-2">
          {[
            { label: "Assets", value: collection.countLabel, icon: Images },
            { label: "Approval", value: collection.approvalSummary, icon: CheckCircle2 },
            { label: "Range", value: collection.dateRange, icon: CalendarDays },
            { label: "Source", value: collection.ministry, icon: Database }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div className="rounded-md border border-[#dbe5de] bg-[#fbfcfa] p-3" key={item.label}>
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-tjc-muted">
                  <Icon size={13} strokeWidth={1.8} aria-hidden="true" />
                  {item.label}
                </div>
                <strong className="mt-1 block text-sm font-black leading-snug text-tjc-ink">{item.value}</strong>
              </div>
            );
          })}
        </div>

        <div className={hasPeopleWarning ? "mx-4 rounded-md border border-[#ead6a8] bg-[#fff8e8] p-3 text-[#725216]" : "mx-4 rounded-md border border-[#b8d9c6] bg-[#edf8f1] p-3 text-[#22563a]"}>
          <div className="flex items-start gap-2">
            {hasPeopleWarning ? <ShieldAlert size={17} strokeWidth={1.8} aria-hidden="true" /> : <CheckCircle2 size={17} strokeWidth={1.8} aria-hidden="true" />}
            <div>
              <strong className="block text-sm font-semibold">{hasPeopleWarning ? collection.peopleWarning : hasAssets ? "No collection-level people/minors warning" : "This collection has no approved assets yet"}</strong>
              <span className="mt-1 block text-xs leading-relaxed">{hasAssets ? "Confirm per-asset reuse in Find before publication." : "It will appear in Find when assets are approved."}</span>
            </div>
          </div>
        </div>

        <p className="px-4 text-xs font-semibold leading-relaxed text-tjc-muted">
          Search intent: {collection.searchQuery}. {totalCollections} collections in current export.
        </p>

        {hasAssets ? (
          <button className="mx-4 mb-4 dam-button-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition active:translate-y-px" type="button" onClick={() => onOpen(collection)}>
            Open Find results
            <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
        ) : (
          <div className="mx-4 mb-4 rounded-md border border-[#d6dfd8] bg-[#fbfcfa] p-3 text-sm font-black text-tjc-muted">
            No assets yet
          </div>
        )}
      </div>
    </section>
  );
}
