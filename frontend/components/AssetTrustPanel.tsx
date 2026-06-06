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
    <section className="dam-card p-3" aria-label="Trust summary">
      <div className="mb-3">
        <h2 className="text-base font-semibold">Can I use this?</h2>
        <p className="mt-1 text-sm leading-snug text-tjc-muted">Approval, scope, rights, people/minors, and source confidence.</p>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <StatusBadge status={asset.status} />
        <UsageBadge scope={asset.usageScope} />
      </div>
      <div className={cn(
        "mb-4 grid grid-cols-[auto_1fr] gap-3 rounded-xl border p-3",
        downloadable && !hasWarnings ? "dam-risk-ok" : "dam-risk-warn"
      )}>
        {downloadable && !hasWarnings ? <CheckCircle2 size={20} strokeWidth={1.8} aria-hidden="true" /> : <ShieldAlert size={20} strokeWidth={1.8} aria-hidden="true" />}
        <div>
          <strong className="block text-sm font-semibold">{downloadable ? "Approved copy available" : display.download.reuse.label}</strong>
          <span className="mt-1 block text-sm leading-snug">{downloadable ? asset.usageGuidance : display.download.reuse.summary}</span>
        </div>
      </div>
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {display.trustFacts.map((fact) => (
          <div key={fact.label} className="border-t border-tjc-line/80 pt-3">
            <dt className="text-xs font-semibold text-tjc-evergreen">{fact.label}</dt>
            <dd className="mt-1 text-sm leading-snug text-[#4d554d]">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 grid gap-2 border-t border-tjc-line pt-3">
        {display.confidence.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-[#4d554d]">{item.label}</span>
            <span className={cn("rounded-lg px-2 py-1 text-xs font-semibold", item.tone === "ok" ? "bg-[#edf8f1] text-[#22563a]" : "bg-[#fff7e5] text-[#725216]")}>{item.state}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
