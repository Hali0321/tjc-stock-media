"use client";

import { type KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Archive, FileSearch, FolderOpen, HelpCircle, KeyRound, ListFilter, Search, Send, Settings2, ShieldAlert, ShieldCheck, Tags, UploadCloud, UserRoundSearch, X } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { cn } from "@/lib/ui";

type Command = {
  id: string;
  label: string;
  hint: string;
  href: string;
  keywords: string;
  icon: typeof Search;
  group: "Go to" | "Find" | "Saved views" | "Workflow";
  shortcut?: string;
  tag?: string;
  access?: "Governance" | "Reviewer";
  adminOnly?: boolean;
  reviewerOnly?: boolean;
};

const commands: Command[] = [
  { id: "go-library", group: "Go to", label: "Find", hint: "Open the role-safe DAM contact sheet", href: "/", keywords: "find library home assets contact sheet", icon: Search, shortcut: "G F" },
  { id: "go-collections", group: "Go to", label: "Deliver", hint: "Open governed ministry delivery packages", href: "/collections", keywords: "deliver collections campaign ministry governed portals events", icon: FolderOpen, shortcut: "G D" },
  { id: "go-upload", group: "Go to", label: "Intake", hint: "Open contributor intake session", href: "/upload", keywords: "intake upload contributor submit files", icon: UploadCloud, shortcut: "G U" },
  { id: "go-review", group: "Go to", label: "Review", hint: "Open reviewer governance workbench", href: "/review", keywords: "review governance queue evidence", icon: ShieldAlert, shortcut: "G R" },
  { id: "go-guide", group: "Go to", label: "Guide", hint: "Open use guidance and policy notes", href: "/guide", keywords: "guide help rules usage children credit", icon: HelpCircle, shortcut: "G ?" },
  { id: "go-admin", group: "Go to", label: "Governance", hint: "Open operations console and blockers", href: "/admin", keywords: "governance admin diagnostics readiness api field mapping", icon: Settings2, shortcut: "G D", adminOnly: true, access: "Governance", tag: "Governance" },

  { id: "find-assets", group: "Find", label: "Search assets", hint: "Run a Find search with your current query", href: "/", keywords: "find search assets bible fellowship media", icon: Search, shortcut: "Enter" },
  { id: "find-rs-id", group: "Find", label: "Search ResourceSpace ID", hint: "Type a numeric RS ID to open an exported asset record", href: "/", keywords: "resourcespace id reference ref search number", icon: KeyRound, shortcut: "RS #" },
  { id: "find-collection", group: "Find", label: "Search deliver packages", hint: "Find governed sets by event, ministry, campaign, or stable collection", href: "/collections", keywords: "deliver collection campaign event ministry stable id", icon: Tags, shortcut: "C" },
  { id: "find-blocked", group: "Find", label: "Search blocked downloads", hint: "Show assets blocked by reuse or download policy", href: "/?view=needs-review", keywords: "blocked downloads unsafe do not publish needs review", icon: ShieldAlert, shortcut: "B" },

  { id: "portal-ready", group: "Saved views", label: "External ready", hint: "Assets approved for external ministry use", href: "/?view=approved-church-wide", keywords: "external ministry safe portal ready approved reusable", icon: ShieldCheck, shortcut: "1" },
  { id: "needs-review", group: "Saved views", label: "Needs Review", hint: "Candidates missing evidence, rights, or approved copy", href: "/?view=needs-review", keywords: "needs portal review missing evidence rights approval", icon: ShieldAlert, shortcut: "2" },
  { id: "no-people", group: "Saved views", label: "No People", hint: "Lower-risk visuals with no visible people", href: "/?view=no-people", keywords: "no people empty plants bible safe", icon: UserRoundSearch, shortcut: "3" },
  { id: "website-hero", group: "Saved views", label: "Website Hero", hint: "Hero/banner candidates for web and slides", href: "/?view=website-hero", keywords: "hero banner web header website", icon: FileSearch, shortcut: "4" },
  { id: "recently-approved", group: "Saved views", label: "Recently Approved", hint: "Newest reviewed items in role-safe Find", href: "/?view=recently-approved", keywords: "recently approved newest reviewed", icon: Archive, shortcut: "5" },

  { id: "start-upload", group: "Workflow", label: "Start intake session", hint: "Submit new media for DAM review", href: "/upload", keywords: "start intake upload contributor draft submit", icon: UploadCloud, shortcut: "U" },
  { id: "open-review-queue", group: "Workflow", label: "Open review queue", hint: "Inspect assets that need reviewer evidence", href: "/review?queue=pending", keywords: "open review queue pending evidence", icon: ListFilter, shortcut: "R", reviewerOnly: true, access: "Reviewer", tag: "Reviewer" },
  { id: "children-youth-queue", group: "Workflow", label: "Open children/youth queue", hint: "Review assets with children or youth visibility risk", href: "/review?queue=children-youth", keywords: "children youth minors queue review people visibility", icon: UserRoundSearch, shortcut: "C Y", reviewerOnly: true, access: "Reviewer", tag: "Reviewer" },
  { id: "pending-writes", group: "Workflow", label: "Show pending writes", hint: "Local review writes awaiting ResourceSpace mapping", href: "/admin#launch-gate", keywords: "pending writes local queue resourcespace write mapping", icon: Settings2, shortcut: "P", adminOnly: true, access: "Governance", tag: "Governance" },
  { id: "request-access", group: "Workflow", label: "Request access", hint: "Review/original access stays a request, not a ResourceSpace write", href: "/guide", keywords: "request access original review coworker permission", icon: HelpCircle, shortcut: "A" }
];

