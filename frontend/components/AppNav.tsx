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
      className="tubelight-nav fixed bottom-3 left-1/2 z-30 flex w-[calc(100%-1.5rem)] max-w-[25rem] -translate-x-1/2 items-center gap-1 rounded-[1.65rem] border border-[#d5dfda] bg-white/93 p-1.5 shadow-[0_1px_0_rgba(255,255,255,.95)_inset,0_24px_70px_rgba(17,24,39,.18)] backdrop-blur-xl md:static md:z-auto md:w-max md:max-w-none md:translate-x-0 md:justify-center md:rounded-full md:border-[#d6dfd9] md:bg-white/82 md:p-1 md:shadow-[0_1px_0_rgba(255,255,255,.95)_inset,0_20px_55px_rgba(13,55,47,.10)]"
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
              "group relative inline-flex min-h-[4.1rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 overflow-visible rounded-[1.25rem] px-1.5 text-[11px] font-black text-[#5b655f] transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:text-tjc-evergreen active:scale-[.98] md:min-h-14 md:flex-none md:flex-row md:gap-1.5 md:rounded-full md:px-4 md:text-sm xl:px-5",
              isActive && "text-tjc-evergreen",
              utility && "border-l border-tjc-line"
            )}
            title={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            {isActive ? (
              <>
                <span className="absolute inset-0 rounded-[1.25rem] bg-[#e8f6f2] shadow-[inset_0_0_0_1px_rgba(13,121,112,.08),0_18px_34px_rgba(7,132,121,.16)] md:rounded-full" aria-hidden="true" />
                <span className="absolute -top-1 left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-t-full bg-[#087c75] shadow-[0_0_18px_rgba(8,124,117,.55)] md:-top-2" aria-hidden="true" />
                <span className="absolute left-1/2 top-0 h-14 w-20 -translate-x-1/2 rounded-full bg-[#19b9a8]/14 blur-xl md:h-16 md:w-28" aria-hidden="true" />
                <span className="absolute bottom-2 h-1 w-9 rounded-full bg-[#12a294] md:bottom-2.5" aria-hidden="true" />
              </>
            ) : null}
            <Icon className="relative z-10 h-5 w-5 shrink-0 transition duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-0.5 md:h-[18px] md:w-[18px]" aria-hidden="true" strokeWidth={1.9} />
            <span className="nav-label relative z-10 whitespace-nowrap leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
