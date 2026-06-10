import type { SearchResult } from "@/lib/types";

type InsightCounts = SearchResult["counts"];
type UsageAnalytics = NonNullable<SearchResult["usageAnalytics"]>;

export type InsightsCommandAction = {
  id: string;
  title: string;
  detail: string;
  href: string;
  priority: "critical" | "high" | "medium";
};

export type InsightsCommandSignal = {
  label: string;
  value: string;
  target: string;
  tone: "ready" | "watch" | "risk";
};

export type InsightsCommandCenter = {
  score: number;
  scoreLabel: string;
  summary: string;
  signals: InsightsCommandSignal[];
  actions: InsightsCommandAction[];
};

function pct(value: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

function action(id: string, title: string, detail: string, href: string, priority: InsightsCommandAction["priority"]): InsightsCommandAction {
  return { id, title, detail, href, priority };
}

export function buildInsightsCommandCenter(result?: SearchResult): InsightsCommandCenter {
  const counts: Partial<InsightCounts> = result?.counts || {};
  const usage: Partial<UsageAnalytics> = result?.usageAnalytics || {};
  const rawTotal = counts.rawTotal || counts.visibleToRole || counts.totalMatching || 0;
  const portalReady = counts.portalReady || 0;
  const rightsRisk = counts.rightsReview || 0;
  const peopleRisk = counts.childrenYouth || 0;
  const missingSource = counts.missingSource || 0;
  const reviewDebt = (counts.needsReview || 0) + rightsRisk + peopleRisk + missingSource + (counts.pendingReview || 0);
  const readiness = pct(portalReady, rawTotal);
  const metadata = result?.metadataHealth;
  const metadataScore = metadata?.averageScore || 0;
  const usageConnected = Boolean(usage.enabled && usage.totalEvents);
  const searchGaps = result?.zeroResultInsights?.length || 0;
  const operationalRisks = (result?.operationalInsights || []).filter((item) => item.tone === "warn" && item.value > 0);
  const score = Math.round((readiness * 0.42) + (metadataScore * 0.28) + ((usageConnected ? 100 : 35) * 0.18) + (Math.max(0, 100 - pct(reviewDebt, rawTotal)) * 0.12));
  const actions: InsightsCommandAction[] = [];

  if (rightsRisk) actions.push(action("rights-review", "Clear rights-risk queue", `${rightsRisk.toLocaleString()} records need rights, consent, or proof review.`, "/review?queue=rights", "critical"));
  if (peopleRisk) actions.push(action("people-risk", "Resolve people/youth confidence", `${peopleRisk.toLocaleString()} records need people/minors review before broad reuse.`, "/review?queue=people", "high"));
  if (missingSource) actions.push(action("source-traceability", "Repair source traceability", `${missingSource.toLocaleString()} records are missing source or provenance evidence.`, "/admin", "high"));
  if ((metadata?.needsUsage || 0) > 0) actions.push(action("usage-guidance", "Fill usage guidance", `${metadata?.needsUsage.toLocaleString()} records need usage guidance for self-serve reuse.`, "/review", "medium"));
  if (!usageConnected) actions.push(action("usage-analytics", "Connect usage analytics", "Search, asset view, download, and package events need durable tracking for premium reporting.", "/admin", "medium"));
  if (searchGaps) actions.push(action("search-gaps", "Tune no-result searches", `${searchGaps.toLocaleString()} search intents map better to saved views than plain keywords.`, "/?view=saved", "medium"));
  if (!actions.length) actions.push(action("scale-library", "Expand governed supply", "Core safety signals look healthy. Increase Portal Ready supply and package coverage.", "/collections", "medium"));

  return {
    score,
    scoreLabel: score >= 85 ? "Premium-ready" : score >= 70 ? "Beta-strong" : score >= 50 ? "Needs focused lift" : "Not enterprise-ready",
    summary: `${portalReady.toLocaleString()} of ${rawTotal.toLocaleString()} records are Portal Ready; ${reviewDebt.toLocaleString()} records still carry review debt.`,
    signals: [
      { label: "Portal readiness", value: `${readiness}%`, target: "85%+ for broad self-serve reuse", tone: readiness >= 85 ? "ready" : readiness >= 55 ? "watch" : "risk" },
      { label: "Metadata health", value: `${metadataScore}%`, target: "90%+ average metadata score", tone: metadataScore >= 90 ? "ready" : metadataScore >= 65 ? "watch" : "risk" },
      { label: "Analytics maturity", value: usageConnected ? `${usage.totalEvents?.toLocaleString()} events` : "Not connected", target: "Search, view, download, package events", tone: usageConnected ? "ready" : "watch" },
      { label: "Warning signals", value: operationalRisks.length.toLocaleString(), target: "0 unresolved warning panels", tone: operationalRisks.length ? "risk" : "ready" }
    ],
    actions: actions.slice(0, 5)
  };
}
