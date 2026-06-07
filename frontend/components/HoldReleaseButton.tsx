"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/ui";

type HoldReleaseButtonProps = {
  children: ReactNode;
  onComplete: () => void;
  disabled?: boolean;
  holdMs?: number;
  className?: string;
  title?: string;
  ariaLabel?: string;
};

export function HoldReleaseButton({
  children,
  onComplete,
  disabled,
  holdMs = 850,
  className,
  title,
  ariaLabel
}: HoldReleaseButtonProps) {
  const [holding, setHolding] = useState(false);
  const timerRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  function clearHold() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    completedRef.current = false;
    setHolding(false);
  }

  function startHold() {
    if (disabled || holding || timerRef.current) return;
    completedRef.current = false;
    setHolding(true);
    timerRef.current = window.setTimeout(() => {
      completedRef.current = true;
      timerRef.current = null;
      setHolding(false);
      onComplete();
    }, holdMs);
  }

  function cancelHold() {
    if (completedRef.current) return;
    clearHold();
  }

  useEffect(() => clearHold, []);
  useEffect(() => {
    if (disabled) clearHold();
  }, [disabled]);

  return (
    <button
      className={cn(
        "relative inline-flex min-h-9 overflow-hidden rounded-md border border-[#e5b7b5] bg-white px-3 text-sm font-semibold text-[#7d2d2a] transition hover:bg-[#fff0ef] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55",
        className
      )}
      type="button"
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerCancel={cancelHold}
      onPointerLeave={cancelHold}
      onKeyDown={(event) => {
        if (event.repeat) return;
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          startHold();
        }
      }}
      onKeyUp={(event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          cancelHold();
        }
      }}
    >
      <span
        className={cn("absolute inset-y-0 left-0 bg-[#f7d9d7] opacity-80", holding ? "w-full" : "w-0")}
        style={{ transition: holding ? `width ${holdMs}ms linear` : "width 140ms ease-out" }}
        aria-hidden="true"
      />
      <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
    </button>
  );
}

export const HoldToConfirmButton = HoldReleaseButton;
