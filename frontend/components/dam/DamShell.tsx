"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Bell, ChevronDown, Clock, HelpCircle, Menu, Search, ShieldCheck, Star, UploadCloud, X } from "lucide-react";
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
    <Link href={opsShell ? "/review" : "/"} className="dam-brand-lockup flex min-w-0 items-center gap-3" aria-label="True Jesus Church Media Library home">
      <span className="dam-brand-mark grid h-12 w-32 shrink-0 place-items-center overflow-hidden rounded-xl text-[10px] font-black text-white">
        <img src="/brand/tjc-logo-english-color.png" alt="" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <strong className="block truncate text-lg font-black tracking-[0] text-tjc-ink">True Jesus Church</strong>
        <small className="block truncate text-xs font-black text-tjc-muted">Media Library</small>
      </span>
    </Link>
  );
}

function DamRailSummary({ role, opsShell }: { role: DemoRole; opsShell: boolean }) {
  return (
    <section className="dam-rail-summary" aria-label="Current workspace">
      <span>{opsShell ? "Operations" : "Library"}</span>
      <strong>{opsShell ? "Workbench" : "Workspace"}</strong>
      <small>{role}</small>
    </section>
  );
}

function DamUtilityActions({ role, opsShell }: { role: DemoRole; opsShell: boolean }) {
  return (
    <div className="dam-utility-actions hidden min-w-0 items-center justify-end gap-3 md:flex">
      <span className="dam-shell-mode hidden min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black 2xl:inline-flex">
        <ShieldCheck size={14} strokeWidth={1.9} aria-hidden="true" />
        {opsShell ? "Operations workbench" : "Approved-copy mode"}
      </span>
      <CommandPalette />
      <Link href="/guide" className="dam-header-icon grid h-10 w-10 place-items-center rounded-xl border text-tjc-evergreen transition hover:bg-[#eef7f1]" aria-label="Open help">
        <HelpCircle size={18} strokeWidth={1.9} aria-hidden="true" />
      </Link>
      <Link href="/review" className="dam-header-icon dam-bell-icon grid h-10 w-10 place-items-center rounded-xl border text-tjc-evergreen transition hover:bg-[#eef7f1]" aria-label="Open notifications">
        <Bell size={18} strokeWidth={1.9} aria-hidden="true" />
      </Link>
      <div className="dam-user-menu">
        <span className="dam-avatar">AK</span>
        <span><strong>Alex Kim</strong><small>Brand Team</small></span>
        <ChevronDown size={14} aria-hidden="true" />
      </div>
      <DamRoleSwitch />
    </div>
  );
}

function DamTopSearch() {
  const [query, setQuery] = useState("");
  useEffect(() => {
    setQuery(new URLSearchParams(window.location.search).get("q") || "");
  }, []);
  return (
    <form className="dam-top-search" action="/" role="search" aria-label="Search assets, collections, and folders">
      <Search size={17} strokeWidth={1.9} aria-hidden="true" />
      <label className="sr-only" htmlFor="dam-global-search">Search assets, collections, and folders</label>
      <input
        id="dam-global-search"
        name="q"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search library..."
        autoComplete="off"
      />
      <kbd>⌘ K</kbd>
    </form>
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
    <div id="mobile-app-menu" className="workbench-mobile-menu absolute inset-x-3 top-[calc(100%+.55rem)] z-50 grid gap-3 rounded-2xl border border-[#d6e0d9] bg-white p-3 shadow-[0_20px_56px_rgba(17,24,39,.16)] lg:hidden">
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
          <span>Review queues, evidence, and audit-safe actions stay together.</span>
          <span>Production access follows assigned DAM roles.</span>
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
        <div className="dam-header-inner mx-auto grid min-h-16 w-full max-w-[1760px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 xl:grid-cols-[minmax(18rem,.45fr)_minmax(18rem,42rem)_auto]">
          <DamBrand opsShell={opsShell} />

          <div className="dam-top-nav-slot hidden min-w-0 justify-center md:flex">
            <DamTopSearch />
          </div>

          <DamUtilityActions role={role} opsShell={opsShell} />

          <button
            type="button"
            className="dam-header-icon grid h-12 w-12 place-items-center rounded-xl border text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px lg:hidden"
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
        <div className="sticky top-[var(--app-header-height)] grid h-[calc(100dvh-var(--app-header-height))] content-start gap-3 p-3">
          <Link href="/" className="dam-rail-brand" aria-label="True Jesus Church Media Library home">
            <img src="/brand/tjc-logo-english-white.png" alt="True Jesus Church" />
            <span>MEDIA LIBRARY</span>
          </Link>
          <DamRailSummary role={role} opsShell={opsShell} />
          <AppNav role={role} variant="menu" />
          <section className="dam-quick-access" aria-label="Quick access">
            <h2>Quick access</h2>
            <Link href="/?view=saved"><Star size={15} />Saved views</Link>
            <Link href="/?view=recently-approved"><Clock size={15} />Recent approvals</Link>
            <Link href="/upload"><UploadCloud size={15} />Send media</Link>
          </section>
          <section className="dam-storage-meter" aria-label="Storage used">
            <h2>Storage used</h2>
            <p>2.45 TB used</p>
          </section>
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

export { DamBrand, DamUtilityActions, DamMobileMenu, DamFooter, DamRoleSwitch, DamRailSummary };
export { AppNav as DamRoleNavigation };
export { CommandPalette as DamCommandEntry };
