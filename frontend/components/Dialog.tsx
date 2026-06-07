"use client";

import { useEffect, useRef, type ReactNode } from "react";
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
  initialFocus?: "close" | "first";
  labelledById?: string;
  closeLabel?: string;
};

export function Dialog({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  className,
  maxWidthClassName = "max-w-2xl",
  initialFocus = "close",
  labelledById,
  closeLabel = "Close dialog"
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

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#07100d]/42 p-3 backdrop-blur-[4px]" role="presentation" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className={cn(
          "max-h-[92dvh] w-full overflow-hidden rounded-[1.25rem] border border-[#b9c8bf] bg-white shadow-[0_24px_80px_rgba(7,16,13,.24)]",
          maxWidthClassName,
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-tjc-line px-4 py-3">
          <div>
            <h2 id={titleId} className="text-xl font-black leading-tight text-tjc-ink">{title}</h2>
            {description ? <p id={descriptionId} className="mt-1 text-sm font-semibold leading-relaxed text-tjc-muted">{description}</p> : null}
          </div>
          <button ref={closeRef} className="grid h-10 w-10 place-items-center rounded-xl text-tjc-muted transition hover:bg-[#f3f6f2] hover:text-tjc-evergreen" type="button" onClick={onClose} aria-label={closeLabel}>
            <X size={17} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
        <div className="max-h-[calc(92dvh-9rem)] overflow-y-auto p-4">{children}</div>
        {footer ? <div className="flex flex-wrap items-center justify-end gap-2 border-t border-tjc-line bg-[#fbfcfa] px-4 py-3">{footer}</div> : null}
      </section>
    </div>
  );
}
