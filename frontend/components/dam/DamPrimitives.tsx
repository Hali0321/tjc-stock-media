"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, FileQuestion, LockKeyhole, Search, ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/ui";
import type { ReactNode } from "react";

type ActionTone = "primary" | "secondary" | "quiet" | "danger";
type StatusTone = "approved" | "review" | "restricted" | "expiring" | "expired" | "archived" | "replaced" | "pending-sync" | "info";

const statusCopy: Record<StatusTone, { label: string; icon: LucideIcon; className: string }> = {
  approved: { label: "Approved", icon: CheckCircle2, className: "is-approved" },
  review: { label: "Needs review", icon: Clock3, className: "is-review" },
  restricted: { label: "Restricted", icon: LockKeyhole, className: "is-restricted" },
  expiring: { label: "Expiring soon", icon: Clock3, className: "is-review" },
  expired: { label: "Expired", icon: AlertTriangle, className: "is-unavailable" },
  archived: { label: "Archived", icon: FileQuestion, className: "is-archived" },
  replaced: { label: "Replaced", icon: FileQuestion, className: "is-archived" },
  "pending-sync": { label: "Pending sync", icon: Clock3, className: "is-request" },
  info: { label: "Info", icon: ShieldCheck, className: "is-info" }
};

export function DamPanel({ children, className, "aria-label": ariaLabel }: { children: ReactNode; className?: string; "aria-label"?: string }) {
  return <section className={cn("dam-v3-panel", className)} aria-label={ariaLabel}>{children}</section>;
}

export function DamInspectorRail({ children, className }: { children: ReactNode; className?: string }) {
  return <aside className={cn("dam-inspector-rail", className)}>{children}</aside>;
}

export function DamSearchBar({ placeholder = "Search assets, collections, folders...", className }: { placeholder?: string; className?: string }) {
  return (
    <form className={cn("dam-search-bar", className)} action="/" role="search">
      <Search size={17} strokeWidth={1.9} aria-hidden="true" />
      <label className="sr-only" htmlFor="dam-search-bar-input">{placeholder}</label>
      <input id="dam-search-bar-input" name="q" type="search" placeholder={placeholder} />
    </form>
  );
}

export function DamStatusBadge({ tone = "info", children }: { tone?: StatusTone; children?: ReactNode }) {
  const status = statusCopy[tone];
  const Icon = status.icon;
  return (
    <span className={cn("dam-v3-status-badge", status.className)}>
      <Icon size={13} strokeWidth={1.9} aria-hidden="true" />
      <span>{children || status.label}</span>
    </span>
  );
}

export function DamActionButton({
  href,
  onClick,
  children,
  icon: Icon,
  tone = "secondary",
  disabled,
  type = "button"
}: {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  icon?: LucideIcon;
  tone?: ActionTone;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const className = cn("dam-v3-action-button", `is-${tone}`);
  const content = (
    <>
      {Icon ? <Icon size={16} strokeWidth={1.9} aria-hidden="true" /> : null}
      <span>{children}</span>
    </>
  );
  if (href && !disabled) return <Link className={className} href={href}>{content}</Link>;
  return <button className={className} type={type} onClick={onClick} disabled={disabled}>{content}</button>;
}

export function DamMetricCard({ label, value, trend, icon: Icon }: { label: string; value: ReactNode; trend?: ReactNode; icon?: LucideIcon }) {
  return (
    <article className="dam-metric-card">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {trend ? <small>{trend}</small> : null}
      </div>
      {Icon ? <span className="dam-metric-icon"><Icon size={18} strokeWidth={1.9} aria-hidden="true" /></span> : null}
    </article>
  );
}

export function DamUnavailablePreview({ title = "Preview unavailable", detail = "Open the record for source, derivative, and permission state." }: { title?: string; detail?: string }) {
  return (
    <div className="dam-unavailable-preview" role="status">
      <FileQuestion size={28} strokeWidth={1.9} aria-hidden="true" />
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}

export function DamRoleGateHint({ children }: { children: ReactNode }) {
  return (
    <div className="dam-role-gate-hint">
      <LockKeyhole size={16} strokeWidth={1.9} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function DamEvidenceCard({ title, children, tone = "info" }: { title: string; children: ReactNode; tone?: StatusTone }) {
  return (
    <section className={cn("dam-evidence-card", `is-${tone}`)}>
      <DamStatusBadge tone={tone}>{title}</DamStatusBadge>
      <div>{children}</div>
    </section>
  );
}

export function DamTableShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("dam-table-shell", className)}>{children}</div>;
}

export function DamStatTrend({ children, tone = "approved" }: { children: ReactNode; tone?: StatusTone }) {
  return <span className={cn("dam-stat-trend", `is-${tone}`)}>{children}</span>;
}

export { DamActionBar as DamStickyActionBar, DamActionButton as DamStickyActionButton } from "./ActionBar";
export { DamTabs as DamSectionTabs } from "@/components/DamTabs";
