"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, Gauge, Search, ShieldCheck, UploadCloud, type LucideIcon } from "lucide-react";
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
  { href: "/upload", label: "Intake", icon: UploadCloud },
  { href: "/review", label: "Review", icon: ShieldCheck },
  { href: "/admin", label: "Govern", icon: Gauge, adminOnly: true }
];

export function AppNav({ role }: { role: DemoRole }) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) => !item.adminOnly || role === "DAM Admin");

  return (
    <nav
      className="tubelight-nav mx-auto flex w-full max-w-[34rem] items-center gap-1 rounded-[1rem] border border-[#c9d4d5] bg-white p-1.5 shadow-[0_1px_0_rgba(255,255,255,.9)_inset,0_12px_28px_rgba(17,24,39,.09)] lg:static lg:z-auto lg:w-max lg:max-w-none lg:translate-x-0 lg:justify-center lg:gap-1.5 lg:rounded-[1rem] lg:p-1.5 2xl:gap-2"
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
              "group relative inline-flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 overflow-visible rounded-[1.1rem] px-1.5 text-[11px] font-black text-[#5b655f] transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:text-tjc-evergreen active:scale-[.98] lg:min-h-14 lg:flex-none lg:flex-row lg:gap-1.5 lg:rounded-full lg:px-5 lg:text-sm 2xl:gap-2 2xl:px-7 2xl:text-base",
              isActive && "text-tjc-evergreen",
              utility && "border-l border-tjc-line"
            )}
            title={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            {isActive ? (
              <>
                <span className="absolute inset-0 rounded-[.85rem] bg-[#e9f3ef] shadow-[inset_0_0_0_1px_rgba(13,63,57,.12)]" aria-hidden="true" />
                <span className="absolute inset-x-3 bottom-1.5 h-0.5 rounded-full bg-[#0b5950]" aria-hidden="true" />
              </>
            ) : null}
            <Icon className="relative z-10 h-5 w-5 shrink-0 transition duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-0.5 lg:h-[18px] lg:w-[18px]" aria-hidden="true" strokeWidth={1.9} />
            <span className="nav-label relative z-10 whitespace-nowrap leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
