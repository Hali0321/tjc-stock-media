"use client";

import { useEffect, useMemo, useRef } from "react";
import { FileLock2, Mail, ShieldAlert, X } from "lucide-react";

type ReuseRequestKind = "original" | "review" | "coworker";

type ReuseRequestDialogProps = {
  open: boolean;
  kind: ReuseRequestKind;
  assetTitle: string;
  resourceSpaceId: string;
  rawStatus: string;
  portalReuseState: string;
  blockers: string[];
  mailtoHref: string;
  onCancel: () => void;
};

const requestCopy: Record<ReuseRequestKind, { kicker: string; title: string; body: string; action: string }> = {
  original: {
    kicker: "Original/master access",
    title: "Request original access",
    body: "Original and master files stay restricted in ResourceSpace and Google Shared Drive. This request does not grant access automatically.",
    action: "Open email request"
  },
  review: {
    kicker: "Reviewer help",
    title: "Request portal review",
    body: "A reviewer must resolve source, rights, people/minors, usage scope, and derivative readiness before blocked assets become reusable.",
    action: "Open review request"
  },
  coworker: {
    kicker: "Media coworker",
    title: "Ask a media coworker",
    body: "Use this when the reuse decision is unclear or when ministry context is missing. The portal will not change ResourceSpace state.",
    action: "Open email"
  }
};

export function ReuseRequestDialog({
  open,
  kind,
  assetTitle,
  resourceSpaceId,
  rawStatus,
  portalReuseState,
  blockers,
  mailtoHref,
  onCancel
}: ReuseRequestDialogProps) {
  const actionRef = useRef<HTMLAnchorElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const copy = requestCopy[kind];
  const visibleBlockers = useMemo(() => blockers.slice(0, 8), [blockers]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => actionRef.current?.focus(), 0);
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])'))
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
    };
  }, [onCancel, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#20221f]/38 p-3 backdrop-blur-[2px]" role="presentation" onMouseDown={onCancel}>
      <section
        ref={dialogRef}
        className="w-full max-w-xl overflow-hidden rounded-lg border border-tjc-line bg-white shadow-[0_18px_60px_rgba(32,34,31,.24)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reuse-request-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-tjc-line px-4 py-3">
          <div>
            <span className="text-sm font-semibold text-tjc-evergreen">{copy.kicker}</span>
            <h2 id="reuse-request-title" className="mt-1 text-xl font-semibold text-tjc-ink">{copy.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-tjc-muted">{copy.body}</p>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded-md text-tjc-muted hover:bg-[#f3f6f2]" type="button" onClick={onCancel} aria-label="Close request dialog">
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
              <span className="text-xs font-semibold uppercase text-tjc-muted">Current state</span>
              <strong className="mt-1 block text-sm text-tjc-ink">{rawStatus}</strong>
              <span className="mt-1 block text-xs font-semibold text-tjc-muted">{portalReuseState}</span>
            </div>
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-3 rounded-md border border-[#ead6a8] bg-[#fff8e8] p-3 text-[#725216]">
            {kind === "original" ? <FileLock2 size={18} strokeWidth={1.8} aria-hidden="true" /> : <ShieldAlert size={18} strokeWidth={1.8} aria-hidden="true" />}
            <div>
              <strong className="block text-sm">{kind === "original" ? "Original access is restricted" : "This does not approve reuse"}</strong>
              <span className="mt-1 block text-sm leading-relaxed">The request opens an email draft only. ResourceSpace status, portal reuse state, and pending review writes do not change here.</span>
            </div>
          </div>

          <section className="rounded-md border border-tjc-line bg-white p-3" aria-label="Current blocker summary">
            <h3 className="text-sm font-semibold text-tjc-evergreen">Current blockers</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {visibleBlockers.length ? (
                visibleBlockers.map((blocker) => (
                  <span className="rounded-md border border-[#ead6a8] bg-[#fff8e8] px-2 py-1 text-xs font-semibold text-[#725216]" key={blocker}>{blocker}</span>
                ))
              ) : (
                <span className="rounded-md border border-[#b8d9c6] bg-[#edf8f1] px-2 py-1 text-xs font-semibold text-[#22563a]">No current portal blockers</span>
              )}
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-tjc-line bg-[#fbfcfa] px-4 py-3">
          <button className="inline-flex min-h-10 items-center rounded-md border border-tjc-line bg-white px-4 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1]" type="button" onClick={onCancel}>
            Cancel
          </button>
          <a ref={actionRef} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-tjc-evergreen px-4 text-sm font-semibold text-white transition hover:bg-tjc-evergreen-2" href={mailtoHref}>
            <Mail size={16} strokeWidth={1.8} aria-hidden="true" />
            {copy.action}
          </a>
        </div>
      </section>
    </div>
  );
}
