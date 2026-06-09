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
  opsView?: boolean;
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

function viewerRequestCopy(kind: ReuseRequestKind) {
  if (kind === "original") {
    return {
      kicker: "Source-file access",
      title: "Request source-file access",
      description: "Source files stay restricted. This request asks the media team for access and does not grant access automatically.",
      action: "Open email request"
    };
  }
  if (kind === "review") {
    return {
      kicker: "Review needed",
      title: "Request DAM review",
      description: "A reviewer must clear source, rights, people/youth, use guidance, and approved-copy checks before this media becomes reusable.",
      action: "Open review request"
    };
  }
  return {
    kicker: "Media team",
    title: "Ask media team",
    description: "Use this when approval, source, people/youth, or ministry context is unclear.",
    action: "Open email"
  };
}

function viewerBlockerLabel(blocker: string) {
  if (/rights|consent/i.test(blocker)) return "Rights or permission details need review";
  if (/people|minor|youth|children/i.test(blocker)) return "People/youth visibility needs review";
  if (/derivative|copy|rendition/i.test(blocker)) return "Approved copy is missing";
  if (/source|provenance/i.test(blocker)) return "Source details need confirmation";
  if (/reviewer|date|evidence/i.test(blocker)) return "Reviewer evidence is incomplete";
  if (/archive|do not use/i.test(blocker)) return "Not available for reuse";
  if (/sensitive/i.test(blocker)) return "Ministry context needs review";
  return blocker;
}

export function ReuseRequestDialog({ open, kind, assetTitle, resourceSpaceId, rawStatus, portalReuseState, blockers, mailtoHref, opsView = false, onCancel }: ReuseRequestDialogProps) {
  const copy = requestCopy[kind];
  const viewerCopy = viewerRequestCopy(kind);
  const visibleBlockers = useMemo(() => (opsView ? blockers : blockers.map(viewerBlockerLabel)).slice(0, 8), [blockers, opsView]);
  const description = opsView
    ? copy.body
    : viewerCopy.description;

  return (
    <Dialog
      open={open}
      title={opsView ? copy.title : viewerCopy.title}
      description={description}
      onClose={onCancel}
      closeLabel="Close request dialog"
      maxWidthClassName="max-w-xl"
      tone={kind === "original" ? "warning" : "neutral"}
      footer={(
        <>
          <button className="inline-flex min-h-10 items-center rounded-md border border-tjc-line bg-white px-4 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1]" type="button" onClick={onCancel}>
            Cancel
          </button>
          <a className="inline-flex min-h-10 items-center gap-2 rounded-md bg-tjc-evergreen px-4 text-sm font-semibold text-white transition hover:bg-tjc-evergreen-2" href={mailtoHref}>
            <Mail size={16} strokeWidth={1.8} aria-hidden="true" />
            {opsView ? copy.action : viewerCopy.action}
          </a>
        </>
      )}
    >
      <div className="grid gap-3">
        <span className="w-fit rounded-md border border-[#bdd9e2] bg-[#eef8fb] px-3 py-1 text-xs font-black text-[#0b5f7a]">{opsView ? copy.kicker : viewerCopy.kicker}</span>
        <div className="grid gap-2 rounded-md border border-tjc-line bg-[#fbfcfa] p-3 sm:grid-cols-2">
          <div>
            <span className="text-xs font-semibold text-tjc-muted">Asset</span>
            <strong className="mt-1 block text-sm text-tjc-ink">{assetTitle}</strong>
            <span className="mt-1 block text-xs font-semibold text-tjc-muted">{opsView ? `ResourceSpace ID ${resourceSpaceId}` : `Reference code ${resourceSpaceId}`}</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-tjc-muted">{opsView ? "Current state" : "Use state"}</span>
            <strong className="mt-1 block text-sm text-tjc-ink">{opsView ? rawStatus : portalReuseState}</strong>
            {opsView ? <span className="mt-1 block text-xs font-semibold text-tjc-muted">{portalReuseState}</span> : null}
          </div>
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-3 rounded-md border border-[#ead6a8] bg-[#fff8e8] p-3 text-[#725216]">
          {kind === "original" ? <FileLock2 size={18} strokeWidth={1.8} aria-hidden="true" /> : <ShieldAlert size={18} strokeWidth={1.8} aria-hidden="true" />}
          <div>
            <strong className="block text-sm">{kind === "original" ? "Original access is restricted" : "This does not approve reuse"}</strong>
            <span className="mt-1 block text-sm leading-relaxed">
              {opsView
                ? "The request opens an email draft only. ResourceSpace status, portal reuse state, and pending review writes do not change here."
                : "The request opens an email draft only. Download access and review status do not change here."}
            </span>
          </div>
        </div>

        <section className="rounded-md border border-tjc-line bg-white p-3" aria-label="Current blocker summary">
          <h3 className="text-sm font-semibold text-tjc-evergreen">{opsView ? "Current blockers" : "What reviewer will check"}</h3>
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
