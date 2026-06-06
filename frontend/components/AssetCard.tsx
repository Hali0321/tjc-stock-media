"use client";

import Link from "next/link";
import { Download, Lock, ShieldAlert } from "lucide-react";
import { MediaPreview } from "@/components/MediaPreview";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import { assetPresentation, provenanceSummary } from "@/lib/presentation";
import { cn } from "@/lib/ui";

export function AssetCard({ asset, role }: { asset: StockMediaAsset; role: DemoRole }) {
  const display = assetPresentation(asset, role);
  const canDownload = display.download.approvedCopy.allowed;
  const source = provenanceSummary(asset, role);
  const downloadHref = `/api/download/${asset.id}?role=${encodeURIComponent(role)}`;
  const confidence = display.confidence.filter((item) => item.tone === "warn").slice(0, 1);
  const hasWarnings = confidence.length > 0;
  const quickLabel = display.download.reuse.label || confidence[0]?.state || display.quickLabel || asset.mediaType;
  const previewLabel = display.image ? "Preview pending" : "Preview restricted";
  const previewDetail = display.image
    ? undefined
    : display.download.reuse.blockers[0]?.label || display.download.approvedCopy.reason || "Reviewer-only until reuse checks pass.";

  return (
    <article className="group overflow-hidden rounded-[14px] border border-[#cfd9cf] bg-white shadow-[0_1px_0_rgba(255,255,255,.9)_inset,0_14px_34px_rgba(49,60,52,.055)] transition duration-200 hover:-translate-y-0.5 hover:border-[#8fb2a5] hover:shadow-[0_22px_54px_rgba(49,60,52,.12)]">
      <Link href={`/assets/${asset.id}`} className="relative block aspect-[4/3] overflow-hidden bg-[#e8eee8]" aria-label={`Open ${display.title}`}>
        <span className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(135deg,rgba(18,63,58,.055),transparent_42%,rgba(138,100,38,.055))]" aria-hidden="true" />
        <MediaPreview
          src={display.image}
          alt={asset.thumbnailAlt}
          label={previewLabel}
          detail={previewDetail}
          imgClassName="transition duration-300 ease-out group-hover:scale-[1.02]"
        />
        <span className={cn(
          "absolute left-2 top-2 z-[2] max-w-[calc(100%-1rem)] rounded-md border border-white/80 bg-white/94 px-2 py-1 text-[10px] font-bold uppercase leading-none shadow-[0_8px_18px_rgba(32,34,31,.12)] backdrop-blur",
          canDownload && !hasWarnings ? "text-[#22563a]" : "text-[#725216]"
        )}>
          {display.shortStatus}
        </span>
        {!canDownload ? (
          <span className="absolute bottom-2 left-2 z-[2] inline-flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-md border border-[#ead6a8] bg-[#fff8e8]/95 px-2 py-1 text-[10px] font-bold uppercase tracking-[.04em] text-[#725216] shadow-[0_8px_18px_rgba(32,34,31,.12)] backdrop-blur">
            <ShieldAlert size={12} strokeWidth={1.9} aria-hidden="true" />
            gated preview
          </span>
        ) : null}
      </Link>
      <div className="grid gap-2.5 border-t border-[#e2e8df] bg-[linear-gradient(180deg,#fff,#fbfcfa)] p-3">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-[13px] font-extrabold leading-tight text-tjc-ink">{display.title}</h2>
            <span className="mt-1 block truncate text-[11px] font-medium text-tjc-muted">{display.cardSubtitle}</span>
          </div>
	          {canDownload ? (
	            <a className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition active:translate-y-px", hasWarnings ? "border-[#ead6a8] bg-[#fff7e5] text-[#725216] hover:bg-[#fff2d5]" : "border-[#a8d3bb] bg-[#ecf8f1] text-[#24583d] hover:bg-[#e2f3e9]")} href={downloadHref} aria-label={`Download approved copy${hasWarnings ? " with review warnings" : ""} of ${display.title}`}>
	              <Download aria-hidden="true" size={15} strokeWidth={1.8} />
	            </a>
          ) : (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#ead6a8] bg-[#fff7e5] text-[#725216]" title={display.download.approvedCopy.reason || "Download blocked"}>
              <Lock aria-hidden="true" size={15} strokeWidth={1.8} />
            </span>
          )}
        </div>
        <div className="grid gap-1 text-[11px] leading-snug text-[#566159]">
          <span className="truncate font-medium">{display.usage} / {asset.mediaType}</span>
          <span className={cn("truncate rounded-md border px-2 py-1 font-bold", canDownload && !hasWarnings ? "border-[#c5dfce] bg-[#f0faf3] text-[#24583d]" : "border-[#ead6a8] bg-[#fff8e8] text-[#725216]")}>{display.download.reuse.blockers[0]?.label || quickLabel}</span>
        </div>
        <div className="max-h-0 overflow-hidden text-xs leading-snug text-tjc-muted opacity-0 transition-all duration-300 group-hover:max-h-28 group-hover:opacity-100 group-focus-within:max-h-28 group-focus-within:opacity-100" aria-label="Source metadata">
          <span className="block">Source: {source.publicLabel}</span>
          <span className="block">{display.reviewFacts.reviewLine}</span>
          <span className="block">{asset.resourceSpaceId ? `ResourceSpace ID ${asset.resourceSpaceId}` : "ResourceSpace export"}</span>
        </div>
      </div>
    </article>
  );
}
