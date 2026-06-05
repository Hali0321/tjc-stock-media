"use client";

import Link from "next/link";
import { Download, Lock, Music, Video, Image as ImageIcon, FileText } from "lucide-react";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import { canDownloadApprovedCopy } from "@/lib/permissions";
import { cardImageUrl, friendlyReviewTrace, friendlySourceLabel, normalizeAssetTitle, shortStatusLabel, usageLabel } from "@/lib/display";

const mediaIcons = {
  photo: ImageIcon,
  video: Video,
  audio: Music,
  graphic: FileText,
  document: FileText
};

export function AssetCard({ asset, role }: { asset: StockMediaAsset; role: DemoRole }) {
  const canDownload = canDownloadApprovedCopy(role, asset);
  const MediaIcon = mediaIcons[asset.mediaType];
  const quickTags = [...(asset.tags || []), ...(asset.tjcTerms || [])].slice(0, 1);
  const displayTitle = normalizeAssetTitle(asset.title, asset.originalFilename, asset);
  const imageUrl = cardImageUrl(asset);
  const traceLabel = asset.reviewedDate
    ? `Reviewed ${asset.reviewedDate}`
    : asset.resourceSpaceId
      ? `RS ${asset.resourceSpaceId}`
      : asset.peopleRisk === "Unknown"
        ? "People unknown"
        : asset.peopleRisk || "Trace pending";
  return (
    <article className={`asset-card asset-card--${asset.status.toLowerCase().replaceAll(" ", "-")}`}>
      <Link href={`/assets/${asset.id}`} className="asset-card__image" aria-label={`Open ${displayTitle}`}>
        {imageUrl ? (
          <img src={imageUrl} alt={asset.thumbnailAlt} loading="eager" decoding="async" />
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
          {shortStatusLabel(asset.status)}
        </span>
      </Link>
      <div className="asset-card__body">
        <h2>{displayTitle}</h2>
        <p>{asset.collection}</p>
        {quickTags.length ? (
          <div className="asset-card__tags" aria-label="Asset tags">
            {quickTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
        <div className="asset-card__hover-meta" aria-label="Source metadata">
          <span>Source: {friendlySourceLabel(asset)}</span>
          <span>{friendlyReviewTrace(asset)}</span>
          <span>{asset.resourceSpaceId ? `ResourceSpace ID ${asset.resourceSpaceId}` : "ResourceSpace export"}</span>
        </div>
        <div className="asset-card__footer">
          <span>{usageLabel(asset.usageScope)} · {quickTags[0] || traceLabel}</span>
          {canDownload ? (
            <span className="download-state download-state--allowed">
              <Download aria-hidden="true" size={14} />
              copy
            </span>
          ) : (
            <span className="download-state">
              <Lock aria-hidden="true" size={14} />
              blocked
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
