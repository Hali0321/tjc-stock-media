import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/ui";

type DisplayCardTone = "ok" | "warn" | "info" | "dark";

type DisplayCardProps = {
  label: string;
  value: string | number;
  detail?: string;
  icon?: LucideIcon;
  tone?: DisplayCardTone;
  active?: boolean;
  onClick?: () => void;
};

function toneClass(tone: DisplayCardTone) {
  if (tone === "dark") return "border-[#cfd7d1] bg-white text-tjc-ink";
  if (tone === "warn") return "border-[#e2c47e] bg-[#fffaf0] text-[#6f4608]";
  if (tone === "info") return "border-[#c8d6df] bg-[#f7fafc] text-[#24465d]";
  return "border-[#b8d4c3] bg-[#f7fbf8] text-[#164d34]";
}

export function DisplayCard({ label, value, detail, icon: Icon, tone = "ok", active, onClick }: DisplayCardProps) {
  const content = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="grid min-w-0 gap-1">
          <span className="text-[11px] font-black uppercase tracking-[.04em] text-current/70">{label}</span>
          <strong className="text-xl font-black leading-none tabular-nums sm:text-2xl">{typeof value === "number" ? value.toLocaleString() : value}</strong>
        </span>
        {Icon ? <Icon className="shrink-0 text-current/78" size={20} strokeWidth={1.9} aria-hidden="true" /> : null}
      </span>
      {detail ? <span className="mt-3 line-clamp-2 block text-xs font-semibold leading-snug text-current/72">{detail}</span> : null}
      {onClick ? <ArrowUpRight className="absolute bottom-3 right-3 text-current/70 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" size={15} strokeWidth={1.9} aria-hidden="true" /> : null}
    </>
  );

  const className = cn(
    "group relative min-h-24 overflow-hidden rounded-lg border p-3 text-left transition duration-200",
    toneClass(tone),
    active && "ring-2 ring-[#063f39] ring-offset-2 ring-offset-[#f1f3ef]",
    onClick && "hover:-translate-y-0.5 active:translate-y-px"
  );

  if (onClick) {
    return (
      <button className={className} type="button" onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}
