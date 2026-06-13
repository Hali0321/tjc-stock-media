"use client";

import { useState } from "react";
import { AssetPreviewPlaceholder, RestrictedPreviewPanel } from "@/components/DamStates";
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

function previewVariantClass(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 997;
  }
  return `dam-preview-variant-${(hash % 4) + 1}`;
}

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

  const restricted = /restricted|unavailable|blocked/i.test(label);

  if (restricted) {
    return <RestrictedPreviewPanel title={label} detail={detail} className={cn("h-full w-full", previewVariantClass(`${alt}-${detail || ""}`), className)} />;
  }

  return <AssetPreviewPlaceholder title={label} detail={detail} className={cn("h-full w-full", className)} />;
}
