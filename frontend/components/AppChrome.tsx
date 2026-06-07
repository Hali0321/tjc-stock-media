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
      <header className="dam-app-header sticky top-0 z-40 px-3 py-3 md:px-6 md:py-5">
        <div className="dam-app-shell relative mx-auto grid min-h-16 w-full max-w-[1760px] gap-3 px-4 py-3 md:grid-cols-[auto_1fr_auto] md:items-center md:px-5">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="TJC Stock Media home">
              <span className="dam-brand-mark grid h-11 w-11 shrink-0 place-items-center rounded-[1rem] text-[10px] font-black text-white md:h-14 md:w-14">TJC</span>
              <span className="min-w-0">
                <strong className="block truncate text-base font-black tracking-[-.01em] md:text-lg">TJC Stock Media</strong>
                <small className="hidden max-w-[13rem] truncate text-xs font-semibold leading-snug text-tjc-muted sm:block">ResourceSpace-backed ministry DAM</small>
              </span>
            </Link>
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-[1rem] border border-[#d7e0da] bg-white text-tjc-evergreen shadow-[0_1px_0_rgba(255,255,255,.95)_inset,0_10px_24px_rgba(25,34,29,.08)] transition duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:bg-[#f1f7f3] active:scale-[.97] md:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? "Close app menu" : "Open app menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-app-menu"
            >
              {mobileMenuOpen ? <X size={18} strokeWidth={1.8} aria-hidden="true" /> : <Menu size={18} strokeWidth={1.8} aria-hidden="true" />}
            </button>
          </div>

          <div className="hidden md:block">
            <AppNav role={role} />
          </div>

          <div className="hidden min-w-0 items-center justify-end gap-3 md:flex">
            <CommandPalette />
            <Link href="/guide" className="hidden min-h-10 items-center gap-2 rounded-xl border border-[#c1cec5] bg-white/95 px-3 text-sm font-bold text-tjc-evergreen shadow-[0_1px_0_rgba(255,255,255,.9)_inset,0_10px_24px_rgba(25,34,29,.055)] transition hover:bg-[#f3f8f4] active:translate-y-px md:inline-flex" aria-label="Open usage guide">
              <HelpCircle aria-hidden="true" size={16} strokeWidth={1.8} />
              <span>Guide</span>
            </Link>
            {role === "DAM Admin" ? (
              <a className="hidden min-h-10 items-center gap-2 rounded-xl border border-[#c1cec5] bg-white/95 px-3 text-sm font-bold text-tjc-evergreen shadow-[0_1px_0_rgba(255,255,255,.9)_inset,0_10px_24px_rgba(25,34,29,.055)] transition hover:bg-[#f3f8f4] active:translate-y-px lg:inline-flex" href="http://localhost:8088" target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden="true" size={16} strokeWidth={1.8} />
                <span>ResourceSpace</span>
              </a>
            ) : null}
            <label className="flex min-w-0 items-center gap-2">
              <span id="demo-role-label" className="hidden text-xs font-medium text-tjc-muted sm:inline">Demo role</span>
              <select
                aria-labelledby="demo-role-label"
                value={role}
                onChange={(event) => setRole(event.target.value as typeof role)}
                className="min-h-10 max-w-[11rem] rounded-xl border border-[#c1cec5] bg-white px-3 text-sm font-semibold text-tjc-ink shadow-[0_1px_0_rgba(255,255,255,.9)_inset] max-[380px]:max-w-[8.5rem]"
              >
                {roles.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#f4f7f4] to-[#d8e1dd] text-sm font-black text-tjc-ink shadow-[0_1px_0_rgba(255,255,255,.9)_inset]">M</span>
          </div>
          {mobileMenuOpen ? (
            <div
              id="mobile-app-menu"
              className="absolute inset-x-3 top-[calc(100%+.5rem)] z-50 grid gap-3 rounded-[1.35rem] border border-[#d6e0d9] bg-white/96 p-3 shadow-[0_22px_60px_rgba(17,24,39,.16),0_1px_0_rgba(255,255,255,.95)_inset] backdrop-blur-xl md:hidden"
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
      <div className="md:hidden">
        <AppNav role={role} />
      </div>
      <main id="main-content" className="relative z-10 min-w-0 pb-24 md:pb-0">{children}</main>
      <Toaster
        position="bottom-right"
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
