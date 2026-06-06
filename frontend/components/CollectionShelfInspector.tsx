"use client";

import { ArrowUpRight, CalendarDays, CheckCircle2, Database, FolderOpen, Images, ShieldAlert, Users } from "lucide-react";
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
      <section className="dam-lift grid min-h-80 place-items-center p-4 text-center" aria-label="Selected collection">
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

  const hero = collection.images[0];
  const secondary = collection.images.slice(1, 5);
  const hasPeopleWarning = Boolean(collection.peopleWarning);

  return (
    <section className="dam-lift overflow-hidden" aria-label={`${collection.name} collection inspector`}>
      <div className="bg-[#0f1916] p-2">
        <div className="grid gap-1.5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,.9fr)]">
          <div className="grid aspect-[16/10] place-items-center overflow-hidden rounded-xl bg-[#18231f] ring-1 ring-white/10">
            {hero ? (
              <MediaPreview src={hero.src} alt={hero.alt} loading="eager" imgClassName="scale-[1.01]" />
            ) : (
              <MediaPreview alt="" label="Preview pending" detail="No safe collection previews are available for this role." />
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {secondary.length ? (
              secondary.map((image, index) => (
                <div className="grid min-h-20 place-items-center overflow-hidden rounded-lg bg-[#18231f] ring-1 ring-white/10" key={`${image.src}-${index}`}>
                  <MediaPreview src={image.src} alt="" />
                </div>
              ))
            ) : (
              <div className="col-span-2 grid min-h-32 place-items-center rounded-lg border border-white/10 bg-[#18231f] px-4 text-center text-xs font-semibold leading-relaxed text-white/62">
                ResourceSpace export has no safe album contact sheet for this role.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[.1em] text-tjc-muted">
            <span>{collection.id}</span>
            <span aria-hidden="true">/</span>
            <span>{totalCollections} shelves</span>
          </div>
          <h2 className="mt-2 text-2xl font-black leading-tight text-tjc-ink">{collection.name}</h2>
          <p className="mt-1 text-sm leading-relaxed text-tjc-muted">{collection.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <InspectorFact icon={Images} label="Assets" value={collection.countLabel} />
          <InspectorFact icon={CalendarDays} label="Range" value={collection.dateRange} />
          <InspectorFact icon={Database} label="Source" value={collection.ministry} />
          <InspectorFact icon={CheckCircle2} label="Approval" value={collection.approvalSummary} />
        </div>

        <div className={hasPeopleWarning ? "rounded-xl border border-[#ead6a8] bg-[#fff7e5] p-3 text-[#725216]" : "rounded-xl border border-[#b8d9c6] bg-[#edf8f1] p-3 text-[#22563a]"}>
          <div className="flex items-start gap-2">
            {hasPeopleWarning ? <ShieldAlert size={17} strokeWidth={1.8} aria-hidden="true" /> : <CheckCircle2 size={17} strokeWidth={1.8} aria-hidden="true" />}
            <div>
              <strong className="block text-sm font-semibold">{hasPeopleWarning ? collection.peopleWarning : "No collection-level people/minors warning"}</strong>
              <span className="mt-1 block text-xs leading-relaxed">
                Album approval is a navigation signal only. Open the Library results before publication to confirm portal reuse, rights, reviewer/date, and approved copy availability per asset.
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-tjc-line bg-[#fbfcfa] p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-tjc-evergreen">
            <Users size={16} strokeWidth={1.8} aria-hidden="true" />
            Collection search intent
          </div>
          <p className="mt-2 text-sm leading-relaxed text-tjc-muted">{collection.searchQuery}</p>
        </div>

        <button className="dam-button-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition active:translate-y-px" type="button" onClick={() => onOpen(collection)}>
          Open Library results
          <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

function InspectorFact({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Images;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-tjc-line bg-white p-2.5">
      <Icon size={15} strokeWidth={1.8} className="text-tjc-evergreen" aria-hidden="true" />
      <span className="mt-2 block text-[11px] font-black uppercase tracking-[.08em] text-tjc-muted">{label}</span>
      <strong className="mt-1 block truncate text-sm font-semibold text-tjc-ink" title={value}>{value}</strong>
    </div>
  );
}
