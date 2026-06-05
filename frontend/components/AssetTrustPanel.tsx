import { CheckCircle2, ShieldAlert } from "lucide-react";
import { StatusBadge, UsageBadge } from "@/components/StatusBadge";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import { assetPresentation } from "@/lib/presentation";
import { cn } from "@/lib/ui";

export function AssetTrustPanel({ asset, role }: { asset: StockMediaAsset; role: DemoRole }) {
  const display = assetPresentation(asset, role);
  const downloadable = display.download.approvedCopy.allowed;
  return (
    <section className="rounded-lg border border-tjc-line bg-white/82 p-4 shadow-[0_1px_0_rgba(32,34,31,.04)]" aria-label="Trust summary">
      <div className="mb-3 flex flex-wrap gap-2">
        <StatusBadge status={asset.status} />
        <UsageBadge scope={asset.usageScope} />
      </div>
      <div className={cn(
        "mb-4 grid grid-cols-[auto_1fr] gap-3 rounded-lg border p-3",
        downloadable ? "border-[#b7dac7] bg-[#eff9f3] text-[#25553b]" : "border-[#ead6a8] bg-[#fff7e5] text-[#73531a]"
      )}>
        {downloadable ? <CheckCircle2 size={20} strokeWidth={1.8} aria-hidden="true" /> : <ShieldAlert size={20} strokeWidth={1.8} aria-hidden="true" />}
        <div>
          <strong className="block text-sm font-semibold">{downloadable ? "Approved copy available" : "Not downloadable yet"}</strong>
          <span className="mt-1 block text-sm leading-snug">{downloadable ? asset.usageGuidance : "A reviewer must approve this asset before reuse."}</span>
        </div>
      </div>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {display.trustFacts.map((fact) => (
          <div key={fact.label} className="border-t border-tjc-line/80 pt-3">
            <dt className="text-xs font-semibold text-tjc-evergreen">{fact.label}</dt>
            <dd className="mt-1 text-sm leading-snug text-[#4d554d]">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 grid gap-2 border-t border-tjc-line pt-3">
        {display.confidence.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-[#4d554d]">{item.label}</span>
            <span className={cn("rounded-md px-2 py-1 text-xs font-semibold", item.tone === "ok" ? "bg-[#edf8f1] text-[#22563a]" : "bg-[#fff7e5] text-[#725216]")}>{item.state}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
