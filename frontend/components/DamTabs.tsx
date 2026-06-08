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
  size?: "sm" | "md";
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

export function DamTabs<T extends string>({ tabs, active, onChange, ariaLabel, idPrefix, className, size = "md" }: DamTabsProps<T>) {
  function moveFocus(nextTab: T) {
    onChange(nextTab);
    window.requestAnimationFrame(() => {
      const next = document.getElementById(damTabId(idPrefix, nextTab));
      next?.focus();
      next?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
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
    <div className={cn("dam-tabs-scroll max-w-full overflow-x-auto overflow-y-hidden rounded-[1.05rem] border border-[#c5d1c9] bg-[#edf3f0] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,.92)]", className)}>
      <div className="flex w-max min-w-full flex-nowrap items-center gap-1 whitespace-nowrap" role="tablist" aria-label={ariaLabel} aria-orientation="horizontal" onKeyDown={onKeyDown}>
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
              data-state={selected ? "active" : "inactive"}
              className={cn(
                "relative inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[.82rem] border border-transparent font-black text-[#46534b] outline-none transition duration-200 ease-out hover:bg-white/78 hover:text-tjc-evergreen focus-visible:ring-4 focus-visible:ring-[#16a99a]/18 active:translate-y-px",
                size === "sm" ? "min-h-9 px-3 text-xs" : "min-h-11 px-4 text-sm",
                selected && "border-[#a5cbbb] bg-[#e5f6f2] text-tjc-evergreen shadow-[0_1px_0_rgba(255,255,255,.9)_inset,0_10px_24px_rgba(13,121,112,.12)]"
              )}
              onClick={() => onChange(tab)}
            >
              {selected ? <span className="absolute inset-x-4 bottom-1 h-0.5 rounded-full bg-[#12a294]" aria-hidden="true" /> : null}
              <span className="relative z-[1]">{tab}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
