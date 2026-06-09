"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { MediaPreview } from "@/components/MediaPreview";
import { assetPresentation } from "@/lib/presentation";
import { missingReviewFields, reviewRiskFlags } from "@/lib/workflow-policy";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import { cn } from "@/lib/ui";

type ReviewQueueAssetCardProps = {
  asset: StockMediaAsset;
  role: DemoRole;
  selected: boolean;
  onInspect: (id: string) => void;
};

function nextCheckLabel(missing: string[], risks: string[]) {
  if (missing.includes("source")) return "Verify source";
  if (missing.includes("people/minors")) return "Check people/minors";
  if (missing.includes("consent") || risks.includes("Rights unclear")) return "Confirm rights";
  if (missing.includes("usage guidance")) return "Add guidance";
  if (missing.includes("reviewer") || missing.includes("review date")) return "Record reviewer";
  return "Decision ready";
}

export function ReviewQueueAssetCard({ asset, role, selected, onInspect }: ReviewQueueAssetCardProps) {
  const display = assetPresentation(asset, role);
  const risks = reviewRiskFlags(asset);
  const missing = missingReviewFields(asset);
  const primaryRisk = risks[0] || "Standard review";
  const compactRisk = primaryRisk
    .replace("Please review before public sharing", "Needs review")
    .replace("People/minors unknown", "People/minors")
    .replace("Rights or consent unclear", "Rights");
  const nextCheck = nextCheckLabel(missing, risks);
  const severity = risks.some((risk) => /children|rights|sensitive/i.test(risk)) ? "High" : missing.length >= 4 ? "Medium" : "Standard";
  const rowTone = severity === "High" ? "High" : missing.length ? "Open" : "Ready";
  const evidenceLabel = missing.length ? `${missing.length} gaps` : "Ready";
  const recordMeta = `${asset.mediaType} · Ref ${asset.id}`;

  return (
    <>
    {selected ? (
      <article
        className="hidden"
        data-component="CompactReviewQueueCard"
        aria-label={`${display.title} currently reviewing`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] font-black uppercase tracking-[.06em] text-tjc-evergreen">Currently reviewing</span>
            <h2 className="mt-1 line-clamp-1 text-sm font-black leading-tight text-tjc-ink">{display.title}</h2>
            <p className="mt-0.5 truncate text-xs font-semibold text-tjc-muted">{nextCheck}</p>
          </div>
          <button
            className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border border-[#8fb2a5] bg-white px-2 text-xs font-black text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px"
            type="button"
            onClick={() => onInspect(asset.id)}
            aria-pressed={true}
          >
            Review
          </button>
        </div>
      </article>
    ) : (
    <article
      className={cn(
        "grid w-full max-w-full grid-cols-[4.75rem_minmax(0,1fr)] gap-2 border-b border-tjc-line px-3 py-2 transition last:border-b-0 md:hidden",
        "bg-white"
      )}
      data-component="CompactReviewQueueCard"
      aria-label={`${display.title} compact review queue card`}
    >
      <button
        type="button"
        onClick={() => onInspect(asset.id)}
        className="review-media-reveal block aspect-[4/3] overflow-hidden rounded-lg border border-black/10 bg-[#eef1ed] text-left"
        aria-label={`Inspect ${display.title}`}
        aria-pressed={selected}
      >
        <MediaPreview src={display.image} alt={asset.thumbnailAlt} imgClassName="transition duration-300 group-hover:scale-[1.025]" className="px-1" loading="eager" />
      </button>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-sm font-black leading-tight text-tjc-ink">{display.title}</h2>
            <p className="mt-0.5 truncate text-xs font-semibold text-tjc-muted">{nextCheck}</p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-md border border-[#ead6a8] bg-[#fff8e8] px-2 py-1 text-[10px] font-black text-[#725216]">
            {compactRisk}
          </span>
          <span className="rounded-md border border-[#d7dfd8] bg-[#f1f4ef] px-2 py-1 text-[10px] font-black text-[#536057]">
            {evidenceLabel}
          </span>
          <span className="rounded-md border border-[#cfd9dd] bg-white px-2 py-1 text-[10px] font-black text-[#52677a]">
            {nextCheck}
          </span>
        </div>
        <div className="mt-2 grid gap-2">
          <button
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-tjc-line bg-white px-2 text-xs font-black text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px"
            type="button"
            onClick={() => onInspect(asset.id)}
          >
            Review
          </button>
        </div>
      </div>
    </article>
    )}

    <article
      className={cn(
        "review-queue-row-v2 group hidden gap-3 border-b border-tjc-line px-3 py-2.5 transition last:border-b-0 hover:bg-[#f8fbf8] md:grid md:grid-cols-[4.5rem_minmax(0,1fr)_5.75rem]",
        selected && "bg-[#e5f3ea] ring-1 ring-inset ring-[#8fb2a5]"
      )}
      data-component="ExpandedReviewQueueCard"
      data-testid={selected ? "review-selected-queue-item" : undefined}
    >
      {selected ? <span className="sr-only">Selected</span> : null}
      <Link
        href={`/assets/${asset.id}`}
        className="review-row-thumb review-media-reveal block aspect-[4/3] overflow-hidden rounded-md border border-black/10 bg-[#eef1ed] max-sm:rounded-lg"
        aria-label={`Open ${display.title}`}
      >
        <MediaPreview src={display.image} alt={asset.thumbnailAlt} imgClassName="transition duration-300 group-hover:scale-[1.025]" className="px-2" loading="eager" />
      </Link>

      <div className="review-row-record min-w-0 self-center">
        <h2 className="min-w-0 truncate text-sm font-black leading-tight text-tjc-ink">{display.title}</h2>
        <div className="review-row-subline">
          <span>{recordMeta}</span>
          <span>{nextCheck}</span>
        </div>
        <div className="review-row-chipline" aria-label="Review row status">
          <span className={cn("review-row-chip", severity === "High" ? "is-warn" : missing.length ? "is-info" : "is-ok")}>{evidenceLabel}</span>
          <span className="review-row-chip is-quiet">{compactRisk}</span>
        </div>
      </div>

      <div className="review-row-actions grid content-center gap-2">
        <div className="grid gap-2">
          <button
            className={cn(
              "inline-flex min-h-9 items-center justify-center rounded-md border px-2.5 text-sm font-black transition hover:bg-[#eef7f1] active:translate-y-px",
              selected ? "border-[#8fb2a5] bg-[#dff0e6] text-tjc-evergreen" : "border-tjc-line bg-white text-tjc-evergreen"
            )}
            type="button"
            onClick={() => onInspect(asset.id)}
            aria-pressed={selected}
          >
            Review
          </button>
          <Link className="sr-only" href={`/assets/${asset.id}`}>
            <ExternalLink size={14} strokeWidth={1.8} aria-hidden="true" />
            Open detail for {display.title}
          </Link>
        </div>
        <span className="sr-only">{rowTone}</span>
      </div>
    </article>
    </>
  );
}
