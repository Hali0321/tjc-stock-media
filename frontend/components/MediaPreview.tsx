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
    <div className={cn("grid h-full w-full place-items-center bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,.9),transparent_32%),linear-gradient(135deg,#eef2ed_0%,#eef2ed_46%,#dfe7df_46%,#dfe7df_50%,#eef2ed_50%)] p-3 text-center text-tjc-muted", className)}>
      <span className="grid max-w-[20rem] justify-items-center gap-2 rounded-xl border border-white/70 bg-white/45 px-3 py-3 shadow-[0_1px_0_rgba(32,34,31,.04)] backdrop-blur-[1px]">
        <ImageIcon size={24} strokeWidth={1.8} aria-hidden="true" />
        <strong className="text-[11px] font-bold uppercase tracking-[.08em] text-[#536058]">{label}</strong>
        {detail ? <span className="max-w-[28rem] text-sm font-medium leading-snug text-tjc-muted">{detail}</span> : null}
      </span>
    </div>
  );
}
