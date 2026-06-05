"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, FolderOpen, Search, ShieldCheck, UploadCloud } from "lucide-react";
import { roles } from "@/lib/permissions";
import { useDemoRole } from "@/components/RoleProvider";

const nav = [
  { href: "/", label: "Library", icon: Search },
  { href: "/#collections", label: "Collections", icon: FolderOpen },
  { href: "/upload", label: "Upload", icon: UploadCloud },
  { href: "/review", label: "Review", icon: ShieldCheck },
  { href: "/guide", label: "Guide", icon: Database }
];

export function AppChrome({ children }: { children: React.ReactNode }) {
  const { role, setRole } = useDemoRole();
  const pathname = usePathname();

  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <Link href="/" className="brand" aria-label="TJC Stock Media home">
            <span className="brand__mark">TJC</span>
            <span>
              <strong>TJC Stock Media</strong>
              <small>Approved media for ministry teams</small>
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
          <label className="role-switch">
            <span>Demo role</span>
            <select value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
              {roles.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="demo-note">Demo role switch - production roles will map to church access control later.</div>
      </header>
      <main>{children}</main>
    </>
  );
}
