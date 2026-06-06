import { CheckCircle2, ShieldAlert } from "lucide-react";
import { StatusBadge, UsageBadge } from "@/components/StatusBadge";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import { assetPresentation } from "@/lib/presentation";
import { cn } from "@/lib/ui";

export function AssetTrustPanel({ asset, role }: { asset: StockMediaAsset; role: DemoRole }) {
  const display = assetPresentation(asset, role);
  const downloadable = display.download.approvedCopy.allowed;
  const hasWarnings = display.confidence.some((item) => item.tone === "warn");
  return (
    <section className="rounded-lg border border-[#d4ded7] bg-white p-4" aria-label="Trust summary">
      <div className="mb-3">
        <h2 className="text-lg font-black">Can I use this?</h2>
        <p className="mt-1 text-sm font-semibold leading-snug text-tjc-muted">Portal reuse decision, raw status, blockers, and role permissions.</p>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <StatusBadge status={asset.status} />
        <UsageBadge scope={asset.usageScope} />
      </div>
      <div className={cn(
        "mb-4 grid grid-cols-[auto_1fr] gap-3 border-l-2 py-1 pl-3",
        downloadable && !hasWarnings ? "border-[#7db58f] text-[#164d34]" : "border-[#d09a31] text-[#6f4608]"
      )}>
        {downloadable && !hasWarnings ? <CheckCircle2 size={20} strokeWidth={1.8} aria-hidden="true" /> : <ShieldAlert size={20} strokeWidth={1.8} aria-hidden="true" />}
        <div>
          <strong className="block text-base font-black">{downloadable ? "Approved copy available" : display.download.reuse.label}</strong>
          <span className="mt-1 block text-sm font-semibold leading-snug">{downloadable ? asset.usageGuidance : display.download.reuse.summary}</span>
        </div>
      </div>
      <dl className="grid grid-cols-1 gap-0 sm:grid-cols-2">
        {display.trustFacts.map((fact) => (
          <div key={fact.label} className="border-b border-[#d8e0d8] py-3 sm:px-3">
            <dt className="text-xs font-black text-tjc-evergreen">{fact.label}</dt>
            <dd className="mt-1 text-sm font-semibold leading-snug text-[#4d554d]">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 grid gap-2 border-t border-tjc-line pt-3">
        {display.confidence.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="font-bold text-[#4d554d]">{item.label}</span>
            <span className={cn("border-l-2 pl-2 text-xs font-black", item.tone === "ok" ? "border-[#7db58f] text-[#22563a]" : "border-[#d09a31] text-[#725216]")}>{item.state}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
