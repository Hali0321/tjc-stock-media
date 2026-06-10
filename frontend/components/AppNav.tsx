"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Box, CheckCircle2, ClipboardList, Grid3X3, Library, PackageCheck, Settings, type LucideIcon } from "lucide-react";
import type { DemoRole } from "@/lib/types";
import { cn } from "@/lib/ui";

type AppNavItem = {
  href: string;
  label: string;
  mobileLabel?: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

const viewerNav: AppNavItem[] = [
  { href: "/", label: "Library", icon: Library },
  { href: "/collections", label: "Collections", icon: Grid3X3 },
  { href: "/packages", label: "Packages", icon: Box },
  { href: "/review", label: "Approvals", mobileLabel: "Review", icon: CheckCircle2 },
  { href: "/guide", label: "Usage", icon: ClipboardList },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/brand-hub", label: "Brand Hub", icon: PackageCheck },
  { href: "/admin", label: "Admin", icon: Settings }
];

const reviewerNav: AppNavItem[] = [
  { href: "/", label: "Library", icon: Library },
  { href: "/collections", label: "Collections", icon: Grid3X3 },
  { href: "/packages", label: "Packages", icon: Box },
  { href: "/review", label: "Approvals", mobileLabel: "Review", icon: ClipboardList },
  { href: "/guide", label: "Usage", icon: CheckCircle2 },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/brand-hub", label: "Brand Hub", icon: PackageCheck },
  { href: "/admin", label: "Admin", icon: Settings }
];

const adminNav: AppNavItem[] = [
  { href: "/", label: "Library", icon: Library },
  { href: "/collections", label: "Collections", icon: Grid3X3 },
  { href: "/packages", label: "Packages", icon: Box },
  { href: "/review", label: "Approvals", mobileLabel: "Review", icon: ClipboardList },
  { href: "/guide", label: "Usage", icon: CheckCircle2 },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/brand-hub", label: "Brand Hub", icon: PackageCheck },
  { href: "/admin", label: "Admin", icon: Settings, adminOnly: true },
];

function navItemsForRole(role: DemoRole) {
  if (role === "DAM Admin") return adminNav;
  if (role === "Reviewer") return reviewerNav;
  return viewerNav;
}

type AppNavProps = {
  role: DemoRole;
  variant?: "top" | "mobile" | "menu";
  onNavigate?: () => void;
};

export function AppNav({ role, variant = "mobile", onNavigate }: AppNavProps) {
  const pathname = usePathname();
  const top = variant === "top";
  const menu = variant === "menu";
  const visibleItems = navItemsForRole(role).filter((item) => !item.adminOnly || role === "DAM Admin");

  return (
    <nav
      className={cn(
        "tubelight-nav border border-[#c9d4d5] bg-white",
        top && "workbench-nav flex max-w-full items-center gap-1 rounded-2xl border-[#c6d6ce] bg-[#f8fbf8] p-1 shadow-none",
        menu && "workbench-menu-nav grid gap-1 rounded-xl border-[#d7dde2] bg-[#f8fbf8] p-1 shadow-none",
        !top && !menu && "mx-auto flex w-full max-w-[34rem] items-center gap-1 rounded-lg p-1 shadow-none"
      )}
      aria-label="Primary navigation"
    >
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const label = top || menu ? item.label : item.mobileLabel || item.label;
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={cn(
              "group relative inline-flex min-w-0 flex-1 items-center justify-center font-black text-[#5b655f] transition-all duration-200 hover:text-tjc-evergreen active:translate-y-px",
              top && "min-h-11 flex-none gap-2 rounded-xl px-4 text-sm",
              menu && "min-h-12 justify-start gap-3 rounded-xl px-3 text-sm",
              !top && !menu && "min-h-14 flex-col gap-1 rounded-md px-1.5 text-[11px]",
              isActive && "text-tjc-evergreen"
            )}
            title={item.label}
            aria-current={isActive ? "page" : undefined}
            onClick={onNavigate}
          >
            {isActive ? <span className="absolute inset-0 rounded-[inherit] bg-white shadow-[0_8px_24px_rgba(15,61,46,.10)]" aria-hidden="true" /> : null}
            <Icon className={cn("relative z-10 shrink-0", top ? "h-[16px] w-[16px]" : menu ? "h-[17px] w-[17px]" : "h-5 w-5")} aria-hidden="true" strokeWidth={1.9} />
            <span className={cn("nav-label relative z-10 truncate leading-none", top && "max-w-none")}>{label}</span>
            {item.label === "Approvals" ? <span className="nav-count-badge relative z-10 ml-auto">28</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
