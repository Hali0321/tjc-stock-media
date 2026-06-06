"use client";

import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/ui";

type MediaPreviewProps = {
  src?: string;
  alt: string;
  label?: string;
  detail?: string;
  className?: string;
  imgClassName?: string;
  loading?: "lazy" | "eager";
};

export function MediaPreview({
  src,
  alt,
  label = "Preview pending",
  detail,
  className,
  imgClassName,
  loading = "lazy"
}: MediaPreviewProps) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        className={cn("h-full w-full object-cover", imgClassName)}
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className={cn("dam-preview-grid grid h-full w-full place-items-center p-3 text-center text-tjc-muted", className)}>
      <span className="grid max-w-[22rem] justify-items-center gap-2 rounded-2xl border border-white/75 bg-white/62 px-4 py-3 shadow-[0_12px_34px_rgba(25,34,29,.08)] backdrop-blur-[2px]">
        <ImageIcon size={24} strokeWidth={1.9} aria-hidden="true" />
        <strong className="text-[11px] font-black uppercase tracking-[.1em] text-[#4f5c55]">{label}</strong>
        {detail ? <span className="max-w-[28rem] text-sm font-medium leading-snug text-tjc-muted">{detail}</span> : null}
      </span>
    </div>
  );
}
