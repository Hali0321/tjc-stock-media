"use client";

import Link from "next/link";
import { Download, Lock } from "lucide-react";
import { MediaPreview } from "@/components/MediaPreview";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import { decideAccess } from "@/lib/access-decisions";
import { assetPresentation, provenanceSummary } from "@/lib/presentation";
import { cn } from "@/lib/ui";

export function AssetCard({ asset, role }: { asset: StockMediaAsset; role: DemoRole }) {
  const display = assetPresentation(asset, role);
  const canDownload = display.download.approvedCopy.allowed;
  const source = provenanceSummary(asset, role);
  const canSeeOriginal = decideAccess(role, "viewOriginalMetadata", asset).allowed;
  const downloadHref = `/api/download/${asset.id}?role=${encodeURIComponent(role)}`;
  const confidence = display.confidence.filter((item) => item.tone === "warn").slice(0, 1);
  const hasWarnings = confidence.length > 0;
  const quickLabel = display.download.reuse.label || confidence[0]?.state || display.quickLabel || asset.mediaType;

  return (
    <article className="group overflow-hidden rounded-md border border-tjc-line bg-white transition duration-150 hover:border-[#9fb8ae]">
      <Link href={`/assets/${asset.id}`} className="relative block aspect-[4/3] overflow-hidden bg-[#eef1ed]" aria-label={`Open ${display.title}`}>
        <MediaPreview src={display.image} alt={asset.thumbnailAlt} imgClassName="transition duration-300 ease-out group-hover:scale-[1.02]" />
        <span className={cn(
          "absolute left-2 top-2 max-w-[calc(100%-1rem)] rounded bg-white/92 px-2 py-1 text-[11px] font-semibold leading-none shadow-[0_1px_0_rgba(32,34,31,.08)]",
          canDownload && !hasWarnings ? "text-[#22563a]" : "text-[#725216]"
        )}>
          {display.shortStatus}
        </span>
      </Link>
      <div className="grid gap-2 p-2.5">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-[13px] font-semibold leading-tight text-tjc-ink">{display.title}</h2>
            <span className="mt-1 block truncate text-[11px] font-medium text-tjc-muted">{display.cardSubtitle}</span>
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
        <div className="grid gap-1 text-[11px] leading-snug text-[#566159]">
          <span className="truncate">{display.usage} / {asset.mediaType}</span>
          <span className="truncate font-semibold text-[#4b5b51]">{display.download.reuse.blockers[0]?.label || quickLabel}</span>
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
