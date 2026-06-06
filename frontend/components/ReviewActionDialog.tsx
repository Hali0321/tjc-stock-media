"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, ShieldCheck, X } from "lucide-react";

type ReviewActionDialogProps = {
  open: boolean;
  actionLabel: string;
  requestedStatus: string;
  assetTitle: string;
  resourceSpaceId: string;
  rawStatus: string;
  portalReuseState: string;
  blockers: string[];
  checklistSummary: string[];
  note: string;
  sourceReadOnly: boolean;
  submitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ReviewActionDialog({
  open,
  actionLabel,
  requestedStatus,
  assetTitle,
  resourceSpaceId,
  rawStatus,
  portalReuseState,
  blockers,
  checklistSummary,
  note,
  sourceReadOnly,
  submitting,
  onCancel,
  onConfirm
}: ReviewActionDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => confirmRef.current?.focus(), 0);
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter((item) => !item.hasAttribute("disabled") && item.tabIndex !== -1);
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
    };
  }, [onCancel, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#20221f]/38 p-3 backdrop-blur-[2px]" role="presentation" onMouseDown={onCancel}>
      <section
        ref={dialogRef}
        className="w-full max-w-2xl overflow-hidden rounded-lg border border-tjc-line bg-white shadow-[0_18px_60px_rgba(32,34,31,.24)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-action-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-tjc-line px-4 py-3">
          <div>
            <span className="text-sm font-semibold text-tjc-evergreen">Queue pending review write</span>
            <h2 id="review-action-title" className="mt-1 text-xl font-semibold text-tjc-ink">{actionLabel}</h2>
            <p className="mt-1 text-sm leading-relaxed text-tjc-muted">
              This queues a local pending write. ResourceSpace is not updated until API field mapping is configured.
            </p>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded-md text-tjc-muted hover:bg-[#f3f6f2]" type="button" onClick={onCancel} aria-label="Cancel review action">
            <X size={17} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-3 p-4">
          <div className="grid gap-2 rounded-md border border-tjc-line bg-[#fbfcfa] p-3 sm:grid-cols-2">
            <div>
              <span className="text-xs font-semibold uppercase text-tjc-muted">Asset</span>
              <strong className="mt-1 block text-sm text-tjc-ink">{assetTitle}</strong>
              <span className="mt-1 block text-xs font-semibold text-tjc-muted">ResourceSpace ID {resourceSpaceId}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-tjc-muted">Status change requested</span>
              <strong className="mt-1 block text-sm text-tjc-ink">{rawStatus} → {requestedStatus}</strong>
              <span className="mt-1 block text-xs font-semibold text-tjc-muted">{portalReuseState}</span>
            </div>
          </div>

          <div className="grid gap-2 rounded-md border border-[#ead6a8] bg-[#fff8e8] p-3 text-[#725216]">
            <div className="flex items-start gap-2">
              <AlertTriangle size={17} strokeWidth={1.8} aria-hidden="true" className="mt-0.5 shrink-0" />
              <div>
                <strong className="block text-sm">Pending, not final ResourceSpace truth</strong>
                <p className="mt-1 text-sm leading-relaxed">
                  {sourceReadOnly
                    ? "Current source is export-backed. This action creates an audit record in the local pending-write queue only."
                    : "This action still writes through the review route and must preserve ResourceSpace audit fields."}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <section className="rounded-md border border-tjc-line bg-white p-3" aria-label="Evidence checklist summary">
              <h3 className="text-sm font-semibold text-tjc-evergreen">Evidence confirmed</h3>
              <ul className="mt-2 grid gap-1.5 text-sm text-[#4d554d]">
                {checklistSummary.map((item) => (
                  <li className="flex gap-2" key={item}>
                    <ShieldCheck size={15} strokeWidth={1.8} aria-hidden="true" className="mt-0.5 shrink-0 text-tjc-evergreen" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-md border border-tjc-line bg-white p-3" aria-label="Current blockers">
              <h3 className="text-sm font-semibold text-tjc-evergreen">Current blockers</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {blockers.length ? (
                  blockers.slice(0, 8).map((blocker) => (
                    <span className="rounded-md border border-[#ead6a8] bg-[#fff8e8] px-2 py-1 text-xs font-semibold text-[#725216]" key={blocker}>{blocker}</span>
                  ))
                ) : (
                  <span className="rounded-md border border-[#b8d9c6] bg-[#edf8f1] px-2 py-1 text-xs font-semibold text-[#22563a]">No current blockers</span>
                )}
              </div>
            </section>
          </div>

          <section className="rounded-md border border-tjc-line bg-[#fbfcfa] p-3" aria-label="Review note preview">
            <h3 className="text-sm font-semibold text-tjc-evergreen">Review note</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#4d554d]">{note}</p>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-tjc-line bg-[#fbfcfa] px-4 py-3">
          <button className="inline-flex min-h-10 items-center rounded-md border border-tjc-line bg-white px-4 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1]" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            ref={confirmRef}
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-tjc-evergreen px-4 text-sm font-semibold text-white transition hover:bg-tjc-evergreen-2 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={onConfirm}
            disabled={submitting}
          >
            <ShieldCheck size={16} strokeWidth={1.8} aria-hidden="true" />
            {submitting ? "Queueing..." : "Queue pending review write"}
          </button>
        </div>
      </section>
    </div>
  );
}
