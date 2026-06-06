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
      className="group grid overflow-hidden rounded-2xl border border-[#cfd9cf] bg-white text-left shadow-[0_1px_0_rgba(255,255,255,.9)_inset,0_18px_44px_rgba(49,60,52,.075)] transition duration-200 hover:-translate-y-0.5 hover:border-[#8fb2a5] hover:shadow-[0_26px_64px_rgba(49,60,52,.13)] active:translate-y-px"
      onClick={onOpen}
      onPointerMove={scrubPreview}
      onPointerLeave={() => setActiveIndex(0)}
      aria-label={`Browse ${name}`}
    >
      <span className="grid grid-cols-[7.5rem_1fr] gap-1.5 border-b border-tjc-line bg-[linear-gradient(135deg,#e8f0e9,#f8faf7)] p-2">
        <span className="grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.8)]">
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
            <span className="grid min-h-12 place-items-center overflow-hidden rounded-lg bg-white" key={`${image.src}-${index}`}>
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
