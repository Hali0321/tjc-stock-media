"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Calendar, CheckCircle2, Clock3, Database, Download, Eye, FileText, Filter, FolderOpen, ImageIcon, Info, Package, Search, Share2, Shield, Star, Tags, UploadCloud } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { useAssetsSearch } from "@/components/dam/useDamApi";
import { assetType, displayTitle, formatBytes, sourceLabel } from "@/lib/enterprise-display";
import { insightHealthRows, insightKpis } from "@/lib/insights-dashboard";
import type { SearchResult, StockMediaAsset } from "@/lib/types";
import { ActionButton, AssetThumb, ErrorCard, LoadingCard, PageHeader, StatusBadge } from "./EnterpriseShared";

type MetricRow = {
  label: string;
  value: number;
  total?: number;
  tone?: "indigo" | "green" | "orange" | "red";
};

type InsightStat = {
  label: string;
  value: string;
  detail: string;
  meta: string;
  tone?: "blue" | "green" | "orange" | "red" | "purple" | "teal";
  icon: typeof Database;
};

type InsightPeriodId = "current-export" | "events-14d" | "events-30d";

type InsightFilterState = {
  review: boolean;
  usage: boolean;
  source: boolean;
  health: boolean;
};

const insightPeriods: Array<{ id: InsightPeriodId; label: string; helper: string }> = [
  { id: "current-export", label: "Current export", helper: "ResourceSpace counts from the latest metadata export." },
  { id: "events-14d", label: "Last 14 days", helper: "Portal usage panels use dated SQLite events when available." },
  { id: "events-30d", label: "Last 30 days", helper: "Ready for longer durable analytics history; empty periods stay honest." }
];

const defaultInsightFilters: InsightFilterState = {
  review: true,
  usage: true,
  source: true,
  health: true
};

function MetricRows({ rows }: { rows: MetricRow[] }) {
  return (
    <div className="ed-metric-rows">
      {rows.map((row) => {
        const total = Math.max(row.total || 0, row.value, 1);
        const percent = Math.round((row.value / total) * 100);
        return (
          <article key={row.label}>
            <div><strong>{row.value.toLocaleString()}</strong><span>{row.label}</span><small>{percent}% of {total.toLocaleString()}</small></div>
            <meter className={`is-${row.tone || "indigo"}`} min={0} max={total} value={row.value} />
          </article>
        );
      })}
    </div>
  );
}

function InsightStatCard({ stat }: { stat: InsightStat }) {
  const Icon = stat.icon;
  return (
    <article className={`ed-insight-stat is-${stat.tone || "blue"}`}>
      <i><Icon size={20} /></i>
      <div>
        <span>{stat.label}</span>
        <strong>{stat.value}</strong>
        <small>{stat.detail}</small>
        <em>{stat.meta}</em>
      </div>
    </article>
  );
}

function InsightPanel({ title, action = "View all", className = "", children }: { title: string; action?: string; className?: string; children: ReactNode }) {
  return (
    <section className={`ed-card ed-insight-panel ${className}`}>
      <header className="ed-card-head"><h3>{title}</h3><a>{action}</a></header>
      {children}
    </section>
  );
}

function SampleLabel({ children }: { children: ReactNode }) {
  return <p className="ed-sample-label">{children}</p>;
}

function PeriodMenu({
  activePeriod,
  onToggle
}: {
  activePeriod: InsightPeriodId;
  onToggle: () => void;
}) {
  const active = insightPeriods.find((period) => period.id === activePeriod) || insightPeriods[0];
  return (
    <div className="ed-action-menu-wrap">
      <ActionButton icon={Calendar} onClick={onToggle}>{active.label}</ActionButton>
    </div>
  );
}

function PeriodPickerPanel({
  activePeriod,
  onSelect
}: {
  activePeriod: InsightPeriodId;
  onSelect: (period: InsightPeriodId) => void;
}) {
  return (
    <section className="ed-card ed-insight-period-panel" aria-label="Insight period">
      {insightPeriods.map((period) => (
        <button className={period.id === activePeriod ? "is-active" : ""} key={period.id} type="button" onClick={() => onSelect(period.id)}>
          <strong>{period.label}</strong>
          <span>{period.helper}</span>
        </button>
      ))}
    </section>
  );
}

