"use client";

import { Suspense, useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { Toaster } from "sonner";
import { BetaPrototypeTools } from "@/components/BetaPrototypeTools";
import { AppSidebar } from "@/components/dam/shell/AppSidebar";
import { DamCommandHeader } from "@/components/dam/shell/DamCommandHeader";
import { useDemoRole } from "@/components/RoleProvider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { routeWithRole } from "@/lib/role-routes";

const SIDEBAR_STORAGE_KEY = "tjc-dam-sidebar-open";

function PersistentSidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpenState] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === "false") setOpenState(false);
    if (stored === "true") setOpenState(true);
  }, []);

  const setOpen = useCallback((nextOpen: boolean) => {
    setOpenState(nextOpen);
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextOpen));
  }, []);

  return (
    <SidebarProvider
      open={open}
      onOpenChange={setOpen}
      className="dam-workbench-v2 dam-command-shell min-h-[100dvh] bg-tjc-bg text-tjc-ink"
      style={{ "--sidebar-width": "15rem", "--sidebar-width-icon": "3.05rem" } as CSSProperties}
    >
      {children}
    </SidebarProvider>
  );
}

function DamFooter() {
  const { role } = useDemoRole();
  return (
    <footer className="relative z-10 mx-auto flex w-full max-w-[1760px] flex-wrap items-center gap-3 border-t border-[#d8e1da] px-4 py-6 text-sm font-semibold text-tjc-muted md:px-6">
      <Link href={routeWithRole("/guide", role)} className="font-black text-tjc-evergreen">Help</Link>
      <span>Review queues, evidence, and audit-safe actions stay together.</span>
      <span>Production access follows assigned DAM roles.</span>
    </footer>
  );
}

export function DamShell({ children }: { children: ReactNode }) {
  return (
    <PersistentSidebarProvider>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Suspense fallback={null}>
        <AppSidebar />
      </Suspense>
      <SidebarInset className="min-w-0 bg-transparent">
        <Suspense fallback={null}>
          <DamCommandHeader />
        </Suspense>
        <div id="main-content" className="relative z-10 min-w-0 flex-1 pb-4 md:pb-10">
          <Suspense fallback={null}>{children}</Suspense>
        </div>
        <BetaPrototypeTools />
        <Toaster
          position="bottom-center"
          offset={{ bottom: "7.25rem" }}
          mobileOffset={{ bottom: "calc(var(--app-mobile-nav-height) + var(--app-mobile-safe-bottom) + 1.25rem)", left: ".75rem", right: ".75rem" }}
          toastOptions={{
            classNames: {
              toast: "rounded-lg border border-[#d6dfd8] bg-white text-tjc-ink shadow-[0_18px_50px_rgba(17,24,39,.16)]",
              title: "font-black text-tjc-ink",
              description: "font-semibold text-tjc-muted"
            }
          }}
        />
        <DamFooter />
      </SidebarInset>
    </PersistentSidebarProvider>
  );
}
