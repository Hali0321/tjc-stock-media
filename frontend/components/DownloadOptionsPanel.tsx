"use client";

import { Download, FileLock2, Image as ImageIcon, Mail, Square, View } from "lucide-react";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import { downloadState } from "@/lib/presentation";
import { cn } from "@/lib/ui";

export function DownloadOptionsPanel({ asset, role }: { asset: StockMediaAsset; role: DemoRole }) {
  const state = downloadState(asset, role);
  const downloadHref = `/api/download/${asset.id}?role=${encodeURIComponent(role)}`;
  const options = [
    { label: "Web image", detail: "Good for website articles and newsletters.", icon: ImageIcon, available: state.approvedCopy.allowed },
    { label: "Slide / presentation", detail: "Dedicated slide derivative can be configured. Current approved copy is available.", icon: View, available: false },
    { label: "Social square", detail: "Square derivative is not configured yet.", icon: Square, available: false }
  ];

  return (
    <section className="rounded-lg border border-tjc-line bg-white/82 p-4 shadow-[0_1px_0_rgba(32,34,31,.04)]" aria-label="Download approved copy">
      <div className="mb-3">
        <h2 className="text-lg font-semibold tracking-[-.01em]">Reuse safely</h2>
        <p className="mt-1 text-sm leading-snug text-tjc-muted">{state.panelLabel}</p>
      </div>
      <div className="grid gap-2">
        {options.map((option, index) => {
          const Icon = option.icon;
          const row = (
            <>
              <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
              <span className="grid gap-0.5">
                <strong className="font-semibold">{option.label}</strong>
                <small className="text-sm leading-snug">{index === 0 && !state.approvedCopy.allowed ? state.panelLabel : option.detail}</small>
              </span>
              {option.available ? <Download size={16} strokeWidth={1.8} aria-hidden="true" /> : <FileLock2 size={16} strokeWidth={1.8} aria-hidden="true" />}
            </>
          );
          return option.available ? (
            <a key={option.label} className="grid min-h-[4.7rem] grid-cols-[auto_1fr_auto] items-start gap-3 rounded-lg border border-[#acd2be] bg-[#edf8f1] p-3 text-[#24583d] transition hover:bg-[#e4f4eb] active:translate-y-px" href={downloadHref}>
              {row}
            </a>
          ) : (
            <button key={option.label} className={cn("grid min-h-[4.7rem] grid-cols-[auto_1fr_auto] items-start gap-3 rounded-lg border border-tjc-line bg-white/72 p-3 text-left text-[#5d665f]", index === 0 && !state.approvedCopy.allowed && "border-[#ead6a8] bg-[#fff8e8] text-[#73531a]")} type="button" disabled>
              {row}
            </button>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-[auto_1fr] gap-3 rounded-lg border border-[#ead6a8] bg-[#fff8e8] p-3 text-[#6f511c]">
        <FileLock2 size={18} strokeWidth={1.8} aria-hidden="true" />
        <div>
          <strong className="block font-semibold">Original/master restricted</strong>
          <span className="mt-1 block text-sm leading-snug">Master files stay in ResourceSpace and Google Shared Drive. Normal users receive approved copies only.</span>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        <a className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px" href={`mailto:media@tjc.org?subject=Original access request for ${encodeURIComponent(asset.title)}`}>
          <Mail size={16} strokeWidth={1.8} aria-hidden="true" />
          Request original access
        </a>
        <a className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px" href="mailto:media@tjc.org?subject=TJC Stock Media asset question">
          <Mail size={16} strokeWidth={1.8} aria-hidden="true" />
          Ask media coworker
        </a>
      </div>
    </section>
  );
}
