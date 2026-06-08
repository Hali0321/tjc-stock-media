import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/ui";

export const filterGroups = [
  { label: "Status", priority: "primary", options: ["Church-wide use", "Internal ministry", "Needs review", "Archive only"] },
  { label: "People/minors", priority: "primary", options: ["No people", "Adults only", "People unknown", "Children/youth"] },
  { label: "Media type", priority: "primary", options: ["Photo", "Video", "Audio", "Graphic", "Document"] },
  { label: "Ministry", priority: "primary", options: ["Worship", "Bible Study", "Fellowship", "Sabbath", "Welcome Team"] },
  { label: "Governance", priority: "advanced", options: ["Missing source", "Rights review", "Portal ready", "AI enrichment", "Taxonomy drift", "Duplicate candidate", "Stale approval", "Rendition gap"] },
  { label: "Event/date", priority: "advanced", options: ["2026", "2025", "2024"] },
  { label: "Orientation", priority: "advanced", options: ["Landscape", "Square", "Portrait"] },
  { label: "Source", priority: "advanced", options: ["LM Photos", "ResourceSpace", "Photographer"] }
];

export function FilterSidebar({
  filters,
  onToggle,
  onClear,
  variant = "inline"
}: {
  filters: string[];
  onToggle: (filter: string) => void;
  onClear: () => void;
  variant?: "inline" | "drawer";
}) {
  const primaryGroups = filterGroups.filter((group) => group.priority === "primary");
  const advancedGroups = filterGroups.filter((group) => group.priority === "advanced");
  const groups = variant === "drawer" ? primaryGroups : filterGroups;

  function renderGroup(group: (typeof filterGroups)[number]) {
    return (
      <section className={cn("border-b border-tjc-line/70 px-3 py-3", variant === "inline" && "md:border-r md:last:border-r-0")} key={group.label} aria-label={`${group.label} filters`}>
        <h2 className="mb-2 text-xs font-black uppercase text-[#65736b]">{group.label}</h2>
        <div className={cn("grid gap-1.5", variant === "drawer" ? "grid-cols-2" : "grid-cols-2")}>
          {group.options.map((filter) => (
            <button
              type="button"
              key={filter}
              className={cn(
                "min-h-9 rounded-full border border-tjc-line bg-white px-3 text-left text-xs font-black text-[#3e4741] transition hover:border-[#9bc5b5] hover:bg-[#eef7f1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0f4f45] active:translate-y-px",
                filters.includes(filter) && "border-[#92c2b0] bg-[#e8f5ef] text-tjc-evergreen shadow-[inset_0_0_0_1px_rgba(18,63,58,.08)]"
              )}
              onClick={() => onToggle(filter)}
              aria-pressed={filters.includes(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <aside className={cn("overflow-hidden rounded-[1.2rem] border border-[#d1ddd2] bg-[#fbfdfb]", variant === "drawer" && "border-0 bg-transparent")} aria-label="Advanced filters">
      <div className="flex items-center justify-between gap-3 border-b border-tjc-line bg-[#f8fbf7] px-3 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-tjc-evergreen">
          <SlidersHorizontal aria-hidden="true" size={16} strokeWidth={1.8} />
          <strong>Filters</strong>
          {variant === "drawer" ? <span className="rounded-full bg-[#e6f0eb] px-2 py-0.5 text-xs font-black text-tjc-evergreen">Primary first</span> : null}
        </div>
        {filters.length ? (
          <button className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-tjc-muted transition hover:bg-[#eef4f1] hover:text-tjc-evergreen" type="button" onClick={onClear}>
            <X size={13} strokeWidth={1.8} aria-hidden="true" />
            Reset
          </button>
        ) : null}
      </div>
      <div className={cn("grid gap-0", variant === "drawer" ? "grid-cols-1" : "md:grid-cols-2 xl:grid-cols-4")}>
        {groups.map(renderGroup)}
      </div>
      {variant === "drawer" ? (
        <details className="border-t border-tjc-line bg-white/68">
          <summary className="cursor-pointer px-3 py-3 text-sm font-black text-tjc-evergreen">Advanced filters</summary>
          <div className="grid gap-0 sm:grid-cols-2">{advancedGroups.map(renderGroup)}</div>
        </details>
      ) : null}
    </aside>
  );
}
