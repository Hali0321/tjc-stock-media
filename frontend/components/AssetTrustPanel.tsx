import { CheckCircle2, ShieldAlert } from "lucide-react";
import { StatusBadge, UsageBadge } from "@/components/StatusBadge";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import { assetPresentation } from "@/lib/presentation";

export function AssetTrustPanel({ asset, role }: { asset: StockMediaAsset; role: DemoRole }) {
  const display = assetPresentation(asset, role);
  const downloadable = display.download.approvedCopy.allowed;
  return (
    <section className="asset-trust-panel" aria-label="Trust summary">
      <div className="asset-card__chips">
        <StatusBadge status={asset.status} />
        <UsageBadge scope={asset.usageScope} />
      </div>
      <div className={`safe-answer ${downloadable ? "safe-answer--approved" : ""}`}>
        {downloadable ? <CheckCircle2 size={20} aria-hidden="true" /> : <ShieldAlert size={20} aria-hidden="true" />}
        <div>
          <strong>{downloadable ? "Approved copy available." : "Not downloadable yet."}</strong>
          <span>{downloadable ? asset.usageGuidance : "A reviewer must approve this asset before reuse."}</span>
        </div>
      </div>
      <dl className="trust-fact-grid">
        {display.trustFacts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
