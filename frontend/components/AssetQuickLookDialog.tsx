"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Download, ExternalLink, FileLock2, ShieldAlert, X } from "lucide-react";
import { MediaPreview } from "@/components/MediaPreview";
import { StatusBadge, UsageBadge } from "@/components/StatusBadge";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import { assetPresentation, confidenceStates, detailImageUrl, downloadState, provenanceSummary } from "@/lib/presentation";
import { cn } from "@/lib/ui";

type AssetQuickLookDialogProps = {
  asset: StockMediaAsset;
  role: DemoRole;
  open: boolean;
  onClose: () => void;
};

export function AssetQuickLookDialog({ asset, role, open, onClose }: AssetQuickLookDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const display = assetPresentation(asset, role);
  const state = downloadState(asset, role);
  const preview = detailImageUrl(asset, role);
  const source = provenanceSummary(asset, role);
  const downloadHref = `/api/download/${asset.id}?role=${encodeURIComponent(role)}`;
  const primaryBlocker = state.reuse.blockers[0]?.label || state.approvedCopy.reason || "Reviewer approval required before reuse.";

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const id = window.setTimeout(() => closeRef.current?.focus(), 0);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('a, button, [tabindex]:not([tabindex="-1"])'))
        .filter((item) => !item.hasAttribute("disabled") && item.tabIndex !== -1);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKeyDown);
      window.setTimeout(() => previous?.focus(), 0);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#07100d]/42 p-3 backdrop-blur-[5px]" role="presentation" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className="grid max-h-[92dvh] w-full max-w-6xl overflow-hidden rounded-lg border border-[#9fb4a8] bg-white shadow-[0_24px_80px_rgba(7,16,13,.24)] lg:grid-cols-[minmax(0,1.25fr)_24rem]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`quick-look-${asset.id}-title`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="min-h-0 overflow-y-auto bg-white p-3">
          <div className="relative aspect-[4/3] min-h-64 overflow-hidden rounded-lg border border-[#d6dfd8] bg-[#eef1ed]">
            <MediaPreview
              src={preview}
              alt={asset.thumbnailAlt}
              label={preview ? "Preview pending" : "Preview restricted"}
              detail={preview ? undefined : primaryBlocker}
              className="px-4"
              imgClassName="h-full w-full object-contain"
              loading="eager"
            />
          </div>
          <div className="mt-3 grid gap-2 border-t border-[#d6dfd8] pt-3 text-tjc-ink">
            <span className="text-xs font-black uppercase tracking-[.06em] text-tjc-muted">Quick look</span>
            <h2 id={`quick-look-${asset.id}-title`} className="text-2xl font-black leading-tight">{display.title}</h2>
            <p className="text-sm font-semibold leading-relaxed text-tjc-muted">{display.cardSubtitle}</p>
          </div>
        </div>

        <aside className="min-h-0 overflow-y-auto p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-sm font-black text-tjc-evergreen">Reuse decision</span>
              <strong className="mt-1 block text-xl leading-tight text-tjc-ink">{state.reuse.label}</strong>
            </div>
            <button
              ref={closeRef}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-tjc-line bg-white text-tjc-muted transition hover:bg-[#eef7f1] hover:text-tjc-evergreen"
              type="button"
              onClick={onClose}
              aria-label="Close quick preview"
            >
              <X size={16} strokeWidth={1.9} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={asset.status} />
            <UsageBadge scope={asset.usageScope} />
            <span className="rounded-full border border-[#cad8cf] bg-white px-2.5 py-1 text-xs font-black text-tjc-evergreen tabular-nums">RS {asset.resourceSpaceId || asset.id}</span>
          </div>

          {state.approvedCopy.allowed ? (
            <a className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 dam-button-primary px-3 text-sm font-black transition active:translate-y-px" href={downloadHref}>
              <Download size={16} strokeWidth={1.9} aria-hidden="true" />
              Download approved copy
            </a>
          ) : (
            <div className="mt-4 grid grid-cols-[auto_1fr] gap-3 rounded-lg border border-[#dfbd73] bg-[#fffaf0] p-3 text-[#6f4608]">
              <FileLock2 size={18} strokeWidth={1.9} aria-hidden="true" />
              <span>
                <strong className="block text-sm font-black">Download blocked</strong>
                <span className="mt-1 block text-sm font-semibold leading-snug">{state.panelLabel}</span>
              </span>
            </div>
          )}

          <Link className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-tjc-line bg-white px-3 text-sm font-black text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px" href={`/assets/${asset.id}`}>
            <ExternalLink size={16} strokeWidth={1.9} aria-hidden="true" />
            Open trust record
          </Link>

          <dl className="mt-4 grid gap-3">
            <div className="rounded-lg border border-tjc-line bg-white p-3">
              <dt className="text-xs font-black uppercase tracking-[.06em] text-tjc-evergreen">Source</dt>
              <dd className="mt-1 text-sm font-semibold leading-snug text-tjc-muted">{source.publicLabel || "Source pending"}</dd>
            </div>
            <div className="rounded-lg border border-tjc-line bg-white p-3">
              <dt className="text-xs font-black uppercase tracking-[.06em] text-tjc-evergreen">Review</dt>
              <dd className="mt-1 text-sm font-semibold leading-snug text-tjc-muted">{display.reviewFacts.reviewLine}</dd>
            </div>
          </dl>

          {state.reuse.blockers.length ? (
            <div className="mt-4 rounded-lg border border-[#dfbd73] bg-[#fffaf0] p-3 text-[#725216]">
              <div className="flex items-start gap-2">
                <ShieldAlert size={18} strokeWidth={1.9} aria-hidden="true" className="mt-0.5 shrink-0" />
                <div>
                  <strong className="block text-sm font-black">Reuse blockers</strong>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {state.reuse.blockers.slice(0, 5).map((blocker) => (
                      <span key={blocker.code} className="rounded-md border border-[#e9c779] bg-white px-2 py-1 text-xs font-black">
                        {blocker.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-4 grid gap-2" aria-label="Metadata confidence">
            {confidenceStates(asset).map((item) => (
              <div key={item.key} className={cn("flex items-center justify-between gap-2 border-b border-[#d6dfd8] px-1 py-2 text-sm font-black", item.tone === "ok" ? "text-[#22563a]" : "text-[#725216]")}>
                <span>{item.label}</span>
                <span className="text-right text-xs">{item.state}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
