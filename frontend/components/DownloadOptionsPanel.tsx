"use client";

import { useState } from "react";
import { Download, FileLock2, Image as ImageIcon, Mail, Square, View } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { ReuseRequestDialog } from "@/components/ReuseRequestDialog";
import { toastDownloadBlocked } from "@/lib/tjc-toasts";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import { assetMetadataHealth } from "@/lib/asset-governance";
import { downloadState } from "@/lib/presentation";
import { cn } from "@/lib/ui";

type RequestKind = "original" | "review" | "coworker";

export function DownloadOptionsPanel({ asset, role }: { asset: StockMediaAsset; role: DemoRole }) {
  const [requestKind, setRequestKind] = useState<RequestKind | null>(null);
  const [blockedDialogOpen, setBlockedDialogOpen] = useState(false);
  const state = downloadState(asset, role);
  const health = assetMetadataHealth(asset);
  const downloadHref = `/api/download/${asset.id}?role=${encodeURIComponent(role)}`;
  const assetTitle = asset.title || asset.resourceSpaceId || asset.id;
  const resourceSpaceId = asset.resourceSpaceId || asset.id;
  const requestLinks: Record<RequestKind, string> = {
    original: `mailto:media@tjc.org?subject=Original access request for ${encodeURIComponent(assetTitle)}&body=ResourceSpace ID: ${encodeURIComponent(resourceSpaceId)}%0ARequest:%20Original/master access%0AReason:%20`,
    review: `mailto:media@tjc.org?subject=Review request for ${encodeURIComponent(assetTitle)}&body=ResourceSpace ID: ${encodeURIComponent(resourceSpaceId)}%0ARaw status: ${encodeURIComponent(asset.status)}%0AReuse state: ${encodeURIComponent(state.reuse.label)}%0AReason:%20`,
    coworker: `mailto:media@tjc.org?subject=TJC Stock Media asset question&body=ResourceSpace ID: ${encodeURIComponent(resourceSpaceId)}%0AAsset: ${encodeURIComponent(assetTitle)}%0AQuestion:%20`
  };
  const options = [
    { label: "Web image", detail: "Approved web copy for websites and newsletters.", icon: ImageIcon, available: state.approvedCopy.allowed, kind: "download" as const },
    { label: "Slide", detail: "Use approved copy in sermon slides and presentation decks.", icon: View, available: state.approvedCopy.allowed, kind: "download" as const },
    { label: "Social", detail: "Use approved copy for social posts where policy allows.", icon: Square, available: state.approvedCopy.allowed, kind: "download" as const },
    { label: "Original request", detail: "Original/master access stays a request, never a direct download.", icon: FileLock2, available: true, kind: "request" as const }
  ];

  return (
    <section className="min-w-0 rounded-[1.35rem] border border-[#d4ded7] bg-white p-4 shadow-[0_16px_38px_rgba(35,53,111,.055)]" aria-label="Download approved copy">
      <div className="mb-3">
        <h2 className="text-lg font-black">Download and requests</h2>
        <p className="mt-1 text-sm font-semibold leading-snug text-tjc-muted">{state.panelLabel}</p>
      </div>
      {state.approvedCopy.allowed ? (
        <a className="mb-3 flex min-h-14 items-center justify-center gap-2 rounded-full bg-tjc-evergreen px-4 text-sm font-black text-white shadow-[0_14px_30px_rgba(15,61,46,.2)] transition hover:bg-[#062d24] active:translate-y-px" href={downloadHref}>
          <Download size={17} strokeWidth={1.8} aria-hidden="true" />
          Download approved web copy
        </a>
      ) : (
        <div className="mb-3 rounded-2xl border border-[#dfbd73] bg-[#fff8e8] p-3 text-[#6f4608]" role="status">
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <FileLock2 size={18} strokeWidth={1.8} aria-hidden="true" />
            <div>
              <strong className="block text-sm font-black">Download unavailable</strong>
              <span className="mt-1 block text-sm font-semibold leading-snug">Request review from the decision card before using this asset.</span>
            </div>
          </div>
        </div>
      )}
      {state.approvedCopy.allowed && health.missing.length ? (
        <div className="mb-3 rounded-lg border border-[#ead6a8] bg-[#fffaf0] p-3 text-sm leading-snug text-[#725216]">
          Download is allowed by approval status, but production use still has metadata warnings: {health.missing.join(", ")}.
        </div>
      ) : null}
      {state.approvedCopy.allowed ? (
        <div className="grid gap-2">
          {options.map((option, index) => {
          const Icon = option.icon;
          const row = (
            <>
              <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
              <span className="grid min-w-0 gap-0.5">
                <strong className="font-semibold">{option.label}</strong>
                <small className="text-sm leading-snug">{index === 0 && !state.approvedCopy.allowed ? state.panelLabel : option.detail}</small>
              </span>
              {option.kind === "request" ? <Mail size={16} strokeWidth={1.8} aria-hidden="true" /> : option.available ? <Download size={16} strokeWidth={1.8} aria-hidden="true" /> : <FileLock2 size={16} strokeWidth={1.8} aria-hidden="true" />}
            </>
          );
          if (option.kind === "request") {
            return (
              <button key={option.label} className="grid min-h-14 min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border border-[#c5d1c9] bg-white p-3 text-left text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px" type="button" onClick={() => setRequestKind("original")}>
                {row}
              </button>
            );
          }
          return option.available ? (
            <a key={option.label} className="grid min-h-14 min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border border-[#8fc9a9] bg-[#f7fbf8] p-3 text-[#164d34] transition hover:bg-[#eef7f1] active:translate-y-px" href={downloadHref}>
              {row}
            </a>
          ) : (
            <button key={option.label} className={cn("grid min-h-14 min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border border-tjc-line bg-white p-3 text-left text-[#5d665f]", index === 0 && !state.approvedCopy.allowed && "border-[#dfbd73] bg-[#fffaf0] text-[#6f4608]")} type="button" disabled>
              {row}
            </button>
          );
          })}
        </div>
      ) : (
        <details className="rounded-2xl border border-[#d6dfd8] bg-[#fbfcfa] p-3 text-sm">
          <summary
            className="cursor-pointer font-black text-tjc-evergreen"
            onClick={() => {
              if (!blockedDialogOpen) toastDownloadBlocked(state.panelLabel, { label: "View why", onClick: () => setBlockedDialogOpen(true) });
            }}
          >
            Why can't I download?
          </summary>
          <div className="mt-3 grid gap-3">
            <p className="font-semibold leading-relaxed text-tjc-muted">Approved copies stay hidden until review clears role, rights, people/minors, and copy checks.</p>
            <button className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#c5d1c9] bg-white px-3 text-sm font-black text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px" type="button" onClick={() => setBlockedDialogOpen(true)}>
              View blocker details
            </button>
          </div>
        </details>
      )}
      {(state.approvedCopy.allowed || role !== "Viewer") ? <div className="mt-3 grid grid-cols-[auto_1fr] gap-3 rounded-2xl border border-[#dfbd73] bg-[#fffaf0] p-3 text-[#6f4608]">
        <FileLock2 size={18} strokeWidth={1.8} aria-hidden="true" />
        <div>
          <strong className="block font-semibold">Original/master restricted</strong>
          <span className="mt-1 block text-sm leading-snug">Master files stay in ResourceSpace and Google Shared Drive. Normal users receive approved copies only.</span>
        </div>
      </div> : null}
      {requestKind ? (
        <ReuseRequestDialog
          open={Boolean(requestKind)}
          kind={requestKind}
          assetTitle={assetTitle}
          resourceSpaceId={resourceSpaceId}
          rawStatus={asset.status}
          portalReuseState={state.reuse.label}
          blockers={state.reuse.blockers.map((blocker) => blocker.label)}
          mailtoHref={requestLinks[requestKind]}
          onCancel={() => setRequestKind(null)}
        />
      ) : null}
      <Dialog
        open={blockedDialogOpen}
        title="Download unavailable"
        description="This asset cannot be downloaded until portal reuse checks pass. ResourceSpace approval alone is not portal permission."
        onClose={() => setBlockedDialogOpen(false)}
        maxWidthClassName="max-w-xl"
        tone="warning"
        footer={(
          <>
            <button className="inline-flex min-h-10 items-center rounded-xl border border-tjc-line bg-white px-4 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1]" type="button" onClick={() => setBlockedDialogOpen(false)}>
              Close
            </button>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-full bg-tjc-evergreen px-4 text-sm font-semibold text-white transition hover:bg-tjc-evergreen-2" type="button" onClick={() => {
              setBlockedDialogOpen(false);
              setRequestKind("review");
            }}>
              <Mail size={16} strokeWidth={1.8} aria-hidden="true" />
              Request review
            </button>
          </>
        )}
      >
        <div className="grid gap-3">
          <div className="grid gap-2 rounded-xl border border-tjc-line bg-[#fbfcfa] p-3 sm:grid-cols-2">
            <div>
              <span className="text-xs font-semibold text-tjc-muted">Asset</span>
              <strong className="mt-1 block text-sm text-tjc-ink">{assetTitle}</strong>
              <span className="mt-1 block text-xs font-semibold text-tjc-muted">ResourceSpace ID {resourceSpaceId}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-tjc-muted">Current state</span>
              <strong className="mt-1 block text-sm text-tjc-ink">{asset.status}</strong>
              <span className="mt-1 block text-xs font-semibold text-tjc-muted">{state.reuse.label}</span>
            </div>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-3 rounded-xl border border-[#ead6a8] bg-[#fff8e8] p-3 text-[#725216]" data-dialog-safety-panel="true">
            <FileLock2 size={18} strokeWidth={1.8} aria-hidden="true" />
            <div>
              <strong className="block text-sm">No active download was exposed</strong>
              <span className="mt-1 block text-sm leading-relaxed">Viewer download remains blocked by source, rights, people/minors, reviewer/date, approved-copy, and role checks. Original/master files stay restricted.</span>
            </div>
          </div>
          <section className="rounded-xl border border-tjc-line bg-white p-3" aria-label="Download blocker reasons">
            <h3 className="text-sm font-semibold text-tjc-evergreen">Blocking reasons</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {state.reuse.blockers.length ? state.reuse.blockers.slice(0, 8).map((blocker) => (
                <span className="rounded-md border border-[#ead6a8] bg-[#fff8e8] px-2 py-1 text-xs font-semibold text-[#725216]" key={blocker.code}>{blocker.label}</span>
              )) : (
                <span className="rounded-md border border-[#b8d9c6] bg-[#edf8f1] px-2 py-1 text-xs font-semibold text-[#22563a]">No current portal blockers</span>
              )}
            </div>
          </section>
        </div>
      </Dialog>
    </section>
  );
}
