"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/ui";

export type DropdownAction = {
  id: string;
  label: string;
  detail?: string;
  icon: ReactNode;
  href?: string;
  external?: boolean;
  onSelect?: () => void | Promise<void>;
};

type DropdownActionMenuProps = {
  label: string;
  actions: DropdownAction[];
  align?: "left" | "right";
  status?: string;
};

export function DropdownActionMenu({ label, actions, align = "right", status }: DropdownActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (!open) return;
    function closeFromOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeFromEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", closeFromOutside);
    document.addEventListener("keydown", closeFromEscape);
    return () => {
      document.removeEventListener("mousedown", closeFromOutside);
      document.removeEventListener("keydown", closeFromEscape);
    };
  }, [open]);

  useEffect(() => {
    if (open) itemRefs.current[0]?.focus();
  }, [open]);

  async function runAction(action: DropdownAction) {
    if (action.onSelect) {
      try {
        await action.onSelect();
      } catch {
        // Individual actions own user-facing failure copy.
      }
    }
    setOpen(false);
    buttonRef.current?.focus();
  }

  function focusItem(index: number) {
    const items = itemRefs.current.filter(Boolean);
    if (!items.length) return;
    const next = ((index % items.length) + items.length) % items.length;
    items[next]?.focus();
  }

  function handleMenuKey(event: ReactKeyboardEvent<HTMLElement>, index: number) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusItem(index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusItem(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusItem(actions.length - 1);
    }
  }

  return (
    <div className="relative min-w-0" ref={menuRef}>
      <button
        ref={buttonRef}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f4f45] active:translate-y-px"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        {label}
        <ChevronDown size={14} strokeWidth={1.8} aria-hidden="true" />
      </button>
      {status ? <span className="sr-only" role="status">{status}</span> : null}
      {open ? (
        <div
          className={cn(
            "absolute z-30 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-md border border-tjc-line bg-white p-1 shadow-[0_12px_32px_rgba(32,34,31,.14)]",
            align === "right" ? "right-0" : "left-0"
          )}
          role="menu"
          aria-label={label}
        >
          {actions.map((action, index) => {
            const content = (
              <>
                <span className="mt-0.5 text-tjc-evergreen">{action.icon}</span>
                <span className="grid min-w-0 gap-0.5 text-left">
                  <span className="text-sm font-semibold text-tjc-ink">{action.label}</span>
                  {action.detail ? <span className="text-xs leading-snug text-tjc-muted">{action.detail}</span> : null}
                </span>
              </>
            );
            const className = "grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-2 rounded px-2.5 py-2 text-left transition hover:bg-[#f3f6f2] focus-visible:bg-[#f3f6f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0f4f45]";
            return action.href ? (
              <a
                className={className}
                href={action.href}
                key={action.id}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                rel={action.external ? "noreferrer" : undefined}
                role="menuitem"
                target={action.external ? "_blank" : undefined}
                onClick={() => setOpen(false)}
                onKeyDown={(event) => handleMenuKey(event, index)}
              >
                {content}
              </a>
            ) : (
              <button
                className={className}
                key={action.id}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                role="menuitem"
                type="button"
                onClick={() => void runAction(action)}
                onKeyDown={(event) => handleMenuKey(event, index)}
              >
                {content}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
