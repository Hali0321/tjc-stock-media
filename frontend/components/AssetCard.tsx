"use client";

import Link from "next/link";
import { Download, Lock, Music, Video, Image as ImageIcon, FileText } from "lucide-react";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import { decideAccess } from "@/lib/access-decisions";
import { assetPresentation, provenanceSummary } from "@/lib/presentation";

const mediaIcons = {
  photo: ImageIcon,
  video: Video,
  audio: Music,
  graphic: FileText,
  document: FileText
};

export function AssetCard({ asset, role }: { asset: StockMediaAsset; role: DemoRole }) {
  const display = assetPresentation(asset, role);
  const canDownload = display.download.approvedCopy.allowed;
  const MediaIcon = mediaIcons[asset.mediaType];
  const quickTags = [...(asset.usageTerms || []), ...(asset.tjcTerms || []), ...(asset.tags || [])].slice(0, 1);
  const source = provenanceSummary(asset, role);
  const canSeeOriginal = decideAccess(role, "viewOriginalMetadata", asset).allowed;
  const traceLabel = asset.reviewedDate ? `Reviewed ${asset.reviewedDate}` : asset.peopleRisk === "Unknown" ? "People unknown" : asset.peopleRisk || "Trace pending";
  return (
    <article className={`asset-card asset-card--${asset.status.toLowerCase().replaceAll(" ", "-")}`}>
      <Link href={`/assets/${asset.id}`} className="asset-card__image" aria-label={`Open ${display.title}`}>
        {display.image ? (
          <img src={display.image} alt={asset.thumbnailAlt} loading="eager" decoding="async" />
        ) : (
          <div className="asset-card__placeholder">
            <MediaIcon aria-hidden="true" size={28} />
          </div>
        )}
        <span className="asset-card__type">
          <MediaIcon aria-hidden="true" size={14} />
          {asset.mediaType}
        </span>
        <span className={`asset-card__status asset-card__status--${asset.status.toLowerCase().replaceAll(" ", "-")}`}>
          {display.shortStatus}
        </span>
      </Link>
      <div className="asset-card__body">
        <h2>{display.title}</h2>
        <p>{display.cardSubtitle}</p>
        {quickTags.length ? (
          <div className="asset-card__tags" aria-label="Asset tags">
            {quickTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
        <div className="asset-card__hover-meta" aria-label="Source metadata">
          <span>Source: {source.publicLabel}</span>
          <span>{display.reviewFacts.reviewLine}</span>
          <span>{asset.resourceSpaceId ? `ResourceSpace ID ${asset.resourceSpaceId}` : "ResourceSpace export"}</span>
          {canSeeOriginal && asset.originalFilename ? <span>Original: {asset.originalFilename}</span> : null}
        </div>
        <div className="asset-card__footer">
          <span>{display.usage} · {quickTags[0] || traceLabel}</span>
          {canDownload ? (
            <span className="download-state download-state--allowed">
              <Download aria-hidden="true" size={14} />
              {display.download.cardLabel}
            </span>
          ) : (
            <span className="download-state">
              <Lock aria-hidden="true" size={14} />
              {display.download.cardLabel}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
