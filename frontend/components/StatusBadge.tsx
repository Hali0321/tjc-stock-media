import { createElement, isValidElement, type ElementType, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, CircleDashed, Download, Eye, FileCheck2, FileX2, Lock, ShieldAlert } from "lucide-react";
import type { StockMediaAsset } from "@/lib/types";
import { buildReuseDecision } from "@/lib/reuse-policy";
import { cn } from "@/lib/ui";

type TjcStatusDomain = "reuse" | "rights" | "review" | "visibility" | "source" | "download" | "raw";
type TjcStatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "pending";
type TjcStatusSize = "xs" | "sm" | "md";

export type TjcStatusBadgeProps = {
  domain: TjcStatusDomain;
  status: string;
  size?: TjcStatusSize;
  tone?: TjcStatusTone;
  icon?: ElementType | ReactNode;
  label: string;
  tooltip?: string;
};

const statusLabels: Record<StockMediaAsset["status"], string> = {
  "Approved Public": "ResourceSpace Approved Public",
  "Approved Internal": "ResourceSpace Approved Internal",
  "Needs Review": "Please review before public sharing",
  "Searchable Archive": "Archive only",
  "Do Not Use": "Do not publish externally",
  "Possible Minors": "Contains children/youth"
};

const usageLabels: Record<StockMediaAsset["usageScope"], string> = {
  Public: "Church-wide use",
  Internal: "Internal ministry use",
  "Public and Internal": "Church-wide and internal",
  "Archive Only": "Archive only",
  "Do Not Publish": "Do not publish yet",
  "Do Not Use": "Do not use"
};

const toneClasses: Record<TjcStatusTone, string> = {
  success: "border-[#b8d9c6] bg-[#edf8f1] text-[#22563a]",
  warning: "border-[#ead6a8] bg-[#fff7e5] text-[#725216]",
  danger: "border-[#e5c0bc] bg-[#fff0ee] text-[#863530]",
  info: "border-[#bdd9e2] bg-[#eef8fb] text-[#0b5f7a]",
  neutral: "border-tjc-line bg-white/80 text-[#405048]",
  pending: "border-[#e0c98d] bg-[#fffaf0] text-[#7a5a19]"
};

const sizeClasses: Record<TjcStatusSize, string> = {
  xs: "min-h-6 gap-1 rounded-full px-2 text-[11px]",
  sm: "min-h-7 gap-1.5 rounded-full px-2.5 text-xs",
  md: "min-h-8 gap-2 rounded-full px-3 text-sm"
};

const rawStatusTones: Record<StockMediaAsset["status"], TjcStatusTone> = {
  "Approved Public": "success",
  "Approved Internal": "info",
  "Needs Review": "warning",
  "Searchable Archive": "neutral",
  "Do Not Use": "danger",
  "Possible Minors": "warning"
};

const usageTones: Record<StockMediaAsset["usageScope"], TjcStatusTone> = {
  Public: "success",
  Internal: "info",
  "Public and Internal": "success",
  "Archive Only": "neutral",
  "Do Not Publish": "danger",
  "Do Not Use": "danger"
};

export function TjcStatusBadge({
  domain,
  status,
  size = "sm",
  tone = "neutral",
  icon: Icon,
  label,
  tooltip
}: TjcStatusBadgeProps) {
  const iconNode = isValidElement(Icon)
    ? Icon
    : (typeof Icon === "function" || (typeof Icon === "object" && Icon && "$$typeof" in Icon))
      ? createElement(Icon as ElementType, { className: "h-3.5 w-3.5 shrink-0", "aria-hidden": "true" })
      : null;
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center border font-bold leading-none",
        toneClasses[tone],
        sizeClasses[size]
      )}
      title={tooltip || `${domain}: ${status}`}
      data-domain={domain}
      data-status={status}
    >
      {iconNode ? <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center" aria-hidden="true">{iconNode}</span> : null}
      <span className="truncate">{label}</span>
    </span>
  );
}

export function StatusBadge({ status }: { status: StockMediaAsset["status"] }) {
  return (
    <RawStatusBadge status={status} />
  );
}

export function UsageBadge({ scope }: { scope: StockMediaAsset["usageScope"] }) {
  return (
    <TjcStatusBadge
      domain="visibility"
      status={scope}
      tone={usageTones[scope]}
      icon={scope.includes("Do Not") ? FileX2 : Eye}
      label={usageLabels[scope]}
      tooltip={`Usage scope: ${scope}`}
    />
  );
}

