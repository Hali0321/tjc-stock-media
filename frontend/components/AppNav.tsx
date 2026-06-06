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
    <nav className="tubelight-nav flex min-w-0 items-center gap-1 overflow-x-auto rounded-[1.15rem] border border-[#b9c8bf] bg-[#fdfefd]/92 p-1.5 shadow-[0_18px_46px_rgba(25,34,29,.11),inset_0_1px_0_rgba(255,255,255,.95)] backdrop-blur md:justify-center" aria-label="Primary navigation">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const utility = item.href === "/admin";
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-[.9rem] px-3.5 text-sm font-bold text-[#3f4741] transition duration-200 hover:bg-[#edf5ef] hover:text-tjc-evergreen active:translate-y-px",
              isActive && "text-tjc-evergreen",
              utility && "border-l border-tjc-line"
            )}
            title={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            {isActive ? <span className="absolute inset-0 rounded-[.9rem] border border-[#7db3a1] bg-[linear-gradient(180deg,#f5fff8,#e0f4e9)] shadow-[0_10px_26px_rgba(6,63,57,.18),inset_0_1px_0_rgba(255,255,255,.95)]" aria-hidden="true" /> : null}
            <Icon className="relative z-10" aria-hidden="true" size={16} strokeWidth={1.8} />
            <span className="relative z-10 max-[430px]:sr-only">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
