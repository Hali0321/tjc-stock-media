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
  if (tone === "critical") return "border-[#dfa6a2] bg-[linear-gradient(180deg,#fff4f2,#ffe9e7)] text-[#772725]";
  if (tone === "warn") return "border-[#dfbd73] bg-[linear-gradient(180deg,#fff9ea,#fff1cf)] text-[#6f4608]";
  if (tone === "ok") return "border-[#a9cfba] bg-[linear-gradient(180deg,#f5fff8,#e7f6ec)] text-[#164d34]";
  return "border-[#b7cadd] bg-[linear-gradient(180deg,#f7fbff,#ecf5fb)] text-[#24465d]";
}

function fallbackIcon(tone: StatusBannerTone) {
  if (tone === "ok") return ShieldCheck;
  if (tone === "info") return Info;
  return AlertTriangle;
}

export function StatusBanner({ tone = "info", title, children, icon, className }: StatusBannerProps) {
  const Icon = icon || fallbackIcon(tone);

  return (
    <section className={cn("grid grid-cols-[auto_1fr] gap-3 rounded-2xl border p-3 shadow-[0_1px_0_rgba(255,255,255,.86)_inset]", toneClass(tone), className)} role="status">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/55">
        <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
      </span>
      <span>
        <strong className="block text-sm font-black">{title}</strong>
        <span className="mt-1 block text-sm font-semibold leading-relaxed text-current/78">{children}</span>
      </span>
    </section>
  );
}
