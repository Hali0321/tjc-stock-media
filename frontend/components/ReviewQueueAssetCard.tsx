"use client";

import Link from "next/link";
import { ExternalLink, ShieldAlert } from "lucide-react";
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
  const evidenceProgress = missing.length ? `${missing.length} gaps` : "Fields ready";
  const severity = risks.some((risk) => /children|rights|sensitive/i.test(risk)) ? "High" : missing.length >= 4 ? "Medium" : "Standard";
  const sla = severity === "High" ? "SLA: review soon" : missing.length ? "SLA: open" : "SLA: ready";

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
            <p className="mt-0.5 truncate text-xs font-semibold text-tjc-muted">{asset.collection}</p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-md border border-[#ead6a8] bg-[#fff8e8] px-2 py-1 text-[10px] font-black text-[#725216]">
            {compactRisk}
          </span>
          <span className="rounded-md border border-[#d7dfd8] bg-[#f1f4ef] px-2 py-1 text-[10px] font-black text-[#536057]">
            {missing.length ? `${missing.length} gaps` : "Fields ready"}
          </span>
          <span className="rounded-md border border-[#cfd9dd] bg-white px-2 py-1 text-[10px] font-black text-[#52677a]">
            {evidenceProgress}
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
        "review-queue-row-v2 group hidden gap-3 border-b border-tjc-line px-3 py-3 transition last:border-b-0 hover:bg-[#f8fbf8] md:grid lg:grid-cols-[5.25rem_minmax(14rem,1.2fr)_minmax(12rem,.8fr)_8.75rem] 2xl:grid-cols-[5.5rem_minmax(16rem,1.2fr)_minmax(13rem,.8fr)_8.75rem]",
        selected && "bg-[#e5f3ea] ring-1 ring-inset ring-[#8fb2a5]"
      )}
      data-component="ExpandedReviewQueueCard"
      data-testid={selected ? "review-selected-queue-item" : undefined}
    >
      <Link
        href={`/assets/${asset.id}`}
        className="review-row-thumb review-media-reveal block aspect-[4/3] overflow-hidden rounded-md border border-black/10 bg-[#eef1ed] max-sm:rounded-lg"
        aria-label={`Open ${display.title}`}
      >
        <MediaPreview src={display.image} alt={asset.thumbnailAlt} imgClassName="transition duration-300 group-hover:scale-[1.025]" className="px-2" loading="eager" />
      </Link>

      <div className="review-row-record min-w-0">
        {selected ? <span className="review-row-state">Selected</span> : null}
        <h2 className="line-clamp-1 text-base font-black leading-tight text-tjc-ink max-sm:text-sm">{display.title}</h2>
        <div className="review-row-focus" aria-label="Review focus">
          <span>{nextCheck}</span>
          <strong>{missing.length ? `${missing.length} gaps` : "Ready"}</strong>
        </div>
      </div>

      <div className="review-row-blockers grid content-start gap-2 max-sm:hidden">
        <div className="review-row-blocker-card grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg border border-[#d7dfd8] bg-[#fbfcfa] p-2 text-sm">
          <ShieldAlert size={16} strokeWidth={1.8} aria-hidden="true" className="text-[#725216]" />
          <span className="min-w-0">
            <strong className="block truncate font-black text-tjc-ink">{compactRisk}</strong>
            <span className="block truncate text-xs font-semibold text-tjc-muted">{evidenceProgress}</span>
          </span>
          <span className="rounded-md border border-[#ead6a8] bg-[#fff8e8] px-2 py-1 text-[11px] font-black text-[#725216]">{severity}</span>
        </div>
      </div>

      <div className="review-row-actions grid content-start gap-2 max-sm:col-span-2">
        <div className="review-row-next rounded-md border border-[#c9d8cf] bg-white p-3 max-sm:hidden">
          <span className="block text-[11px] font-black uppercase tracking-[.06em] text-tjc-evergreen">SLA</span>
          <strong className="mt-1 block text-sm text-tjc-ink">{sla.replace("SLA: ", "")}</strong>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          <button
            className={cn(
              "inline-flex min-h-9 items-center justify-center rounded-md border px-2.5 text-sm font-black transition hover:bg-[#eef7f1] active:translate-y-px max-sm:col-span-2",
              selected ? "border-[#8fb2a5] bg-[#dff0e6] text-tjc-evergreen" : "border-tjc-line bg-white text-tjc-evergreen"
            )}
            type="button"
            onClick={() => onInspect(asset.id)}
            aria-pressed={selected}
          >
            {selected ? "Selected for review" : "Review"}
          </button>
          <Link className="inline-flex min-h-9 items-center justify-center gap-1 rounded-md border border-tjc-line bg-white px-2.5 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1] max-sm:hidden" href={`/assets/${asset.id}`}>
            <ExternalLink size={14} strokeWidth={1.8} aria-hidden="true" />
            Detail
          </Link>
        </div>
      </div>
    </article>
    </>
  );
}
