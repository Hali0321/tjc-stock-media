"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, HelpCircle, Search, ShieldCheck, UploadCloud } from "lucide-react";
import { roles } from "@/lib/permissions";
import { useDemoRole } from "@/components/RoleProvider";

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
    <div className="app-frame">
      <aside className="app-sidebar" aria-label="TJC Stock Media navigation">
        <div className="app-sidebar__top">
          <Link href="/" className="brand" aria-label="TJC Stock Media home">
            <span className="brand__mark">TJC</span>
            <span>
              <strong>TJC Stock Media</strong>
              <small>Ministry media library</small>
            </span>
          </Link>
          <nav className="nav" aria-label="Primary navigation">
            {nav.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === "/" ? pathname === "/" : item.href.startsWith("/#") ? false : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav__link ${isActive ? "nav__link--active" : ""}`}
                >
                  <Icon aria-hidden="true" size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="app-sidebar__bottom">
          <Link href="/guide" className="help-link" aria-label="Open usage guide">
            <HelpCircle aria-hidden="true" size={16} />
            <span>Usage guide</span>
          </Link>
          <p>ResourceSpace backend. Google Shared Drive originals.</p>
        </div>
      </aside>
      <section className="app-workspace">
        <header className="topbar">
          <div>
            <span>Approved media for ministry teams</span>
          </div>
          <div className="utility-cluster">
            <Link href="/guide" className="help-link help-link--top" aria-label="Open usage guide">
              <HelpCircle aria-hidden="true" size={16} />
              <span>Guide</span>
            </Link>
            <label className="role-switch">
              <span id="demo-role-label">Demo role</span>
              <select aria-labelledby="demo-role-label" value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
                {roles.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
        </header>
        <main>{children}</main>
        <footer className="app-footer">
          <Link href="/guide">Usage guide</Link>
          <span>ResourceSpace remains backend/source of truth.</span>
        </footer>
      </section>
    </div>
  );
}
