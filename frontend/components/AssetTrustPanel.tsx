import { CheckCircle2, ShieldAlert } from "lucide-react";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import { assetPresentation } from "@/lib/presentation";
import { cn } from "@/lib/ui";

export function AssetTrustPanel({ asset, role }: { asset: StockMediaAsset; role: DemoRole }) {
  const display = assetPresentation(asset, role);
  const downloadable = display.download.approvedCopy.allowed;
  const hasWarnings = display.confidence.some((item) => item.tone === "warn");
  const primaryFacts = display.trustFacts.slice(0, 4);
  return (
    <section className={cn(
      "rounded-[1.35rem] border p-4 shadow-[0_18px_42px_rgba(35,53,111,.06)]",
      downloadable && !hasWarnings ? "border-[#a9d8bd] bg-[#f1fbf5]" : "border-[#e5c57d] bg-[#fff8e7]"
    )} aria-label="Trust summary">
      <div className={cn(
        "grid grid-cols-[auto_1fr] gap-3",
        downloadable && !hasWarnings ? "text-[#164d34]" : "text-[#6f4608]"
      )}>
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-[0_8px_18px_rgba(15,61,46,.08)]">
          {downloadable && !hasWarnings ? <CheckCircle2 size={22} strokeWidth={1.8} aria-hidden="true" /> : <ShieldAlert size={22} strokeWidth={1.8} aria-hidden="true" />}
        </span>
        <div>
          <h2 className="text-sm font-black text-tjc-ink">Can I use this?</h2>
          <strong className="mt-1 block text-xl font-black leading-tight">{downloadable && !hasWarnings ? "Use approved copy" : display.download.reuse.label}</strong>
          <span className="mt-1 block text-sm font-semibold leading-snug">{downloadable && !hasWarnings ? asset.usageGuidance : display.download.reuse.summary}</span>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {primaryFacts.map((fact) => (
          <div key={fact.label} className="rounded-2xl bg-white/72 p-3 ring-1 ring-white">
            <dt className="text-xs font-black text-tjc-evergreen">{fact.label}</dt>
            <dd className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-[#4d554d]">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <details className="mt-3 rounded-2xl bg-white/58 p-3 text-sm">
        <summary className="cursor-pointer font-black text-tjc-evergreen">Trust checklist</summary>
        <div className="mt-3 grid gap-2">
          {display.confidence.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3">
              <span className="font-bold text-[#4d554d]">{item.label}</span>
              <span className={cn("border-l-2 pl-2 text-xs font-black", item.tone === "ok" ? "border-[#7db58f] text-[#22563a]" : "border-[#d09a31] text-[#725216]")}>{item.state}</span>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
