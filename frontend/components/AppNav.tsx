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
  { href: "/collections", label: "Albums", icon: FolderOpen },
  { href: "/upload", label: "Upload", icon: UploadCloud },
  { href: "/review", label: "Review", icon: ShieldCheck },
  { href: "/admin", label: "Admin", icon: Settings2, adminOnly: true }
];

export function AppNav({ role }: { role: DemoRole }) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) => !item.adminOnly || role === "DAM Admin");

  return (
    <nav
      className="tubelight-nav flex w-full min-w-0 items-center gap-1 rounded-2xl border border-[#b9c8bf] bg-white/94 p-1 shadow-[0_1px_0_rgba(255,255,255,.95)_inset,0_12px_28px_rgba(35,53,111,.06)] backdrop-blur md:justify-center md:rounded-full"
      aria-label="Primary navigation"
    >
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const utility = item.href === "/admin";
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative inline-flex min-h-10 min-w-0 flex-1 items-center justify-center gap-0.5 rounded-xl px-1.5 text-[11px] font-bold text-[#3f4741] transition duration-200 hover:bg-[#f2f6f2] hover:text-tjc-evergreen active:translate-y-px sm:shrink-0 sm:flex-none sm:gap-1.5 sm:px-3 sm:text-sm md:rounded-full",
              isActive && "bg-[#e6f0eb] text-tjc-evergreen shadow-[inset_0_0_0_1px_rgba(15,61,46,.08)]",
              utility && "border-l border-tjc-line"
            )}
            title={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            {isActive ? <span className="absolute inset-x-3 bottom-1 h-1 rounded-full bg-tjc-blue" aria-hidden="true" /> : null}
            <Icon className="relative z-10 shrink-0 sm:h-3.5 sm:w-3.5" aria-hidden="true" size={12} strokeWidth={1.8} />
            <span className="nav-label relative z-10 whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
