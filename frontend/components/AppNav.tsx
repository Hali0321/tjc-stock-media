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
    <nav className="tubelight-nav flex min-w-0 items-center gap-1 overflow-x-auto rounded-full border border-[#b9c8bf] bg-white/92 p-1 backdrop-blur md:justify-center" aria-label="Primary navigation">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const utility = item.href === "/admin";
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold text-[#3f4741] transition duration-200 hover:bg-[#f2f6f2] hover:text-tjc-evergreen active:translate-y-px",
              isActive && "text-tjc-evergreen",
              utility && "border-l border-tjc-line"
            )}
            title={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            {isActive ? <span className="absolute inset-x-2 bottom-1 h-1 rounded-full bg-tjc-evergreen" aria-hidden="true" /> : null}
            <Icon className="relative z-10" aria-hidden="true" size={16} strokeWidth={1.8} />
            <span className={cn("relative z-10", utility ? "max-[1530px]:sr-only" : "max-[430px]:sr-only")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
