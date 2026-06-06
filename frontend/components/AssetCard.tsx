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
    <article className="group overflow-hidden rounded-[1rem] border border-[#becbc2] bg-[#111a17] shadow-[0_1px_0_rgba(255,255,255,.14)_inset,0_18px_52px_rgba(25,34,29,.12)] transition duration-200 hover:-translate-y-0.5 hover:border-[#7ca792] hover:shadow-[0_26px_70px_rgba(25,34,29,.2)]">
      <Link href={`/assets/${asset.id}`} className="relative block aspect-[4/3] overflow-hidden bg-[#19231f]" aria-label={`Open ${display.title}`}>
        <span className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(0,0,0,0)_44%,rgba(7,16,13,.72)),linear-gradient(135deg,rgba(255,255,255,.06),transparent_38%,rgba(6,63,57,.16))]" aria-hidden="true" />
        <MediaPreview
          src={display.image}
          alt={asset.thumbnailAlt}
          label={previewLabel}
          detail={previewDetail}
          imgClassName="transition duration-300 ease-out group-hover:scale-[1.02]"
        />
        <span className={cn(
          "absolute left-2 top-2 z-[2] max-w-[calc(100%-1rem)] rounded-full border px-2.5 py-1 text-[10px] font-black uppercase leading-none shadow-[0_10px_24px_rgba(7,16,13,.22)] backdrop-blur",
          canDownload && !hasWarnings ? "border-[#b7dfc8] bg-[#effbf3]/95 text-[#1f5d3b]" : "border-[#f0cf7d] bg-[#fff2cb]/95 text-[#704707]"
        )}>
          {display.shortStatus}
        </span>
        {!canDownload ? (
          <span className="absolute bottom-2 left-2 z-[2] inline-flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-full border border-[#f0cf7d] bg-[#fff2cb]/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.04em] text-[#704707] shadow-[0_10px_24px_rgba(7,16,13,.22)] backdrop-blur">
            <ShieldAlert size={12} strokeWidth={1.9} aria-hidden="true" />
            gated preview
          </span>
        ) : null}
      </Link>
      <div className="grid gap-2.5 border-t border-white/10 bg-[linear-gradient(180deg,#17211d,#111a17)] p-3 text-white">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-[13px] font-black leading-tight text-white">{display.title}</h2>
            <span className="mt-1 block truncate text-[11px] font-semibold text-white/56">{display.cardSubtitle}</span>
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
        <div className="grid gap-1 text-[11px] leading-snug text-white/66">
          <span className="truncate font-semibold">{display.usage} / {asset.mediaType}</span>
          <span className={cn("truncate rounded-lg border px-2 py-1 font-black", canDownload && !hasWarnings ? "border-[#9bd2b3] bg-[#e7f7ed] text-[#164d34]" : "border-[#f0cf7d] bg-[#fff2cb] text-[#704707]")}>{display.download.reuse.blockers[0]?.label || quickLabel}</span>
        </div>
        <div className="max-h-0 overflow-hidden text-xs leading-snug text-white/54 opacity-0 transition-all duration-300 group-hover:max-h-28 group-hover:opacity-100 group-focus-within:max-h-28 group-focus-within:opacity-100" aria-label="Source metadata">
          <span className="block">Source: {source.publicLabel}</span>
          <span className="block">{display.reviewFacts.reviewLine}</span>
          <span className="block">{asset.resourceSpaceId ? `ResourceSpace ID ${asset.resourceSpaceId}` : "ResourceSpace export"}</span>
        </div>
      </div>
    </article>
  );
}
