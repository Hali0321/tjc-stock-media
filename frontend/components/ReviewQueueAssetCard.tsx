"use client";

import Link from "next/link";
import { ExternalLink, ShieldAlert } from "lucide-react";
import { MediaPreview } from "@/components/MediaPreview";
import { StatusBadge, UsageBadge } from "@/components/StatusBadge";
import { assetPresentation, provenanceSummary } from "@/lib/presentation";
import { missingReviewFields, reviewRiskFlags } from "@/lib/workflow-policy";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import { cn } from "@/lib/ui";

type ReviewQueueAssetCardProps = {
  asset: StockMediaAsset;
  role: DemoRole;
  selected: boolean;
  onInspect: (id: string) => void;
};

function sourceSummary(asset: StockMediaAsset, role: DemoRole) {
  return provenanceSummary(asset, role).publicLabel || asset.collection || "Source pending";
}

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
  const evidenceProgress = "0/9 evidence";

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
          <span className="rounded-full border border-[#ead6a8] bg-[#fff8e8] px-2 py-1 text-[10px] font-black text-[#725216]">
            {compactRisk}
          </span>
          <span className="rounded-full border border-[#d7dfd8] bg-[#f1f4ef] px-2 py-1 text-[10px] font-black text-[#536057]">
            {missing.length ? `${missing.length} gaps` : "Fields ready"}
          </span>
          <span className="rounded-full border border-[#cfd9dd] bg-white px-2 py-1 text-[10px] font-black text-[#52677a]">
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
        "group hidden gap-3 border-b border-tjc-line px-3 py-3 transition last:border-b-0 hover:bg-[#f8fbf8] md:grid lg:grid-cols-[7.25rem_minmax(14rem,1.15fr)_minmax(15rem,1fr)_minmax(13rem,.9fr)]",
        selected && "bg-[#e5f3ea] shadow-[inset_6px_0_0_#063f39]"
      )}
      data-component="ExpandedReviewQueueCard"
      data-testid={selected ? "review-selected-queue-item" : undefined}
    >
      <Link
        href={`/assets/${asset.id}`}
        className="review-media-reveal block aspect-[4/3] overflow-hidden rounded-xl border border-black/10 bg-[#eef1ed] shadow-[0_10px_24px_rgba(25,34,29,.08)] max-sm:rounded-lg"
        aria-label={`Open ${display.title}`}
      >
        <MediaPreview src={display.image} alt={asset.thumbnailAlt} imgClassName="transition duration-300 group-hover:scale-[1.025]" className="px-2" loading="eager" />
      </Link>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-base font-black leading-tight text-tjc-ink max-sm:text-sm">{display.title}</h2>
            <p className="mt-1 grid gap-1 text-sm font-medium text-tjc-muted max-sm:text-xs">
              <span className="truncate">{asset.collection}</span>
              <span className="truncate max-sm:hidden">{sourceSummary(asset, role)}</span>
            </p>
          </div>
          <span className="rounded-full border border-[#cad8cf] bg-white px-2 py-1 text-[11px] font-black text-tjc-evergreen tabular-nums max-sm:hidden">RS {asset.resourceSpaceId || asset.id}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 max-sm:hidden">
          <StatusBadge status={asset.status} />
          <UsageBadge scope={asset.usageScope} />
        </div>
      </div>

      <div className="grid gap-2 max-sm:hidden">
        <div className="rounded-xl border border-[#ead6a8] bg-[#fff8e6] p-3 text-sm text-[#684a10]">
          <div className="flex items-start gap-2">
            <ShieldAlert size={17} strokeWidth={1.8} aria-hidden="true" className="mt-0.5 shrink-0" />
            <div>
              <strong className="block font-black">{primaryRisk}</strong>
              <span className="mt-1 block leading-snug">{asset.rightsNotes || "Review needed before reuse."}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {risks.slice(0, 3).map((flag) => (
            <span className="rounded-full border border-[#ead6a8] bg-white px-2 py-1 text-[11px] font-black text-[#725216]" key={flag}>
              {flag}
            </span>
          ))}
          <span className="rounded-full border border-[#d7dfd8] bg-[#f1f4ef] px-2 py-1 text-[11px] font-black text-[#536057]">
            {missing.length ? `${missing.length} missing` : "Fields ready"}
          </span>
          <span className="rounded-full border border-[#cfd9dd] bg-white px-2 py-1 text-[11px] font-black text-[#52677a]">
            {evidenceProgress}
          </span>
        </div>
      </div>

      <div className="grid content-start gap-2 max-sm:col-span-2">
        <div className="rounded-xl border border-[#c9d8cf] bg-white/86 p-3 max-sm:hidden">
          <span className="block text-[11px] font-black uppercase tracking-[.06em] text-tjc-evergreen">Next check</span>
          <strong className="mt-1 block text-sm text-tjc-ink">{nextCheck}</strong>
          <p className="mt-1 text-xs font-medium leading-snug text-tjc-muted">{evidenceProgress} · {missing.length ? missing.slice(0, 3).join(", ") : "Checklist and note still required before action."}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          <button
            className={cn(
              "inline-flex min-h-9 items-center justify-center rounded-xl border px-2.5 text-sm font-black transition hover:bg-[#eef7f1] active:translate-y-px max-sm:col-span-2",
              selected ? "border-[#8fb2a5] bg-[#dff0e6] text-tjc-evergreen" : "border-tjc-line bg-white text-tjc-evergreen"
            )}
            type="button"
            onClick={() => onInspect(asset.id)}
            aria-pressed={selected}
          >
            {selected ? "Selected for review" : "Review"}
          </button>
          <Link className="inline-flex min-h-9 items-center justify-center gap-1 rounded-xl border border-tjc-line bg-white px-2.5 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1] max-sm:hidden" href={`/assets/${asset.id}`}>
            <ExternalLink size={14} strokeWidth={1.8} aria-hidden="true" />
            Detail
          </Link>
        </div>
      </div>
    </article>
    </>
  );
}
