"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, Gauge, HelpCircle, Search, ShieldCheck, UploadCloud, type LucideIcon } from "lucide-react";
import type { DemoRole } from "@/lib/types";
import { cn } from "@/lib/ui";

type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

const findAndUseNav: AppNavItem[] = [
  { href: "/", label: "Find", icon: Search },
  { href: "/collections", label: "Packages", icon: FolderOpen },
  { href: "/guide", label: "Help", icon: HelpCircle }
];

const contributorNav: AppNavItem[] = [
  { href: "/", label: "Find", icon: Search },
  { href: "/collections", label: "Packages", icon: FolderOpen },
  { href: "/upload", label: "Send", icon: UploadCloud },
  { href: "/guide", label: "Help", icon: HelpCircle }
];

const reviewerNav: AppNavItem[] = [
  { href: "/review", label: "Review", icon: ShieldCheck },
  { href: "/", label: "Ops", icon: Search },
  { href: "/upload", label: "Send", icon: UploadCloud },
  { href: "/collections", label: "Packages", icon: FolderOpen },
  { href: "/guide", label: "Help", icon: HelpCircle }
];

const adminNav: AppNavItem[] = [
  { href: "/admin", label: "Govern", icon: Gauge, adminOnly: true },
  { href: "/review", label: "Review", icon: ShieldCheck },
  { href: "/", label: "Ops", icon: Search },
  { href: "/collections", label: "Packages", icon: FolderOpen },
  { href: "/guide", label: "Help", icon: HelpCircle }
];

function navItemsForRole(role: DemoRole) {
  if (role === "DAM Admin") return adminNav;
  if (role === "Reviewer") return reviewerNav;
  if (role === "Contributor") return contributorNav;
  return findAndUseNav;
}

type AppNavProps = {
  role: DemoRole;
  variant?: "rail" | "mobile";
};

export function AppNav({ role, variant = "mobile" }: AppNavProps) {
  const pathname = usePathname();
  const visibleItems = navItemsForRole(role).filter((item) => !item.adminOnly || role === "DAM Admin");
  const rail = variant === "rail";

  return (
    <nav
      className={cn(
        "tubelight-nav mx-auto flex w-full items-center border border-[#c9d4d5] bg-white",
        rail
          ? "max-w-none flex-col gap-1 rounded-none border-0 bg-transparent p-0 shadow-none"
          : "max-w-[34rem] gap-1 rounded-[.55rem] p-1 shadow-[0_10px_24px_rgba(17,24,39,.08)]"
      )}
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
              "group relative inline-flex min-w-0 flex-1 items-center text-sm font-bold text-[#5b655f] transition-colors duration-200 ease-out hover:text-tjc-evergreen active:translate-y-px",
              rail
                ? "min-h-10 w-full flex-none justify-start gap-2 rounded-md px-3"
                : "min-h-14 flex-col justify-center gap-1 rounded-[.45rem] px-1.5 text-[11px]",
              isActive && "text-tjc-evergreen",
              utility && (rail ? "mt-2 border-t border-tjc-line pt-3" : "border-l border-tjc-line")
            )}
            title={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            {isActive ? (
              <>
                <span className={cn("absolute inset-0 bg-[#dfece6] shadow-[inset_0_0_0_1px_rgba(13,63,57,.12)]", rail ? "rounded-md" : "rounded-[.45rem]")} aria-hidden="true" />
                {!rail ? <span className="absolute inset-x-3 bottom-1.5 h-0.5 rounded-sm bg-[#0b5950]" aria-hidden="true" /> : null}
              </>
            ) : null}
            <Icon className={cn("relative z-10 shrink-0", rail ? "h-[17px] w-[17px]" : "h-5 w-5")} aria-hidden="true" strokeWidth={1.9} />
            <span className="nav-label relative z-10 whitespace-nowrap leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
