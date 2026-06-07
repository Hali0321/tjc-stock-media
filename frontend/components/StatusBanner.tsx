import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/ui";

type StatusBannerTone = "ok" | "warn" | "info" | "critical";

type StatusBannerProps = {
  tone?: StatusBannerTone;
  title: string;
  children: ReactNode;
  icon?: LucideIcon;
  className?: string;
};

function toneClass(tone: StatusBannerTone) {
  if (tone === "critical") return "border-[#dfa6a2] bg-[#fff4f2] text-[#772725]";
  if (tone === "warn") return "border-[#dfbd73] bg-[#fffaf0] text-[#6f4608]";
  if (tone === "ok") return "border-[#a9cfba] bg-[#f7fbf8] text-[#164d34]";
  return "border-[#b7cadd] bg-[#f7fafc] text-[#24465d]";
}

function fallbackIcon(tone: StatusBannerTone) {
  if (tone === "ok") return ShieldCheck;
  if (tone === "info") return Info;
  return AlertTriangle;
}

export function StatusBanner({ tone = "info", title, children, icon, className }: StatusBannerProps) {
  const Icon = icon || fallbackIcon(tone);

  return (
    <section className={cn("grid grid-cols-[auto_1fr] gap-3 rounded-lg border p-3", toneClass(tone), className)} role="status">
      <span className="grid h-9 w-9 place-items-center rounded-md bg-white/65">
        <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
      </span>
      <span>
        <strong className="block text-sm font-black">{title}</strong>
        <span className="mt-1 block text-sm font-semibold leading-relaxed text-current/78">{children}</span>
      </span>
    </section>
  );
}

export const StateBanner = StatusBanner;
