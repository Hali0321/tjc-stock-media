import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/ui";

const filterGroups = [
  { label: "Status", options: ["Church-wide use", "Internal ministry", "Needs review", "Archive only"] },
  { label: "Media type", options: ["Photo", "Video", "Audio", "Graphic", "Document"] },
  { label: "People/minors", options: ["No people", "Adults only", "People unknown", "Children/youth"] },
  { label: "Governance", options: ["Missing source", "Rights review", "Portal ready", "AI enrichment", "Taxonomy drift", "Duplicate candidate", "Stale approval", "Rendition gap"] },
  { label: "Ministry", options: ["Worship", "Bible Study", "Fellowship", "Sabbath", "Welcome Team"] },
  { label: "Event/date", options: ["2026", "2025", "2024"] },
  { label: "Orientation", options: ["Landscape", "Square", "Portrait"] },
  { label: "Source", options: ["LM Photos", "ResourceSpace", "Photographer"] }
];

export function FilterSidebar({
  filters,
  onToggle,
  onClear
}: {
  filters: string[];
  onToggle: (filter: string) => void;
  onClear: () => void;
}) {
  return (
    <aside className="overflow-hidden dam-lift xl:sticky xl:top-24" aria-label="Advanced filters">
      <div className="flex items-center justify-between gap-3 border-b border-tjc-line bg-[#f8fbf7] px-3 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-tjc-evergreen">
          <SlidersHorizontal aria-hidden="true" size={16} strokeWidth={1.8} />
          <strong>Filters</strong>
        </div>
        {filters.length ? (
          <button className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-tjc-muted transition hover:bg-[#eef4f1] hover:text-tjc-evergreen" type="button" onClick={onClear}>
            <X size={13} strokeWidth={1.8} aria-hidden="true" />
            Reset
          </button>
        ) : null}
      </div>
      <div className="grid gap-0">
        {filterGroups.map((group) => (
          <section className="border-b border-tjc-line/70 px-3 py-3 last:border-b-0" key={group.label} aria-label={`${group.label} filters`}>
            <h2 className="mb-2 text-xs font-semibold text-[#65736b]">{group.label}</h2>
            <div className="grid grid-cols-2 gap-1.5">
              {group.options.map((filter) => (
                <button
                  type="button"
                  key={filter}
                  className={cn(
                    "min-h-8 rounded-lg border border-tjc-line bg-white px-2 text-left text-[11px] font-semibold text-[#3e4741] transition hover:border-[#9bc5b5] hover:bg-[#eef7f1] active:translate-y-px",
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
        ))}
      </div>
    </aside>
  );
}
