"use client";

import { CheckCircle2, CircleAlert, LockKeyhole, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/ui";
import type { ReactNode } from "react";

type SafeCopyTone = "approved" | "blocked" | "restricted" | "pending";

export function DamSafeCopy({
  tone,
  title,
  children
}: {
  tone: SafeCopyTone;
  title: string;
  children: ReactNode;
}) {
  const Icon = tone === "approved" ? CheckCircle2 : tone === "restricted" ? LockKeyhole : tone === "blocked" ? ShieldAlert : CircleAlert;
  return (
    <section className={cn("dam-safe-copy", `is-${tone}`)} aria-label={title}>
      <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </section>
  );
}
