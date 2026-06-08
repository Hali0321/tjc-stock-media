import { CheckCircle2, ClipboardCheck, ShieldAlert } from "lucide-react";
import { ReuseStateBadge, ReviewBadge, RightsBadge, VisibilityBadge } from "@/components/StatusBadge";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import { assetPresentation } from "@/lib/presentation";
import { cn } from "@/lib/ui";

export function AssetTrustPanel({ asset, role }: { asset: StockMediaAsset; role: DemoRole }) {
  const display = assetPresentation(asset, role);
  const downloadable = display.download.approvedCopy.allowed;
  const hasWarnings = display.confidence.some((item) => item.tone === "warn");
  const primaryFacts = display.trustFacts.slice(0, 6);
  const lanes = [
    { label: "Workflow", value: display.download.reuse.label },
    { label: "Distribution", value: asset.usageScope },
    { label: "Rights", value: asset.rightsStatus && !/unknown|needs review|review required/i.test(asset.rightsStatus) ? "Rights verified" : "Rights unverified" },
    { label: "People/release", value: asset.peopleRisk && asset.peopleRisk !== "Unknown" ? asset.peopleRisk : "People visibility unverified" },
    { label: "Availability", value: downloadable ? "Download available" : "Preview only" },
    { label: "Source", value: asset.sourceSystem || asset.sourcePlatform || asset.sourceAccount ? "Source verified" : "Source incomplete" }
  ];
  return (
    <section className={cn(
      "rounded-md border p-4",
      downloadable && !hasWarnings ? "border-[#a9d8bd] bg-[#f5fbf7]" : "border-[#e5c57d] bg-[#fffaf0]"
    )} aria-label="Trust summary">
      <div className={cn(
        "grid grid-cols-[auto_1fr] gap-3",
        downloadable && !hasWarnings ? "text-[#164d34]" : "text-[#6f4608]"
      )}>
        <span className="grid h-10 w-10 place-items-center rounded-md border border-[#d6dfd8] bg-white">
          {downloadable && !hasWarnings ? <CheckCircle2 size={22} strokeWidth={1.8} aria-hidden="true" /> : <ShieldAlert size={22} strokeWidth={1.8} aria-hidden="true" />}
        </span>
        <div>
          <h2 className="text-sm font-black text-tjc-ink">Trust summary</h2>
          <strong className="mt-1 block text-xl font-black leading-tight">{downloadable && !hasWarnings ? "Evidence complete" : "Evidence needs review"}</strong>
          <span className="mt-1 block text-sm font-semibold leading-snug">{downloadable && !hasWarnings ? "Source, rights, review, visibility, and approved-copy checks support reuse." : display.download.reuse.summary}</span>
        </div>
      </div>
      <div className="mt-4 grid gap-2 rounded-md border border-[#d6dfd8] bg-white p-3" aria-label="Trust matrix status lanes" data-badge-slot="detail-trust-summary">
        <h3 className="text-xs font-black uppercase text-tjc-muted">Trust matrix</h3>
        <div className="flex flex-wrap items-center gap-2">
          <ReuseStateBadge asset={asset} size="sm" />
          <RightsBadge asset={asset} size="sm" />
          <ReviewBadge asset={asset} size="sm" />
          <VisibilityBadge asset={asset} size="sm" />
        </div>
        <dl className="grid gap-2 sm:grid-cols-2">
          {lanes.map((lane) => (
            <div className="rounded-md border border-[#d6dfd8] bg-white p-2" key={lane.label}>
              <dt className="text-[11px] font-black uppercase text-tjc-muted">{lane.label}</dt>
              <dd className="mt-1 text-xs font-black text-tjc-ink">{lane.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <details className="mt-3 rounded-md border border-[#d6dfd8] bg-white p-3 text-sm" open={role !== "Viewer"}>
        <summary className="cursor-pointer font-black text-tjc-evergreen"><span className="inline-flex items-center gap-2"><ClipboardCheck size={15} strokeWidth={1.8} aria-hidden="true" /> {role === "Viewer" ? "Show details" : "Trust checklist"}</span></summary>
        <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {primaryFacts.map((fact) => (
            <div key={fact.label} className="rounded-md border border-[#d6dfd8] bg-white p-3">
              <dt className="text-xs font-black text-tjc-evergreen">{fact.label}</dt>
              <dd className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-[#4d554d]">{fact.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-3 grid gap-2">
          {display.confidence.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3">
              <span className="font-bold text-[#4d554d]">{item.label}</span>
              <span className={cn("rounded-md border px-2 py-1 text-xs font-black", item.tone === "ok" ? "border-[#b8d9c6] bg-[#edf8f1] text-[#22563a]" : "border-[#ead6a8] bg-[#fff8e8] text-[#725216]")}>{item.state}</span>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
