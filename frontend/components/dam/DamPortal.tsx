"use client";

import { FolderOpen, Search, ShieldAlert } from "lucide-react";
import { DamEmptyState as EmptyState, DamPrimaryAction as PrimaryAction } from "@/components/dam/DamWorkspace";
import { collectionImageUrl } from "@/lib/presentation";
import { cn } from "@/lib/ui";
import type { CatalogCollection, DemoRole, StockMediaAsset } from "@/lib/types";

function packageCoverTone(name: string) {
  const tones = [
    "from-[#0f3d2e] via-[#d8e8df] to-[#fbfaf6]",
    "from-[#263d54] via-[#e6edf3] to-[#f8fafc]",
    "from-[#57451f] via-[#f2e7c9] to-[#fffaf0]",
    "from-[#34413c] via-[#e2ece7] to-[#fbfcfb]",
    "from-[#1e4d43] via-[#dcebe3] to-[#fbfcfb]"
  ];
  const code = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return tones[code % tones.length];
}

function packageInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "PK";
}

function PackageCover({
  collection,
  readyCount,
  reviewNeeded,
  large = false
}: {
  collection: CatalogCollection;
  readyCount: number;
  reviewNeeded: number;
  large?: boolean;
}) {
  const images = collection.images.slice(0, 4);
  if (images.length) {
    return (
      <div className={cn("package-cover grid aspect-[4/3] grid-cols-[1.25fr_.75fr] gap-1.5 overflow-hidden rounded-2xl bg-[#e8f1eb] p-1.5", large && "aspect-[16/10]")}>
        <span className="row-span-2 overflow-hidden rounded-xl bg-white">
          <img className="h-full min-h-12 w-full object-cover transition duration-300 group-hover:scale-[1.025]" src={images[0].src} alt={images[0].alt} loading="lazy" />
        </span>
        {images.slice(1, 3).map((image) => (
          <span className="overflow-hidden rounded-xl bg-white" key={image.src}>
            <img className="h-full min-h-12 w-full object-cover transition duration-300 group-hover:scale-[1.025]" src={image.src} alt={image.alt} loading="lazy" />
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className={cn("package-cover generated-package-cover relative grid aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white", packageCoverTone(collection.name), large && "aspect-[16/10]")}>
      <div className="absolute inset-0 opacity-[.22]" aria-hidden="true">
        <div className="h-full w-full bg-[linear-gradient(90deg,rgba(255,255,255,.82)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.82)_1px,transparent_1px)] bg-[size:26px_26px]" />
      </div>
      <div className="relative z-[1] grid h-full content-between">
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-xl bg-white/90 px-2.5 py-1 text-xs font-black text-tjc-evergreen shadow-sm">{packageInitials(collection.name)}</span>
          <span className="text-right text-[11px] font-black uppercase tracking-[.08em] text-white/85">Ministry kit</span>
        </div>
        <div>
          <strong className="line-clamp-2 text-lg font-black leading-tight text-white drop-shadow-sm">{collection.name}</strong>
          <span className="mt-2 block text-xs font-black text-white/90">{readyCount.toLocaleString()} ready / {reviewNeeded.toLocaleString()} review</span>
        </div>
      </div>
    </div>
  );
}

export function PackageCard({
  collection,
  role,
  active,
  onOpen,
  onInspect
}: {
  collection: CatalogCollection;
  role: DemoRole;
  active?: boolean;
  onOpen: () => void;
  onInspect: () => void;
}) {
  const readyMatch = collection.approvalSummary.match(/\d+/);
  const rawReadyCount = readyMatch ? Number(readyMatch[0]) : collection.count;
  const readyCount = role === "Reviewer" || role === "DAM Admin" ? rawReadyCount : 0;
  const reviewNeeded = Math.max(0, collection.count - readyCount);
  const bestUse = collection.searchQuery || `${collection.ministry} media`;
  return (
    <article
      className={cn("package-card group grid gap-4 overflow-hidden rounded-2xl border bg-white p-4 transition", active && "ring-2 ring-[#0b4b42]")}
      onPointerEnter={onInspect}
    >
      <PackageCover collection={collection} readyCount={readyCount} reviewNeeded={reviewNeeded} />
      <div className="grid gap-3">
        <div className="min-w-0">
          <span className="text-xs font-black text-tjc-evergreen">{collection.ministry}</span>
          <h2 className="mt-1 line-clamp-2 text-2xl font-black leading-tight text-tjc-ink">{collection.name}</h2>
          <p className="mt-2 line-clamp-2 text-sm font-semibold leading-relaxed text-tjc-muted">{collection.description}</p>
        </div>
        <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-[#d6dfd8] bg-[#f7faf8] text-sm">
          <span className="px-3 py-2 font-black text-[#194f34]">{readyCount.toLocaleString()}<small className="mt-0.5 block font-semibold text-tjc-muted">ready</small></span>
          <span className="border-x border-[#d6dfd8] px-3 py-2 font-black text-[#71500f]">{reviewNeeded.toLocaleString()}<small className="mt-0.5 block font-semibold text-tjc-muted">review</small></span>
          <span className="min-w-0 px-3 py-2 font-black text-[#27435b]"><span className="block truncate">{collection.countLabel}</span><small className="mt-0.5 block font-semibold text-tjc-muted">items</small></span>
        </div>
        <div className="grid gap-2 rounded-xl bg-[#f7faf8] p-3 text-sm leading-relaxed">
          <p className="font-semibold text-tjc-muted"><strong className="font-black text-tjc-ink">Best use:</strong> {bestUse}</p>
          <p className="font-semibold text-[#71500f]"><strong className="font-black">Safety:</strong> item-level approval required before reuse.</p>
        </div>
        {collection.peopleWarning ? (
          <p className="rounded-xl border border-[#ead6a8] bg-[#fff8e8] p-3 text-xs font-black leading-relaxed text-[#71500f]">{collection.peopleWarning}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <PrimaryAction onClick={onOpen} icon={Search}>Open media</PrimaryAction>
          <PrimaryAction onClick={onInspect} tone="secondary" icon={FolderOpen}>View details</PrimaryAction>
        </div>
      </div>
    </article>
  );
}

export function PackageInspector({
  collection,
  totalCollections,
  onOpen,
  opsView
}: {
  collection?: CatalogCollection;
  totalCollections: number;
  onOpen: (collection: CatalogCollection) => void;
  opsView?: boolean;
}) {
  if (!collection) {
    return (
      <EmptyState
        title="Select a package"
        description="Choose a ministry package to see purpose, safety summary, and item-level reuse reminder."
      />
    );
  }
  const readyMatch = collection.approvalSummary.match(/\d+/);
  const rawReadyCount = readyMatch ? Number(readyMatch[0]) : collection.count;
  const readyCount = opsView ? rawReadyCount : 0;
  const reviewNeeded = Math.max(0, collection.count - readyCount);
  const bestUse = collection.searchQuery || `${collection.ministry} media`;
  return (
    <aside className="package-inspector grid gap-4 rounded-2xl border border-[#d6dfd8] bg-white p-4 sm:p-5">
      <div>
        <span className="text-sm font-black text-tjc-evergreen">{opsView ? "Package readiness" : "Package detail panel"}</span>
        <h2 className="mt-1 text-3xl font-black leading-tight text-tjc-ink">{collection.name}</h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-tjc-muted">{collection.description}</p>
      </div>
      <PackageCover collection={collection} readyCount={readyCount} reviewNeeded={reviewNeeded} large />
      <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-[#d6dfd8] bg-[#f8fbf8] py-1 text-sm">
        <span className="px-3 py-2 font-black text-[#194f34]">{readyCount}<br /><small className="font-semibold text-tjc-muted">ready</small></span>
        <span className="border-x border-[#d6dfd8] px-3 py-2 font-black text-[#71500f]">{reviewNeeded}<br /><small className="font-semibold text-tjc-muted">review</small></span>
        <span className="px-3 py-2 font-black text-[#27435b]">{totalCollections}<br /><small className="font-semibold text-tjc-muted">packages</small></span>
      </div>
      <section className="grid gap-2">
        <h3 className="text-sm font-black text-tjc-ink">Suggested use</h3>
        <p className="text-sm font-semibold leading-relaxed text-tjc-muted">{bestUse}</p>
      </section>
      <section className="grid grid-cols-[auto_1fr] gap-3 rounded-xl border border-[#e5cf93] bg-[#fff8e8] p-3 text-sm font-semibold leading-relaxed text-[#71500f]">
        <ShieldAlert size={18} strokeWidth={1.9} aria-hidden="true" />
        <span>Package approval is not enough. Open each media record to confirm item-level approval before reuse.</span>
      </section>
      {collection.peopleWarning ? (
        <section className="rounded-xl border border-[#dfb9b5] bg-[#fff1ef] p-3 text-sm font-semibold leading-relaxed text-[#7b332f]">
          {collection.peopleWarning}
        </section>
      ) : null}
      <PrimaryAction onClick={() => onOpen(collection)} icon={Search}>Open media</PrimaryAction>
    </aside>
  );
}

export function packageCoverImages(collection: CatalogCollection, role: DemoRole, assets: StockMediaAsset[] = []) {
  if (collection.images.length) return collection.images;
  return assets.slice(0, 4).map((asset) => ({
    src: collectionImageUrl(asset, role) || "",
    alt: asset.thumbnailAlt
  })).filter((image) => image.src);
}

export { PackageCard as DamPackageCard, PackageInspector as DamPackageInspector };
export { CollectionAlbumCard as DamCollectionAlbumCard } from "@/components/CollectionAlbumCard";
export { CollectionShelfInspector as DamCollectionShelfInspector } from "@/components/CollectionShelfInspector";