const groupOrder: Command["group"][] = ["Go to", "Find", "Saved views", "Workflow"];

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
  const hiddenRoleCommandCount = commands.filter((command) => (command.adminOnly && role !== "DAM Admin") || (command.reviewerOnly && !reviewer)).length;

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
        group: "Find",
        label: `Open ResourceSpace ID ${resourceId}`,
        hint: "Open asset detail by exported ID/reference",
        href: `/assets/${resourceId}`,
        keywords: resourceId,
        icon: KeyRound,
        shortcut: "Enter"
      });
    }
    if (query.trim() && !resourceId) {
      base.push({
        id: `search-${query.trim()}`,
        group: "Find",
        label: `Search "${query.trim()}"`,
        hint: "Run library search",
        href: `/?q=${encodeURIComponent(query.trim())}`,
        keywords: query,
        icon: Search,
        shortcut: "Enter"
      });
    }
    return base;
  }, [query, reviewer, role]);

  const groupedCommands = useMemo(() => {
    const groups = groupOrder.map((group) => ({ group, items: [] as Command[] }));
    visibleCommands.forEach((command) => {
      let group = groups.find((item) => item.group === command.group);
      if (!group) {
        group = { group: command.group, items: [] };
        groups.push(group);
      }
      group.items.push(command);
    });
    return groups.filter((group) => group.items.length);
  }, [visibleCommands]);

  const selectedCommand = visibleCommands[selectedIndex];

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
      setSelectedIndex((current) => visibleCommands.length ? (current + 1) % visibleCommands.length : 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((current) => visibleCommands.length ? (current - 1 + visibleCommands.length) % visibleCommands.length : 0);
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
        className="group hidden min-h-10 w-10 items-center justify-center gap-2 rounded-md border border-[#d3ded7] bg-white px-0 text-left text-sm font-black text-tjc-evergreen transition hover:border-[#a8c7bb] hover:bg-[#f7fbf8] active:translate-y-px lg:inline-flex 2xl:w-auto 2xl:px-3"
        onClick={openPalette}
        aria-label="Open command palette"
        aria-keyshortcuts="Meta+K Control+K"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#edf7f3] text-tjc-evergreen transition group-hover:bg-[#dff3ed]">
          <Search size={16} strokeWidth={1.9} aria-hidden="true" />
        </span>
        <span className="hidden text-sm font-black text-tjc-ink 2xl:inline">Command</span>
        <kbd className="hidden shrink-0 rounded-md border border-[#c7d2ca] bg-[#f4f7f4] px-1.5 py-0.5 text-[11px] font-black text-tjc-muted 2xl:inline">⌘K</kbd>
      </button>
      <button
        type="button"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#d3ded7] bg-white px-3 text-sm font-black text-tjc-evergreen transition hover:bg-[#f3f8f4] active:translate-y-px lg:hidden"
        onClick={openPalette}
        aria-label="Open command palette"
        aria-keyshortcuts="Meta+K Control+K"
      >
        <Search size={16} strokeWidth={1.8} aria-hidden="true" />
        <span>Search commands</span>
      </button>
      {open && typeof document !== "undefined" ? createPortal((
        <div className="fixed inset-0 z-[80] bg-[#07100d]/36 p-3" role="presentation" onMouseDown={closePalette}>
          <section
            ref={dialogRef}
            className="mx-auto mt-8 w-full max-w-5xl overflow-hidden rounded-md border border-[#9fb4a8] bg-[#fbfdfb] shadow-[0_30px_80px_rgba(7,16,13,.26)] md:mt-14"
            role="dialog"
            aria-modal="true"
            aria-labelledby="command-palette-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="border-b border-[#c7d3cb] bg-white px-4 pb-4 pt-3 sm:px-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <label id="command-palette-title" className="text-xs font-black uppercase tracking-[.14em] text-tjc-muted" htmlFor="command-search">DAM Launcher</label>
                  <p className="mt-0.5 hidden text-xs font-semibold text-tjc-muted sm:block">Jump, find, saved views, and review workflows stay policy-aware.</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden rounded-md border border-[#c9d6ce] bg-[#f6faf7] px-2.5 py-1 text-[11px] font-black text-tjc-evergreen sm:inline-flex">Role: {role}</span>
                  <kbd className="hidden rounded-md border border-[#c7d2ca] bg-[#f4f7f4] px-2 py-1 text-[11px] font-black text-tjc-muted sm:inline">⌘K</kbd>
                  <kbd className="hidden rounded-md border border-[#c7d2ca] bg-[#f4f7f4] px-2 py-1 text-[11px] font-black text-tjc-muted sm:inline">Ctrl K</kbd>
                  <button className="grid h-9 w-9 place-items-center rounded-md text-tjc-muted transition hover:bg-[#f3f6f2] active:translate-y-px" type="button" onClick={closePalette} aria-label="Close command palette">
                    <X size={16} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="grid min-h-[4.75rem] grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border border-[#c9d6ce] bg-[#fbfdfb] px-4 transition focus-within:border-[#0d7970] focus-within:ring-4 focus-within:ring-[#16a99a]/12" data-command-proof="search-height">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-[#edf7f3] text-tjc-evergreen">
                  <Search size={19} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <input
                  id="command-search"
                  ref={inputRef}
                  className="command-search-input min-h-16 min-w-0 bg-transparent text-lg font-semibold text-tjc-ink outline-none placeholder:text-[#7d877f] focus:outline-none focus-visible:outline-none sm:text-xl"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={onInputKeyDown}
                  placeholder="Search assets, RS ID, collection, saved view..."
                  aria-label="Command search"
                  aria-activedescendant={visibleCommands[selectedIndex] ? `command-option-${visibleCommands[selectedIndex].id}` : undefined}
                  aria-controls="command-results"
                  aria-expanded={open}
                  aria-haspopup="listbox"
                  aria-autocomplete="list"
                  role="combobox"
                />
                <span className="grid h-10 w-10 place-items-center rounded-md bg-[#eef7f1] text-tjc-evergreen" aria-hidden="true">
                  {query.trim() ? <Send size={17} strokeWidth={1.8} /> : <Search size={17} strokeWidth={1.8} />}
                </span>
              </div>
            </div>
            <div className="max-h-[62dvh] overflow-y-auto p-3 sm:p-4">
              <div id="command-results" role="listbox" aria-label="Command results">
                {visibleCommands.length ? (
                  <div className="grid gap-4 md:grid-cols-2" data-command-proof="command-groups">
                    {groupedCommands.map((group) => (
                      <section className="grid gap-1.5" key={group.group} aria-label={group.group}>
                        <div className="flex items-center gap-2 px-2">
                          <h3 className="text-[11px] font-black uppercase tracking-[.12em] text-tjc-muted">{group.group}</h3>
                          <span className="h-px flex-1 bg-[#dce5df]" aria-hidden="true" />
                          <span className="text-[11px] font-black text-tjc-muted">{group.items.length}</span>
                        </div>
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
                                "group/command relative grid min-h-16 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border px-3 py-2 text-left transition hover:bg-[#f3f8f4] focus-visible:bg-[#f3f8f4]",
                                selected ? "border-[#79c9bd] bg-[#e4f8f4] ring-1 ring-[#79c9bd]" : "border-transparent"
                              )}
                              data-command-proof={selected ? "selected-row" : undefined}
                              role="option"
                              aria-selected={selected}
                              tabIndex={-1}
                              onClick={() => runCommand(command)}
                              onMouseEnter={() => setSelectedIndex(index)}
                            >
                              <span className={cn("grid h-11 w-11 place-items-center rounded-md border border-[#c5d0c8] bg-white text-tjc-evergreen transition group-hover/command:border-[#9accc3]", selected && "border-[#9accc3] bg-white")}>
                                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                              </span>
                              <span className="min-w-0">
                                <strong className="block truncate text-[15px] font-black text-tjc-ink">{command.label}</strong>
                                <span className="mt-0.5 block truncate text-xs font-semibold text-tjc-muted">{command.hint}</span>
                              </span>
                              <span className="hidden items-center gap-2 sm:inline-flex" data-command-proof={command.access ? "role-restricted-command shortcut-placement" : "shortcut-placement"}>
                                {command.tag ? <span className={cn("rounded-md border px-2 py-1 text-[11px] font-black", command.access === "Governance" ? "border-[#ead6a8] bg-[#fff8e8] text-[#725216]" : "border-[#b9d4e1] bg-[#eef8fb] text-[#24546b]")}>{command.tag}</span> : null}
                                {command.shortcut ? <kbd className="rounded-md border border-[#d7e0da] bg-white px-2 py-1 text-[11px] font-black text-tjc-muted">{command.shortcut}</kbd> : null}
                                {selected ? <span className="rounded-md bg-tjc-evergreen px-2 py-1 text-[11px] font-black text-white">Enter</span> : null}
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
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#c7d3cb] bg-[#f5f8f5] px-4 py-3 text-xs font-semibold text-tjc-muted sm:px-5">
              <span>↑↓ move. Enter opens {selectedCommand ? selectedCommand.label : "selected command"}. Esc closes.</span>
              <span data-command-proof="footer-safety-copy">ResourceSpace writes remain pending until field mapping is configured.</span>
              {hiddenRoleCommandCount ? <span>{hiddenRoleCommandCount} role-restricted commands hidden for {role}.</span> : <span>Governance and reviewer commands visible for {role}.</span>}
            </div>
          </section>
        </div>
      ), document.body) : null}
    </>
  );
}
