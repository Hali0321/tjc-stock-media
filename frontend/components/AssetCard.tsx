"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Eye, Lock } from "lucide-react";
import { AssetQuickLookDialog } from "@/components/AssetQuickLookDialog";
import { MediaPreview } from "@/components/MediaPreview";
import { ReuseStateBadge } from "@/components/StatusBadge";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import { assetPresentation } from "@/lib/presentation";
import { cn } from "@/lib/ui";

type AssetCardVariant = "standard" | "wide" | "tall" | "feature";

function mediaAspectClass(variant: AssetCardVariant) {
  if (variant === "feature") return "aspect-[16/9]";
  if (variant === "wide") return "aspect-[16/10]";
  if (variant === "tall") return "aspect-[5/4]";
  return "aspect-[4/3]";
}

function compactCardReason(value?: string) {
  if (!value) return "Review details in asset record";
  return value
    .replace(/Needs reviewer decision/gi, "Needs review")
    .replace(/Needs portal review/gi, "Needs review")
    .replace(/Rights or consent unclear/gi, "Rights unclear")
    .replace(/People\/minors review required/gi, "People check")
    .replace(/Children\/youth possible/gi, "People check")
    .replace(/Reviewer\/date missing/gi, "Reviewer missing")
    .replace(/Approved derivative missing/gi, "Approved copy missing")
    .replace(/Unknown - reviewer should confirm before public use/gi, "Needs review");
}

export function AssetCard({
  asset,
  role,
  variant = "standard"
}: {
  asset: StockMediaAsset;
  role: DemoRole;
  variant?: AssetCardVariant;
}) {
  const [quickLookOpen, setQuickLookOpen] = useState(false);
  const display = assetPresentation(asset, role);
  const canDownload = display.download.approvedCopy.allowed;
  const downloadHref = `/api/download/${asset.id}?role=${encodeURIComponent(role)}`;
  const confidence = display.confidence.filter((item) => item.tone === "warn").slice(0, 1);
  const hasWarnings = confidence.length > 0;
  const blocker = compactCardReason(display.download.reuse.blockers[0]?.label || confidence[0]?.state || display.download.reuse.label || display.quickLabel);
  const previewLabel = display.image ? "Preview export pending" : `${asset.mediaType} preview restricted`;
  const previewDetail = display.image
    ? undefined
    : `${asset.collection || "Collection"} · ${display.download.reuse.blockers[0]?.label || display.download.approvedCopy.reason || "Reviewer-only until reuse checks pass."}`;

  return (
    <article className="dam-asset-card group flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[#cad8cf] bg-white transition duration-200 hover:border-[#7ca792] hover:bg-[#fbfdfb]">
      <div className={cn("dam-asset-card-media relative overflow-hidden bg-[#edf2ed]", mediaAspectClass(variant))}>
        <Link href={`/assets/${asset.id}`} className="absolute inset-0 block" aria-label={`Open ${display.title}`}>
          <MediaPreview
            src={display.image}
            alt={asset.thumbnailAlt}
            label={previewLabel}
            detail={previewDetail}
            imgClassName="transition duration-300 ease-out group-hover:scale-[1.02]"
          />
        </Link>
        <span className="dam-asset-card-primary absolute left-2 top-2 z-[2] max-w-[calc(100%-1rem)]" data-badge-slot="asset-card-primary">
          <ReuseStateBadge asset={asset} size="xs" />
        </span>
        <button
          className="dam-asset-card-preview-action absolute bottom-2 right-2 z-[2] inline-flex min-h-8 items-center gap-1.5 rounded-md border border-[#c5d3ca] bg-white px-2.5 text-[11px] font-black text-tjc-evergreen transition hover:bg-[#eef7f1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-px max-sm:h-8 max-sm:w-8 max-sm:px-0"
          type="button"
          onClick={() => setQuickLookOpen(true)}
          aria-haspopup="dialog"
          aria-label={`Quick preview ${display.title}`}
        >
          <Eye size={13} strokeWidth={1.9} aria-hidden="true" />
          <span className="sr-only">Preview</span>
        </button>
      </div>
      <div className="dam-asset-card-body grid flex-1 content-start gap-2.5 border-t border-[#d6dfd8] p-3.5 text-tjc-ink max-sm:gap-1.5 max-sm:p-2">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="dam-asset-card-title line-clamp-2 text-sm font-black leading-tight text-tjc-ink max-sm:text-[12px]">{display.title}</h2>
            <span className="dam-asset-card-subtitle mt-1 block truncate text-xs font-semibold text-tjc-muted max-sm:text-[10px]">{display.cardSubtitle}</span>
          </div>
	          {canDownload ? (
	            <a className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition active:translate-y-px", hasWarnings ? "border-[#f0cf7d] bg-[#fff2cb] text-[#704707] hover:bg-[#ffe9ad]" : "border-[#92cfad] bg-[#e6f7ec] text-[#164d34] hover:bg-[#d9f0e3]")} href={downloadHref} aria-label={`Download approved copy${hasWarnings ? " with review warnings" : ""} of ${display.title}`}>
	              <Download aria-hidden="true" size={15} strokeWidth={1.8} />
	            </a>
          ) : (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#f0cf7d] bg-[#fff2cb] text-[#704707]" title={display.download.approvedCopy.reason || "Download unavailable"}>
              <Lock aria-hidden="true" size={15} strokeWidth={1.8} />
            </span>
          )}
        </div>
        <div className="dam-asset-card-mobile-badges hidden min-w-0 flex-wrap items-center gap-1.5" aria-label="Asset trust state">
          <ReuseStateBadge asset={asset} size="xs" />
        </div>
        <div className="dam-asset-card-meta grid gap-1 text-xs leading-snug text-tjc-muted max-sm:text-[10px]">
          <span className={cn("dam-asset-card-use-line line-clamp-1 rounded-md border px-2 py-1 text-[13px] font-black max-sm:text-[11px]", canDownload && !hasWarnings ? "border-[#b8d9c6] bg-[#edf8f1] text-[#164d34]" : "border-[#ead6a8] bg-[#fff8e8] text-[#704707]")}>{canDownload && !hasWarnings ? "Safe to reuse" : blocker}</span>
          <span className="truncate font-semibold">{asset.collection || display.cardSubtitle}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-2 border-t border-[#eef1ef] pt-2 text-[10px] font-bold leading-snug text-tjc-muted max-sm:hidden" aria-label="Source metadata">
          <span className="truncate">{canDownload ? "Approved copy" : "Reuse requires review"}</span>
          <span className="rounded-md bg-[#f6f8f5] px-2 py-1 tabular-nums text-[#6f7a72]">{asset.resourceSpaceId ? `RS ${asset.resourceSpaceId}` : "RS export"}</span>
        </div>
      </div>
      <AssetQuickLookDialog asset={asset} role={role} open={quickLookOpen} onClose={() => setQuickLookOpen(false)} />
    </article>
  );
}
