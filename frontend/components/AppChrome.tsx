"use client";

import Link from "next/link";
import { ExternalLink, HelpCircle } from "lucide-react";
import { Toaster } from "sonner";
import { AppNav } from "@/components/AppNav";
import { CommandPalette } from "@/components/CommandPalette";
import { roles } from "@/lib/permissions";
import { useDemoRole } from "@/components/RoleProvider";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const { role, setRole } = useDemoRole();

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden bg-tjc-bg text-tjc-ink">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="grain-overlay" aria-hidden="true" />
      <header className="dam-app-header sticky top-0 z-40">
        <div className="mx-auto grid min-h-16 w-full max-w-[1760px] gap-2 px-3 py-2 md:grid-cols-[auto_1fr_auto] md:items-center md:px-5">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="TJC Stock Media home">
              <span className="dam-brand-mark grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[10px] font-black text-white">TJC</span>
              <span className="min-w-0">
                <strong className="block truncate text-base font-black tracking-[-.01em]">TJC Stock Media</strong>
                <small className="hidden truncate text-xs font-semibold text-tjc-muted sm:block">ResourceSpace-backed ministry DAM</small>
              </span>
            </Link>
          </div>

          <AppNav role={role} />

          <div className="flex min-w-0 items-center justify-end gap-2">
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
          </div>
        </div>
      </header>
      <main id="main-content" className="relative z-10 min-w-0">{children}</main>
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
