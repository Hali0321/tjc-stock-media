"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, Menu, Settings2, X } from "lucide-react";
import { Toaster } from "sonner";
import { AppNav } from "@/components/AppNav";
import { CommandPalette } from "@/components/CommandPalette";
import { roles } from "@/lib/permissions";
import { useDemoRole } from "@/components/RoleProvider";

function RoleSwitch({ compact = false }: { compact?: boolean }) {
  const { role, setRole } = useDemoRole();
  return (
    <label className={compact ? "grid gap-1" : "hidden shrink-0 items-center gap-2 md:flex"}>
      <span id={compact ? "mobile-demo-role-label" : "demo-role-label"} className={compact ? "text-xs font-black text-tjc-muted" : "sr-only"}>Demo role</span>
      <select
        aria-labelledby={compact ? "mobile-demo-role-label" : "demo-role-label"}
        value={role}
        onChange={(event) => setRole(event.target.value as typeof role)}
        className="min-h-10 rounded-md border border-[#cbd8cf] bg-white px-3 text-sm font-black text-[#2f3b34]"
      >
        {roles.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const { role } = useDemoRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const opsShell = role === "Reviewer" || role === "DAM Admin";
  const navLabel = opsShell ? "DAM operations" : "Find and Use";

  return (
    <div className="min-h-[100dvh] w-full overflow-x-clip bg-tjc-bg text-tjc-ink">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="grain-overlay" aria-hidden="true" />
      <header className="dam-app-header sticky top-0 z-40 px-3 py-2.5 md:px-5">
        <div className="mx-auto flex min-h-14 w-full max-w-[1760px] items-center justify-between gap-3">
          <Link href={opsShell ? "/review" : "/"} className="flex min-w-0 items-center gap-3" aria-label="TJC Stock Media home">
            <span className="dam-brand-mark grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[10px] font-black text-white">TJC</span>
            <span className="min-w-0">
              <strong className="block truncate text-base font-black tracking-[0] text-tjc-ink">TJC Stock Media</strong>
              <small className="block truncate text-xs font-bold text-tjc-muted">{navLabel}</small>
            </span>
          </Link>

          <div className="hidden flex-1 justify-center xl:flex">
            <AppNav role={role} variant="top" />
          </div>

          <div className="hidden min-w-0 items-center justify-end gap-2 md:flex">
            <CommandPalette />
            <Link href="/guide" className="grid h-10 w-10 place-items-center rounded-md border border-[#cbd8cf] bg-white text-tjc-evergreen transition hover:bg-[#eef7f1]" aria-label="Open help">
              <HelpCircle size={18} strokeWidth={1.9} aria-hidden="true" />
            </Link>
            {opsShell ? (
              <Link href="/admin" className="grid h-10 w-10 place-items-center rounded-md border border-[#cbd8cf] bg-white text-tjc-evergreen transition hover:bg-[#eef7f1]" aria-label="Open governance">
                <Settings2 size={18} strokeWidth={1.9} aria-hidden="true" />
              </Link>
            ) : null}
            <RoleSwitch />
          </div>

          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-md border border-[#cbd8cf] bg-white text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px xl:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? "Close app menu" : "Open app menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-app-menu"
          >
            {mobileMenuOpen ? <X size={19} strokeWidth={1.9} aria-hidden="true" /> : <Menu size={19} strokeWidth={1.9} aria-hidden="true" />}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div id="mobile-app-menu" className="absolute inset-x-3 top-[calc(100%+.5rem)] z-50 grid gap-3 rounded-lg border border-[#d6e0d9] bg-white p-3 shadow-[0_20px_56px_rgba(17,24,39,.16)] xl:hidden">
            <CommandPalette />
            <AppNav role={role} variant="menu" onNavigate={() => setMobileMenuOpen(false)} />
            <RoleSwitch compact />
          </div>
        ) : null}
      </header>

      <main id="main-content" className="relative z-10 min-w-0 pb-4 md:pb-10">{children}</main>

      <Toaster
        position="bottom-center"
        offset={{ bottom: "7.25rem" }}
        mobileOffset={{ bottom: "calc(var(--app-mobile-nav-height) + var(--app-mobile-safe-bottom) + 1.25rem)", left: ".75rem", right: ".75rem" }}
        toastOptions={{
          classNames: {
            toast: "rounded-lg border border-[#d6dfd8] bg-white text-tjc-ink shadow-[0_18px_50px_rgba(17,24,39,.16)]",
            title: "font-black text-tjc-ink",
            description: "font-semibold text-tjc-muted"
          }
        }}
      />

      <footer className="relative z-10 mx-auto flex w-full max-w-[1760px] flex-wrap items-center gap-3 border-t border-[#d8e1da] px-4 py-6 text-sm font-semibold text-tjc-muted md:px-6">
        <Link href="/guide" className="font-black text-tjc-evergreen">Help</Link>
        {opsShell ? (
          <>
            <span>Operations view shows source, sync, audit, and launch readiness.</span>
            <span>Demo role switch is not production auth.</span>
          </>
        ) : (
          <>
            <span>Use approved copies.</span>
            <span>When unsure, request DAM review.</span>
          </>
        )}
      </footer>
    </div>
  );
}
