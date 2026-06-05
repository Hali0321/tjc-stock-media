"use client";

import { PointerEvent, useState } from "react";

type CollectionAlbumCardProps = {
  name: string;
  description: string;
  countLabel: string;
  latestLabel: string;
  scope: string;
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
  latestLabel,
  scope,
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
      className="collection-album"
      onClick={onOpen}
      onPointerMove={scrubPreview}
      onPointerLeave={() => setActiveIndex(0)}
      aria-label={`Browse ${name}`}
    >
      <span className="collection-album__media">
        {activeImage ? (
          <img src={activeImage.src} alt="" aria-hidden="true" loading="lazy" />
        ) : (
          <span className="collection-album__empty" aria-hidden="true" />
        )}
        {images.length > 1 ? (
          <span className="collection-album__strip" aria-hidden="true">
            {images.slice(0, 5).map((image, index) => (
              <img key={`${image.src}-${index}`} src={image.src} alt="" loading="lazy" />
            ))}
          </span>
        ) : null}
      </span>
      <span className="collection-album__content">
        <span className="collection-album__title">{name}</span>
        <span className="collection-album__description">{description}</span>
        <span className="collection-album__meta">{countLabel} · {latestLabel}</span>
        <span className="collection-album__scope">{scope}</span>
      </span>
      {images.length > 1 ? (
        <span className="collection-album__dots" aria-hidden="true">
          {images.slice(0, 5).map((image, index) => (
            <span key={`${image.src}-dot-${index}`} className={index === activeIndex ? "is-active" : ""} />
          ))}
        </span>
      ) : null}
    </button>
  );
}
