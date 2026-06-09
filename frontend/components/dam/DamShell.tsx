"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { HelpCircle, Menu, Settings2, Sparkles, X } from "lucide-react";
import { Toaster } from "sonner";
import { AppNav } from "@/components/AppNav";
import { CommandPalette } from "@/components/CommandPalette";
import { useDemoRole } from "@/components/RoleProvider";
import { roles } from "@/lib/permissions";
import type { DemoRole } from "@/lib/types";

function DamRoleSwitch({ compact = false }: { compact?: boolean }) {
  const { role, setRole } = useDemoRole();
  return (
    <label className={compact ? "grid gap-1" : "hidden shrink-0 items-center gap-2 md:flex"}>
      <span id={compact ? "mobile-access-role-label" : "access-role-label"} className={compact ? "text-xs font-black text-tjc-muted" : "sr-only"}>Access role</span>
      <select
        aria-labelledby={compact ? "mobile-access-role-label" : "access-role-label"}
        value={role}
        onChange={(event) => setRole(event.target.value as DemoRole)}
        className="min-h-10 rounded-md border border-[#cbd8cf] bg-white px-3 text-sm font-black text-[#2f3b34]"
      >
        {roles.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}

function DamBrand({ opsShell }: { opsShell: boolean }) {
  return (
    <Link href={opsShell ? "/review" : "/"} className="dam-brand-lockup flex min-w-0 items-center gap-3" aria-label="TJC Stock Media home">
      <span className="dam-brand-mark grid h-12 w-12 shrink-0 place-items-center rounded-xl text-[10px] font-black text-white">TJC</span>
      <span className="min-w-0">
        <strong className="block truncate text-lg font-black tracking-[0] text-tjc-ink">TJC Stock Media</strong>
        <small className="block truncate text-xs font-black text-tjc-muted">{opsShell ? "DAM operations" : "Find and Use"}</small>
      </span>
    </Link>
  );
}

function DamUtilityActions({ role, opsShell }: { role: DemoRole; opsShell: boolean }) {
  const canOpenGovernance = role === "DAM Admin";
  return (
    <div className="hidden min-w-0 items-center justify-end gap-2 md:flex">
      <span className="dam-shell-mode hidden min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black 2xl:inline-flex">
        <Sparkles size={14} strokeWidth={1.9} aria-hidden="true" />
        {opsShell ? "Operations workbench" : "Approved-copy mode"}
      </span>
      <CommandPalette />
      <Link href="/guide" className="dam-header-icon grid h-10 w-10 place-items-center rounded-xl border text-tjc-evergreen transition hover:bg-[#eef7f1]" aria-label="Open help">
        <HelpCircle size={18} strokeWidth={1.9} aria-hidden="true" />
      </Link>
      {canOpenGovernance ? (
        <Link href="/admin" className="dam-header-icon grid h-10 w-10 place-items-center rounded-xl border text-tjc-evergreen transition hover:bg-[#eef7f1]" aria-label="Open governance">
          <Settings2 size={18} strokeWidth={1.9} aria-hidden="true" />
        </Link>
      ) : null}
      <DamRoleSwitch />
    </div>
  );
}

function DamMobileMenu({
  open,
  role,
  opsShell,
  onClose
}: {
  open: boolean;
  role: DemoRole;
  opsShell: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div id="mobile-app-menu" className="workbench-mobile-menu absolute inset-x-3 top-[calc(100%+.55rem)] z-50 grid gap-3 rounded-2xl border border-[#d6e0d9] bg-white p-3 shadow-[0_20px_56px_rgba(17,24,39,.16)] 2xl:hidden">
      <div className="rounded-xl bg-[#0f3d2e] p-3 text-white">
        <span className="block text-xs font-black uppercase tracking-[.08em] text-white/70">{opsShell ? "Operations" : "Media workbench"}</span>
        <strong className="mt-1 block text-base font-black">{opsShell ? "Review, governance, and audit" : "Find, package, and send safely"}</strong>
      </div>
      <CommandPalette />
      <AppNav role={role} variant="menu" onNavigate={onClose} />
      <DamRoleSwitch compact />
    </div>
  );
}

function DamFooter({ opsShell }: { opsShell: boolean }) {
  return (
    <footer className="relative z-10 mx-auto flex w-full max-w-[1760px] flex-wrap items-center gap-3 border-t border-[#d8e1da] px-4 py-6 text-sm font-semibold text-tjc-muted md:px-6">
      <Link href="/guide" className="font-black text-tjc-evergreen">Help</Link>
      {opsShell ? (
        <>
          <span>Operations view shows review queues, evidence, and audit-safe actions.</span>
          <span>Production access uses assigned DAM roles.</span>
        </>
      ) : (
        <>
          <span>Use approved copies.</span>
          <span>When unsure, request DAM review.</span>
        </>
      )}
    </footer>
  );
}

export function DamShell({ children }: { children: ReactNode }) {
  const { role } = useDemoRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const opsShell = role === "Reviewer" || role === "DAM Admin";

  return (
    <div className="dam-workbench-v2 min-h-[100dvh] w-full overflow-x-clip bg-tjc-bg text-tjc-ink">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="grain-overlay" aria-hidden="true" />
      <header className="dam-app-header sticky top-0 z-40 px-3 py-3 md:px-5">
        <div className="dam-header-inner mx-auto grid min-h-16 w-full max-w-[1760px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 xl:grid-cols-[minmax(18rem,.52fr)_minmax(0,1fr)_auto]">
          <DamBrand opsShell={opsShell} />

          <div className="dam-top-nav-slot hidden min-w-0 justify-center 2xl:flex">
            <AppNav role={role} variant="top" />
          </div>

          <DamUtilityActions role={role} opsShell={opsShell} />

          <button
            type="button"
            className="dam-header-icon grid h-12 w-12 place-items-center rounded-xl border text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px 2xl:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? "Close app menu" : "Open app menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-app-menu"
          >
            {mobileMenuOpen ? <X size={19} strokeWidth={1.9} aria-hidden="true" /> : <Menu size={19} strokeWidth={1.9} aria-hidden="true" />}
          </button>
        </div>

        <DamMobileMenu open={mobileMenuOpen} role={role} opsShell={opsShell} onClose={() => setMobileMenuOpen(false)} />
      </header>

      <aside className="dam-desktop-rail hidden border-r border-[#d7dde2] bg-white lg:block" aria-label="Desktop workspace navigation">
        <div className="sticky top-[var(--app-header-height)] grid h-[calc(100dvh-var(--app-header-height))] content-start p-3">
          <AppNav role={role} variant="menu" />
        </div>
      </aside>

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

      <DamFooter opsShell={opsShell} />
    </div>
  );
}

export { DamBrand, DamUtilityActions, DamMobileMenu, DamFooter, DamRoleSwitch };
export { AppNav as DamRoleNavigation };
export { CommandPalette as DamCommandEntry };
