"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";

function DefaultToggle() {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <ThemeToggle />
    </div>
  );
}

export { DefaultToggle };
