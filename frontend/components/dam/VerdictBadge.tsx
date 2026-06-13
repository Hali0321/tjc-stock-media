"use client";

import { CheckCircle2, CircleAlert, LockKeyhole, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/ui";
import type { ViewerVerdict } from "@/lib/viewer-verdict";

export function DamVerdictBadge({ verdict }: { verdict: ViewerVerdict }) {
  const Icon = verdict.tone === "ready" ? CheckCircle2 : verdict.tone === "restricted" ? LockKeyhole : verdict.tone === "unavailable" ? ShieldAlert : CircleAlert;
  return (
    <span className={cn("dam-verdict-badge", `is-${verdict.tone}`)}>
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
      {verdict.label}
    </span>
  );
}
