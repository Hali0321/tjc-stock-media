"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { DemoRole } from "@/lib/types";
import { normalizeRole } from "@/lib/permissions";

type RoleContextValue = {
  role: DemoRole;
  ready: boolean;
  setRole: (role: DemoRole) => void;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<DemoRole>("Viewer");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const queryRole = new URLSearchParams(window.location.search).get("role");
    const storedRole = window.localStorage.getItem("tjc-demo-role");
    const nextRole = normalizeRole(queryRole || storedRole);
    setRoleState(nextRole);
    if (queryRole) window.localStorage.setItem("tjc-demo-role", nextRole);
    setReady(true);
  }, []);

  const value = useMemo(
    () => ({
      role,
      ready,
      setRole(nextRole: DemoRole) {
        setRoleState(nextRole);
        setReady(true);
        window.localStorage.setItem("tjc-demo-role", nextRole);
      }
    }),
    [role, ready]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useDemoRole() {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useDemoRole must be used inside RoleProvider");
  return context;
}
