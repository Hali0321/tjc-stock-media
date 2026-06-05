"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, FolderOpen, HelpCircle, Search, ShieldCheck, UploadCloud } from "lucide-react";
import { roles } from "@/lib/permissions";
import { useDemoRole } from "@/components/RoleProvider";
import { cn } from "@/lib/ui";

const nav = [
  { href: "/", label: "Library", icon: Search },
  { href: "/#collections", label: "Collections", icon: FolderOpen },
  { href: "/upload", label: "Upload", icon: UploadCloud },
  { href: "/review", label: "Review", icon: ShieldCheck }
];

export function AppChrome({ children }: { children: React.ReactNode }) {
  const { role, setRole } = useDemoRole();
  const pathname = usePathname();

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden bg-tjc-bg text-tjc-ink">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="grain-overlay" aria-hidden="true" />
      <header className="sticky top-0 z-40 border-b border-tjc-line bg-[#f8faf6]/94 backdrop-blur-xl">
        <div className="mx-auto grid min-h-16 w-full max-w-[1760px] gap-2 px-3 py-2 md:grid-cols-[auto_1fr_auto] md:items-center md:px-5">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="TJC Stock Media home">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-tjc-evergreen text-[11px] font-bold text-white shadow-[0_8px_18px_rgba(18,63,58,.18)]">TJC</span>
              <span className="min-w-0">
                <strong className="block truncate text-[15px] font-semibold tracking-[-.01em]">TJC Stock Media</strong>
                <small className="block truncate text-xs font-medium text-tjc-muted">ResourceSpace-backed ministry DAM</small>
              </span>
            </Link>
            <label className="flex min-w-0 items-center gap-2 md:hidden">
              <span className="sr-only">Demo role</span>
              <select
                aria-label="Demo role"
                value={role}
                onChange={(event) => setRole(event.target.value as typeof role)}
                className="min-h-9 max-w-[9.5rem] rounded-lg border border-tjc-line bg-white px-2.5 text-sm font-medium text-tjc-ink"
              >
                {roles.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <nav className="flex min-w-0 items-center gap-1 overflow-x-auto md:justify-center" aria-label="Primary navigation">
            {nav.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === "/" ? pathname === "/" : item.href.startsWith("/#") ? false : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[#3f4741] transition hover:bg-white hover:text-tjc-evergreen active:translate-y-px",
                    isActive && "bg-white text-tjc-evergreen shadow-[0_1px_0_rgba(32,34,31,.06)]"
                  )}
                >
                  <Icon aria-hidden="true" size={16} strokeWidth={1.8} />
                  <span className="max-[350px]:sr-only">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden min-w-0 items-center justify-end gap-2 md:flex">
            <Link href="/guide" className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef5f1] active:translate-y-px" aria-label="Open usage guide">
              <HelpCircle aria-hidden="true" size={16} strokeWidth={1.8} />
              <span>Guide</span>
            </Link>
            {role === "DAM Admin" ? (
              <a className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef5f1] active:translate-y-px" href="http://localhost:8088" target="_blank" rel="noreferrer">
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
                className="min-h-9 max-w-[11rem] rounded-lg border border-tjc-line bg-white px-3 text-sm font-medium text-tjc-ink"
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
      <footer className="relative z-10 mx-auto flex w-full max-w-[1760px] flex-wrap gap-3 px-3 pb-8 pt-3 text-sm text-tjc-muted md:px-5">
        <Link href="/guide" className="font-semibold text-tjc-evergreen">Usage guide</Link>
        <span>ResourceSpace remains source of truth.</span>
        <span>Google Shared Drive keeps master originals.</span>
        <span>Demo role switch is not production auth.</span>
      </footer>
    </div>
  );
}
