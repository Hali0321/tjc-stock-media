"use client";

import { useState } from "react";
import { ImageIcon, Lock } from "lucide-react";
import { MediaPreview } from "@/components/MediaPreview";
import { cn } from "@/lib/ui";

type ImageComparisonPanelProps = {
  safePreview?: string;
  alt: string;
  approvedCopyAllowed: boolean;
  originalHidden: boolean;
};

export function ImageComparisonPanel({ safePreview, alt, approvedCopyAllowed, originalHidden }: ImageComparisonPanelProps) {
  const [position, setPosition] = useState(58);

  return (
    <section className="rounded-md border border-[#d4ded7] bg-white p-3" aria-label="Derivative comparison">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-tjc-evergreen">Derivative compare</h2>
          <p className="mt-1 text-xs font-semibold leading-snug text-tjc-muted">Compares role-safe display copy against approved-copy availability. Original/master is never exposed here.</p>
        </div>
        <span className={cn("rounded-md border px-2.5 py-1 text-xs font-black", approvedCopyAllowed ? "border-[#b8d9c6] bg-[#edf8f1] text-[#22563a]" : "border-[#ead6a8] bg-[#fff8e8] text-[#725216]")}>
          {approvedCopyAllowed ? "Approved copy available" : "Copy blocked"}
        </span>
      </div>
      <div className="relative overflow-hidden rounded-md border border-[#dbe4dd] bg-[#f5f7f4]">
        <div className="grid aspect-[16/10] place-items-center">
          <MediaPreview src={safePreview} alt={alt} label="Safe preview unavailable" detail="No role-safe derivative is exported for this asset." imgClassName="h-full w-full object-contain" className="px-4" />
        </div>
        {safePreview ? (
          <div className="pointer-events-none absolute inset-0 border-r border-white/90 bg-white/10" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }} aria-hidden="true">
            <MediaPreview src={safePreview} alt="" imgClassName="h-full w-full object-contain saturate-[.92]" className="px-4" />
          </div>
        ) : null}
        <div className="absolute left-3 top-3 rounded-md border border-[#cbd8cf] bg-white px-3 py-1 text-xs font-black text-tjc-evergreen">Display derivative</div>
        <div className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md border border-[#cbd8cf] bg-white px-3 py-1 text-xs font-black text-[#4d554d]">
          {originalHidden ? <Lock size={13} strokeWidth={1.8} aria-hidden="true" /> : <ImageIcon size={13} strokeWidth={1.8} aria-hidden="true" />}
          Original hidden
        </div>
      </div>
      <label className="mt-3 grid gap-1 text-xs font-black text-tjc-muted">
        Compare view
        <input
          type="range"
          min={20}
          max={80}
          value={position}
          onChange={(event) => setPosition(Number(event.currentTarget.value))}
          aria-label="Derivative comparison position"
          className="accent-tjc-evergreen"
          disabled={!safePreview}
        />
      </label>
    </section>
  );
}
