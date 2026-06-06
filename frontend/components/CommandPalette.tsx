"use client";

import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, FileSearch, FolderOpen, HelpCircle, Search, Settings2, ShieldAlert, ShieldCheck, UploadCloud, X } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { cn } from "@/lib/ui";

type Command = {
  id: string;
  label: string;
  hint: string;
  href: string;
  keywords: string;
  icon: typeof Search;
  adminOnly?: boolean;
  reviewerOnly?: boolean;
};

const commands: Command[] = [
  { id: "search-library", label: "Search library", hint: "Find assets by ministry need", href: "/", keywords: "search library assets bible fellowship media", icon: Search },
  { id: "website-hero", label: "Website hero images", hint: "Open stable saved view", href: "/?view=website-hero", keywords: "hero banner web header website", icon: FileSearch },
  { id: "portal-ready", label: "Portal ready", hint: "Assets passing reuse policy", href: "/?view=portal-ready", keywords: "public safe portal ready approved reusable", icon: ShieldCheck },
  { id: "no-people", label: "No people", hint: "Lower-risk visual search", href: "/?view=no-people", keywords: "no people empty plants bible safe", icon: FileSearch },
  { id: "sabbath", label: "Sabbath collection", hint: "Open collection by stable ID", href: "/?collection=sabbath", keywords: "sabbath worship church life collection", icon: FolderOpen },
  { id: "collections", label: "Collections", hint: "Browse albums and ministry contexts", href: "/collections", keywords: "albums collections events", icon: FolderOpen },
  { id: "upload", label: "Start upload intake", hint: "Contributor context and files", href: "/upload", keywords: "upload intake contributor submit files", icon: UploadCloud },
  { id: "review", label: "Pending review", hint: "Reviewer governance queue", href: "/review", keywords: "review governance pending queue", icon: ShieldAlert, reviewerOnly: true },
  { id: "children-youth", label: "Children/youth review", hint: "Review sensitive people/minors queue", href: "/review", keywords: "children youth minors sensitive", icon: ShieldAlert, reviewerOnly: true },
  { id: "archive", label: "Archive candidates", hint: "Review archive-only material", href: "/review", keywords: "archive do not use searchable archive", icon: Archive, reviewerOnly: true },
  { id: "guide", label: "Usage guide", hint: "Search rules, Do/Avoid, large media", href: "/guide", keywords: "guide help rules usage children credit", icon: HelpCircle },
  { id: "admin", label: "Admin diagnostics", hint: "Read-only operational checks", href: "/admin", keywords: "admin diagnostics readiness api field mapping", icon: Settings2, adminOnly: true }
];

export function CommandPalette() {
  const router = useRouter();
  const { role } = useDemoRole();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const reviewer = role === "Reviewer" || role === "DAM Admin";

  const visibleCommands = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const base = commands.filter((command) => {
      if (command.adminOnly && role !== "DAM Admin") return false;
      if (command.reviewerOnly && !reviewer) return false;
      if (!terms.length) return true;
      const haystack = `${command.label} ${command.hint} ${command.keywords}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
    const resourceId = query.trim().match(/^(?:rs\s*)?(\d{2,})$/i)?.[1];
    if (resourceId) {
      base.unshift({
        id: `resource-${resourceId}`,
        label: `Open ResourceSpace ID ${resourceId}`,
        hint: "Open asset detail by exported ID/reference",
        href: `/assets/${resourceId}`,
        keywords: resourceId,
        icon: FileSearch
      });
    }
    if (query.trim() && !resourceId) {
      base.push({
        id: `search-${query.trim()}`,
        label: `Search "${query.trim()}"`,
        hint: "Run library search",
        href: `/?q=${encodeURIComponent(query.trim())}`,
        keywords: query,
        icon: Search
      });
    }
    return base.slice(0, 9);
  }, [query, reviewer, role]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isCommand = event.metaKey || event.ctrlKey;
      if (isCommand && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  function runCommand(command: Command) {
    setOpen(false);
    setQuery("");
    router.push(command.href);
  }

  function onInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && visibleCommands[0]) {
      event.preventDefault();
      runCommand(visibleCommands[0]);
    }
  }

  return (
    <>
      <button
        type="button"
        className="hidden min-h-9 items-center gap-2 rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#f3f6f2] active:translate-y-px md:inline-flex"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
      >
        <Search size={16} strokeWidth={1.8} aria-hidden="true" />
        <span>Command</span>
        <kbd className="rounded border border-tjc-line bg-[#f7f8f6] px-1.5 py-0.5 text-[11px] font-semibold text-tjc-muted">⌘K</kbd>
      </button>
      <button
        type="button"
        className="inline-grid h-9 w-9 place-items-center rounded-md border border-tjc-line bg-white text-tjc-evergreen transition hover:bg-[#f3f6f2] active:translate-y-px md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
      >
        <Search size={16} strokeWidth={1.8} aria-hidden="true" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 bg-[#20221f]/28 p-3 backdrop-blur-[2px]" role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className="mx-auto mt-16 w-full max-w-2xl overflow-hidden rounded-lg border border-tjc-line bg-white shadow-[0_18px_60px_rgba(32,34,31,.22)]"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-tjc-line px-3 py-2">
              <Search size={18} strokeWidth={1.8} className="text-tjc-evergreen" aria-hidden="true" />
              <input
                ref={inputRef}
                className="min-h-11 min-w-0 bg-transparent text-base font-medium text-tjc-ink placeholder:text-[#7d877f]"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search Bible, open Website hero, jump to Review..."
                aria-label="Command search"
              />
              <button className="grid h-9 w-9 place-items-center rounded-md text-tjc-muted hover:bg-[#f3f6f2]" type="button" onClick={() => setOpen(false)} aria-label="Close command palette">
                <X size={16} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
            <div className="max-h-[60dvh] overflow-y-auto p-2">
              {visibleCommands.length ? (
                <div className="grid gap-1">
                  {visibleCommands.map((command) => {
                    const Icon = command.icon;
                    return (
                      <button
                        type="button"
                        key={command.id}
                        className="grid min-h-14 grid-cols-[auto_1fr] items-center gap-3 rounded-md px-3 py-2 text-left transition hover:bg-[#f3f6f2] focus-visible:bg-[#f3f6f2]"
                        onClick={() => runCommand(command)}
                      >
                        <span className="grid h-9 w-9 place-items-center rounded-md border border-tjc-line bg-[#fbfcfa] text-tjc-evergreen">
                          <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <strong className="block truncate text-sm font-semibold text-tjc-ink">{command.label}</strong>
                          <span className="mt-0.5 block truncate text-xs font-medium text-tjc-muted">{command.hint}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-sm font-medium text-tjc-muted">No matching commands.</div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-tjc-line bg-[#fbfcfa] px-3 py-2 text-xs font-medium text-tjc-muted">
              <span>Enter opens first result. Esc closes.</span>
              <span>ResourceSpace writes remain pending until field mapping is configured.</span>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
