import { DamShell } from "@/components/dam/DamShell";

export function AppChrome({ children }: { children: React.ReactNode }) {
  return <DamShell>{children}</DamShell>;
}
