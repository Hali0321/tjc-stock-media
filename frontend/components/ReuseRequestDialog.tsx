"use client";

import { FileLock2, Mail, ShieldAlert } from "lucide-react";
import { useMemo } from "react";
import { Dialog } from "@/components/Dialog";

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
    title: "Request review",
    body: "A reviewer must resolve source, rights, people/minors, usage scope, and approved-copy readiness before blocked assets become reusable.",
    action: "Open review request"
  },
  coworker: {
    kicker: "Media coworker",
    title: "Ask a media coworker",
    body: "Use this when the reuse decision is unclear or when ministry context is missing. The portal will not change ResourceSpace state.",
    action: "Open email"
  }
};

export function ReuseRequestDialog({ open, kind, assetTitle, resourceSpaceId, rawStatus, portalReuseState, blockers, mailtoHref, onCancel }: ReuseRequestDialogProps) {
  const copy = requestCopy[kind];
  const visibleBlockers = useMemo(() => blockers.slice(0, 8), [blockers]);

  return (
    <Dialog
      open={open}
      title={copy.title}
      description={copy.body}
      onClose={onCancel}
      closeLabel="Close request dialog"
      maxWidthClassName="max-w-xl"
      tone={kind === "original" ? "warning" : "neutral"}
      footer={(
        <>
          <button className="inline-flex min-h-10 items-center rounded-xl border border-tjc-line bg-white px-4 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1]" type="button" onClick={onCancel}>
            Cancel
          </button>
          <a className="inline-flex min-h-10 items-center gap-2 rounded-full bg-tjc-evergreen px-4 text-sm font-semibold text-white transition hover:bg-tjc-evergreen-2" href={mailtoHref}>
            <Mail size={16} strokeWidth={1.8} aria-hidden="true" />
            {copy.action}
          </a>
        </>
      )}
    >
      <div className="grid gap-3">
        <span className="w-fit rounded-full border border-[#bdd9e2] bg-[#eef8fb] px-3 py-1 text-xs font-black text-[#0b5f7a]">{copy.kicker}</span>
        <div className="grid gap-2 rounded-xl border border-tjc-line bg-[#fbfcfa] p-3 sm:grid-cols-2">
          <div>
            <span className="text-xs font-semibold text-tjc-muted">Asset</span>
            <strong className="mt-1 block text-sm text-tjc-ink">{assetTitle}</strong>
            <span className="mt-1 block text-xs font-semibold text-tjc-muted">ResourceSpace ID {resourceSpaceId}</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-tjc-muted">Current state</span>
            <strong className="mt-1 block text-sm text-tjc-ink">{rawStatus}</strong>
            <span className="mt-1 block text-xs font-semibold text-tjc-muted">{portalReuseState}</span>
          </div>
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-3 rounded-xl border border-[#ead6a8] bg-[#fff8e8] p-3 text-[#725216]">
          {kind === "original" ? <FileLock2 size={18} strokeWidth={1.8} aria-hidden="true" /> : <ShieldAlert size={18} strokeWidth={1.8} aria-hidden="true" />}
          <div>
            <strong className="block text-sm">{kind === "original" ? "Original access is restricted" : "This does not approve reuse"}</strong>
            <span className="mt-1 block text-sm leading-relaxed">The request opens an email draft only. ResourceSpace status, portal reuse state, and pending review writes do not change here.</span>
          </div>
        </div>

        <section className="rounded-xl border border-tjc-line bg-white p-3" aria-label="Current blocker summary">
          <h3 className="text-sm font-semibold text-tjc-evergreen">Current blockers</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {visibleBlockers.length ? (
              visibleBlockers.map((blocker) => (
                <span className="rounded-md border border-[#ead6a8] bg-[#fff8e8] px-2 py-1 text-xs font-semibold text-[#725216]" key={blocker}>{blocker}</span>
              ))
            ) : (
              <span className="rounded-md border border-[#b8d9c6] bg-[#edf8f1] px-2 py-1 text-xs font-semibold text-[#22563a]">No current blockers</span>
            )}
          </div>
        </section>
      </div>
    </Dialog>
  );
}