function InsightFilterPanel({
  filters,
  onChange,
  onReset
}: {
  filters: InsightFilterState;
  onChange: (next: InsightFilterState) => void;
  onReset: () => void;
}) {
  const rows = [
    ["review", "Review workload", "Queue volume, rights risk, metadata blockers"],
    ["usage", "Usage analytics", "Searches, asset views, package/event panels"],
    ["source", "Source health", "ResourceSpace/export status and content snapshot"],
    ["health", "Governance health", "Asset health and readiness meters"]
  ] as const;
  return (
    <section className="ed-card ed-insight-filter-panel" aria-label="Insight filters">
      <header className="ed-card-head"><h3>Insight filters</h3><button type="button" onClick={onReset}>Reset</button></header>
      <div>
        {rows.map(([id, label, helper]) => (
          <label className="ed-insight-filter-row" key={id}>
            <input
              type="checkbox"
              checked={filters[id]}
              onChange={(event) => onChange({ ...filters, [id]: event.target.checked })}
            />
            <span><strong>{label}</strong><small>{helper}</small></span>
          </label>
        ))}
      </div>
    </section>
  );
}

function TopAssetsList({ assets, usage }: { assets: StockMediaAsset[]; usage?: SearchResult["usageAnalytics"] }) {
  const usageRows = usage?.topAssets || [];
  if (usageRows.length) {
    return <div className="ed-ranked-list">{usageRows.slice(0, 5).map((row, index) => <p key={row.label}><span>{index + 1}</span><strong>{row.label}</strong><em>{row.value.toLocaleString()}</em></p>)}</div>;
  }
  return (
    <div className="ed-ranked-assets">
      {assets.slice(0, 5).map((asset, index) => (
        <article key={asset.id}>
          <span>{index + 1}</span>
          <AssetThumb asset={asset} />
          <strong title={displayTitle(asset)}>{displayTitle(asset)}<small>{assetType(asset)} · {formatBytes(asset.fileSizeBytes)}</small></strong>
          <em>{asset.resourceSpaceId || asset.id}</em>
        </article>
      ))}
    </div>
  );
}

function TopicsList({ usage, savedViews }: { usage?: SearchResult["usageAnalytics"]; savedViews: SearchResult["savedViews"] }) {
  const rows = usage?.topSearches?.length
    ? usage.topSearches.slice(0, 5).map((row) => [row.label, `${row.value.toLocaleString()} searches`])
    : savedViews.slice(0, 5).map((view) => [view.label, `${view.count.toLocaleString()} visible`]);
  return <div className="ed-topic-list">{rows.map(([label, value]) => <p key={label}><Tags size={16} /><strong>{label}</strong><span>{value}</span></p>)}</div>;
}

function SourceHealth({ total, usageTotal, sourceLabelText }: { total: number; usageTotal: number; sourceLabelText: string }) {
  return (
    <table className="ed-insight-table">
      <thead><tr><th>Source</th><th>Status</th><th>Last sync</th><th>Records</th></tr></thead>
      <tbody>
        <tr><td>{sourceLabelText}</td><td><StatusBadge status="Read-only" /></td><td>Current export</td><td>{total.toLocaleString()}</td></tr>
        <tr><td>Portal usage analytics</td><td><StatusBadge status={usageTotal ? "Operational" : "Pending setup"} /></td><td>{usageTotal ? "SQLite events" : "-"}</td><td>{usageTotal.toLocaleString()}</td></tr>
      </tbody>
    </table>
  );
}

