"use client";

import { type KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  { id: "review", label: "Pending review", hint: "Reviewer governance queue", href: "/review?queue=pending", keywords: "review governance pending queue", icon: ShieldAlert, reviewerOnly: true },
  { id: "children-youth", label: "Children/youth review", hint: "Review sensitive people/minors queue", href: "/review?queue=children-youth", keywords: "children youth minors sensitive", icon: ShieldAlert, reviewerOnly: true },
  { id: "rights-review", label: "Rights review", hint: "Review rights, consent, and source concerns", href: "/review?queue=rights-review", keywords: "rights consent source review", icon: ShieldAlert, reviewerOnly: true },
  { id: "missing-source", label: "Missing source", hint: "Review missing source/provenance queue", href: "/review?queue=missing-source", keywords: "missing source photographer provenance", icon: FileSearch, reviewerOnly: true },
  { id: "usage-guidance", label: "Needs usage guidance", hint: "Review assets missing use guidance", href: "/review?queue=usage-guidance", keywords: "usage guidance captions credit rules", icon: FileSearch, reviewerOnly: true },
  { id: "archive", label: "Archive candidates", hint: "Review archive-only material", href: "/review?queue=archive-candidates", keywords: "archive do not use searchable archive", icon: Archive, reviewerOnly: true },
  { id: "guide", label: "Usage guide", hint: "Search rules, Do/Avoid, large media", href: "/guide", keywords: "guide help rules usage children credit", icon: HelpCircle },
  { id: "admin", label: "Admin diagnostics", hint: "Read-only operational checks", href: "/admin", keywords: "admin diagnostics readiness api field mapping", icon: Settings2, adminOnly: true }
];

export function CommandPalette() {
  const router = useRouter();
  const { role } = useDemoRole();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);
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

  const openPalette = useCallback(() => {
    lastActiveRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
    window.setTimeout(() => lastActiveRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isCommand = event.metaKey || event.ctrlKey;
      if (isCommand && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openPalette]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closePalette();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])'))
        .filter((item) => !item.hasAttribute("disabled") && item.tabIndex !== -1);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closePalette, open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    setSelectedIndex((current) => Math.min(current, Math.max(visibleCommands.length - 1, 0)));
  }, [visibleCommands.length]);

  useEffect(() => {
    if (!open) return;
    document.getElementById(`command-option-${visibleCommands[selectedIndex]?.id}`)?.scrollIntoView({ block: "nearest" });
  }, [open, selectedIndex, visibleCommands]);

  function runCommand(command: Command) {
    closePalette();
    router.push(command.href);
  }

  function onInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((current) => Math.min(current + 1, Math.max(visibleCommands.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Home") {
      event.preventDefault();
      setSelectedIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setSelectedIndex(Math.max(visibleCommands.length - 1, 0));
    } else if (event.key === "Enter" && visibleCommands[selectedIndex]) {
      event.preventDefault();
      runCommand(visibleCommands[selectedIndex]);
    }
  }

  return (
    <>
      <button
        type="button"
        className="hidden min-h-9 items-center gap-2 rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#f3f6f2] active:translate-y-px md:inline-flex"
        onClick={openPalette}
        aria-label="Open command palette"
      >
        <Search size={16} strokeWidth={1.8} aria-hidden="true" />
        <span>Command</span>
        <kbd className="rounded border border-tjc-line bg-[#f7f8f6] px-1.5 py-0.5 text-[11px] font-semibold text-tjc-muted">⌘K</kbd>
      </button>
      <button
        type="button"
        className="inline-grid h-9 w-9 place-items-center rounded-md border border-tjc-line bg-white text-tjc-evergreen transition hover:bg-[#f3f6f2] active:translate-y-px md:hidden"
        onClick={openPalette}
        aria-label="Open command palette"
      >
        <Search size={16} strokeWidth={1.8} aria-hidden="true" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 bg-[#20221f]/28 p-3 backdrop-blur-[2px]" role="presentation" onMouseDown={closePalette}>
          <section
            ref={dialogRef}
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
                aria-activedescendant={visibleCommands[selectedIndex] ? `command-option-${visibleCommands[selectedIndex].id}` : undefined}
                aria-controls="command-results"
                aria-expanded={open}
                role="combobox"
              />
              <button className="grid h-9 w-9 place-items-center rounded-md text-tjc-muted hover:bg-[#f3f6f2]" type="button" onClick={closePalette} aria-label="Close command palette">
                <X size={16} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
            <div className="max-h-[60dvh] overflow-y-auto p-2">
              {visibleCommands.length ? (
                <div className="grid gap-1" id="command-results" role="listbox" aria-label="Command results">
                  {visibleCommands.map((command, index) => {
                    const Icon = command.icon;
                    const selected = index === selectedIndex;
                    return (
                      <button
                        type="button"
                        key={command.id}
                        id={`command-option-${command.id}`}
                        className={cn(
                          "grid min-h-14 grid-cols-[auto_1fr] items-center gap-3 rounded-md px-3 py-2 text-left transition hover:bg-[#f3f6f2] focus-visible:bg-[#f3f6f2]",
                          selected ? "bg-[#eef7f1] ring-1 ring-[#a7cbbd]" : ""
                        )}
                        role="option"
                        aria-selected={selected}
                        onClick={() => runCommand(command)}
                        onMouseEnter={() => setSelectedIndex(index)}
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
