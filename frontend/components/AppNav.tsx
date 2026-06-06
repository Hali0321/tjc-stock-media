"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, Search, Settings2, ShieldCheck, UploadCloud, type LucideIcon } from "lucide-react";
import type { DemoRole } from "@/lib/types";
import { cn } from "@/lib/ui";

type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

const navItems: AppNavItem[] = [
  { href: "/", label: "Library", icon: Search },
  { href: "/collections", label: "Collections", icon: FolderOpen },
  { href: "/upload", label: "Upload", icon: UploadCloud },
  { href: "/review", label: "Review", icon: ShieldCheck },
  { href: "/admin", label: "Admin", icon: Settings2, adminOnly: true }
];

export function AppNav({ role }: { role: DemoRole }) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) => !item.adminOnly || role === "DAM Admin");

  return (
    <nav className="tubelight-nav flex min-w-0 items-center gap-1 overflow-x-auto rounded-xl border border-tjc-line bg-[#fbfcfa]/92 p-1 md:justify-center" aria-label="Primary navigation">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const utility = item.href === "/admin";
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-[#3f4741] transition hover:text-tjc-evergreen active:translate-y-px",
              isActive && "text-tjc-evergreen",
              utility && "border-l border-tjc-line"
            )}
            title={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            {isActive ? <span className="absolute inset-0 rounded-lg border border-[#a7cbbd] bg-white shadow-[0_6px_18px_rgba(18,63,58,.10)]" aria-hidden="true" /> : null}
            <Icon className="relative z-10" aria-hidden="true" size={16} strokeWidth={1.8} />
            <span className="relative z-10 max-[430px]:sr-only">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
