"use client";

import Link from "next/link";
import { Download, FileText, Image as ImageIcon, Lock, Music, Video } from "lucide-react";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import { decideAccess } from "@/lib/access-decisions";
import { assetPresentation, provenanceSummary } from "@/lib/presentation";
import { cn } from "@/lib/ui";

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
  const source = provenanceSummary(asset, role);
  const canSeeOriginal = decideAccess(role, "viewOriginalMetadata", asset).allowed;
  const downloadHref = `/api/download/${asset.id}?role=${encodeURIComponent(role)}`;
  const confidence = display.confidence.filter((item) => item.tone === "warn").slice(0, 1);
  const hasWarnings = confidence.length > 0;
  const quickLabel = display.download.reuse.label || confidence[0]?.state || display.quickLabel || asset.mediaType;

  return (
    <article className="group overflow-hidden rounded-lg border border-tjc-line bg-white shadow-[0_1px_0_rgba(32,34,31,.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[#b7ccc2] hover:shadow-[0_12px_30px_rgba(32,34,31,.09)]">
      <Link href={`/assets/${asset.id}`} className="grid aspect-[4/3] place-items-center overflow-hidden bg-[#e9eee8] p-2" aria-label={`Open ${display.title}`}>
        {display.image ? (
          <img className="h-auto max-h-full w-auto max-w-full rounded-md object-contain shadow-[0_5px_14px_rgba(32,34,31,.14)] transition duration-500 ease-out group-hover:scale-[1.025]" src={display.image} alt={asset.thumbnailAlt} loading="lazy" decoding="async" />
        ) : (
          <div className="grid aspect-[4/3] min-h-20 place-items-center text-tjc-muted">
            <MediaIcon aria-hidden="true" size={28} strokeWidth={1.8} />
          </div>
        )}
      </Link>
      <div className="grid gap-2 p-3">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
	              <span className={cn(
	                "shrink-0 rounded-md border px-1.5 py-1 text-[11px] font-semibold leading-none",
	                canDownload && !hasWarnings ? "border-[#b8d9c6] bg-[#edf8f1] text-[#22563a]" : "border-[#ead6a8] bg-[#fff7e5] text-[#725216]"
	              )}>
                {display.shortStatus}
              </span>
              <span className="truncate text-[11px] font-medium capitalize text-tjc-muted">{asset.mediaType}</span>
            </div>
            <h2 className="mt-2 line-clamp-2 text-sm font-semibold leading-tight text-tjc-ink">{display.title}</h2>
          </div>
	          {canDownload ? (
	            <a className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-md border transition active:translate-y-px", hasWarnings ? "border-[#ead6a8] bg-[#fff7e5] text-[#725216] hover:bg-[#fff2d5]" : "border-[#b8d9c6] bg-[#edf8f1] text-[#24583d] hover:bg-[#e2f3e9]")} href={downloadHref} aria-label={`Download approved copy${hasWarnings ? " with review warnings" : ""} of ${display.title}`}>
	              <Download aria-hidden="true" size={15} strokeWidth={1.8} />
	            </a>
          ) : (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-[#ead6a8] bg-[#fff7e5] text-[#725216]" title={display.download.approvedCopy.reason || "Download blocked"}>
              <Lock aria-hidden="true" size={15} strokeWidth={1.8} />
            </span>
          )}
        </div>
        <div className="grid gap-1 text-xs leading-snug text-[#566159]">
          <span className="truncate">{display.cardSubtitle}</span>
              <span className="truncate">{display.usage} / {quickLabel}</span>
              {display.download.reuse.blockers.length ? <span className="truncate">{display.download.reuse.blockers[0]?.label}</span> : null}
        </div>
        <div className="max-h-0 overflow-hidden text-xs leading-snug text-tjc-muted opacity-0 transition-all duration-300 group-hover:max-h-28 group-hover:opacity-100 group-focus-within:max-h-28 group-focus-within:opacity-100" aria-label="Source metadata">
          <span className="block">Source: {source.publicLabel}</span>
          <span className="block">{display.reviewFacts.reviewLine}</span>
          <span className="block">{asset.resourceSpaceId ? `ResourceSpace ID ${asset.resourceSpaceId}` : "ResourceSpace export"}</span>
          {canSeeOriginal && asset.originalFilename ? <span className="block">Original: {asset.originalFilename}</span> : null}
        </div>
      </div>
    </article>
  );
}
