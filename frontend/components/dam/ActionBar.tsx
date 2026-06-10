"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/ui";
import type { ReactNode } from "react";

type ActionButtonProps = {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  icon?: LucideIcon;
  tone?: "primary" | "secondary" | "quiet" | "danger";
  disabled?: boolean;
  disabledReason?: string;
  type?: "button" | "submit";
};

export function DamActionButton({
  href,
  onClick,
  children,
  icon: Icon,
  tone = "secondary",
  disabled,
  disabledReason,
  type = "button"
}: ActionButtonProps) {
  const className = cn(
    "dam-action-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-3.5 text-sm font-black transition active:translate-y-px disabled:pointer-events-none disabled:opacity-55",
    tone === "primary" && "bg-tjc-evergreen text-white shadow-[0_12px_24px_rgba(15,61,46,.18)] hover:bg-[#073b31]",
    tone === "secondary" && "border border-[#b9c9bf] bg-white text-tjc-evergreen hover:bg-[#f2f8f4]",
    tone === "quiet" && "bg-transparent text-tjc-evergreen hover:bg-[#eef6f1]",
    tone === "danger" && "bg-[#7d2d2a] text-white hover:bg-[#642320]"
  );
  const content = (
    <>
      {Icon ? <Icon size={16} strokeWidth={1.9} aria-hidden="true" /> : null}
      <span>{children}</span>
    </>
  );
  if (href && !disabled) return <Link className={className} href={href} title={disabledReason}>{content}</Link>;
  return <button className={className} type={type} onClick={onClick} disabled={disabled} title={disabled ? disabledReason : undefined}>{content}</button>;
}

export function DamActionBar({
  children,
  reminder
}: {
  children: ReactNode;
  reminder?: ReactNode;
}) {
  return (
    <section className="dam-action-bar" aria-label="Record actions">
      {reminder ? <div className="dam-action-bar-reminder">{reminder}</div> : null}
      <div className="dam-action-bar-buttons">{children}</div>
    </section>
  );
}
