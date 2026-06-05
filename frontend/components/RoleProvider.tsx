"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { DemoRole } from "@/lib/types";
import { normalizeRole } from "@/lib/permissions";

type RoleContextValue = {
  role: DemoRole;
  setRole: (role: DemoRole) => void;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<DemoRole>("Viewer");

  useEffect(() => {
    setRoleState(normalizeRole(window.localStorage.getItem("tjc-demo-role")));
  }, []);

  const value = useMemo(
    () => ({
      role,
      setRole(nextRole: DemoRole) {
        setRoleState(nextRole);
        window.localStorage.setItem("tjc-demo-role", nextRole);
      }
    }),
    [role]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useDemoRole() {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useDemoRole must be used inside RoleProvider");
  return context;
}