export function RawStatusBadge({ status }: { status: StockMediaAsset["status"] }) {
  const icon =
    status === "Approved Public" || status === "Approved Internal"
      ? FileCheck2
      : status === "Do Not Use"
        ? FileX2
        : status === "Searchable Archive"
          ? Lock
          : AlertTriangle;
  return (
    <TjcStatusBadge
      domain="raw"
      status={status}
      tone={rawStatusTones[status]}
      icon={icon}
      label={statusLabels[status]}
      tooltip={`Raw ResourceSpace status: ${status}`}
    />
  );
}

const reuseStateLabels: Record<string, string> = {
  portal_ready: "Portal Ready",
  portalReady: "Portal Ready",
  "portal-ready": "Portal Ready",
  internal_ready: "Internal Ready",
  "internal-ready": "Internal Ready",
  needs_portal_review: "Needs portal review",
  preview_only: "Preview only",
  blocked: "Blocked",
  archive_only: "Archive only",
  do_not_publish: "Do not publish"
};

export function ReuseStateBadge({ asset, state }: { asset?: StockMediaAsset; state?: string }) {
  const decision = asset ? buildReuseDecision(asset) : null;
  const status = decision?.state || state || "needs_portal_review";
  const label = decision?.label || reuseStateLabels[status] || status;
  const tone: TjcStatusTone =
    status === "portal-ready" || status === "portal_ready"
      ? "success"
      : status === "internal-ready" || status === "internal_ready"
        ? "info"
        : status.startsWith("blocked") || status === "do_not_publish"
          ? "danger"
          : status === "preview-only" || status === "preview_only" || status === "archive_only"
            ? "neutral"
            : "warning";
  const icon = decision?.downloadable ? CheckCircle2 : status.startsWith("blocked") ? ShieldAlert : CircleDashed;
  return (
    <TjcStatusBadge
      domain="reuse"
      status={status}
      tone={tone}
      icon={icon}
      label={label}
      tooltip={`Portal reuse state: ${decision?.summary || label}`}
    />
  );
}

export function RightsBadge({ asset, state }: { asset?: StockMediaAsset; state?: string }) {
  const rights = state || asset?.rightsStatus || asset?.consentStatus || "Unknown";
  const tone: TjcStatusTone = /clear|approved|confirmed/i.test(rights) ? "success" : /missing|concern|blocked/i.test(rights) ? "danger" : /restricted|internal/i.test(rights) ? "info" : "warning";
  return <TjcStatusBadge domain="rights" status={rights} tone={tone} icon={Lock} label={rights} tooltip={`Rights status: ${rights}`} />;
}

export function ReviewBadge({ asset, state }: { asset?: StockMediaAsset; state?: string }) {
  const status = state || (asset?.pendingReviewWrite ? "Pending Write" : asset?.reviewer && asset?.reviewedDate ? "Review Complete" : "Needs Review");
  const tone: TjcStatusTone = status === "Review Complete" ? "success" : status === "Pending Write" ? "pending" : "warning";
  return <TjcStatusBadge domain="review" status={status} tone={tone} icon={status === "Review Complete" ? CheckCircle2 : CircleDashed} label={status} />;
}

export function VisibilityBadge({ asset, state }: { asset?: StockMediaAsset; state?: string }) {
  const status = state || asset?.peopleRisk || "People Unknown";
  const tone: TjcStatusTone = /children|youth|sensitive/i.test(status) ? "danger" : status === "Possible minors" || status === "Unknown" || /unknown/i.test(status) ? "warning" : "success";
  return <TjcStatusBadge domain="visibility" status={status} tone={tone} icon={Eye} label={status} tooltip={`People/minors visibility: ${status}`} />;
}

export function DownloadBadge({ asset, state }: { asset?: StockMediaAsset; state?: string }) {
  const decision = asset ? buildReuseDecision(asset) : null;
  const allowed = decision?.downloadable || state === "allowed";
  return (
    <TjcStatusBadge
      domain="download"
      status={allowed ? "allowed" : "blocked"}
      tone={allowed ? "success" : "danger"}
      icon={allowed ? Download : FileX2}
      label={allowed ? "Download approved copy" : "Download blocked"}
      tooltip={allowed ? "Approved copy can be downloaded by allowed roles." : decision?.summary || "Download blocked by portal reuse policy."}
    />
  );
}
