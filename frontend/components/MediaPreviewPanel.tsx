"use client";

import { FileText, Image as ImageIcon, Music, Video, FileQuestion, LockKeyhole } from "lucide-react";
import { MediaPreview } from "@/components/MediaPreview";
import { RestrictedPreviewPanel, StateCard } from "@/components/DamStates";
import type { StockMediaAsset } from "@/lib/types";
import { cn } from "@/lib/ui";

export type MediaPreviewMode = "image" | "video" | "audio" | "document" | "restricted" | "unknown";

type MediaPreviewVariant = {
  label: string;
  src?: string;
  active?: boolean;
};

type MediaPreviewPanelProps = {
  mode?: MediaPreviewMode;
  asset?: StockMediaAsset;
  src?: string;
  alt: string;
  title?: string;
  detail?: string;
  variants?: MediaPreviewVariant[];
  className?: string;
  compact?: boolean;
};

function modeFor(asset?: StockMediaAsset, src?: string): MediaPreviewMode {
  if (!asset) return src ? "image" : "restricted";
  if (!src) return "restricted";
  if (asset.mediaType === "video") return "video";
  if (asset.mediaType === "audio") return "audio";
  if (asset.mediaType === "document") return "document";
  if (asset.mediaType === "graphic" || asset.mediaType === "photo") return "image";
  return "unknown";
}

