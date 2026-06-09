"use client";

import { Download, FileLock2, Hash, Info, Mail } from "lucide-react";
import { DamPrimaryAction as PrimaryAction, DamRecordStatusBadge as StatusBadge } from "@/components/dam/DamWorkspace";
import { AssetActionsMenu } from "@/components/AssetActionsMenu";
import { AssetTrustPanel } from "@/components/AssetTrustPanel";
import { DownloadOptionsPanel } from "@/components/DownloadOptionsPanel";
import { MediaPreviewPanel } from "@/components/MediaPreviewPanel";
import { ReuseRequestDialog } from "@/components/ReuseRequestDialog";
import { cn } from "@/lib/ui";
import { requestReviewMailto, viewerVerdictForAsset, type ViewerVerdict } from "@/lib/viewer-verdict";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import type { ReactNode } from "react";

export function ProtectedPreview({
  label = "Preview protected",
  detail = "Open the media record for review status.",
  signals = ["Reuse check required", "Approved copy only", "Source file restricted"],
  className
}: {
  label?: string;
  detail?: string;
  signals?: string[];
  className?: string;
}) {
  return (
    <div className={cn("protected-preview grid h-full min-h-56 place-items-center overflow-hidden rounded-2xl bg-[#eef3ef] p-6 text-center", className)}>
      <div className="protected-preview-material grid w-full max-w-[44rem] gap-3">
        <div className="protected-preview-frame relative grid min-h-[12rem] w-full place-items-center overflow-hidden rounded-2xl border border-white/70 bg-white/68 p-4">
          <div className="protected-preview-watermark" aria-hidden="true">
            <span>Protected record</span>
            <span>Preview withheld</span>
            <span>Review required</span>
          </div>
          <div className="absolute inset-2 grid grid-cols-5 gap-1 opacity-70" aria-hidden="true">
            {Array.from({ length: 20 }).map((_, index) => (
              <span className="rounded bg-[#e7eee9]" key={index} />
            ))}
          </div>
          <div className="absolute inset-4 rounded-xl border border-dashed border-[#9eb0a7] bg-white/38 backdrop-blur-[1px]" aria-hidden="true" />
          <div className="protected-preview-lock-card relative z-[1] grid max-w-[24rem] justify-items-center gap-3 rounded-xl border border-[#dce5df] bg-white/94 px-5 py-4 shadow-[0_16px_40px_rgba(15,61,46,.10)]">
            <span className="inline-flex items-center gap-2 rounded-lg border border-[#cbd5e1] bg-white px-2.5 py-1 text-xs font-black text-tjc-evergreen">
              <FileLock2 size={14} strokeWidth={1.8} aria-hidden="true" />
              Protected preview
            </span>
            <span>
              <strong className="block text-lg font-black text-tjc-ink">{label}</strong>
              <span className="mt-1 block text-sm font-semibold leading-snug text-tjc-muted">{detail}</span>
            </span>
          </div>
          <div className="protected-preview-stage-notes" aria-hidden="true">
            <span>Open verdict first</span>
            <span>Approved copy only</span>
            <span>Source file by request</span>
          </div>
        </div>
        <ul className="protected-preview-signals" aria-label="Preview safety checks">
          {signals.map((signal) => (
            <li key={signal}>{signal}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function VerdictPanel({
  verdict,
  title,
  onRequestReview,
  requestHref,
  compact
}: {
  verdict: ViewerVerdict;
  title?: string;
  onRequestReview?: () => void;
  requestHref?: string;
  compact?: boolean;
}) {
  function secondaryActionProps(action: string) {
    if (action === "View credit") return { href: "#credit", icon: Info };
    if (action === "View use guidance") return { href: "#use-guidance", icon: Info };
    return requestHref ? { href: requestHref, icon: action.includes("source") ? FileLock2 : Mail } : { onClick: onRequestReview, icon: action.includes("source") ? FileLock2 : Mail };
  }
  return (
    <section className={cn("verdict-panel grid gap-4 rounded-2xl border p-4", compact ? "p-3" : "p-5", verdict.tone === "ready" ? "border-[#b9d8c6] bg-[#eef8f2] text-[#194f34]" : verdict.tone === "unavailable" ? "border-[#dfb9b5] bg-[#fff1ef] text-[#7b332f]" : "border-[#e5cf93] bg-[#fff8e8] text-[#71500f]")} data-testid="asset-primary-verdict">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black">{title || "Can I use this?"}</span>
        <StatusBadge tone={verdict.tone}>{verdict.label}</StatusBadge>
      </div>
      <div className="min-w-0">
        <h2 className="text-3xl font-black leading-tight text-current">{verdict.title}</h2>
        <p className="mt-2 max-w-[62ch] text-sm font-semibold leading-relaxed opacity-90">{verdict.reason}</p>
      </div>
      <div className="grid gap-2">
        {verdict.canDownload ? (
          <PrimaryAction href={verdict.downloadHref} icon={Download}>Download approved copy</PrimaryAction>
        ) : (
          <PrimaryAction href={requestHref} onClick={requestHref ? undefined : onRequestReview} icon={Mail}>Request DAM review</PrimaryAction>
        )}
        <div className="flex flex-wrap gap-2">
          {verdict.secondaryActions.slice(0, 2).map((action) => {
            return <PrimaryAction key={action} tone="secondary" {...secondaryActionProps(action)}>{action}</PrimaryAction>;
          })}
        </div>
      </div>
    </section>
  );
}

export function ViewerReadyHint({ asset, role }: { asset: StockMediaAsset; role: DemoRole }) {
  const verdict = viewerVerdictForAsset(asset, role);
  return (
    <div className={cn("rounded-2xl border px-3 py-2 text-sm font-semibold", verdict.tone === "ready" ? "border-[#b9d8c6] bg-[#eef8f2] text-[#194f34]" : "border-[#e5cf93] bg-[#fff8e8] text-[#71500f]")}>
      <strong className="block font-black">{verdict.label}</strong>
      <span className="mt-1 block">{verdict.reason}</span>
    </div>
  );
}

function RecordCommandHeader({
  eyebrow = "Media record",
  title,
  subtitle,
  referenceLabel = "Reference code",
  reference,
  children
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  reference?: string;
  referenceLabel?: string;
  children?: ReactNode;
}) {
  return (
    <section className="record-command-header" aria-label="Media record command header">
      <div className="record-command-copy">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div className="record-command-side">
        {reference ? (
          <div className="record-reference-chip">
            <Hash size={14} strokeWidth={1.9} aria-hidden="true" />
            <span>{referenceLabel}</span>
            <strong>{reference}</strong>
          </div>
        ) : null}
        {children ? <div className="record-command-actions">{children}</div> : null}
      </div>
    </section>
  );
}

function RecordLedger({
  items
}: {
  items: Array<{ label: string; value?: ReactNode }>;
}) {
  return (
    <dl className="record-ledger" aria-label="Record summary">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value || "Not provided"}</dd>
        </div>
      ))}
    </dl>
  );
}

function RecordPreviewStage({
  title,
  subtitle,
  status,
  children,
  filmstrip
}: {
  title: string;
  subtitle?: string;
  status: string;
  children: ReactNode;
  filmstrip?: ReactNode;
}) {
  return (
    <section className="record-stage-console" aria-label="Protected media preview stage">
      <header className="record-stage-header">
        <div>
          <span>Preview stage</span>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <dl>
          <div>
            <dt>Stage status</dt>
            <dd>{status}</dd>
          </div>
          <div>
            <dt>Reuse rule</dt>
            <dd>Open verdict first</dd>
          </div>
        </dl>
      </header>
      <div className="record-stage-canvas">
        {children}
      </div>
      {filmstrip ? <div className="record-stage-filmstrip">{filmstrip}</div> : null}
    </section>
  );
}

function RecordFilmstrip({
  children
}: {
  children: ReactNode;
}) {
  return (
    <div className="record-filmstrip" aria-label="Record media strip">
      {children}
    </div>
  );
}

function RecordMetadataSection({
  title,
  children,
  className,
  id
}: {
  title: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("dam-record-section rounded-2xl border border-[#e1e8e2] bg-white p-5", className)}>
      <h2 className="text-xl font-black text-tjc-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function RecordMetadataRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="dam-record-row border-t border-[#e2e9e3] pt-3 first:border-t-0 first:pt-0">
      <dt className="text-sm font-black text-tjc-evergreen">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold leading-relaxed text-tjc-muted">{value || "Not provided"}</dd>
    </div>
  );
}

function RecordActions({ children }: { children: ReactNode }) {
  return (
    <div className="dam-record-actions flex flex-wrap items-center gap-3">
      {children}
    </div>
  );
}

export { StatusBadge as DamRecordStatusBadge };
export { ProtectedPreview as DamProtectedPreview, VerdictPanel as DamVerdictPanel, ViewerReadyHint as DamViewerReadyHint };
export { RecordActions as DamRecordActions, RecordCommandHeader as DamRecordCommandHeader, RecordFilmstrip as DamRecordFilmstrip, RecordLedger as DamRecordLedger, RecordMetadataRow as DamRecordMetadataRow, RecordMetadataSection as DamRecordMetadataSection, RecordPreviewStage as DamRecordPreviewStage };
export { AssetActionsMenu as DamAssetActionsMenu };
export { AssetTrustPanel as DamAssetTrustPanel };
export { DownloadOptionsPanel as DamDownloadOptionsPanel };
export { MediaPreviewPanel as DamMediaPreviewPanel };
export { ReuseRequestDialog as DamReuseRequestDialog };
export { requestReviewMailto };
