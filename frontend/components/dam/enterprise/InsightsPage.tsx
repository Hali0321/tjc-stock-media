"use client";

import { Calendar, Database, Download, Filter, Package, Search } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { useAssetsSearch } from "@/components/dam/useDamApi";
import { displayTitle, sourceLabel } from "@/lib/enterprise-display";
import { insightCharts, insightHealthRows, insightKpis, type InsightKpi } from "@/lib/insights-dashboard";
import { ActionButton, AssetThumb, ChartCard, ErrorCard, KpiCard, LoadingCard, PageHeader } from "./EnterpriseShared";

type MetricRow = {
  label: string;
  value: number;
  total?: number;
  tone?: "indigo" | "green" | "orange" | "red";
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

export function EnterpriseInsightsPage() {
  const { role } = useDemoRole();
  const insights = useAssetsSearch({ role, limit: 5 });
  const counts = insights.data?.counts;
  const usage = insights.data?.usageAnalytics;
  const hasUsageRows = Boolean(usage?.topSearches.length || usage?.topAssets.length);
  const operationalView = role === "Reviewer" || role === "DAM Admin";
  const roleKpis: InsightKpi[] = [
    { label: "Matching Media", value: (counts?.totalMatching || counts?.matching || 0).toLocaleString(), delta: "visible to role", icon: Search },
    { label: "Shown Now", value: (counts?.currentlyShown || counts?.rendered || 0).toLocaleString(), delta: "current page", icon: Database },
    { label: "Saved Views", value: (insights.data?.savedViews?.length || 0).toLocaleString(), delta: "role-safe", icon: Filter },
    { label: "Collections", value: (insights.data?.collections?.length || 0).toLocaleString(), delta: "package cabinet", icon: Package }
  ];
  const rawTotal = counts?.rawTotal || counts?.visibleToRole || counts?.totalMatching || 0;
  const reviewRows: MetricRow[] = [
    { label: "Needs Review", value: counts?.needsReview || 0, total: rawTotal, tone: "orange" },
    { label: "Rights Review", value: counts?.rightsReview || 0, total: rawTotal, tone: "red" },
    { label: "Missing Metadata", value: counts?.pendingReview || 0, total: rawTotal, tone: "indigo" },
    { label: "Children/Youth", value: counts?.childrenYouth || 0, total: rawTotal, tone: "orange" }
  ];
  const usageRows: MetricRow[] = [
    { label: "Search Events", value: usage?.topSearches.reduce((sum, row) => sum + row.value, 0) || 0, total: usage?.totalEvents || 0, tone: "green" },
    { label: "Asset Views", value: usage?.topAssets.reduce((sum, row) => sum + row.value, 0) || 0, total: usage?.totalEvents || 0, tone: "green" },
    { label: "Total Events", value: usage?.totalEvents || 0, total: usage?.totalEvents || 0, tone: "green" }
  ];
  return (
    <div className="enterprise-page enterprise-insights">
      <PageHeader title="Insights / Analytics" subtitle={operationalView ? "Track ResourceSpace records, review queues, and portal usage readiness." : "Role-safe portal activity for visible media, saved views, and collections."} actions={<><ActionButton icon={Calendar}>Current period</ActionButton>{operationalView ? <><ActionButton icon={Filter}>Filters</ActionButton><ActionButton icon={Download}>Export</ActionButton></> : null}</>} />
      <section className="ed-approved-banner"><Database size={22} /><div><strong>{sourceLabel(insights.source)}</strong><span>{insights.source?.detail || "Media library source unavailable."}</span></div><span>{operationalView ? (hasUsageRows ? "Usage rows from portal analytics" : "Sample analytics where event rows are unavailable") : "Operational diagnostics hidden for this role"}</span></section>
      {insights.loading ? <LoadingCard /> : insights.error ? <ErrorCard message={insights.error} source={insights.source} /> : <>
        <div className="ed-kpi-grid">{(operationalView ? insightKpis(counts) : roleKpis).map((item) => <KpiCard key={item.label} label={item.label} value={item.value} delta={item.delta} icon={item.icon} danger={item.danger} showTrend={false} />)}</div>
        {operationalView ? <div className="ed-insights-grid">{insightCharts.map((chart) => <ChartCard key={chart.id} title={chart.title} large={chart.large} sample={chart.sample && !(chart.id === "top-searches" && usage?.topSearches.length)}>{chart.id === "review-load" ? <MetricRows rows={reviewRows} /> : chart.id === "usage-trend" ? <MetricRows rows={usageRows} /> : chart.id === "top-assets" ? (usage?.topAssets.length ? usage.topAssets.map((asset, i) => <p className="ed-top-asset" key={asset.label}><span>{i + 1}</span><strong>{asset.label}</strong><small>{asset.value.toLocaleString()} views</small></p>) : (insights.data?.assets || []).map((asset, i) => <p className="ed-top-asset" key={asset.id}><span>{i + 1}</span><AssetThumb asset={asset} /><strong title={displayTitle(asset)}>{displayTitle(asset)}</strong><small>{asset.resourceSpaceId || asset.id}</small></p>)) : chart.id === "top-searches" && usage?.topSearches.length ? <div className="ed-table-mini">{usage.topSearches.map((row) => <p key={row.label}>{row.label}<span>{row.value.toLocaleString()}</span></p>)}</div> : chart.rows ? <div className="ed-table-mini">{chart.rows.map((row) => <p key={row}>{row}</p>)}</div> : null}</ChartCard>)}</div> : <section className="ed-card"><h3>Role-safe activity</h3><div className="ed-table-mini">{(insights.data?.savedViews || []).slice(0, 6).map((view) => <p key={view.id}><strong>{view.label}</strong><span>{view.count.toLocaleString()} visible</span></p>)}</div></section>}
        {operationalView ? <section className="ed-card"><h3>Asset Health & Governance</h3><div className="ed-health-grid">{insightHealthRows(counts).map((row) => <article key={row.label}><strong>{row.value.toLocaleString()}</strong><span>{row.label}</span><meter className={`is-${row.tone}`} min={0} max={Math.max(rawTotal, row.value, 1)} value={row.value} /></article>)}</div></section> : null}
      </>}
    </div>
  );
}