function TrendPanel({ usage }: { usage?: SearchResult["usageAnalytics"] }) {
  const rows = usage?.dailyEvents || [];
  const max = Math.max(...rows.map((row) => row.value), 1);
  const points = rows.map((row, index) => {
    const x = rows.length <= 1 ? 210 : (index / (rows.length - 1)) * 420;
    const y = 132 - (row.value / max) * 112;
    return { ...row, x, y };
  });
  if (!rows.length) {
    return (
      <div className="ed-analytics-empty">
        <Clock3 size={22} />
        <strong>No real trend line yet</strong>
        <p>Daily analytics will render here after SQLite usage events are recorded with dates. No placeholder graph is shown.</p>
      </div>
    );
  }
  return (
    <div>
      <div className="ed-trend-chart" aria-label="Portal daily usage event trend">
        <svg viewBox="0 0 420 150" aria-hidden="true">
          <polyline points={points.map((point) => `${point.x},${point.y}`).join(" ")} />
          {points.map((point) => <circle key={point.date} cx={point.x} cy={point.y} r="4" />)}
        </svg>
      </div>
      <div className="ed-insight-mini-stats">
        <span><strong>{(usage?.totalEvents || 0).toLocaleString()}</strong>Total events</span>
        <span><strong>{rows.length}</strong>Days tracked</span>
        <span><strong>{(usage?.topSearches || []).reduce((sum, row) => sum + row.value, 0).toLocaleString()}</strong>Search events</span>
        <span><strong>{(usage?.topAssets || []).reduce((sum, row) => sum + row.value, 0).toLocaleString()}</strong>Asset views</span>
      </div>
    </div>
  );
}

function ContentSnapshot({ assets }: { assets: StockMediaAsset[] }) {
  const total = Math.max(assets.length, 1);
  const mediaTypes = ["photo", "document", "video", "audio", "graphic"] as const;
  return (
    <div className="ed-table-mini">
      {mediaTypes.map((type) => {
        const count = assets.filter((asset) => asset.mediaType === type).length;
        const percent = Math.round((count / total) * 100);
        return <p key={type}><strong>{type === "photo" ? "Images" : `${type[0].toUpperCase()}${type.slice(1)}s`}</strong><span>{count.toLocaleString()} · {percent}%</span></p>;
      })}
    </div>
  );
}

function CategoryDonut({ assets, visibleTotal }: { assets: StockMediaAsset[]; visibleTotal: number }) {
  const rendered = Math.max(assets.length, 1);
  const categories = [
    ["Images", assets.filter((asset) => asset.mediaType === "photo").length, "#0b74de"],
    ["Documents", assets.filter((asset) => asset.mediaType === "document").length, "#8b7cf6"],
    ["Videos", assets.filter((asset) => asset.mediaType === "video").length, "#3bc681"],
    ["Audio", assets.filter((asset) => asset.mediaType === "audio").length, "#f3c74e"],
    ["Graphics", assets.filter((asset) => asset.mediaType === "graphic").length, "#9aa7ff"]
  ];
  let cursor = 0;
  const stops = categories.map(([, count, color]) => {
    const start = cursor;
    const end = cursor + (Number(count) / rendered) * 100;
    cursor = end;
    return `${color} ${start}% ${end}%`;
  }).join(", ");
  return (
    <div className="ed-donut-row">
      <div className="ed-donut" style={{ background: `conic-gradient(${stops || "#e5edf3 0 100%"})` }}><strong>{visibleTotal.toLocaleString()}</strong><span>visible</span></div>
      <div className="ed-donut-legend">{categories.map(([label, count, color]) => <p key={label}><i style={{ background: color }} />{label}<span>{Number(count).toLocaleString()}</span></p>)}</div>
    </div>
  );
}

