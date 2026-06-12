"use client";

import {
  Archive,
  BarChart3,
  ClipboardList,
  Grid3X3,
  HelpCircle,
  Library,
  ScrollText,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  UsersRound,
  type LucideIcon
} from "lucide-react";
import type { DemoRole } from "@/lib/types";

export type DamShellNavGroup = "Library" | "Workflow" | "Governance" | "System";

export type DamShellNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: DemoRole[];
  description?: string;
  group: DamShellNavGroup;
  badge?: string;
};

export const damShellNavItems: DamShellNavItem[] = [
  { label: "Asset Library", href: "/", icon: Library, group: "Library", description: "Browse approved and source-tracked media." },
  { label: "Collections", href: "/collections", icon: Grid3X3, group: "Library", description: "Open curated ministry collections." },
  { label: "Review Queue", href: "/review?queue=pending", icon: ShieldAlert, roles: ["Reviewer", "DAM Admin"], group: "Workflow", description: "Validate assets before broad use.", badge: "181" },
  { label: "Packages", href: "/packages", icon: Archive, group: "Workflow", description: "Build governed media packages." },
  { label: "Upload", href: "/upload", icon: UploadCloud, roles: ["Contributor", "Reviewer", "DAM Admin"], group: "Workflow", description: "Submit new media for review." },
  { label: "Metadata", href: "/insights?panel=metadata", icon: ClipboardList, group: "Governance", description: "Inspect metadata quality and missing fields." },
  { label: "Rights & Usage", href: "/insights?panel=rights-usage", icon: ShieldCheck, roles: ["Reviewer", "DAM Admin"], group: "Governance", description: "Review rights and usage evidence." },
  { label: "Policy Center", href: "/guide?section=policies#policies", icon: ScrollText, group: "Governance", description: "Open policy-safe DAM guidance." },
  { label: "Insights", href: "/insights", icon: BarChart3, group: "Governance", description: "Monitor usage and readiness signals." },
  { label: "Users", href: "/admin#users", icon: UsersRound, roles: ["DAM Admin"], group: "System", description: "Manage users and access roles." },
  { label: "Roles", href: "/admin#roles", icon: ShieldCheck, roles: ["DAM Admin"], group: "System", description: "Manage DAM role mapping." },
  { label: "Settings", href: "/admin", icon: Settings2, roles: ["DAM Admin"], group: "System", description: "Monitor source health, audit activity, and policy workflows." },
  { label: "Help", href: "/guide", icon: HelpCircle, group: "System", description: "Policy-safe DAM guidance." }
];

export const damShellNavGroups: DamShellNavGroup[] = ["Library", "Workflow", "Governance", "System"];

export function canSeeDamShellItem(item: DamShellNavItem, role: DemoRole) {
  return !item.roles || item.roles.includes(role);
}

export function damShellItemsForRole(role: DemoRole) {
  return damShellNavItems.filter((item) => canSeeDamShellItem(item, role));
}

export const damShellQuickActions: DamShellNavItem[] = [
  { label: "Upload", href: "/upload", icon: UploadCloud, roles: ["Contributor", "Reviewer", "DAM Admin"], group: "Workflow", description: "Send media" },
  { label: "New package", href: "/packages", icon: Archive, group: "Workflow", description: "Build package" },
  { label: "Review queue", href: "/review?queue=pending", icon: ShieldAlert, roles: ["Reviewer", "DAM Admin"], group: "Workflow", description: "Pending review" }
];

export const damShellWorkspaceCopy: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Library", subtitle: "Browse approved and source-tracked media for ministry use." },
  "/collections": { title: "Collections", subtitle: "Open curated sets with reuse decisions intact." },
  "/review": { title: "Review Queue", subtitle: "Validate assets before they become broadly available." },
  "/packages": { title: "Package Builder", subtitle: "Build governed media packages without moving source files." },
  "/upload": { title: "Upload", subtitle: "Submit source, rights, people, and usage context for review." },
  "/insights": { title: "Insights", subtitle: "Monitor usage, readiness, and governance signals." },
  "/admin": { title: "Governance", subtitle: "Monitor source health, audit activity, and policy-sensitive workflows." },
  "/guide": { title: "Help", subtitle: "Follow policy-safe media use and review guidance." }
};

export function workspaceCopyForPath(pathname: string, search = "") {
  const params = new URLSearchParams(search);
  if (pathname === "/review" && params.get("queue") === "rights-review") {
    return { title: "Rights & Usage", subtitle: "Review rights evidence, use scope, consent, and gated-copy decisions." };
  }
  if (pathname === "/insights" && params.get("panel") === "rights-usage") {
    return { title: "Rights & Usage", subtitle: "Review rights evidence, use scope, consent, and gated-copy decisions." };
  }
  if (pathname === "/insights" && params.get("panel") === "metadata") {
    return { title: "Metadata", subtitle: "Track field coverage, missing metadata, and reviewer-ready record quality." };
  }
  if (pathname === "/guide" && params.get("section") === "policies") {
    return { title: "Policy Center", subtitle: "Policy-safe DAM guidance for reuse, rights, consent, and metadata standards." };
  }
  if (pathname.startsWith("/assets/")) {
    return { title: "Asset Detail", subtitle: "Inspect source, rights, usage, and download decisions." };
  }
  return damShellWorkspaceCopy[pathname] || damShellWorkspaceCopy["/"];
}
