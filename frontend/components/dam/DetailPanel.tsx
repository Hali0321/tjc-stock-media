"use client";

import Link from "next/link";
import { FileLock2 } from "lucide-react";
import { MediaPreview } from "@/components/MediaPreview";
import { assetPresentation, collectionImageUrl } from "@/lib/presentation";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import type { ReactNode } from "react";

export function DamDetailPanel({
  preview,
  decision
}: {
  preview: ReactNode;
  decision: ReactNode;
}) {
  return (
    <section className="dam-detail-panel-v2" aria-label="Media record decision">
      <div className="dam-detail-preview-column">{preview}</div>
      <aside className="dam-detail-decision-column">{decision}</aside>
    </section>
  );
}

export function DamPreviewWorkbench({
  title,
  subtitle,
  status,
  facts,
  children
}: {
  title: string;
  subtitle: string;
  status: string;
  facts: Array<{ label: string; value?: ReactNode }>;
  children: ReactNode;
}) {
  return (
    <section className="dam-preview-workbench" aria-label="Protected media preview">
      <div className="dam-preview-toolbar">
        <div className="min-w-0">
          <span>{status}</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="dam-preview-canvas">{children}</div>
      <dl className="dam-preview-fact-strip">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value || "Not provided"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function DamMetadataGrid({
  title,
  items
}: {
  title: string;
  items: Array<{ label: string; value?: ReactNode }>;
}) {
  return (
    <section className="dam-metadata-grid-v2" aria-label={title}>
      <h2>{title}</h2>
      <dl>
        {items.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value || "Not provided"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function DamRelatedMediaStrip({
  assets,
  role
}: {
  assets: StockMediaAsset[];
  role: DemoRole;
}) {
  if (!assets.length) return null;
  return (
    <section className="dam-related-strip-v2" aria-label="Related media">
      <div className="dam-related-strip-heading">
        <h2>Related media</h2>
        <span>Item approval stays separate</span>
      </div>
      <div className="dam-related-strip-list">
        {assets.slice(0, 4).map((asset) => {
          const display = assetPresentation(asset, role);
          return (
            <Link href={`/assets/${asset.id}`} className="dam-related-card-v2" key={asset.id}>
              <span className="dam-related-thumb">
                <MediaPreview src={collectionImageUrl(asset, role)} alt={asset.thumbnailAlt} label="Preview protected" detail="Open record for guidance" />
              </span>
              <span>
                <strong>{display.title}</strong>
                <small>{display.cardSubtitle}</small>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function DamSourceRestrictionCard({ detail }: { detail: string }) {
  return (
    <section className="dam-source-restriction-card" aria-label="Source file restriction">
      <FileLock2 size={18} strokeWidth={1.9} aria-hidden="true" />
      <p>{detail}</p>
    </section>
  );
}
