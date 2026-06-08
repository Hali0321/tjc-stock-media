"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, HelpCircle, Menu, X } from "lucide-react";
import { Toaster } from "sonner";
import { AppNav } from "@/components/AppNav";
import { CommandPalette } from "@/components/CommandPalette";
import { roles } from "@/lib/permissions";
import { useDemoRole } from "@/components/RoleProvider";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const { role, setRole } = useDemoRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden bg-tjc-bg text-tjc-ink">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="grain-overlay" aria-hidden="true" />
      <header className="dam-app-header sticky top-0 z-40 px-3 py-2.5 md:px-6 md:py-4">
        <div className="dam-app-shell relative mx-auto flex min-h-14 w-full max-w-[1760px] items-center justify-between gap-3 px-3.5 py-2.5 lg:px-4 xl:gap-4">
          <div className="flex min-w-0 shrink-0 items-center justify-between gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-3 lg:max-w-[13.5rem] xl:max-w-none" aria-label="TJC Stock Media home">
              <span className="dam-brand-mark grid h-9 w-9 shrink-0 place-items-center rounded-[.8rem] text-[9px] font-black text-white md:h-10 md:w-10">TJC</span>
              <span className="min-w-0">
                <strong className="block truncate text-sm font-black tracking-[-.01em] md:text-base">TJC Stock Media</strong>
                <small className="hidden max-w-[13rem] truncate text-[11px] font-semibold leading-snug text-tjc-muted lg:block">Private media operations DAM</small>
              </span>
            </Link>
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-[1rem] border border-[#d7e0da] bg-white text-tjc-evergreen shadow-[0_1px_0_rgba(255,255,255,.95)_inset,0_10px_24px_rgba(25,34,29,.08)] transition duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:bg-[#f1f7f3] active:scale-[.97] lg:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? "Close app menu" : "Open app menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-app-menu"
            >
              {mobileMenuOpen ? <X size={18} strokeWidth={1.8} aria-hidden="true" /> : <Menu size={18} strokeWidth={1.8} aria-hidden="true" />}
            </button>
          </div>

          <div className="hidden shrink-0 lg:block">
            <AppNav role={role} />
          </div>

          <div className="hidden min-w-0 shrink-0 items-center justify-end gap-2 lg:flex xl:gap-3">
            <CommandPalette />
            <Link href="/guide" className="hidden min-h-11 w-11 items-center justify-center gap-2 rounded-[1rem] border border-[#d3ded7] bg-white/90 px-0 text-sm font-bold text-tjc-evergreen shadow-[0_1px_0_rgba(255,255,255,.9)_inset,0_14px_32px_rgba(25,34,29,.06)] transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-0.5 hover:bg-[#f3f8f4] active:scale-[.985] lg:inline-flex 2xl:w-auto 2xl:px-3" aria-label="Open usage guide">
              <HelpCircle aria-hidden="true" size={16} strokeWidth={1.8} />
              <span className="hidden 2xl:inline">Guide</span>
            </Link>
            {role === "DAM Admin" ? (
              <a className="hidden min-h-11 items-center gap-2 rounded-[1rem] border border-[#d3ded7] bg-white/90 px-3 text-sm font-bold text-tjc-evergreen shadow-[0_1px_0_rgba(255,255,255,.9)_inset,0_14px_32px_rgba(25,34,29,.06)] transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-0.5 hover:bg-[#f3f8f4] active:scale-[.985] min-[1800px]:inline-flex" href="http://localhost:8088" target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden="true" size={16} strokeWidth={1.8} />
                <span>ResourceSpace</span>
              </a>
            ) : null}
            <label className="hidden shrink-0 items-center gap-2 xl:flex">
              <span id="demo-role-label" className="sr-only">Demo role</span>
              <select
                aria-labelledby="demo-role-label"
                value={role}
                onChange={(event) => setRole(event.target.value as typeof role)}
                className="min-h-10 w-[9.25rem] rounded-[.9rem] border border-[#d8e0da] bg-[#fbfdfb]/80 px-3 text-sm font-semibold text-[#2f3b34] shadow-[0_1px_0_rgba(255,255,255,.8)_inset]"
              >
                {roles.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <span data-header-control="avatar" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#f4f7f4] to-[#d8e1dd] text-sm font-black text-tjc-ink shadow-[0_1px_0_rgba(255,255,255,.9)_inset]">M</span>
          </div>
          {mobileMenuOpen ? (
            <div
              id="mobile-app-menu"
              className="absolute inset-x-3 top-[calc(100%+.5rem)] z-50 grid gap-3 rounded-[1.35rem] border border-[#d6e0d9] bg-white/96 p-3 shadow-[0_22px_60px_rgba(17,24,39,.16),0_1px_0_rgba(255,255,255,.95)_inset] backdrop-blur-xl lg:hidden"
            >
              <CommandPalette />
              <Link href="/guide" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#c1cec5] bg-[#f8fbf8] px-3 text-sm font-black text-tjc-evergreen" onClick={() => setMobileMenuOpen(false)}>
                <HelpCircle aria-hidden="true" size={16} strokeWidth={1.8} />
                <span>Guide</span>
              </Link>
              {role === "DAM Admin" ? (
                <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#c1cec5] bg-[#f8fbf8] px-3 text-sm font-black text-tjc-evergreen" href="http://localhost:8088" target="_blank" rel="noreferrer" onClick={() => setMobileMenuOpen(false)}>
                  <ExternalLink aria-hidden="true" size={16} strokeWidth={1.8} />
                  <span>ResourceSpace</span>
                </a>
              ) : null}
              <label className="grid gap-1">
                <span id="mobile-demo-role-label" className="text-xs font-black text-tjc-muted">Demo role</span>
                <select
                  aria-labelledby="mobile-demo-role-label"
                  value={role}
                  onChange={(event) => setRole(event.target.value as typeof role)}
                  className="min-h-11 rounded-xl border border-[#c1cec5] bg-white px-3 text-sm font-semibold text-tjc-ink"
                >
                  {roles.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
        </div>
      </header>
      <main id="main-content" className="relative z-10 min-w-0 pb-24 md:pb-0">{children}</main>
      <div className="relative z-20 px-3 pb-4 lg:hidden">
        <AppNav role={role} />
      </div>
      <Toaster
        position="bottom-center"
        offset={{ bottom: "7.25rem" }}
        mobileOffset={{ bottom: "calc(var(--app-mobile-nav-height) + var(--app-mobile-safe-bottom) + 1.25rem)", left: ".75rem", right: ".75rem" }}
        toastOptions={{
          classNames: {
            toast: "rounded-2xl border border-[#d6dfd8] bg-white text-tjc-ink shadow-[0_18px_50px_rgba(17,24,39,.16)]",
            title: "font-black text-tjc-ink",
            description: "font-semibold text-tjc-muted"
          }
        }}
      />
      <footer className="relative z-10 mx-auto flex w-full max-w-[1760px] flex-wrap gap-3 border-t border-tjc-line px-3 pb-8 pt-3 text-sm text-tjc-muted md:px-5">
        <Link href="/guide" className="font-semibold text-tjc-evergreen">Usage guide</Link>
        <span>ResourceSpace remains source of truth.</span>
        <span>Google Shared Drive keeps master originals.</span>
        <span>Demo role switch is not production auth.</span>
      </footer>
    </div>
  );
}
