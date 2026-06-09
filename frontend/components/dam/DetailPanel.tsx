"use client";

import Link from "next/link";
import { ArrowRight, FileLock2 } from "lucide-react";
import { MediaPreview } from "@/components/MediaPreview";
import { assetPresentation, collectionImageUrl } from "@/lib/presentation";
import { viewerVerdictForAsset } from "@/lib/viewer-verdict";
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
  const visible = assets.slice(0, 5);
  return (
    <section className="dam-related-strip-v2" aria-label="Related media">
      <div className="dam-related-strip-heading">
        <div>
          <h2>Related records</h2>
          <p>Open each record before reuse; package context does not approve the item.</p>
        </div>
        <span>{assets.length.toLocaleString()} in package</span>
      </div>
      <div className="dam-related-record-list">
        {visible.map((asset) => {
          const display = assetPresentation(asset, role);
          const verdict = viewerVerdictForAsset(asset, role);
          return (
            <Link href={`/assets/${asset.id}`} className="dam-related-record-row" key={asset.id}>
              <span className="dam-related-record-thumb">
                <MediaPreview src={collectionImageUrl(asset, role)} alt={asset.thumbnailAlt} label="Preview protected" detail="Open record for guidance" />
              </span>
              <span className="dam-related-record-main">
                <strong>{display.title}</strong>
                <small>{display.cardSubtitle}</small>
              </span>
              <span className={`dam-related-record-verdict is-${verdict.tone}`}>
                {verdict.label}
              </span>
              <span className="dam-related-record-action">
                Open record
                <ArrowRight size={14} strokeWidth={1.9} aria-hidden="true" />
              </span>
            </Link>
          );
        })}
        {assets.length > visible.length ? (
          <span className="dam-related-record-more">{(assets.length - visible.length).toLocaleString()} more related records available from the package.</span>
        ) : null}
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
