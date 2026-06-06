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
  if (tone === "dark") return "border-[#1d2924] bg-[#111a17] text-white shadow-[0_24px_70px_rgba(7,16,13,.2)]";
  if (tone === "warn") return "border-[#dfbd73] bg-[linear-gradient(180deg,#fff9ea,#fff1cf)] text-[#6f4608]";
  if (tone === "info") return "border-[#b7cadd] bg-[linear-gradient(180deg,#f7fbff,#ecf5fb)] text-[#24465d]";
  return "border-[#a9cfba] bg-[linear-gradient(180deg,#f5fff8,#e7f6ec)] text-[#164d34]";
}

export function DisplayCard({ label, value, detail, icon: Icon, tone = "ok", active, onClick }: DisplayCardProps) {
  const content = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="grid min-w-0 gap-1">
          <span className={cn("text-[11px] font-black uppercase tracking-[.08em]", tone === "dark" ? "text-white/64" : "text-current/70")}>{label}</span>
          <strong className="truncate text-2xl font-black leading-none tracking-[-.02em] tabular-nums">{typeof value === "number" ? value.toLocaleString() : value}</strong>
        </span>
        {Icon ? <Icon className={cn("shrink-0", tone === "dark" ? "text-white/76" : "text-current/78")} size={20} strokeWidth={1.9} aria-hidden="true" /> : null}
      </span>
      {detail ? <span className={cn("mt-3 line-clamp-2 block text-xs font-semibold leading-snug", tone === "dark" ? "text-white/62" : "text-current/72")}>{detail}</span> : null}
      {onClick ? <ArrowUpRight className={cn("absolute bottom-3 right-3 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5", tone === "dark" ? "text-white/70" : "text-current/70")} size={15} strokeWidth={1.9} aria-hidden="true" /> : null}
    </>
  );

  const className = cn(
    "group relative min-h-28 overflow-hidden rounded-2xl border p-3 text-left shadow-[0_1px_0_rgba(255,255,255,.86)_inset,0_18px_50px_rgba(25,34,29,.08)] transition duration-200",
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
