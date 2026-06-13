"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/ui";

type FilterPill = {
  id: string;
  label: string;
  count?: number;
  active?: boolean;
};

type FilterPillsProps = {
  pills: FilterPill[];
  onSelect?: (id: string) => void;
  onRemove?: (id: string) => void;
  ariaLabel: string;
  className?: string;
};

export function FilterPills({ pills, onSelect, onRemove, ariaLabel, className }: FilterPillsProps) {
  return (
    <div className={cn("flex max-w-full flex-wrap gap-2", className)} aria-label={ariaLabel}>
      {pills.map((pill) => {
        const active = Boolean(pill.active);
        const classes = cn(
          "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm font-black transition active:translate-y-px",
          active ? "border-[#007da4] bg-[#e6f0eb] text-tjc-evergreen" : "border-[#d8e1da] bg-white text-[#3f4a43] hover:bg-[#eef7f1] hover:text-tjc-evergreen"
        );
        if (onRemove) {
          return (
            <span key={pill.id} className={classes}>
              <button type="button" className="min-h-7" onClick={() => onSelect?.(pill.id)}>
                {pill.label}
              </button>
              {typeof pill.count === "number" ? <span className="rounded-md border border-[#d8e1da] bg-white px-1.5 text-[11px] tabular-nums">{pill.count.toLocaleString()}</span> : null}
              <button type="button" className="grid h-6 w-6 place-items-center rounded-md hover:bg-white" onClick={() => onRemove(pill.id)} aria-label={`Remove ${pill.label}`}>
                <X size={12} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </span>
          );
        }
        return (
          <button
            key={pill.id}
            type="button"
            className={classes}
            aria-pressed={active}
            onClick={() => onSelect?.(pill.id)}
          >
            <span>{pill.label}</span>
            {typeof pill.count === "number" ? <span className="rounded-md border border-[#d8e1da] bg-white px-1.5 text-[11px] tabular-nums">{pill.count.toLocaleString()}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
