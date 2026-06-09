"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, FolderOpen, Gauge, HelpCircle, History, Search, UploadCloud, type LucideIcon } from "lucide-react";
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
  { href: "/", label: "Find", icon: Search },
  { href: "/collections", label: "Packages", icon: FolderOpen },
  { href: "/upload", label: "Send", icon: UploadCloud },
  { href: "/guide", label: "Help", icon: HelpCircle }
];

const reviewerNav: AppNavItem[] = [
  { href: "/review", label: "Review Inbox", mobileLabel: "Review", icon: ClipboardList },
  { href: "/", label: "Ops Search", mobileLabel: "Search", icon: Search },
  { href: "/collections", label: "Packages", icon: FolderOpen },
  { href: "/guide", label: "Audit", icon: History }
];

const adminNav: AppNavItem[] = [
  { href: "/review", label: "Review Inbox", mobileLabel: "Review", icon: ClipboardList },
  { href: "/", label: "Ops Search", mobileLabel: "Search", icon: Search },
  { href: "/collections", label: "Packages", icon: FolderOpen },
  { href: "/admin", label: "Governance", mobileLabel: "Govern", icon: Gauge, adminOnly: true },
  { href: "/guide", label: "Audit", icon: History }
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
        top && "flex max-w-full items-center gap-1 border-transparent bg-transparent p-0 shadow-none",
        menu && "grid gap-1 rounded-lg border-[#d7dde2] p-1 shadow-none",
        !top && !menu && "mx-auto flex w-full max-w-[34rem] items-center gap-1 rounded-lg p-1 shadow-none"
      )}
      aria-label="Primary navigation"
    >
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const label = top ? item.label : item.mobileLabel || item.label;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative inline-flex min-w-0 flex-1 items-center justify-center font-black text-[#5b655f] transition-colors duration-200 hover:text-tjc-evergreen active:translate-y-px",
              top && "min-h-10 flex-none gap-2 rounded-md px-3 text-sm",
              menu && "min-h-11 justify-start gap-3 rounded-md px-3 text-sm",
              !top && !menu && "min-h-14 flex-col gap-1 rounded-md px-1.5 text-[11px]",
              isActive && "text-tjc-evergreen"
            )}
            title={item.label}
            aria-current={isActive ? "page" : undefined}
            onClick={onNavigate}
          >
            {isActive ? <span className="absolute inset-0 rounded-[inherit] bg-[#edf4ef]" aria-hidden="true" /> : null}
            <Icon className={cn("relative z-10 shrink-0", top ? "h-[16px] w-[16px]" : menu ? "h-[17px] w-[17px]" : "h-5 w-5")} aria-hidden="true" strokeWidth={1.9} />
            <span className={cn("nav-label relative z-10 truncate leading-none", top && "max-w-none")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
