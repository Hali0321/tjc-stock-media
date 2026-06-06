"use client";

import { type KeyboardEvent } from "react";
import { cn } from "@/lib/ui";

type DamTabsProps<T extends string> = {
  tabs: readonly T[];
  active: T;
  onChange: (tab: T) => void;
  ariaLabel: string;
  idPrefix: string;
  className?: string;
  mountedPanels?: boolean;
};

function safeTabId(tab: string) {
  return tab.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function damTabId(idPrefix: string, tab: string) {
  return `${idPrefix}-${safeTabId(tab)}-tab`;
}

export function damTabPanelId(idPrefix: string, tab: string) {
  return `${idPrefix}-${safeTabId(tab)}-panel`;
}

export function DamTabs<T extends string>({ tabs, active, onChange, ariaLabel, idPrefix, className, mountedPanels = false }: DamTabsProps<T>) {
  function moveFocus(nextTab: T) {
    onChange(nextTab);
    window.requestAnimationFrame(() => document.getElementById(damTabId(idPrefix, nextTab))?.focus());
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = tabs.indexOf(active);
    if (currentIndex < 0) return;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      moveFocus(tabs[(currentIndex + 1) % tabs.length]);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(tabs[(currentIndex - 1 + tabs.length) % tabs.length]);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveFocus(tabs[0]);
    } else if (event.key === "End") {
      event.preventDefault();
      moveFocus(tabs[tabs.length - 1]);
    }
  }

  return (
    <div className={cn("flex max-w-full flex-wrap gap-1 rounded-2xl border border-[#c5d1c9] bg-[#edf2ee] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,.8)]", className)} role="tablist" aria-label={ariaLabel} onKeyDown={onKeyDown}>
      {tabs.map((tab) => {
        const selected = active === tab;
        return (
          <button
            id={damTabId(idPrefix, tab)}
            key={tab}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={damTabPanelId(idPrefix, tab)}
            tabIndex={selected ? 0 : -1}
            className={cn("inline-flex min-h-10 max-w-full items-center rounded-xl border border-transparent px-3 text-sm font-black text-[#46534b] transition hover:bg-white/78 active:translate-y-px", selected && "border-[#8fbda8] bg-white text-tjc-evergreen shadow-[0_10px_24px_rgba(25,34,29,.08),inset_0_1px_0_rgba(255,255,255,.95)]")}
            onClick={() => onChange(tab)}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
