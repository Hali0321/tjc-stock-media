"use client";

import { ArrowRight, Users } from "lucide-react";
import { CollectionPreviewPlaceholder } from "@/components/DamStates";
import { MediaPreview } from "@/components/MediaPreview";
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
  onInspect?: () => void;
  onOpen: () => void;
};

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
  onInspect,
  onOpen
}: CollectionAlbumCardProps) {
  return (
    <button
      type="button"
      className={cn(
        "group grid min-w-0 gap-3 rounded-[1.5rem] border bg-white p-3 text-left shadow-[0_14px_34px_rgba(35,53,111,.045)] transition duration-200 hover:-translate-y-0.5 hover:border-[#8aa99a] hover:bg-[#fbfdfb] active:translate-y-px sm:grid-cols-[15rem_minmax(0,1fr)_auto]",
        isActive ? "border-[#0b4b42] bg-[#f6fbf7] shadow-[inset_4px_0_0_#0b4b42,0_18px_40px_rgba(35,53,111,.07)]" : "border-[#d4ded7]"
      )}
      onClick={onOpen}
      onFocus={onInspect}
      onPointerEnter={onInspect}
      aria-label={`Browse ${name}`}
    >
      <span className="grid max-w-full grid-cols-[1.35fr_1fr] gap-1.5 overflow-hidden" aria-hidden="true">
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
            <CollectionPreviewPlaceholder className="row-span-2 aspect-[4/3]" title="Album cover pending" />
            <CollectionPreviewPlaceholder className="aspect-[4/3]" title="Shelf" />
            <span className="grid aspect-[4/3] min-w-0 place-items-center rounded-[.85rem] border border-dashed border-[#cbd8cf] bg-[#fbfcfa] text-[10px] font-bold leading-tight text-[#718078]">pending</span>
          </>
        )}
      </span>
      <span className="grid min-w-0 content-center gap-1">
        <span className="truncate text-base font-black leading-tight text-tjc-ink">{name}</span>
        <span className="line-clamp-2 text-sm leading-snug text-tjc-muted">{description}</span>
        <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-[#5c675f]">
          <span>{countLabel}</span>
          <span>{approvalSummary}</span>
          <span>{dateRange}</span>
          <span className="hidden md:inline">Source: {ministry}</span>
          <span className="hidden md:inline">Stable ID</span>
        </span>
        {peopleWarning ? (
          <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#725216]">
            <Users size={13} strokeWidth={1.8} aria-hidden="true" />
            {peopleWarning}
          </span>
        ) : null}
      </span>
      <span className="hidden h-9 w-9 place-items-center self-center rounded-md text-tjc-evergreen transition group-hover:translate-x-0.5 group-hover:bg-[#edf5ef] sm:grid">
        <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
      </span>
    </button>
  );
}
