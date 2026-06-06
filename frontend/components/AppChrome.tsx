"use client";

import Link from "next/link";
import { ExternalLink, HelpCircle } from "lucide-react";
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
      <header className="sticky top-0 z-40 border-b border-tjc-line bg-white/95 backdrop-blur">
        <div className="mx-auto grid min-h-14 w-full max-w-[1760px] gap-2 px-3 py-2 md:grid-cols-[auto_1fr_auto] md:items-center md:px-5">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="TJC Stock Media home">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-tjc-evergreen text-[10px] font-bold text-white">TJC</span>
              <span className="min-w-0">
                <strong className="block truncate text-[15px] font-semibold">
                  <span className="max-[350px]:hidden">TJC Stock Media</span>
                  <span className="hidden max-[350px]:inline">TJC Media</span>
                </strong>
                <small className="hidden truncate text-xs font-medium text-tjc-muted sm:block">ResourceSpace-backed ministry DAM</small>
              </span>
            </Link>
          </div>

          <AppNav role={role} />

          <div className="flex min-w-0 items-center justify-end gap-2">
            <CommandPalette />
            <Link href="/guide" className="hidden min-h-9 items-center gap-2 rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#f3f6f2] active:translate-y-px md:inline-flex" aria-label="Open usage guide">
              <HelpCircle aria-hidden="true" size={16} strokeWidth={1.8} />
              <span>Guide</span>
            </Link>
            {role === "DAM Admin" ? (
              <a className="hidden min-h-9 items-center gap-2 rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#f3f6f2] active:translate-y-px lg:inline-flex" href="http://localhost:8088" target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden="true" size={16} strokeWidth={1.8} />
                <span>ResourceSpace</span>
              </a>
            ) : null}
            <label className="flex min-w-0 items-center gap-2">
              <span id="demo-role-label" className="text-xs font-medium text-tjc-muted">Demo role</span>
              <select
                aria-labelledby="demo-role-label"
                value={role}
                onChange={(event) => setRole(event.target.value as typeof role)}
                className="min-h-9 max-w-[11rem] rounded-md border border-tjc-line bg-white px-3 text-sm font-medium text-tjc-ink"
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
      <footer className="relative z-10 mx-auto flex w-full max-w-[1760px] flex-wrap gap-3 border-t border-tjc-line px-3 pb-8 pt-3 text-sm text-tjc-muted md:px-5">
        <Link href="/guide" className="font-semibold text-tjc-evergreen">Usage guide</Link>
        <span>ResourceSpace remains source of truth.</span>
        <span>Google Shared Drive keeps master originals.</span>
        <span>Demo role switch is not production auth.</span>
      </footer>
    </div>
  );
}
