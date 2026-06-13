"use client";

import { usePathname } from "next/navigation";
import { DamShell } from "@/components/dam/DamShell";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/beta-login") return <>{children}</>;
  return <DamShell>{children}</DamShell>;
}
