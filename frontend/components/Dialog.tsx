"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/ui";

type DialogProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  className?: string;
  maxWidthClassName?: string;
  tone?: "neutral" | "warning" | "danger" | "success";
  initialFocus?: "close" | "first";
  labelledById?: string;
  closeLabel?: string;
  placement?: "center" | "right" | "bottom";
};

function toneAccent(tone: NonNullable<DialogProps["tone"]>) {
  if (tone === "danger") return "bg-[#d64545]";
  if (tone === "warning") return "bg-[#d09a31]";
  if (tone === "success") return "bg-[#2f7d55]";
  return "bg-[#12a294]";
}

export function Dialog({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  className,
  maxWidthClassName = "max-w-2xl",
  tone = "neutral",
  initialFocus = "close",
  labelledById,
  closeLabel = "Close dialog",
  placement = "center"
}: DialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = labelledById || `dialog-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const descriptionId = `${titleId}-description`;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const id = window.setTimeout(() => {
      if (initialFocus === "close") closeRef.current?.focus();
      else dialogRef.current?.querySelector<HTMLElement>('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus();
    }, 0);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter((item) => !item.hasAttribute("disabled") && item.tabIndex !== -1);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      window.setTimeout(() => previous?.focus(), 0);
    };
  }, [initialFocus, onClose, open]);

  if (!open) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[90] grid bg-[#07100d]/42 p-3",
        placement === "right" ? "place-items-stretch justify-items-end" : placement === "bottom" ? "items-end justify-items-center" : "place-items-center"
      )}
      role="presentation"
      onMouseDown={onClose}
      data-dialog-overlay="true"
    >
      <section
        ref={dialogRef}
        className={cn(
          "grid max-h-[92dvh] w-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-md border border-[#b9c8bf] bg-white shadow-[0_24px_70px_rgba(7,16,13,.22)]",
          placement === "right" && "h-full max-h-full rounded-md",
          placement === "bottom" && "min-h-[82dvh] max-h-[88dvh] rounded-b-none",
          maxWidthClassName,
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onMouseDown={(event) => event.stopPropagation()}
        data-dialog-panel="true"
      >
        <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-tjc-line bg-[#fbfcfa] px-5 py-4">
          <div>
            <span className={cn("mb-3 block h-1 w-14 rounded-sm", toneAccent(tone))} aria-hidden="true" />
            <h2 id={titleId} className="text-2xl font-black leading-tight text-tjc-ink">{title}</h2>
            {description ? <p id={descriptionId} className="mt-1 text-sm font-semibold leading-relaxed text-tjc-muted">{description}</p> : null}
          </div>
          <button ref={closeRef} className="grid h-10 w-10 place-items-center rounded-md border border-[#d7e0da] bg-white text-tjc-muted transition hover:bg-[#f3f6f2] hover:text-tjc-evergreen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a99a]/24" type="button" onClick={onClose} aria-label={closeLabel}>
            <X size={17} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
        <div className="max-h-[calc(92dvh-10rem)] overflow-y-auto p-5">{children}</div>
        {footer ? <div className="flex flex-wrap items-center justify-end gap-2 border-t border-tjc-line bg-[#fbfcfa] px-5 py-4">{footer}</div> : null}
      </section>
    </div>,
    document.body
  );
}
