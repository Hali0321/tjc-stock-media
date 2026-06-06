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
    <div className={cn("grid h-full w-full place-items-center bg-[linear-gradient(135deg,#eef1ed_0%,#eef1ed_48%,#e2e8e2_48%,#e2e8e2_52%,#eef1ed_52%)] p-3 text-center text-tjc-muted", className)}>
      <span className="grid justify-items-center gap-2">
        <ImageIcon size={26} strokeWidth={1.8} aria-hidden="true" />
        <strong className="text-[11px] font-semibold uppercase tracking-[.04em] text-[#5d675f]">{label}</strong>
        {detail ? <span className="max-w-[28rem] text-sm font-medium leading-snug text-tjc-muted">{detail}</span> : null}
      </span>
    </div>
  );
}
