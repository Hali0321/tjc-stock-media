"use client";

import { ArrowRight, CalendarDays, CheckCircle2, FolderOpen, Images, Users } from "lucide-react";
import { MediaPreview } from "@/components/MediaPreview";
import { TjcStatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/ui";

type CollectionAlbumCardProps = {
  name: string;
  description: string;
  countLabel: string;
  dateRange: string;
  ministry: string;
  approvalSummary: string;
  peopleWarning?: string;
  images: { src: string; alt: string }[];
  isActive?: boolean;
  inspectLabel?: string;
  onInspect?: () => void;
  onOpen: () => void;
};

function placeholderTone(name: string) {
  const variants = [
    "from-[#dbeee5] via-[#f7fbf7] to-[#cfe4ee] text-[#174d37]",
    "from-[#e6f4f8] via-[#f8fbfb] to-[#d6e5ef] text-[#24546b]",
    "from-[#fff3cb] via-[#fffaf0] to-[#dcebdd] text-[#725216]",
    "from-[#eee7dc] via-[#fbfaf6] to-[#d9e9e4] text-[#51463b]"
  ];
  return variants[Math.abs([...name].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % variants.length];
}

function AlbumPlaceholder({ name, title, className, label = "Album cover" }: { name: string; title: string; className?: string; label?: string }) {
  return (
    <span className={cn("relative grid h-full min-h-20 w-full place-items-center overflow-hidden rounded-[1rem] border border-white/72 bg-gradient-to-br p-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.9)]", placeholderTone(name), className)}>
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,.95),transparent_28%),radial-gradient(circle_at_78%_84%,rgba(15,61,46,.12),transparent_34%)]" aria-hidden="true" />
      <span className="absolute inset-2 rounded-[.85rem] border border-white/76" aria-hidden="true" />
      <span className="absolute bottom-3 left-3 right-3 h-8 rounded-full border border-white/72 bg-white/58 shadow-[0_12px_24px_rgba(25,34,29,.08)]" aria-hidden="true" />
      <span className="relative z-[1] grid justify-items-center gap-1.5">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white/82 shadow-[0_10px_24px_rgba(25,34,29,.10)]">
          <FolderOpen size={18} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <strong className="text-[11px] font-black leading-tight">{title}</strong>
        <span className="text-[10px] font-black uppercase opacity-70">{label}</span>
      </span>
    </span>
  );
}