function AdminInsights({
  counts,
  usage,
  assets,
  sourceText,
  hasUsageRows,
  filters
}: {
  counts: SearchResult["counts"];
  usage?: SearchResult["usageAnalytics"];
  assets: StockMediaAsset[];
  sourceText: string;
  hasUsageRows: boolean;
  filters: InsightFilterState;
}) {
  const rawTotal = counts?.rawTotal || counts?.visibleToRole || counts?.totalMatching || 0;
  const reviewRows: MetricRow[] = [
    { label: "Needs Review", value: counts?.needsReview || 0, total: rawTotal, tone: "orange" },
    { label: "Rights Review", value: counts?.rightsReview || 0, total: rawTotal, tone: "red" },
    { label: "Missing Metadata", value: counts?.pendingReview || 0, total: rawTotal, tone: "orange" },
    { label: "Children/Youth", value: counts?.childrenYouth || 0, total: rawTotal, tone: "indigo" }
  ];
  const riskRows = [
    ["Rights review overdue", counts?.rightsReview || 0, "red"],
    ["Metadata critical", counts?.pendingReview || 0, "orange"],
    ["Policy exceptions", counts?.blocked || 0, "green"],
    ["Unmapped fields", counts?.missingSource || 0, "indigo"]
  ] as const;
  const stats: InsightStat[] = insightKpis(counts).map((item) => ({
    label: item.label === "ResourceSpace Records" ? "Total Records" : item.label === "Blocked / Risk" ? "Rights Review" : item.label,
    value: item.value,
    detail: item.delta,
    meta: "ResourceSpace / portal period",
    tone: item.danger ? "red" : item.label.includes("Portal") ? "teal" : item.label.includes("Needs") ? "orange" : "blue",
    icon: item.icon
  }));
  return (
    <>
      <div className="ed-insight-stat-grid">{stats.map((stat) => <InsightStatCard key={stat.label} stat={stat} />)}</div>
      <div className="ed-insights-board is-admin">
        {filters.review ? <InsightPanel title="Review Workload" action="Open review queue"><MetricRows rows={reviewRows} /></InsightPanel> : null}
        {filters.review ? <InsightPanel title="Governance / Risk Summary" action="View details"><div className="ed-risk-list">{riskRows.map(([label, value, tone]) => <p key={label} className={`is-${tone}`}><span>{label}</span><strong>{value.toLocaleString()}</strong></p>)}</div><small>Based on current period export</small></InsightPanel> : null}
        {filters.usage ? <InsightPanel title="Top Searched Terms"><TopicsList usage={usage} savedViews={[]} />{!hasUsageRows ? <SampleLabel>Sample data until search logging is connected</SampleLabel> : null}</InsightPanel> : null}
        {filters.usage ? <InsightPanel title="Top Assets"><TopAssetsList assets={assets} usage={usage} />{!usage?.topAssets?.length ? <SampleLabel>Sample data until usage logging is connected</SampleLabel> : null}</InsightPanel> : null}
        {filters.source ? <InsightPanel title="Source Health / Integration Status"><SourceHealth total={rawTotal} usageTotal={usage?.totalEvents || 0} sourceLabelText={sourceText} /><p className="ed-footnote"><Info size={14} /> Operational diagnostics visible to reviewer/admin roles.</p></InsightPanel> : null}
        {filters.usage ? <InsightPanel title="Trends" className="is-wide" action="View trends"><TrendPanel usage={usage} /></InsightPanel> : null}
        {filters.source ? <InsightPanel title="Content Snapshot"><ContentSnapshot assets={assets} /><p className="ed-footnote"><Info size={14} /> Based on current result page.</p></InsightPanel> : null}
      </div>
      {!Object.values(filters).some(Boolean) ? <section className="ed-card ed-analytics-empty"><Filter size={22} /><strong>No insight sections selected</strong><p>Turn on at least one filter to show operational panels.</p></section> : null}
      {filters.health ? <section className="ed-card"><h3>Asset Health & Governance</h3><div className="ed-health-grid">{insightHealthRows(counts).map((row) => <article key={row.label}><strong>{row.value.toLocaleString()}</strong><span>{row.label}</span><meter className={`is-${row.tone}`} min={0} max={Math.max(rawTotal, row.value, 1)} value={row.value} /></article>)}</div></section> : null}
    </>
  );
}

