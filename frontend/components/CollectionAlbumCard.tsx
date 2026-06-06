"use client";

import { PointerEvent, useState } from "react";
import { ArrowRight, FolderOpen, Users } from "lucide-react";
import { MediaPreview } from "@/components/MediaPreview";

type CollectionAlbumCardProps = {
  name: string;
  description: string;
  countLabel: string;
  dateRange: string;
  ministry: string;
  approvalSummary: string;
  peopleWarning?: string;
  images: { src: string; alt: string }[];
  onOpen: () => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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
  onOpen
}: CollectionAlbumCardProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] || images[0];

  function scrubPreview(event: PointerEvent<HTMLButtonElement>) {
    if (images.length <= 1) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 0.999);
    setActiveIndex(Math.floor(ratio * images.length));
  }

  return (
    <button
      type="button"
      className="group grid overflow-hidden rounded-[1.1rem] border border-[#becbc2] bg-white text-left shadow-[0_1px_0_rgba(255,255,255,.9)_inset,0_20px_54px_rgba(25,34,29,.09)] transition duration-200 hover:-translate-y-0.5 hover:border-[#7fa996] hover:shadow-[0_28px_72px_rgba(25,34,29,.15)] active:translate-y-px"
      onClick={onOpen}
      onPointerMove={scrubPreview}
      onPointerLeave={() => setActiveIndex(0)}
      aria-label={`Browse ${name}`}
    >
      <span className="grid grid-cols-[8.5rem_1fr] gap-1.5 border-b border-[#cdd8d0] bg-[#111a17] p-2">
        <span className="grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-[#19231f] shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]">
          {activeImage ? (
            <MediaPreview src={activeImage.src} alt="" imgClassName="transition duration-300 ease-out group-hover:scale-[1.025]" />
          ) : (
            <span className="grid h-full w-full place-items-center rounded-xl bg-[#f6f8f5] text-center text-[11px] font-semibold leading-tight text-tjc-muted" aria-hidden="true">
              <FolderOpen size={18} strokeWidth={1.8} />
              No previews
            </span>
          )}
        </span>
        <span className="grid min-w-0 grid-cols-4 gap-1" aria-hidden="true">
          {(images.length ? images.slice(0, 4) : []).map((image, index) => (
            <span className="grid min-h-12 place-items-center overflow-hidden rounded-lg bg-[#19231f] ring-1 ring-white/10" key={`${image.src}-${index}`}>
              <MediaPreview src={image.src} alt="" />
            </span>
          ))}
        </span>
      </span>
      <span className="grid gap-2 bg-[linear-gradient(180deg,#fff,#fbfcfa)] p-3">
        <span className="flex min-w-0 items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold leading-tight text-tjc-ink">{name}</span>
            <span className="mt-1 block text-xs leading-snug text-tjc-muted">{description}</span>
          </span>
          <ArrowRight className="shrink-0 text-tjc-evergreen transition group-hover:translate-x-1" size={16} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="grid gap-1 text-[11px] text-[#5c675f]">
          <span>{countLabel} / {dateRange}</span>
          <span>{ministry}</span>
          <strong className="font-semibold text-tjc-evergreen">{approvalSummary}</strong>
        </span>
        {peopleWarning ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#725216]">
            <Users size={13} strokeWidth={1.8} aria-hidden="true" />
            {peopleWarning}
          </span>
        ) : null}
      </span>
    </button>
  );
}