export function MediaPreviewPanel({
  mode,
  asset,
  src,
  alt,
  title,
  detail,
  variants = [],
  className,
  compact
}: MediaPreviewPanelProps) {
  const resolvedMode = mode || modeFor(asset, src);
  const heading = title || asset?.title || "Media preview";
  const fileLine = asset
    ? [asset.mediaType, asset.fileExtension?.toUpperCase(), asset.imageDimensions].filter(Boolean).join(" · ")
    : undefined;

  if (resolvedMode === "restricted") {
    return (
      <section className={cn("overflow-hidden rounded-[1.6rem] border border-[#cfd7d1] bg-white p-3 shadow-[0_18px_46px_rgba(35,53,111,.07)]", className)} aria-label="Restricted media preview">
        <RestrictedPreviewPanel
          title={title || "Preview restricted"}
          detail={detail || "No role-safe derivative is available. Original/master remains restricted and reuse is governed by the trust record."}
          className={cn(compact ? "min-h-52" : "min-h-[22rem]")}
        />
      </section>
    );
  }

  return (
    <section className={cn("overflow-hidden rounded-[1.6rem] border border-[#cfd7d1] bg-white p-3 shadow-[0_18px_46px_rgba(35,53,111,.07)]", className)} aria-label={`${resolvedMode} media preview`}>
      <div className={cn("relative overflow-hidden rounded-[1.25rem] border border-[#dbe4dd] bg-[#f5f8f5]", compact ? "min-h-56" : "min-h-[24rem]")}>
        {resolvedMode === "image" ? (
          <div className="grid h-full min-h-[inherit] place-items-center">
            <MediaPreview
              src={src}
              alt={alt}
              label="Preview unavailable"
              detail="No display derivative is exported for this role."
              className="min-h-[inherit] px-4"
              imgClassName="!h-auto max-h-[72dvh] !w-auto max-w-full rounded !object-contain shadow-[0_8px_24px_rgba(32,34,31,.14)]"
              loading="eager"
            />
          </div>
        ) : null}

        {resolvedMode === "video" ? (
          <div className="grid min-h-[inherit] content-center gap-3 bg-[#101916] px-4 pb-4 pt-14 text-white">
            <div className="flex items-center gap-2 text-sm font-black">
              <Video size={18} strokeWidth={1.8} aria-hidden="true" />
              Video preview
            </div>
            {src ? (
              <video className="max-h-[68dvh] w-full rounded-xl bg-black" controls preload="metadata" src={src} aria-label={alt} />
            ) : (
              <StateCard compact variant="restricted" tone="warning" title="Video preview unavailable" description="No role-safe video derivative is exported." />
            )}
          </div>
        ) : null}

        {resolvedMode === "audio" ? (
          <div className="grid min-h-[inherit] content-center gap-4 px-6 pb-6 pt-14">
            <div className="flex items-center gap-2 text-sm font-black text-tjc-evergreen">
              <Music size={18} strokeWidth={1.8} aria-hidden="true" />
              Audio preview
            </div>
            <div className="grid gap-1 rounded-2xl border border-[#cbd8cf] bg-white p-4">
              <div className="flex h-16 items-end gap-1" aria-hidden="true">
                {Array.from({ length: 32 }).map((_, index) => (
                  <span className="flex-1 rounded-full bg-[#007da4]/70" style={{ height: `${18 + ((index * 17) % 42)}px` }} key={index} />
                ))}
              </div>
              {src ? <audio className="mt-3 w-full" controls src={src} aria-label={alt} /> : <p className="mt-3 text-sm font-semibold text-tjc-muted">No role-safe audio derivative is exported.</p>}
            </div>
          </div>
        ) : null}

        {resolvedMode === "document" ? (
          <div className="grid min-h-[inherit] content-center gap-4 px-6 pb-6 pt-14">
            <div className="flex items-center gap-2 text-sm font-black text-tjc-evergreen">
              <FileText size={18} strokeWidth={1.8} aria-hidden="true" />
              Document preview
            </div>
            <div className="rounded-2xl border border-[#cbd8cf] bg-white p-5">
              {src && /\.pdf(?:$|\?)/i.test(src) ? (
                <iframe className="h-[30rem] w-full rounded-xl border border-tjc-line" src={src} title={alt} />
              ) : (
                <div className="grid justify-items-center gap-3 py-10 text-center">
                  <FileText size={36} strokeWidth={1.5} aria-hidden="true" className="text-tjc-evergreen" />
                  <strong className="text-lg font-black text-tjc-ink">Document shell</strong>
                  <p className="max-w-md text-sm font-semibold leading-relaxed text-tjc-muted">
                    PDF/document preview is prepared for safe exported derivatives. Original documents remain restricted unless policy allows a role-safe copy.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {resolvedMode === "unknown" ? (
          <div className="grid min-h-[inherit] place-items-center px-6 pb-6 pt-14">
            <StateCard
              variant="empty"
              tone="neutral"
              title="Unknown file preview"
              description="This file type needs a safe derivative before inline preview. Use the trust record and request workflow."
              icon={<FileQuestion size={20} strokeWidth={1.8} aria-hidden="true" />}
            />
          </div>
        ) : null}

        <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/92 px-3 py-1 text-xs font-black text-tjc-evergreen shadow-sm">
          {resolvedMode === "image" ? <ImageIcon size={13} strokeWidth={1.8} aria-hidden="true" /> : null}
          {resolvedMode === "video" ? <Video size={13} strokeWidth={1.8} aria-hidden="true" /> : null}
          {resolvedMode === "audio" ? <Music size={13} strokeWidth={1.8} aria-hidden="true" /> : null}
          {resolvedMode === "document" ? <FileText size={13} strokeWidth={1.8} aria-hidden="true" /> : null}
          {resolvedMode === "unknown" ? <FileQuestion size={13} strokeWidth={1.8} aria-hidden="true" /> : null}
          {resolvedMode}
        </div>
        <div className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-1 text-xs font-black text-[#4d554d] shadow-sm">
          <LockKeyhole size={13} strokeWidth={1.8} aria-hidden="true" />
          Original restricted
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-black text-tjc-ink">{heading}</h2>
          <p className="mt-0.5 text-xs font-semibold text-tjc-muted">{detail || fileLine || "Role-safe preview only."}</p>
        </div>
        {variants.length ? (
          <div className="flex flex-wrap gap-2" aria-label="Preview variants">
            {variants.map((variant, index) => (
              <span
                className={cn("rounded-full border px-2.5 py-1 text-[11px] font-black", variant.active ? "border-[#0f3d2e] bg-[#e6f0eb] text-tjc-evergreen" : "border-[#d6dfd8] bg-white text-tjc-muted")}
                key={`${variant.label}-${variant.src || "variant"}-${index}`}
              >
                {variant.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