function ViewerInsights({
  counts,
  usage,
  assets,
  savedViews,
  collections
}: {
  counts: SearchResult["counts"];
  usage?: SearchResult["usageAnalytics"];
  assets: StockMediaAsset[];
  savedViews: SearchResult["savedViews"];
  collections: SearchResult["collections"];
}) {
  const visible = counts?.visibleToRole || counts?.totalMatching || 0;
  const ready = counts?.portalReady || counts?.approved || 0;
  const needs = counts?.needsReview || 0;
  const stats: InsightStat[] = [
    { label: "Visible Media", value: visible.toLocaleString(), detail: "items you can view", meta: "visible library period", tone: "blue", icon: ImageIcon },
    { label: "Ready to Use", value: ready.toLocaleString(), detail: "approved and ready", meta: "visible library period", tone: "green", icon: CheckCircle2 },
    { label: "Needs Review", value: needs.toLocaleString(), detail: "may need attention", meta: "visible library period", tone: "orange", icon: Clock3 },
    { label: "Saved Views", value: savedViews.length.toLocaleString(), detail: "role-safe saved views", meta: "your library", tone: "purple", icon: Eye },
    { label: "Collections", value: collections.length.toLocaleString(), detail: "your collections", meta: "your library", tone: "blue", icon: FolderOpen },
    { label: "Recent Uploads", value: (counts?.approvedThisMonth || 0).toLocaleString(), detail: "last 30 days", meta: "visible library period", tone: "teal", icon: UploadCloud }
  ];
  const useCases = [
    ["Find images for website or announcements", "Browse photos, banners, and graphics", ImageIcon],
    ["Find sermon or slide backgrounds", "Widescreen and social sizes", FileText],
    ["Find social media content", "Square, story, and post-ready assets", Share2],
    ["Find newsletter assets", "Header images and content blocks", FileText],
    ["Find videos for events or ministries", "Events, testimonies, and ministry highlights", Search]
  ] as const;
  const reuseGuide = [
    ["Use approved assets", "All media in this library is reviewed for accuracy and brand alignment."],
    ["Follow brand guidelines", "Maintain consistency in logo use, colors, and typography."],
    ["Credit when required", "Some assets require attribution. Check asset details."],
    ["When in doubt, ask", "Contact your brand or communications team for help."]
  ];
  const tips = [
    ["Save a view", "Filter results and save for quick access anytime.", Star],
    ["Add to favorites", "Star assets you use often for fast retrieval.", Star],
    ["Collections", "Organize assets by project, event, or ministry.", FolderOpen],
    ["Share with your team", "Share collections or asset links with your team.", Share2]
  ] as const;
  return (
    <>
      <div className="ed-insight-stat-grid">{stats.map((stat) => <InsightStatCard key={stat.label} stat={stat} />)}</div>
      <div className="ed-viewer-board">
        <InsightPanel title="My Common Use Cases" action="View all use cases">{useCases.map(([title, detail, Icon]) => <a className="ed-use-case" href="/" key={title}><i><Icon size={16} /></i><strong>{title}<small>{detail}</small></strong><span>›</span></a>)}</InsightPanel>
        <InsightPanel title="Frequently Used Topics" action="Browse all topics"><TopicsList usage={usage} savedViews={savedViews} /></InsightPanel>
        <InsightPanel title="Recently Viewed Assets"><div className="ed-recent-assets">{assets.slice(0, 5).map((asset) => <article key={asset.id}><AssetThumb asset={asset} /><strong>{displayTitle(asset)}<small>{assetType(asset)} · {formatBytes(asset.fileSizeBytes)}</small></strong><span>Visible</span></article>)}</div></InsightPanel>
        <InsightPanel title="Top Categories" action="Explore all categories"><CategoryDonut assets={assets} visibleTotal={visible} /></InsightPanel>
        <InsightPanel title="Approved Media Reuse Guide" action="View brand guidelines">{reuseGuide.map(([title, detail]) => <p className="ed-guide-row" key={title}><CheckCircle2 size={16} /><strong>{title}<small>{detail}</small></strong></p>)}</InsightPanel>
        <InsightPanel title="Tips & Shortcuts" action="View help center">{tips.map(([title, detail, Icon]) => <p className="ed-tip-row" key={title}><i><Icon size={16} /></i><strong>{title}<small>{detail}</small></strong></p>)}</InsightPanel>
      </div>
    </>
  );
}

