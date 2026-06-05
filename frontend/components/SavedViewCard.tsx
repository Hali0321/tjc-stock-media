import { ArrowRight, BookmarkCheck } from "lucide-react";
import type { SavedViewSummary } from "@/lib/types";

export function SavedViewCard({
  view,
  active,
  onOpen
}: {
  view: SavedViewSummary;
  active: boolean;
  onOpen: () => void;
}) {
  return (
    <button type="button" className={`saved-view-card ${active ? "saved-view-card--active" : ""}`} onClick={onOpen}>
      <span className="saved-view-card__icon">
        <BookmarkCheck size={16} aria-hidden="true" />
      </span>
      <span className="saved-view-card__body">
        <span className="saved-view-card__title">{view.label}</span>
        <span className="saved-view-card__description">{view.description}</span>
        <span className="saved-view-card__reason">{view.reason}</span>
      </span>
      <span className="saved-view-card__count">{view.count.toLocaleString()}</span>
      <ArrowRight className="saved-view-card__arrow" size={16} aria-hidden="true" />
    </button>
  );
}
