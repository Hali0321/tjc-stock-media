import type { DemoRole, SearchResult } from "@/lib/types";

export type MissionControlTone = "ready" | "watch" | "risk" | "info";

export type MissionControlLane = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: MissionControlTone;
  filter?: string;
};

export type MissionControlAction = {
  id: string;
  label: string;
  detail: string;
  href?: string;
  filter?: string;
  query?: string;
  priority: "now" | "next" | "later";
};

export type MissionControlSpotlight = {
  title: string;
  detail: string;
  id?: string;
  href?: string;
};

export type DamMissionControl = {
  score: number;
  label: string;
  summary: string;
  selectedSummary: string;
  lanes: MissionControlLane[];
  actions: MissionControlAction[];
  spotlight: MissionControlSpotlight;
};

function pct(value: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

function count(value: number | undefined) {
  return (value || 0).toLocaleString();
}

function lane(
  id: string,
  label: string,
  value: string,
  detail: string,
  tone: MissionControlTone,
  filter?: string
): MissionControlLane {
  return { id, label, value, detail, tone, filter };
}

function action(
  id: string,
  label: string,
  detail: string,
  priority: MissionControlAction["priority"],
  target: Pick<MissionControlAction, "href" | "filter" | "query"> = {}
): MissionControlAction {
  return { id, label, detail, priority, ...target };
}

function scoreLabel(score: number) {
  if (score >= 86) return "WOW-ready";
  if (score >= 72) return "Team-ready";
  if (score >= 55) return "Needs focused lift";
  return "Review-first";
}

export function buildDamMissionControl({
  result,
  role,
  selectedCount
}: {
  result?: SearchResult | null;
  role: DemoRole;
  selectedCount: number;
}): DamMissionControl {
  const counts = result?.counts;
  const assets = result?.assets ?? [];
  const visibleReady = assets.filter((asset) => asset.downloadPolicy === "approved-copy-allowed").length;
  const visibleReview = assets.filter((asset) => asset.status === "Needs Review" || asset.status === "Possible Minors").length;
  const total = counts?.visibleToRole ?? counts?.rawTotal ?? result?.total ?? counts?.totalMatching ?? assets.length ?? 0;
  const portalReady = counts?.portalReady ?? visibleReady;
  const needsReview = (counts?.needsReview ?? 0) + (counts?.pendingReview ?? 0);
  const rightsReview = counts?.rightsReview ?? 0;
  const childrenYouth = counts?.childrenYouth ?? 0;
  const missingSource = counts?.missingSource ?? 0;
  const reviewDebt = counts ? needsReview + rightsReview + childrenYouth + missingSource : visibleReview;
  const readiness = pct(portalReady, total);
  const metadataScore = result?.metadataHealth?.averageScore
    ?? pct(assets.filter((asset) => ((asset.tags?.length ?? 0) || (asset.tjcTerms?.length ?? 0)) && asset.usageGuidance).length, assets.length);
  const blockerLoad = pct(reviewDebt, total);
  const score = Math.round((readiness * 0.5) + (metadataScore * 0.3) + (Math.max(0, 100 - blockerLoad) * 0.2));
  const shown = result?.counts.currentlyShown ?? assets.length ?? 0;
  const primaryAsset = assets.find((asset) => asset.downloadPolicy === "approved-copy-allowed" || asset.reuseDecision?.downloadable) || assets[0];
  const actions: MissionControlAction[] = [];

  if (portalReady) {
    actions.push(action(
      "portal-ready",
      "Show ready-to-use media",
      `${count(portalReady)} records can anchor sermon slides, newsletters, social, and web work.`,
      "now",
      { filter: "portal ready" }
    ));
  }
  if (rightsReview || childrenYouth) {
    actions.push(action(
      "rights-review",
      "Clear highest-risk review debt",
      `${count(rightsReview + childrenYouth)} records need rights, people, or youth confidence.`,
      role === "Viewer" || role === "Contributor" ? "next" : "now",
      { href: "/review?queue=rights-review" }
    ));
  }
  if (missingSource) {
    actions.push(action(
      "source-evidence",
      "Repair source evidence",
      `${count(missingSource)} records need custody/source proof before broad reuse.`,
      role === "DAM Admin" ? "now" : "next",
      { href: "/admin" }
    ));
  }
  if (selectedCount > 1) {
    actions.push(action(
      "package-selected",
      "Package selected records",
      `${selectedCount.toLocaleString()} selected refs can become a governed ministry toolkit.`,
      "now",
      { href: "/packages" }
    ));
  }
  if (result?.discovery?.suggestedFilters[0]) {
    const suggestion = result.discovery.suggestedFilters[0];
    actions.push(action(
      "best-filter",
      `Try ${suggestion.label}`,
      `${suggestion.count.toLocaleString()} matching records fit this intent.`,
      "next",
      { filter: suggestion.filter }
    ));
  }
  if (!actions.length) {
    actions.push(action(
      "broaden-search",
      "Broaden discovery",
      "Try ministry language like sermon, youth, baptism, fellowship, social, banner, or newsletter.",
      "now",
      { query: "sermon" }
    ));
  }

  return {
    score,
    label: scoreLabel(score),
    summary: `${count(portalReady)} Portal Ready of ${count(total)} visible records. ${count(reviewDebt)} need review, source, rights, or people/youth confidence.`,
    selectedSummary: selectedCount ? `${selectedCount.toLocaleString()} selected for package or review flow` : `${shown.toLocaleString()} visible records in this workspace`,
    lanes: [
      lane("portal-ready", "Ready supply", `${readiness}%`, `${count(portalReady)} governed records`, readiness >= 75 ? "ready" : readiness >= 45 ? "watch" : "risk", "portal ready"),
      lane("review-debt", "Review debt", count(reviewDebt), "Rights, source, people, and pending-review blockers", reviewDebt ? "risk" : "ready"),
      lane("metadata", "Record readiness", `${metadataScore}%`, "Average readiness score", metadataScore >= 85 ? "ready" : metadataScore >= 65 ? "watch" : "risk"),
      lane("search-fit", "Search fit", count(result?.counts.totalMatching), "Records matching current intent", result?.counts.totalMatching ? "info" : "watch")
    ],
    actions: actions.slice(0, 4),
    spotlight: primaryAsset ? {
      title: primaryAsset.title,
      detail: primaryAsset.reuseDecision?.summary || primaryAsset.usageGuidance || primaryAsset.status,
      id: primaryAsset.id,
      href: `/assets/${primaryAsset.id}`
    } : {
      title: "No spotlight record yet",
      detail: "Broaden search or choose a saved view to load candidate media."
    }
  };
}
