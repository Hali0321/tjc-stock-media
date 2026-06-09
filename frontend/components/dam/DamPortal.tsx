"use client";

import { FolderOpen, LayoutGrid, ListFilter, Search, ShieldAlert } from "lucide-react";
import { DamEmptyState as EmptyState, DamPrimaryAction as PrimaryAction } from "@/components/dam/DamWorkspace";
import { collectionImageUrl } from "@/lib/presentation";
import { cn } from "@/lib/ui";
import type { CatalogCollection, DemoRole, StockMediaAsset } from "@/lib/types";

function packageInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "PK";
}

function packageReference(collection: CatalogCollection) {
  return `PK-${packageInitials(collection.name)}-${collection.name.length.toString().padStart(2, "0")}`;
}

export function packageReadinessForRole(collection: CatalogCollection, roleOrOpsView: DemoRole | boolean) {
  const opsView = typeof roleOrOpsView === "boolean" ? roleOrOpsView : roleOrOpsView === "Reviewer" || roleOrOpsView === "DAM Admin";
  const readyMatch = collection.approvalSummary.match(/\d+/);
  const readyCount = readyMatch ? Number(readyMatch[0]) : collection.count;
  const reviewNeeded = Math.max(0, collection.count - readyCount);
  return {
    readyCount,
    reviewNeeded,
    opsView,
    bestUse: collection.searchQuery || `${collection.ministry} media`,
    reference: packageReference(collection)
  };
}

