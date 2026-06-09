import { forwardRef, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Database, Gauge, ListChecks, Lock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/ui";

export {
  EvidenceChecklist as DamEvidenceChecklist,
  GovernanceMetric as DamGovernanceMetric
} from "@/components/DamExperience";

export { HoldReleaseButton as DamHoldReleaseButton, HoldToConfirmButton as DamHoldToConfirmButton } from "@/components/HoldReleaseButton";
export { ReviewActionDialog as DamReviewActionDialog } from "@/components/ReviewActionDialog";
export { ReviewQueueAssetCard as DamReviewQueueAssetCard } from "@/components/ReviewQueueAssetCard";
export { ReviewTriageStrip as DamReviewTriageStrip } from "@/components/ReviewTriageStrip";

type OpsTone = "ok" | "warn" | "info" | "danger";

function opsToneClass(tone: OpsTone) {
  if (tone === "ok") return "border-[#b8d9c6] bg-[#eef8f2] text-[#194f34]";
  if (tone === "danger") return "border-[#dfb9b5] bg-[#fff1ef] text-[#7b332f]";
  if (tone === "warn") return "border-[#ead6a8] bg-[#fff8e8] text-[#71500f]";
  return "border-[#c8d7e6] bg-[#f2f7fb] text-[#27435b]";
}

export function DamOpsBanner({
  kicker,
  title,
  description,
  metric,
  tone = "info",
  icon: Icon,
  children
}: {
  kicker: string;
  title: string;
  description: string;
  metric?: ReactNode;
  tone?: OpsTone;
  icon?: LucideIcon;
  children?: ReactNode;
}) {
  const BannerIcon = Icon || (tone === "danger" || tone === "warn" ? AlertTriangle : CheckCircle2);
  return (
    <section className={cn("dam-ops-banner find-hero grid gap-5 p-5 sm:p-7 xl:grid-cols-[minmax(0,1fr)_30rem]", tone === "danger" && "dam-ops-banner-danger")} aria-label={kicker}>
      <div>
        <span className="inline-flex items-center gap-2 text-sm font-black text-tjc-evergreen">
          <BannerIcon size={18} strokeWidth={1.9} aria-hidden="true" />
          {kicker}
        </span>
        <h1 className="mt-2 dam-page-title">{title}</h1>
        <p className="mt-3 max-w-[66ch] text-lg font-semibold leading-relaxed text-tjc-muted">{description}</p>
        {children ? <div className="mt-4">{children}</div> : null}
      </div>
      {metric ? (
        <div className={cn("grid content-center gap-2 rounded-2xl border bg-white p-4", opsToneClass(tone))}>
          {metric}
        </div>
      ) : null}
    </section>
  );
}

export function DamReviewQueueRail({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="sticky top-24 grid gap-2 rounded-xl border border-[#c9d4d5] bg-white p-3" aria-label={title}>
      <div>
        <h2 className="text-sm font-black text-tjc-evergreen">{title}</h2>
        <p className="mt-1 text-xs font-semibold leading-relaxed text-tjc-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function DamEvidenceMatrix({
  items,
  onToggle
}: {
  items: Array<{ id: string; label: string; complete: boolean }>;
  onToggle?: (id: string) => void;
}) {
  return (
    <div className="dam-evidence-matrix grid gap-2 sm:grid-cols-2" aria-label="Review evidence matrix" data-component="DamEvidenceMatrix">
      {items.map((item) => (
        <label className={cn("flex min-h-10 items-center gap-2 rounded-lg border px-2.5 text-xs font-black transition", item.complete ? "border-[#b8d9c6] bg-[#eef8f2] text-[#194f34]" : "border-[#d8e1da] bg-white text-[#3f4a43] hover:bg-[#f8faf8]")} key={item.id}>
          <input
            className="h-4 w-4 accent-tjc-evergreen"
            type="checkbox"
            checked={item.complete}
            onChange={() => onToggle?.(item.id)}
          />
          {item.label}
        </label>
      ))}
    </div>
  );
}

export const DamReviewSelectedAsset = forwardRef<HTMLElement, { children: ReactNode }>(function DamReviewSelectedAsset({
  children
}, ref) {
  return (
    <aside ref={ref} className="review-selected-workbench order-1 grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1fr)] gap-3 overflow-x-hidden self-start rounded-2xl border border-[#d4ded7] bg-white p-4 xl:order-none xl:sticky xl:top-[calc(var(--app-header-height)+1rem)] xl:max-h-[calc(100vh-var(--app-header-height)-2rem)] xl:overflow-y-auto xl:overscroll-contain" aria-label="Selected asset decision console" data-component="DamReviewSelectedAsset" data-testid="review-current-workspace">
      {children}
    </aside>
  );
});

export function DamReviewDecisionLockPanel({
  missingLabels,
  completed,
  total
}: {
  missingLabels: string[];
  completed: number;
  total: number;
}) {
  const locked = missingLabels.length > 0;
  const visibleMissing = missingLabels.slice(0, 4).join(", ");
  return (
    <section
      className={cn("mt-2 rounded-xl border p-3 text-sm", locked ? "border-[#ead6a8] bg-[#fff8e8] text-[#725216]" : "border-[#b8d9c6] bg-[#f3fbf6] text-[#24583d]")}
      data-testid="review-decision-requirements"
      aria-label="Decision requirements"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="font-black">{locked ? "Decision locked" : "Decision ready"}</strong>
        <span className="rounded-md bg-white px-2 py-1 text-xs font-black tabular-nums">{completed}/{total} complete</span>
      </div>
      <p className="mt-1 text-xs font-semibold leading-relaxed">
        {locked
          ? `Complete before approval: ${visibleMissing}${missingLabels.length > 4 ? ` and ${missingLabels.length - 4} more` : ""}.`
          : "Evidence and note are ready for a pending review write."}
      </p>
    </section>
  );
}

export function DamDecisionActions({ children }: { children: ReactNode }) {
  return (
    <div className="dam-decision-actions grid min-w-0 max-w-full gap-2" data-component="DamDecisionActions" data-testid="review-disabled-decision-group">
      {children}
    </div>
  );
}

export function DamGovernanceCockpit({
  title,
  score,
  assetCount,
  sourceLabel,
  onExport,
  children
}: {
  title: string;
  score: number;
  assetCount: number;
  sourceLabel: string;
  onExport: () => void;
  children?: ReactNode;
}) {
  const blocked = score < 80;
  return (
    <section id="overview" className="dam-governance-cockpit admin-cockpit-hero find-hero scroll-mt-24 grid gap-5 p-5 sm:p-7 xl:grid-cols-[minmax(0,1fr)_28rem]">
      <div className="admin-cockpit-intro">
        <span className="inline-flex items-center gap-2 text-sm font-black text-tjc-evergreen">
          <Gauge size={18} strokeWidth={1.9} aria-hidden="true" />
          Governance cockpit
        </span>
        <h1 className="mt-2 dam-page-title">{title}</h1>
        <p className="mt-3 max-w-[72ch] text-lg font-semibold leading-relaxed text-tjc-muted">See what is blocked, why it is blocked, who owns it, and the next queue to open.</p>
        {children}
      </div>
      <div className="admin-launch-card grid content-center gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-5">
        <div>
          <div className={cn("flex items-center gap-2 text-sm font-black", blocked ? "text-[#7d2d2a]" : "text-[#22563a]")}>
            {blocked ? <AlertTriangle size={19} strokeWidth={1.8} aria-hidden="true" /> : <CheckCircle2 size={19} strokeWidth={1.8} aria-hidden="true" />}
            Launch gate status
          </div>
          <strong className="mt-1 block text-5xl font-black text-tjc-ink">{blocked ? "Blocked" : "Ready"}</strong>
          <span className="mt-1 block text-sm font-semibold text-tjc-muted">Readiness score {score}% across {assetCount.toLocaleString()} assets from {sourceLabel}</span>
          <span className="mt-3 block h-2 overflow-hidden rounded-full bg-[#edf0eb]" aria-hidden="true">
            <span className={cn("block h-full rounded-full", score >= 80 ? "bg-[#2f7d55]" : score >= 55 ? "bg-[#5a7f95]" : "bg-[#d64545]")} style={{ width: `${Math.max(3, Math.min(score, 100))}%` }} />
          </span>
        </div>
        <button className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-[10px] bg-tjc-evergreen px-4 text-sm font-black text-white transition hover:bg-[#082f29]" type="button" onClick={onExport}>
          Export report
        </button>
      </div>
    </section>
  );
}

export function DamReadinessScorecard({
  items
}: {
  items: Array<{ label: string; value: ReactNode; tone?: OpsTone }>;
}) {
  return (
    <section className="dam-readiness-scorecard grid grid-cols-2 gap-2 md:grid-cols-4" aria-label="Readiness scorecard">
      {items.map((item) => (
        <div className={cn("rounded-xl border px-3 py-2", opsToneClass(item.tone || "info"))} key={item.label}>
          <strong className="block text-base font-black tabular-nums">{item.value}</strong>
          <span className="text-[.68rem] font-black uppercase tracking-[.04em]">{item.label}</span>
        </div>
      ))}
    </section>
  );
}

export function DamDiagnosticPanel({
  title,
  icon: Icon = Database,
  children,
  defaultOpen = false,
  className
}: {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return (
    <details className={cn("rounded-xl border border-[#d6dfd8] bg-white p-4", className)} open={defaultOpen}>
      <summary className="flex cursor-pointer items-center gap-2 font-black text-tjc-evergreen">
        <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
        {title}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

export function DamLaunchGatePanel({ children }: { children: ReactNode }) {
  return (
    <section className="dam-launch-gate-panel rounded-xl border border-[#d6dfd8] bg-white" aria-label="Launch gate">
      {children}
    </section>
  );
}

export function DamMappingPanel({ children }: { children: ReactNode }) {
  return (
    <section className="dam-mapping-panel rounded-xl border border-[#d6dfd8] bg-white p-4" aria-label="ResourceSpace write mapping">
      {children}
    </section>
  );
}

export function DamAuditPanel({ children }: { children: ReactNode }) {
  return (
    <section className="dam-audit-panel rounded-xl border border-[#d6dfd8] bg-white p-4" aria-label="Audit">
      {children}
    </section>
  );
}

export function DamBlockerTable({ children }: { children: ReactNode }) {
  return (
    <section className="dam-blocker-table overflow-hidden rounded-xl border border-[#e5e7eb] bg-white" aria-label="Blocker ownership table">
      {children}
    </section>
  );
}

export { Lock as DamOperationsLockIcon, ListChecks as DamOperationsListIcon };
