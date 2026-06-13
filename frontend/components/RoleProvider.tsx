"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { DemoRole } from "@/lib/types";
import { normalizeRole } from "@/lib/permissions";

type RoleContextValue = {
  role: DemoRole;
  ready: boolean;
  betaLocked: boolean;
  setRole: (role: DemoRole) => void;
};

const RoleContext = createContext<RoleContextValue | null>(null);
const clientRoleSwitchEnabled = process.env.NEXT_PUBLIC_LOCAL_BETA_ROLE_SWITCH === "1";

export function RoleProvider({
  children,
  initialRole = "Viewer",
  betaLocked = false
}: {
  children: React.ReactNode;
  initialRole?: DemoRole;
  betaLocked?: boolean;
}) {
  const [role, setRoleState] = useState<DemoRole>(initialRole);
  const [ready, setReady] = useState(betaLocked);

  useEffect(() => {
    if (betaLocked || !clientRoleSwitchEnabled) {
      setRoleState(initialRole);
      setReady(true);
      return;
    }
    const queryRole = new URLSearchParams(window.location.search).get("role");
    const storedRole = window.localStorage.getItem("tjc-demo-role");
    const nextRole = normalizeRole(queryRole || storedRole);
    setRoleState(nextRole);
    if (queryRole) window.localStorage.setItem("tjc-demo-role", nextRole);
    setReady(true);
  }, [betaLocked, initialRole]);

  const value = useMemo(
    () => ({
      role,
      ready,
      betaLocked,
      setRole(nextRole: DemoRole) {
        if (betaLocked || !clientRoleSwitchEnabled) return;
        setRoleState(nextRole);
        setReady(true);
        window.localStorage.setItem("tjc-demo-role", nextRole);
      }
    }),
    [role, ready, betaLocked]
  );

  if (!ready) {
    return (
      <RoleContext.Provider value={value}>
        <div className="min-h-dvh bg-[#f7f5ee]" aria-label="Loading role" />
      </RoleContext.Provider>
    );
  }

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useDemoRole() {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useDemoRole must be used inside RoleProvider");
  return context;
}
