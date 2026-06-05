import { SlidersHorizontal } from "lucide-react";

const filterGroups = [
  { label: "Use", options: ["Church-wide use", "Internal ministry", "Needs review", "Archive only"] },
  { label: "Media", options: ["Photo", "Video", "Audio", "Graphic", "Document"] },
  { label: "People", options: ["No people", "Adults only", "Children/youth"] },
  { label: "Govern", options: ["Missing source", "Rights review"] },
  { label: "Ministry", options: ["Worship", "Bible Study", "Fellowship", "Seasonal", "Welcome Team"] },
  { label: "Date", options: ["2026", "2025", "2024"] }
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
    <aside className="filter-sidebar" aria-label="Advanced filters">
      <div className="filter-sidebar__header">
        <div>
          <SlidersHorizontal aria-hidden="true" size={16} />
          <strong>Filters</strong>
        </div>
        {filters.length ? <button type="button" onClick={onClear}>Clear</button> : null}
      </div>
      {filterGroups.map((group) => (
        <section className="filter-group" key={group.label} aria-label={`${group.label} filters`}>
          <h2>{group.label}</h2>
          <div>
            {group.options.map((filter) => (
              <button
                type="button"
                key={filter}
                className={filters.includes(filter) ? "filter-option filter-option--active" : "filter-option"}
                onClick={() => onToggle(filter)}
                aria-pressed={filters.includes(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </section>
      ))}
    </aside>
  );
}
