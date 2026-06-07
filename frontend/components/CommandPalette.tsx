"use client";

import { type KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, FileSearch, FolderOpen, HelpCircle, Search, Send, Settings2, ShieldAlert, ShieldCheck, UploadCloud, X } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { cn } from "@/lib/ui";

type Command = {
  id: string;
  label: string;
  hint: string;
  href: string;
  keywords: string;
  icon: typeof Search;
  group: "Go to" | "Saved views" | "Review work" | "Safety" | "ResourceSpace";
  adminOnly?: boolean;
  reviewerOnly?: boolean;
};

const commands: Command[] = [
  { id: "search-library", group: "Go to", label: "Search library", hint: "Find assets by ministry need", href: "/", keywords: "search library assets bible fellowship media", icon: Search },
  { id: "collections", group: "Go to", label: "Albums", hint: "Browse albums and ministry contexts", href: "/collections", keywords: "albums collections events", icon: FolderOpen },
  { id: "upload", group: "Go to", label: "Start upload intake", hint: "Contributor context and files", href: "/upload", keywords: "upload intake contributor submit files", icon: UploadCloud },
  { id: "guide", group: "Go to", label: "Usage guide", hint: "Search rules, Do/Avoid, large media", href: "/guide", keywords: "guide help rules usage children credit", icon: HelpCircle },
  { id: "admin", group: "Go to", label: "Admin readiness", hint: "Read-only operational checks", href: "/admin", keywords: "admin diagnostics readiness api field mapping", icon: Settings2, adminOnly: true },
  { id: "website-hero", group: "Saved views", label: "Website hero images", hint: "Open stable saved view", href: "/?view=website-hero", keywords: "hero banner web header website", icon: FileSearch },
  { id: "portal-ready", group: "Saved views", label: "Portal ready", hint: "Assets passing reuse policy", href: "/?view=portal-ready", keywords: "public safe portal ready approved reusable", icon: ShieldCheck },
  { id: "no-people", group: "Saved views", label: "No people", hint: "Lower-risk visual search", href: "/?view=no-people", keywords: "no people empty plants bible safe", icon: FileSearch },
  { id: "sabbath", group: "Saved views", label: "Sabbath collection", hint: "Open collection by stable ID", href: "/?collection=sabbath", keywords: "sabbath worship church life collection", icon: FolderOpen },
  { id: "review", group: "Review work", label: "Pending review", hint: "Reviewer governance queue", href: "/review?queue=pending", keywords: "review governance pending queue pending writes", icon: ShieldAlert, reviewerOnly: true },
  { id: "children-youth", group: "Review work", label: "Children/youth review", hint: "Review sensitive people/minors queue", href: "/review?queue=children-youth", keywords: "children youth minors sensitive", icon: ShieldAlert, reviewerOnly: true },
  { id: "rights-review", group: "Review work", label: "Rights review", hint: "Review rights, consent, and source concerns", href: "/review?queue=rights-review", keywords: "rights consent source review", icon: ShieldAlert, reviewerOnly: true },
  { id: "missing-source", group: "Review work", label: "Missing source", hint: "Review missing source/provenance queue", href: "/review?queue=missing-source", keywords: "missing source photographer provenance", icon: FileSearch, reviewerOnly: true },
  { id: "usage-guidance", group: "Review work", label: "Needs usage guidance", hint: "Review assets missing use guidance", href: "/review?queue=usage-guidance", keywords: "usage guidance captions credit rules", icon: FileSearch, reviewerOnly: true },
  { id: "archive", group: "Review work", label: "Archive candidates", hint: "Review archive-only material", href: "/review?queue=archive-candidates", keywords: "archive do not use searchable archive", icon: Archive, reviewerOnly: true },
  { id: "blocked-downloads", group: "Safety", label: "Blocked downloads", hint: "Assets not safe to download yet", href: "/?view=needs-review", keywords: "blocked downloads unsafe do not publish missing derivative", icon: ShieldAlert },
  { id: "pending-writes", group: "Safety", label: "Pending writes", hint: "Local review writes awaiting ResourceSpace mapping", href: "/admin#launch-gate", keywords: "pending writes local queue resourcespace write mapping", icon: Settings2, adminOnly: true }
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
        group: "ResourceSpace",
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
        group: "Go to",
        label: `Search "${query.trim()}"`,
        hint: "Run library search",
        href: `/?q=${encodeURIComponent(query.trim())}`,
        keywords: query,
        icon: Search
      });
    }
    return base.slice(0, 12);
  }, [query, reviewer, role]);

  const groupedCommands = useMemo(() => {
    const groups: Array<{ group: Command["group"]; items: Command[] }> = [];
    visibleCommands.forEach((command) => {
      let group = groups.find((item) => item.group === command.group);
      if (!group) {
        group = { group: command.group, items: [] };
        groups.push(group);
      }
      group.items.push(command);
    });
    return groups;
  }, [visibleCommands]);

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
        className="group hidden min-h-12 w-44 items-center gap-2 rounded-[1rem] border border-[#d3ded7] bg-white/92 px-3 text-left text-sm font-black text-tjc-evergreen shadow-[0_1px_0_rgba(255,255,255,.95)_inset,0_16px_40px_rgba(13,55,47,.075)] transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-0.5 hover:border-[#a8c7bb] hover:bg-[#f7fbf8] hover:shadow-[0_1px_0_rgba(255,255,255,.95)_inset,0_24px_54px_rgba(13,55,47,.12)] active:scale-[.985] md:inline-flex 2xl:w-72"
        onClick={openPalette}
        aria-label="Open command palette"
        aria-keyshortcuts="Meta+K Control+K"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#edf7f3] text-tjc-evergreen shadow-[inset_0_0_0_1px_rgba(13,121,112,.08)] transition duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:bg-[#dff3ed]">
          <Search size={16} strokeWidth={1.9} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] leading-tight text-tjc-ink 2xl:hidden">Command</span>
          <span className="hidden truncate text-[13px] leading-tight text-tjc-ink 2xl:block">Search commands</span>
          <span className="hidden truncate text-[11px] font-semibold leading-tight text-tjc-muted 2xl:block">assets, views, queues, ResourceSpace ID</span>
        </span>
        <kbd className="shrink-0 rounded-lg border border-[#c7d2ca] bg-[#f4f7f4] px-1.5 py-0.5 text-[11px] font-black text-tjc-muted shadow-[0_1px_0_rgba(255,255,255,.9)_inset]">⌘K</kbd>
      </button>
      <button
        type="button"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d3ded7] bg-white px-3 text-sm font-black text-tjc-evergreen shadow-[0_1px_0_rgba(255,255,255,.95)_inset] transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:bg-[#f3f8f4] active:scale-[.98] md:hidden"
        onClick={openPalette}
        aria-label="Open command palette"
        aria-keyshortcuts="Meta+K Control+K"
      >
        <Search size={16} strokeWidth={1.8} aria-hidden="true" />
        <span>Search commands</span>
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 bg-[#07100d]/36 p-3 backdrop-blur-[5px]" role="presentation" onMouseDown={closePalette}>
          <section
            ref={dialogRef}
            className="mx-auto mt-16 w-full max-w-2xl overflow-hidden rounded-[1.35rem] border border-[#9fb4a8] bg-[#fbfdfb] shadow-[0_30px_100px_rgba(7,16,13,.32),0_1px_0_rgba(255,255,255,.95)_inset]"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="border-b border-[#c7d3cb] bg-white px-4 pb-4 pt-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-xs font-black uppercase tracking-[.14em] text-tjc-muted" htmlFor="command-search">Search Commands</label>
                <button className="grid h-9 w-9 place-items-center rounded-xl text-tjc-muted transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:bg-[#f3f6f2] active:scale-[.97]" type="button" onClick={closePalette} aria-label="Close command palette">
                  <X size={16} strokeWidth={1.8} aria-hidden="true" />
                </button>
              </div>
              <div className="grid min-h-12 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-[#c9d6ce] bg-[#fbfdfb] px-3 shadow-[0_1px_0_rgba(255,255,255,.95)_inset,0_14px_34px_rgba(25,34,29,.06)] transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] focus-within:border-[#0d7970] focus-within:ring-4 focus-within:ring-[#16a99a]/12">
                <Search size={18} strokeWidth={1.8} className="text-tjc-evergreen" aria-hidden="true" />
                <input
                  id="command-search"
                  ref={inputRef}
                  className="command-search-input min-h-12 min-w-0 bg-transparent text-base font-semibold text-tjc-ink outline-none placeholder:text-[#7d877f] focus:outline-none focus-visible:outline-none"
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
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#eef7f1] text-tjc-evergreen" aria-hidden="true">
                  {query.trim() ? <Send size={15} strokeWidth={1.8} /> : <Search size={15} strokeWidth={1.8} />}
                </span>
              </div>
            </div>
            <div className="max-h-[60dvh] overflow-y-auto p-2">
              {visibleCommands.length ? (
                <div className="grid gap-2" id="command-results" role="listbox" aria-label="Command results">
                  {groupedCommands.map((group) => (
                    <section className="grid gap-1" key={group.group} aria-label={group.group}>
                      <h3 className="px-3 pt-1 text-[11px] font-black text-tjc-muted">{group.group}</h3>
                      {group.items.map((command) => {
                        const index = visibleCommands.findIndex((item) => item.id === command.id);
                        const Icon = command.icon;
                        const selected = index === selectedIndex;
                        return (
                          <button
                            type="button"
                            key={command.id}
                            id={`command-option-${command.id}`}
                            className={cn(
                              "grid min-h-14 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl px-3 py-2 text-left transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:bg-[#f3f8f4] focus-visible:bg-[#f3f8f4]",
                              selected ? "bg-[#e7f5ec] ring-1 ring-[#8fbda8] shadow-[inset_4px_0_0_#063f39]" : ""
                            )}
                            role="option"
                            aria-selected={selected}
                            onClick={() => runCommand(command)}
                            onMouseEnter={() => setSelectedIndex(index)}
                          >
                            <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#c5d0c8] bg-white text-tjc-evergreen shadow-[0_1px_0_rgba(255,255,255,.9)_inset]">
                              <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                            </span>
                            <span className="min-w-0">
                              <strong className="block truncate text-sm font-black text-tjc-ink">{command.label}</strong>
                              <span className="mt-0.5 block truncate text-xs font-medium text-tjc-muted">{command.hint}</span>
                            </span>
                            <span className="hidden items-center gap-2 sm:inline-flex">
                              <span className="rounded-full border border-[#d7e0da] bg-white px-2 py-1 text-[11px] font-black text-tjc-muted">{command.group}</span>
                              {selected ? <span className="rounded-full bg-tjc-evergreen px-2 py-1 text-[11px] font-black text-white">Enter</span> : null}
                            </span>
                          </button>
                        );
                      })}
                    </section>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-sm font-medium text-tjc-muted">No matching commands.</div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#c7d3cb] bg-[#f5f8f5] px-4 py-2.5 text-xs font-semibold text-tjc-muted">
              <span>Enter opens first result. Esc closes.</span>
              <span>ResourceSpace writes remain pending until field mapping is configured.</span>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
