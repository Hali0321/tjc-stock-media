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
      <span className="grid max-w-[20rem] justify-items-center gap-1.5 px-3 py-2">
        <ImageIcon size={22} strokeWidth={1.8} aria-hidden="true" />
        <strong className="text-[10px] font-black uppercase tracking-[.08em] text-[#4f5c55]">{label}</strong>
        {detail ? <span className="max-w-[28rem] text-sm font-medium leading-snug text-tjc-muted">{detail}</span> : null}
      </span>
    </div>
  );
}
