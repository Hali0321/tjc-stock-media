"use client";

import { PointerEvent, useState } from "react";
import { ArrowRight, Users } from "lucide-react";

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
      className="group grid overflow-hidden rounded-lg border border-tjc-line bg-white text-left shadow-[0_1px_0_rgba(32,34,31,.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[#b7ccc2] active:translate-y-px"
      onClick={onOpen}
      onPointerMove={scrubPreview}
      onPointerLeave={() => setActiveIndex(0)}
      aria-label={`Browse ${name}`}
    >
      <span className="grid grid-cols-[6rem_1fr] gap-2 border-b border-tjc-line bg-[#e9eee8] p-2">
        <span className="grid aspect-[4/3] place-items-center rounded-md bg-white/74 p-1">
          {activeImage ? (
            <img className="h-auto max-h-full w-auto max-w-full rounded object-contain transition duration-500 ease-out group-hover:scale-[1.025]" src={activeImage.src} alt="" aria-hidden="true" loading="lazy" />
          ) : (
            <span className="skeleton block h-full w-full rounded-md" aria-hidden="true" />
          )}
        </span>
        <span className="grid min-w-0 grid-cols-4 gap-1" aria-hidden="true">
          {(images.length ? images.slice(0, 4) : []).map((image, index) => (
            <span className="grid min-h-12 place-items-center rounded bg-white/72 p-0.5" key={`${image.src}-${index}`}>
              <img className="h-auto max-h-12 w-auto max-w-full rounded-[.2rem] object-contain" src={image.src} alt="" loading="lazy" />
            </span>
          ))}
        </span>
      </span>
      <span className="grid gap-2 p-3">
        <span className="flex min-w-0 items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="block truncate text-base font-semibold leading-tight text-tjc-ink">{name}</span>
            <span className="mt-1 block text-xs leading-snug text-tjc-muted">{description}</span>
          </span>
          <ArrowRight className="shrink-0 text-tjc-evergreen transition group-hover:translate-x-1" size={16} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="grid gap-1 text-xs text-[#5c675f]">
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