export function EnterpriseInsightsPage() {
  const { role } = useDemoRole();
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activePeriod, setActivePeriod] = useState<InsightPeriodId>("current-export");
  const [filters, setFilters] = useState<InsightFilterState>(defaultInsightFilters);
  const [exportStatus, setExportStatus] = useState("");
  const insights = useAssetsSearch({ role, limit: 5 });
  const counts = insights.data?.counts;
  const usage = insights.data?.usageAnalytics;
  const hasUsageRows = Boolean(usage?.topSearches.length || usage?.topAssets.length);
  const operationalView = role === "Reviewer" || role === "DAM Admin";
  const title = operationalView ? "Insights / Analytics" : "Insights / My Library";
  const subtitle = operationalView ? "Operational visibility across your digital asset lifecycle." : "Role-safe overview of your visible media, saved views, and collections.";
  const activePeriodLabel = insightPeriods.find((period) => period.id === activePeriod)?.label || "Current export";
  const exportInsights = () => {
    if (!insights.data) {
      setExportStatus("Insights are still loading. Export will be available after data loads.");
      return;
    }
    const payload = {
      exportedAt: new Date().toISOString(),
      role,
      period: activePeriodLabel,
      note: activePeriod === "current-export" ? "Counts are from current ResourceSpace export." : "Period applies to portal usage event panels where dated SQLite events exist.",
      source: operationalView ? insights.source : undefined,
      counts: insights.data.counts,
      usageAnalytics: operationalView ? insights.data.usageAnalytics : undefined,
      topAssets: insights.data.assets.slice(0, 10).map((asset) => ({
        id: asset.id,
        resourceSpaceId: asset.resourceSpaceId,
        title: displayTitle(asset),
        mediaType: asset.mediaType,
        status: asset.status,
        usageScope: asset.usageScope
      }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `tjc-dam-insights-${activePeriod}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
    setExportStatus(`Downloaded ${activePeriodLabel} Insights JSON. ResourceSpace remains unchanged.`);
  };
  return (
    <div className="enterprise-page enterprise-insights">
      <PageHeader title={title} subtitle={subtitle} actions={<><PeriodMenu activePeriod={activePeriod} onToggle={() => { setPeriodMenuOpen((open) => !open); setFiltersOpen(false); }} />{operationalView ? <><ActionButton icon={Filter} onClick={() => { setFiltersOpen((open) => !open); setPeriodMenuOpen(false); }}>{filtersOpen ? "Hide filters" : "Filters"}</ActionButton><ActionButton icon={Download} onClick={exportInsights} disabled={insights.loading}>Export</ActionButton></> : null}</>} />
      {periodMenuOpen ? <PeriodPickerPanel activePeriod={activePeriod} onSelect={(period) => { setActivePeriod(period); setPeriodMenuOpen(false); setExportStatus(`${insightPeriods.find((item) => item.id === period)?.label || "Current export"} selected. ResourceSpace counts remain latest export.`); }} /> : null}
      {filtersOpen && operationalView ? <InsightFilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters(defaultInsightFilters)} /> : null}
      {exportStatus ? <p className="ed-inline-success ed-insight-status">{exportStatus}</p> : null}
      <section className={operationalView ? "ed-approved-banner" : "ed-role-safe-banner"}>{operationalView ? <Database size={22} /> : <Info size={22} />}<div><strong>{operationalView ? sourceLabel(insights.source) : "Role-safe insights"}</strong><span>{operationalView ? (insights.source?.detail || "Media library source unavailable.") : "These insights reflect only the content you can view based on your role and permissions."}</span></div><span>{operationalView ? (hasUsageRows ? "Usage rows from portal analytics" : "Sample analytics where event rows are unavailable") : "Operational diagnostics are hidden for this role."}</span></section>
      {insights.loading ? <LoadingCard /> : insights.error ? <ErrorCard message={insights.error} source={insights.source} /> : <>
        {operationalView
          ? <AdminInsights counts={counts!} usage={usage} assets={insights.data?.assets || []} sourceText={sourceLabel(insights.source)} hasUsageRows={hasUsageRows} filters={filters} />
          : <ViewerInsights counts={counts!} usage={usage} assets={insights.data?.assets || []} savedViews={insights.data?.savedViews || []} collections={insights.data?.collections || []} />}
      </>}
    </div>
  );
}