export function PackageCabinetHeader({
  collections,
  readyTotal,
  reviewTotal,
  submittedQuery,
  onClear
}: {
  collections: CatalogCollection[];
  readyTotal: number;
  reviewTotal: number;
  submittedQuery?: string;
  onClear: () => void;
}) {
  return (
    <section className="package-cabinet-header" aria-label="Package cabinet controls">
      <div className="package-cabinet-title">
        <span>Cabinet</span>
        <h2>Ministry kits</h2>
        <p>{collections.length.toLocaleString()} curated packages shown.</p>
      </div>
      <dl className="package-cabinet-metrics" aria-label="Package readiness summary">
        <div>
          <dt>Ready items</dt>
          <dd>{readyTotal.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Need review</dt>
          <dd>{reviewTotal.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Reuse rule</dt>
          <dd>Item-level</dd>
        </div>
      </dl>
      <div className="package-cabinet-actions" aria-label="Package view options">
        <span><LayoutGrid size={14} strokeWidth={1.9} aria-hidden="true" /> Contact sheet</span>
        <span><ListFilter size={14} strokeWidth={1.9} aria-hidden="true" /> Safety first</span>
        {submittedQuery ? (
          <button type="button" onClick={onClear}>Clear search</button>
        ) : null}
      </div>
    </section>
  );
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
      <div className={cn("package-cover package-cover-photo relative grid aspect-[4/3] grid-cols-[1.25fr_.75fr] gap-1.5 overflow-hidden bg-[#e8f1eb] p-1.5", large && "aspect-[16/10]")}>
        <span className="package-cover-label absolute left-3 top-3 z-[2] bg-white/92 px-2.5 py-1 text-[11px] font-black uppercase tracking-[.08em] text-tjc-evergreen shadow-sm">Contact sheet</span>
        <span className="package-cover-count absolute bottom-3 right-3 z-[2] bg-[#0b4b42]/92 px-2.5 py-1 text-[11px] font-black text-white shadow-sm">{readyCount.toLocaleString()} ready / {reviewNeeded.toLocaleString()} review</span>
        <span className="row-span-2 overflow-hidden bg-white">
          <img className="h-full min-h-12 w-full object-cover transition duration-300 group-hover:scale-[1.025]" src={images[0].src} alt={images[0].alt} loading="lazy" />
        </span>
        {images.slice(1, 3).map((image) => (
          <span className="overflow-hidden bg-white" key={image.src}>
            <img className="h-full min-h-12 w-full object-cover transition duration-300 group-hover:scale-[1.025]" src={image.src} alt={image.alt} loading="lazy" />
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className={cn("package-cover generated-package-cover relative grid aspect-[4/3] overflow-hidden p-3 text-tjc-ink", large && "aspect-[16/10]")}>
      <div className="generated-package-spine" aria-hidden="true">
        <span>{packageInitials(collection.name)}</span>
      </div>
      <div className="generated-package-contact-sheet absolute grid grid-cols-3 gap-1.5 opacity-95" aria-hidden="true">
        {Array.from({ length: large ? 12 : 9 }).map((_, index) => (
          <span className={cn(index % 4 === 0 && "is-paper", index % 5 === 0 && "is-ready")} key={index} />
        ))}
      </div>
      <div className="relative z-[1] grid h-full content-between">
        <div className="flex items-start justify-between gap-2">
          <span className="package-cover-code bg-white/90 px-2.5 py-1 text-xs font-black text-tjc-evergreen shadow-sm">{packageReference(collection)}</span>
          <span className="package-cover-kind text-right text-[11px] font-black uppercase tracking-[.08em] text-[#617168]">Contact sheet</span>
        </div>
        <div className="package-cover-caption bg-white/92 p-2 text-tjc-ink shadow-sm">
          <strong className="line-clamp-2 text-lg font-black leading-tight">{collection.name}</strong>
          <span className="mt-1 block text-xs font-black text-[#52625a]">{readyCount.toLocaleString()} ready / {reviewNeeded.toLocaleString()} review</span>
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
  const { readyCount, reviewNeeded, bestUse, reference } = packageReadinessForRole(collection, role);
  return (
    <article
      className={cn("package-card collectible-package-card collection-row-card package-cabinet-row group overflow-hidden", active && "is-active")}
      onPointerEnter={onInspect}
    >
      <div className="package-row-index" aria-hidden="true">
        <span>{reference}</span>
        <small>{reviewNeeded ? "Review" : "Ready"}</small>
      </div>
      <PackageCover collection={collection} readyCount={readyCount} reviewNeeded={reviewNeeded} />
      <div className="package-row-main">
        <div className="package-row-copy">
          <div className="package-row-eyebrow">
            <span>{collection.ministry}</span>
            <span>Package</span>
          </div>
          <h2>{collection.name}</h2>
          <p>{collection.description}</p>
        </div>
        <div className="package-row-stats">
          <span><strong>{readyCount.toLocaleString()}</strong><small>ready</small></span>
          <span><strong>{reviewNeeded.toLocaleString()}</strong><small>review</small></span>
          <span><strong>{collection.countLabel}</strong><small>items</small></span>
        </div>
        <div className="package-row-ledger">
          <div>
            <span>Best use:</span>
            <strong>{bestUse}</strong>
          </div>
          <div>
            <span>Safety:</span>
            <strong>Item-level approval required before reuse.</strong>
          </div>
        </div>
        {collection.peopleWarning ? (
          <p className="package-row-warning">{collection.peopleWarning}</p>
        ) : null}
        <div className="package-row-actions">
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
  const { readyCount, reviewNeeded, bestUse, reference } = packageReadinessForRole(collection, Boolean(opsView));
  return (
    <aside className="package-inspector package-cabinet-inspector">
      <div className="package-inspector-title">
        <span>{opsView ? "Package readiness" : "Package detail panel"}</span>
        <h2>{collection.name}</h2>
        <p>{collection.description}</p>
      </div>
      <PackageCover collection={collection} readyCount={readyCount} reviewNeeded={reviewNeeded} large />
      <nav className="package-inspector-tabs" aria-label="Package detail sections">
        <span className="is-active">Overview</span>
        <span>Items</span>
        <span>Safety</span>
      </nav>
      <dl className="package-inspector-record">
        <div><dt>Reference code</dt><dd>{reference}</dd></div>
        <div><dt>Suggested use</dt><dd>{bestUse}</dd></div>
        <div><dt>Package count</dt><dd>{collection.countLabel}</dd></div>
        <div><dt>Cabinet size</dt><dd>{totalCollections.toLocaleString()} packages</dd></div>
      </dl>
      <div className="package-inspector-metrics">
        <span><strong>{readyCount}</strong><small>ready</small></span>
        <span><strong>{reviewNeeded}</strong><small>review</small></span>
        <span><strong>{collection.dateRange}</strong><small>date range</small></span>
      </div>
      <section className="package-safety-notice">
        <ShieldAlert size={18} strokeWidth={1.9} aria-hidden="true" />
        <span>Package approval is not enough. Open each media record to confirm item-level approval before reuse.</span>
      </section>
      {collection.peopleWarning ? (
        <section className="package-people-warning">
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
