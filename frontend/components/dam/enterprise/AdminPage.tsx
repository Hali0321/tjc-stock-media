"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Box, Check, Database, FileText, Lock, Settings, Shield, ShieldCheck } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { useAdminReadiness } from "@/components/dam/useDamApi";
import { adminNavItems, adminNavLabel, integrationReadinessColumns, integrationState, policySummaryRows, systemHealthRows } from "@/lib/admin-control";
import { mediaSourceIsLive } from "@/lib/media-source/truth";
import { ActionButton, CustodyMapPanel, ErrorCard, KpiCard, LoadingCard, PageHeader, SourcePill, StatusBadge } from "./EnterpriseShared";

export function EnterpriseAdminPage() {
  const { role, ready } = useDemoRole();
  const [activeNav, setActiveNav] = useState(adminNavItems[0].id);
  const admin = useAdminReadiness(role);
  if (!ready) return <div className="enterprise-page"><LoadingCard label="Loading control center..." /></div>;
  if (role !== "DAM Admin") return <div className="enterprise-page"><section className="ed-card ed-access-block"><Lock size={28} /><h1>Governance requires DAM Admin role</h1><p>System governance, policies, user access, integrations, and audit controls are restricted to DAM Admins.</p><Link href="/">Return to Asset Library</Link></section></div>;
  const readiness = admin.data;
  return (
    <div className="enterprise-page enterprise-admin-control">
      <div className="ed-admin-grid">
        <aside className="ed-panel ed-admin-nav"><strong>Administration</strong>{adminNavItems.map((item) => <button className={activeNav === item.id ? "is-active" : ""} type="button" key={item.id} onClick={() => setActiveNav(item.id)}><Settings size={15} />{item.label}</button>)}</aside>
        <main>
          <PageHeader title="DAM Control Center" subtitle={`Manage system governance, policies, user access, and integrations. Current module: ${adminNavLabel(activeNav)}.`} />
          {admin.loading ? <LoadingCard /> : admin.error ? <ErrorCard message={admin.error} source={admin.source} /> : <>
            <CustodyMapPanel readiness={readiness} />
            <div className="ed-kpi-grid is-four"><KpiCard label="Records" value={(readiness?.assetCount || 0).toLocaleString()} delta="ResourceSpace-backed" icon={Database} /><KpiCard label="Readiness" value={`${readiness?.score || 0}/100`} delta="policy score" icon={Shield} /><KpiCard label="Needs Review" value={(readiness?.metrics.needsReview || 0).toLocaleString()} delta="queue count" icon={FileText} /><KpiCard label="Audit Events" value={(readiness?.auditLog.count || 0).toLocaleString()} delta="portal log" icon={Box} /></div>
            <section className="ed-card"><header className="ed-card-head"><div><h3>Integration Status</h3><p>ResourceSpace, Drive, S3, and portal readiness.</p></div><SourcePill source={readiness?.source} live={mediaSourceIsLive(readiness?.source)} /></header><table className="ed-table"><thead><tr>{integrationReadinessColumns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{(readiness?.integrationReadiness || []).map((row) => <tr key={row.id}><td>{row.label}</td><td>{row.owner}</td><td><StatusBadge status={integrationState(row)} /></td><td>{row.detail}</td></tr>)}</tbody></table></section>
            <div className="ed-module-grid">{(readiness?.actionBacklog || []).slice(0, 6).map((item) => <section className="ed-card ed-module-card" key={item.id}><ShieldCheck size={22} /><h3>{item.label}</h3><p>{item.action}</p><small>{item.count.toLocaleString()} · {item.owner}</small><a>›</a></section>)}</div>
            <section className="ed-card"><header className="ed-card-head"><h3>Recent Audit Activity</h3><ActionButton>View all logs</ActionButton></header><table className="ed-table"><thead><tr><th>Time</th><th>Role</th><th>Action</th><th>Object</th><th>Summary</th></tr></thead><tbody>{(readiness?.auditLog.recent || []).slice(0, 6).map((row) => <tr key={row.id}><td>{row.createdAt}</td><td>{row.role}</td><td>{row.type}</td><td>{row.assetId || row.resourceSpaceId || "Portal"}</td><td>{row.summary}</td></tr>)}</tbody></table></section>
          </>}
        </main>
        <aside className="ed-admin-rail"><section className="ed-card"><h3>Policy Summary</h3><p>{readiness?.source.detail || "Readiness not loaded."}</p><div className="ed-big-check"><Check size={30} /></div>{policySummaryRows(readiness).map((row) => <p className="ed-row-between" key={row.label}><span>{row.label}</span><strong>{row.value.toLocaleString()}</strong></p>)}<ActionButton>Manage policies</ActionButton></section><section className="ed-card"><header className="ed-card-head"><h3>Recent Activity</h3><a>View all</a></header>{(readiness?.auditLog.recent || []).slice(0, 5).map((item) => <p className="ed-activity" key={item.id}><Bell size={16} />{item.summary}<small>{item.role} · {item.createdAt}</small></p>)}</section><section className="ed-card"><h3>System Health</h3>{systemHealthRows(readiness).map((item) => <p className="ed-row-between" key={item.id}><span>{item.label}</span><StatusBadge status={item.state} /></p>)}<a>View system status</a></section></aside>
      </div>
    </div>
  );
}
