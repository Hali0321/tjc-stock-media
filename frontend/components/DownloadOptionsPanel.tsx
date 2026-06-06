"use client";

import { useState } from "react";
import { Download, FileLock2, Image as ImageIcon, Mail, Square, View } from "lucide-react";
import { ReuseRequestDialog } from "@/components/ReuseRequestDialog";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import { assetMetadataHealth } from "@/lib/asset-governance";
import { downloadState } from "@/lib/presentation";
import { cn } from "@/lib/ui";

type RequestKind = "original" | "review" | "coworker";

export function DownloadOptionsPanel({ asset, role }: { asset: StockMediaAsset; role: DemoRole }) {
  const [requestKind, setRequestKind] = useState<RequestKind | null>(null);
  const state = downloadState(asset, role);
  const health = assetMetadataHealth(asset);
  const downloadHref = `/api/download/${asset.id}?role=${encodeURIComponent(role)}`;
  const assetTitle = asset.title || asset.resourceSpaceId || asset.id;
  const resourceSpaceId = asset.resourceSpaceId || asset.id;
  const requestLinks: Record<RequestKind, string> = {
    original: `mailto:media@tjc.org?subject=Original access request for ${encodeURIComponent(assetTitle)}&body=ResourceSpace ID: ${encodeURIComponent(resourceSpaceId)}%0ARequest:%20Original/master access%0AReason:%20`,
    review: `mailto:media@tjc.org?subject=Review request for ${encodeURIComponent(assetTitle)}&body=ResourceSpace ID: ${encodeURIComponent(resourceSpaceId)}%0ARaw status: ${encodeURIComponent(asset.status)}%0APortal state: ${encodeURIComponent(state.reuse.label)}%0AReason:%20`,
    coworker: `mailto:media@tjc.org?subject=TJC Stock Media asset question&body=ResourceSpace ID: ${encodeURIComponent(resourceSpaceId)}%0AAsset: ${encodeURIComponent(assetTitle)}%0AQuestion:%20`
  };
  const options = [
    { label: "Web image", detail: "Good for website articles and newsletters.", icon: ImageIcon, available: state.approvedCopy.allowed },
    { label: "Slide / presentation", detail: "Dedicated slide derivative can be configured. Current approved copy is available.", icon: View, available: false },
    { label: "Social square", detail: "Square derivative is not configured yet.", icon: Square, available: false }
  ];

  return (
    <section className="min-w-0 dam-inspector p-4" aria-label="Download approved copy">
      <div className="mb-3">
        <h2 className="text-lg font-black">Reuse safely</h2>
        <p className="mt-1 text-sm font-semibold leading-snug text-tjc-muted">{state.panelLabel}</p>
      </div>
      {state.approvedCopy.allowed && health.missing.length ? (
        <div className="mb-3 rounded-lg border border-[#ead6a8] bg-[#fff8e8] p-3 text-sm leading-snug text-[#725216]">
          Download is allowed by approval status, but production use still has metadata warnings: {health.missing.join(", ")}.
        </div>
      ) : null}
      {!state.approvedCopy.allowed && state.reuse.blockers.length ? (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {state.reuse.blockers.slice(0, 5).map((blocker) => (
            <span className="rounded-md border border-[#ead6a8] bg-[#fff8e8] px-2 py-1 text-xs font-semibold text-[#725216]" key={blocker.code}>{blocker.label}</span>
          ))}
        </div>
      ) : null}
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
              {option.available ? <Download size={16} strokeWidth={1.8} aria-hidden="true" /> : <FileLock2 size={16} strokeWidth={1.8} aria-hidden="true" />}
            </>
          );
          return option.available ? (
            <a key={option.label} className="grid min-h-16 min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border border-[#8fc9a9] bg-[linear-gradient(180deg,#f2fff7,#dff3e8)] p-3 text-[#164d34] shadow-[0_12px_28px_rgba(6,63,57,.12)] transition hover:-translate-y-0.5 hover:bg-[#e4f4eb] active:translate-y-px" href={downloadHref}>
              {row}
            </a>
          ) : (
            <button key={option.label} className={cn("grid min-h-16 min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border border-tjc-line bg-white p-3 text-left text-[#5d665f]", index === 0 && !state.approvedCopy.allowed && "border-[#dfbd73] bg-[linear-gradient(180deg,#fff9ea,#fff1cf)] text-[#6f4608]")} type="button" disabled>
              {row}
            </button>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-[auto_1fr] gap-3 rounded-2xl border border-[#dfbd73] bg-[linear-gradient(180deg,#fff9ea,#fff1cf)] p-3 text-[#6f4608]">
        <FileLock2 size={18} strokeWidth={1.8} aria-hidden="true" />
        <div>
          <strong className="block font-semibold">Original/master restricted</strong>
          <span className="mt-1 block text-sm leading-snug">Master files stay in ResourceSpace and Google Shared Drive. Normal users receive approved copies only.</span>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        <button className="inline-flex min-h-10 w-full min-w-0 flex-wrap items-center justify-center gap-2 rounded-xl border border-[#c5d1c9] bg-white px-3 text-center text-sm font-black text-tjc-evergreen shadow-[0_1px_0_rgba(255,255,255,.9)_inset] transition hover:bg-[#eef7f1] active:translate-y-px" type="button" onClick={() => setRequestKind("original")}>
          <Mail size={16} strokeWidth={1.8} aria-hidden="true" />
          Request original access
        </button>
        <button className="inline-flex min-h-10 w-full min-w-0 flex-wrap items-center justify-center gap-2 rounded-xl border border-[#c5d1c9] bg-white px-3 text-center text-sm font-black text-tjc-evergreen shadow-[0_1px_0_rgba(255,255,255,.9)_inset] transition hover:bg-[#eef7f1] active:translate-y-px" type="button" onClick={() => setRequestKind("review")}>
          <Mail size={16} strokeWidth={1.8} aria-hidden="true" />
          Request review
        </button>
        <button className="inline-flex min-h-10 w-full min-w-0 flex-wrap items-center justify-center gap-2 rounded-xl border border-[#c5d1c9] bg-white px-3 text-center text-sm font-black text-tjc-evergreen shadow-[0_1px_0_rgba(255,255,255,.9)_inset] transition hover:bg-[#eef7f1] active:translate-y-px" type="button" onClick={() => setRequestKind("coworker")}>
          <Mail size={16} strokeWidth={1.8} aria-hidden="true" />
          Ask media coworker
        </button>
      </div>
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
    </section>
  );
}
