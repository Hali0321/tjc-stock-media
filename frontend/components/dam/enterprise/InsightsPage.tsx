"use client";

import { Calendar, Database, Download, Filter } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { useAssetsSearch } from "@/components/dam/useDamApi";
import { displayTitle, sourceLabel } from "@/lib/enterprise-display";
import { insightCharts, insightHealthRows, insightKpis } from "@/lib/insights-dashboard";
import { ActionButton, AssetThumb, ChartCard, ErrorCard, KpiCard, LoadingCard, MiniLine, PageHeader } from "./EnterpriseShared";

export function EnterpriseInsightsPage() {
  const { role } = useDemoRole();
  const insights = useAssetsSearch({ role: role === "Viewer" ? "DAM Admin" : role, limit: 5 });
  const counts = insights.data?.counts;
  const usage = insights.data?.usageAnalytics;
  return (
    <div className="enterprise-page enterprise-insights">
      <PageHeader title="Insights / Analytics" subtitle="Track ResourceSpace records, review queues, and portal usage readiness." actions={<><ActionButton icon={Calendar}>Current export</ActionButton><ActionButton icon={Filter}>Filters</ActionButton><ActionButton icon={Download}>Export</ActionButton></>} />
      <section className="ed-approved-banner"><Database size={22} /><div><strong>{sourceLabel(insights.source)}</strong><span>{insights.source?.detail || "ResourceSpace not connected."}</span></div><span>Sample analytics until usage logging is connected</span></section>
      {insights.loading ? <LoadingCard /> : insights.error ? <ErrorCard message={insights.error} source={insights.source} /> : <>
        <div className="ed-kpi-grid">{insightKpis(counts).map((item) => <KpiCard key={item.label} label={item.label} value={item.value} delta={item.delta} icon={item.icon} danger={item.danger} />)}</div>
        <div className="ed-insights-grid">{insightCharts.map((chart) => <ChartCard key={chart.id} title={chart.title} large={chart.large} sample={chart.sample && !(chart.id === "top-searches" && usage?.topSearches.length)}>{chart.id === "top-assets" ? (usage?.topAssets.length ? usage.topAssets.map((asset, i) => <p className="ed-top-asset" key={asset.label}><span>{i + 1}</span><strong>{asset.label}</strong><small>{asset.value.toLocaleString()} views</small></p>) : (insights.data?.assets || []).map((asset, i) => <p className="ed-top-asset" key={asset.id}><span>{i + 1}</span><AssetThumb asset={asset} /><strong title={displayTitle(asset)}>{displayTitle(asset)}</strong><small>{asset.resourceSpaceId || asset.id}</small></p>)) : chart.id === "top-searches" && usage?.topSearches.length ? <div className="ed-table-mini">{usage.topSearches.map((row) => <p key={row.label}>{row.label}<span>{row.value.toLocaleString()}</span></p>)}</div> : chart.rows ? <div className="ed-table-mini">{chart.rows.map((row) => <p key={row}>{row}</p>)}</div> : <div className="ed-big-line"><MiniLine /><MiniLine tone={chart.tone || "indigo"} /></div>}</ChartCard>)}</div>
        <section className="ed-card"><h3>Asset Health & Governance</h3><div className="ed-health-grid">{insightHealthRows(counts).map((row) => <article key={row.label}><strong>{row.value.toLocaleString()}</strong><span>{row.label}</span><MiniLine tone={row.tone} /></article>)}</div></section>
      </>}
    </div>
  );
}
