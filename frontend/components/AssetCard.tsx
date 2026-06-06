"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Eye, Lock, ShieldAlert } from "lucide-react";
import { AssetQuickLookDialog } from "@/components/AssetQuickLookDialog";
import { MediaPreview } from "@/components/MediaPreview";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import { assetPresentation, provenanceSummary } from "@/lib/presentation";
import { cn } from "@/lib/ui";

type AssetCardVariant = "standard" | "wide" | "tall" | "feature";

function mediaAspectClass(variant: AssetCardVariant) {
  if (variant === "feature") return "aspect-[16/9]";
  if (variant === "wide") return "aspect-[16/10]";
  if (variant === "tall") return "aspect-[4/5]";
  return "aspect-[4/3]";
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
  const source = provenanceSummary(asset, role);
  const downloadHref = `/api/download/${asset.id}?role=${encodeURIComponent(role)}`;
  const confidence = display.confidence.filter((item) => item.tone === "warn").slice(0, 1);
  const hasWarnings = confidence.length > 0;
  const quickLabel = display.download.reuse.label || confidence[0]?.state || display.quickLabel || asset.mediaType;
  const previewLabel = display.image ? "Preview export pending" : "Preview restricted";
  const previewDetail = display.image
    ? undefined
    : display.download.reuse.blockers[0]?.label || display.download.approvedCopy.reason || "Reviewer-only until reuse checks pass.";

  return (
    <article className="group flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[#becbc2] bg-white transition duration-200 hover:border-[#7ca792] hover:bg-[#fbfdfb]">
      <div className={cn("relative overflow-hidden bg-[#edf2ed]", mediaAspectClass(variant))}>
        <Link href={`/assets/${asset.id}`} className="absolute inset-0 block" aria-label={`Open ${display.title}`}>
          <span className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(255,255,255,0)_58%,rgba(247,250,247,.88))]" aria-hidden="true" />
          <MediaPreview
            src={display.image}
            alt={asset.thumbnailAlt}
            label={previewLabel}
            detail={previewDetail}
            imgClassName="transition duration-300 ease-out group-hover:scale-[1.02]"
          />
        </Link>
        <span className={cn(
          "absolute left-2 top-2 z-[2] max-w-[calc(100%-1rem)] rounded border px-2 py-1 text-[10px] font-black uppercase leading-none backdrop-blur",
          canDownload && !hasWarnings ? "border-[#b7dfc8] bg-[#effbf3]/95 text-[#1f5d3b]" : "border-[#f0cf7d] bg-[#fff2cb]/95 text-[#704707]"
        )}>
          {display.shortStatus}
        </span>
        {!canDownload ? (
          <span className="absolute bottom-2 left-2 z-[2] inline-flex max-w-[calc(100%-1rem)] items-center gap-1 rounded border border-[#f0cf7d] bg-[#fff2cb]/95 px-2 py-1 text-[10px] font-black uppercase tracking-[.04em] text-[#704707] backdrop-blur">
            <ShieldAlert size={12} strokeWidth={1.9} aria-hidden="true" />
            download blocked
          </span>
        ) : null}
        <button
          className="absolute bottom-2 right-2 z-[2] inline-flex min-h-8 items-center gap-1.5 rounded-md border border-[#c5d3ca] bg-white/90 px-2.5 text-[11px] font-black text-tjc-evergreen backdrop-blur transition hover:bg-[#eef7f1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-px"
          type="button"
          onClick={() => setQuickLookOpen(true)}
          aria-haspopup="dialog"
          aria-label={`Quick preview ${display.title}`}
        >
          <Eye size={13} strokeWidth={1.9} aria-hidden="true" />
          Preview
        </button>
      </div>
      <div className="grid flex-1 content-start gap-2.5 border-t border-[#d6dfd8] p-3 text-tjc-ink">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-[13px] font-black leading-tight text-tjc-ink">{display.title}</h2>
            <span className="mt-1 block truncate text-[11px] font-semibold text-tjc-muted">{display.cardSubtitle}</span>
          </div>
	          {canDownload ? (
	            <a className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition active:translate-y-px", hasWarnings ? "border-[#f0cf7d] bg-[#fff2cb] text-[#704707] hover:bg-[#ffe9ad]" : "border-[#92cfad] bg-[#e6f7ec] text-[#164d34] hover:bg-[#d9f0e3]")} href={downloadHref} aria-label={`Download approved copy${hasWarnings ? " with review warnings" : ""} of ${display.title}`}>
	              <Download aria-hidden="true" size={15} strokeWidth={1.8} />
	            </a>
          ) : (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#f0cf7d] bg-[#fff2cb] text-[#704707]" title={display.download.approvedCopy.reason || "Download blocked"}>
              <Lock aria-hidden="true" size={15} strokeWidth={1.8} />
            </span>
          )}
        </div>
        <div className="grid gap-1 text-[11px] leading-snug text-tjc-muted">
          <span className="truncate font-semibold">{display.usage} / {asset.mediaType}</span>
          <span className={cn("truncate border-l-2 pl-2 font-black", canDownload && !hasWarnings ? "border-[#7db58f] text-[#164d34]" : "border-[#d09a31] text-[#704707]")}>{display.download.reuse.blockers[0]?.label || quickLabel}</span>
        </div>
        <div className="max-h-0 overflow-hidden text-xs leading-snug text-tjc-muted opacity-0 transition-all duration-300 group-hover:max-h-28 group-hover:opacity-100 group-focus-within:max-h-28 group-focus-within:opacity-100" aria-label="Source metadata">
          <span className="block">Source: {source.publicLabel}</span>
          <span className="block">{display.reviewFacts.reviewLine}</span>
          <span className="block">{asset.resourceSpaceId ? `ResourceSpace ID ${asset.resourceSpaceId}` : "ResourceSpace export"}</span>
        </div>
      </div>
      <AssetQuickLookDialog asset={asset} role={role} open={quickLookOpen} onClose={() => setQuickLookOpen(false)} />
    </article>
  );
}