export function CollectionAlbumCard({
  name,
  description,
  countLabel,
  dateRange,
  ministry,
  approvalSummary,
  peopleWarning,
  images,
  isActive = false,
  inspectLabel = "View details",
  onInspect,
  onOpen
}: CollectionAlbumCardProps) {
  const hasPeopleWarning = Boolean(peopleWarning);
  const hasAssets = !countLabel.startsWith("0 ");
  const statusTone = hasPeopleWarning ? "warning" : hasAssets ? "success" : "neutral";
  const statusLabel = hasPeopleWarning ? "People review" : hasAssets ? "Collection ready" : "No assets yet";

  return (
    <article
      className={cn(
        "group relative grid min-w-0 gap-4 overflow-hidden rounded-[1.5rem] border bg-white p-3 text-left shadow-[0_16px_42px_rgba(35,53,111,.055)] transition duration-300 hover:-translate-y-0.5 hover:border-[#8aa99a] hover:bg-[#fbfdfb] md:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)]",
        isActive ? "border-[#0b4b42] bg-[#f6fbf7] shadow-[inset_4px_0_0_#0b4b42,0_22px_48px_rgba(35,53,111,.08)]" : "border-[#d4ded7]"
      )}
      aria-label={`${name} collection card`}
      onPointerEnter={onInspect}
    >
      <button className="absolute inset-0 z-[1] hidden rounded-[1.5rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f4f45] md:block" type="button" onClick={onInspect} aria-label={`Select ${name}`} />
      <div className="pointer-events-none relative z-[2] grid max-w-full grid-cols-[1.45fr_.88fr] gap-2 overflow-hidden rounded-[1.15rem] bg-[#edf3ef] p-1.5" aria-hidden="true">
        {images.length ? (
          <>
            <span className="row-span-2 grid aspect-[4/3] place-items-center overflow-hidden rounded-[1rem] border border-[#d6e0d8] bg-[#f4f7f4]">
              <MediaPreview src={images[0]?.src} alt="" imgClassName="transition duration-300 ease-out group-hover:scale-[1.025]" />
            </span>
            {images.slice(1, 3).map((image, index) => (
              <span className="grid aspect-[4/3] place-items-center overflow-hidden rounded-[.85rem] border border-[#d6e0d8] bg-[#f4f7f4]" key={`${image.src}-${index}`}>
                <MediaPreview src={image.src} alt="" imgClassName="transition duration-300 ease-out group-hover:scale-[1.025]" />
              </span>
            ))}
          </>
        ) : (
          <>
            <AlbumPlaceholder name={name} className="row-span-2 aspect-[4/3]" title={name} label="Cover pending" />
            <AlbumPlaceholder name={`${name}-shelf`} className="aspect-[4/3] rounded-[.85rem]" title="Collection" label="Preview" />
            <AlbumPlaceholder name={`${name}-stable`} className="aspect-[4/3] rounded-[.85rem]" title="Stable ID" label="Export" />
          </>
        )}
      </div>
      <div className="pointer-events-none relative z-[2] grid min-w-0 content-between gap-4 py-1">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[11px] font-black uppercase tracking-[.08em] text-tjc-muted">{ministry}</span>
              <h2 className="mt-1 line-clamp-2 text-xl font-black leading-tight text-tjc-ink">{name}</h2>
            </div>
            <TjcStatusBadge domain="reuse" status={statusLabel} tone={statusTone} icon={hasPeopleWarning ? Users : hasAssets ? CheckCircle2 : FolderOpen} label={statusLabel} size="xs" />
          </div>
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-tjc-muted">{description}</p>
          <div className="flex flex-wrap gap-2 text-xs font-black text-[#4d5b52]">
            <span className="inline-flex min-h-8 max-w-full min-w-0 items-center gap-1.5 rounded-full border border-[#dbe4dd] bg-[#f9fbf9] px-2">
              <Images size={13} strokeWidth={1.8} aria-hidden="true" />
              <span className="truncate">{countLabel}</span>
            </span>
            <span className="inline-flex min-h-8 max-w-full min-w-0 items-center gap-1.5 rounded-full border border-[#dbe4dd] bg-[#f9fbf9] px-2">
              <CheckCircle2 size={13} strokeWidth={1.8} aria-hidden="true" />
              <span className="truncate">{approvalSummary}</span>
            </span>
            <span className="inline-flex min-h-8 max-w-full min-w-0 items-center gap-1.5 rounded-full border border-[#dbe4dd] bg-[#f9fbf9] px-2">
              <CalendarDays size={13} strokeWidth={1.8} aria-hidden="true" />
              <span className="truncate">{dateRange}</span>
            </span>
          </div>
          {peopleWarning ? (
          <span className="inline-flex items-center gap-1 text-xs font-black text-[#725216]">
            <Users size={13} strokeWidth={1.8} aria-hidden="true" />
            {peopleWarning}
          </span>
        ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e6eee8] pt-3">
          <span className="text-xs font-black text-tjc-muted">
            {hasAssets ? "Open Library results to confirm each asset before reuse." : "No assets yet."}
          </span>
          <div className="flex flex-wrap gap-2">
            {onInspect ? (
              <button className="pointer-events-auto inline-flex min-h-9 items-center rounded-xl border border-[#c9d8cf] bg-white px-3 text-sm font-black text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px" type="button" onClick={onInspect}>
                {inspectLabel}
              </button>
            ) : null}
            {hasAssets ? <button className="pointer-events-auto inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#c9d8cf] bg-white px-3 text-sm font-black text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px" type="button" onClick={onOpen}>
              Open Library results
              <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
            </button> : null}
          </div>
        </div>
      </div>
    </article>
  );
}
