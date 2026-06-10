"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Box, Check, ClipboardCheck, Database, FileText, HardDrive, KeyRound, Lock, Plug, Settings, Shield, ShieldCheck, Sparkles, Tags, Users } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { useAdminReadiness } from "@/components/dam/useDamApi";
import { adminNavItems, adminNavLabel, integrationReadinessColumns, integrationState, policySummaryRows, systemHealthRows } from "@/lib/admin-control";
import { mediaSourceIsLive } from "@/lib/media-source/truth";
import type { DamReadinessResult, IntegrationReadinessItem } from "@/lib/types";
import { ActionButton, CustodyMapPanel, ErrorCard, KpiCard, LoadingCard, PageHeader, SourcePill, StatusBadge } from "./EnterpriseShared";

const roleRows = [
  ["Viewer", "Find approved media", "Approved copy only", "No", "No", "No"],
  ["Contributor", "Find and submit media", "Approved copy only", "Yes", "No", "No"],
  ["Reviewer", "Review evidence and decisions", "Role-gated previews", "Yes", "Yes", "No"],
  ["DAM Admin", "Governance and integrations", "Role-gated previews", "Yes", "Yes", "Yes"]
];

const teamRows = [
  ["DAM Admin", "System owner", "Integrations, SSO readiness, audit evidence"],
  ["Reviewers", "Review owner", "Evidence checklist, rights decisions, pending writes"],
  ["Contributors", "Intake owner", "Upload packets and reviewer handoff"],
  ["Portal", "Access layer", "Search, download gates, analytics events"]
];

const moduleIcons = {
  overview: Shield,
  "users-roles": Users,
  "roles-permissions": KeyRound,
  teams: Users,
  taxonomy: Tags,
  "metadata-schemas": Database,
  "rights-policies": ShieldCheck,
  "review-workflows": ClipboardCheck,
  "storage-retention": HardDrive,
  "ai-moderation": Sparkles,
  integrations: Plug,
  "audit-logs": Bell,
  "system-settings": Settings
} as const;

function IntegrationTable({ rows = [] }: { rows?: IntegrationReadinessItem[] }) {
  return (
    <table className="ed-table">
      <thead><tr>{integrationReadinessColumns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
      <tbody>{rows.map((row) => <tr key={row.id}><td>{row.label}</td><td>{row.owner}</td><td><StatusBadge status={integrationState(row)} /></td><td>{row.detail}</td></tr>)}</tbody>
    </table>
  );
}

function AuditTable({ readiness, onViewAll }: { readiness?: DamReadinessResult | null; onViewAll?: () => void }) {
  return (
    <section className="ed-card">
      <header className="ed-card-head"><h3>Recent Audit Activity</h3>{onViewAll ? <button className="ed-link-button" type="button" onClick={onViewAll}>View all logs</button> : null}</header>
      <table className="ed-table">
        <thead><tr><th>Time</th><th>Role</th><th>Action</th><th>Object</th><th>Summary</th></tr></thead>
        <tbody>{(readiness?.auditLog.recent || []).slice(0, 10).map((row) => <tr key={row.id}><td>{row.createdAt}</td><td>{row.role}</td><td>{row.type}</td><td>{row.assetId || row.resourceSpaceId || "Portal"}</td><td>{row.summary}</td></tr>)}</tbody>
      </table>
    </section>
  );
}

function OverviewModule({ readiness, onSelectModule }: { readiness?: DamReadinessResult | null; onSelectModule: (id: string) => void }) {
  return (
    <>
      <CustodyMapPanel readiness={readiness} />
      <div className="ed-kpi-grid is-four"><KpiCard label="Records" value={(readiness?.assetCount || 0).toLocaleString()} delta="ResourceSpace-backed" icon={Database} /><KpiCard label="Readiness" value={`${readiness?.score || 0}/100`} delta="policy score" icon={Shield} /><KpiCard label="Needs Review" value={(readiness?.metrics.needsReview || 0).toLocaleString()} delta="queue count" icon={FileText} /><KpiCard label="Audit Events" value={(readiness?.auditLog.count || 0).toLocaleString()} delta="portal log" icon={Box} /></div>
      <section className="ed-card"><header className="ed-card-head"><div><h3>Integration Status</h3><p>ResourceSpace, Drive, S3, and portal readiness.</p></div><SourcePill source={readiness?.source} live={mediaSourceIsLive(readiness?.source)} /></header><IntegrationTable rows={readiness?.integrationReadiness || []} /></section>
      <div className="ed-module-grid">{(readiness?.actionBacklog || []).slice(0, 6).map((item) => <section className="ed-card ed-module-card" key={item.id}><ShieldCheck size={22} /><h3>{item.label}</h3><p>{item.action}</p><small>{item.count.toLocaleString()} · {item.owner}</small></section>)}</div>
      <AuditTable readiness={readiness} onViewAll={() => onSelectModule("audit-logs")} />
    </>
  );
}

function AdminModuleContent({ activeNav, readiness, onSelectModule }: { activeNav: string; readiness?: DamReadinessResult | null; onSelectModule: (id: string) => void }) {
  const metrics = readiness?.metrics;
  const integrations = readiness?.integrationReadiness || [];
  if (activeNav === "overview") return <OverviewModule readiness={readiness} onSelectModule={onSelectModule} />;
  if (activeNav === "users-roles") return (
    <section className="ed-card ed-admin-module">
      <header className="ed-card-head"><div><h3>Users & Access</h3><p>Identity is SSO-ready, but live IdP headers are not verified in this beta.</p></div><StatusBadge status="Pending setup" /></header>
      <div className="ed-admin-stat-grid">
        <article><strong>4</strong><span>role tiers</span><small>Viewer, Contributor, Reviewer, DAM Admin</small></article>
        <article><strong>Local</strong><span>beta fallback</span><small>Role switch remains for pilot QA only</small></article>
        <article><strong>SSO-ready</strong><span>not live</span><small>Needs trusted provider headers</small></article>
      </div>
      <table className="ed-table"><thead><tr><th>Role</th><th>Primary job</th><th>Download</th><th>Upload</th><th>Review</th><th>Admin</th></tr></thead><tbody>{roleRows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table>
    </section>
  );
  if (activeNav === "roles-permissions") return (
    <section className="ed-card ed-admin-module">
      <header className="ed-card-head"><div><h3>Permission Matrix</h3><p>Frontend labels mirror backend gates; sensitive actions stay server-enforced.</p></div><StatusBadge status="Operational" /></header>
      <table className="ed-table"><thead><tr><th>Role</th><th>Find</th><th>Download</th><th>Upload</th><th>Review write</th><th>Governance</th></tr></thead><tbody>{roleRows.map((row) => <tr key={row[0]}><td>{row[0]}</td><td>Allowed visible assets</td><td>{row[2]}</td><td>{row[3]}</td><td>{row[4]}</td><td>{row[5]}</td></tr>)}</tbody></table>
    </section>
  );
  if (activeNav === "teams") return (
    <section className="ed-card ed-admin-module">
      <header className="ed-card-head"><div><h3>Teams & Owners</h3><p>Ownership is shown as pilot operating model, not a live directory.</p></div><StatusBadge status="Read-only" /></header>
      <div className="ed-admin-owner-grid">{teamRows.map(([team, owner, detail]) => <article key={team}><Users size={20} /><strong>{team}</strong><span>{owner}</span><p>{detail}</p></article>)}</div>
    </section>
  );
  if (activeNav === "taxonomy") return (
    <section className="ed-card ed-admin-module">
      <header className="ed-card-head"><div><h3>Taxonomy</h3><p>Vocabulary drift and search terms from current ResourceSpace-backed catalog.</p></div><StatusBadge status={metrics?.taxonomyDrift ? "Degraded" : "Operational"} /></header>
      <table className="ed-table"><thead><tr><th>Term</th><th>Count</th><th>Kind</th></tr></thead><tbody>{(readiness?.vocabulary || []).slice(0, 14).map((row) => <tr key={`${row.kind}-${row.term}`}><td>{row.term}</td><td>{row.count.toLocaleString()}</td><td>{row.kind}</td></tr>)}</tbody></table>
    </section>
  );
  if (activeNav === "metadata-schemas") return (
    <section className="ed-card ed-admin-module">
      <header className="ed-card-head"><div><h3>Metadata Fields</h3><p>Field mapping truth. Live writeback remains blocked until ResourceSpace refs are configured.</p></div><StatusBadge status="Read-only" /></header>
      <table className="ed-table"><thead><tr><th>Field</th><th>ResourceSpace field</th><th>Coverage</th><th>Missing</th></tr></thead><tbody>{(readiness?.fieldMappings || []).map((row) => <tr key={row.key}><td>{row.label}</td><td>{row.resourceSpaceField}</td><td><StatusBadge status={row.coverage >= 90 ? "Operational" : row.required ? "Degraded" : "Read-only"} /> {row.coverage}%</td><td>{row.missing.toLocaleString()}</td></tr>)}</tbody></table>
    </section>
  );
  if (activeNav === "rights-policies") return (
    <section className="ed-card ed-admin-module">
      <header className="ed-card-head"><div><h3>Rights Policies</h3><p>Policy blockers from portal reuse and ResourceSpace metadata.</p></div><StatusBadge status={metrics?.rightsReview ? "Degraded" : "Operational"} /></header>
      <div className="ed-admin-stat-grid">{policySummaryRows(readiness).map((row) => <article key={row.label}><strong>{row.value.toLocaleString()}</strong><span>{row.label}</span><small>current catalog</small></article>)}</div>
      <table className="ed-table"><thead><tr><th>Policy</th><th>Blocked</th><th>Detail</th></tr></thead><tbody>{(readiness?.portalPolicy || []).map((row) => <tr key={row.id}><td>{row.label}</td><td>{row.blocked.toLocaleString()}</td><td>{row.detail}</td></tr>)}</tbody></table>
    </section>
  );
  if (activeNav === "review-workflows") return (
    <section className="ed-card ed-admin-module">
      <header className="ed-card-head"><div><h3>Review Sync</h3><p>Pending review writes queue locally unless live ResourceSpace writeback is fully configured.</p></div><StatusBadge status={integrations.find((row) => row.id === "review-writes") ? integrationState(integrations.find((row) => row.id === "review-writes")!) : "Not configured"} /></header>
      <div className="ed-admin-stat-grid"><article><strong>{(metrics?.needsReview || 0).toLocaleString()}</strong><span>needs review</span><small>queue count</small></article><article><strong>{readiness?.auditLog.queued || 0}</strong><span>queued audit events</span><small>portal log</small></article><article><strong>{readiness?.auditLog.denied || 0}</strong><span>denied actions</span><small>role safety</small></article></div>
      <div className="ed-module-grid">{(readiness?.actionBacklog || []).map((item) => <section className="ed-card ed-module-card" key={item.id}><ClipboardCheck size={22} /><h3>{item.label}</h3><p>{item.action}</p><small>{item.count.toLocaleString()} · {item.owner}</small></section>)}</div>
    </section>
  );
  if (activeNav === "storage-retention") return (
    <section className="ed-card ed-admin-module">
      <header className="ed-card-head"><div><h3>Storage</h3><p>Storage shows used amount only. No quota is claimed by this pilot UI.</p></div><StatusBadge status="Read-only" /></header>
      <div className="ed-admin-stat-grid"><article><strong>2.45 TB</strong><span>used</span><small>display-only pilot metric</small></article><article><strong>{(metrics?.renditionGaps || 0).toLocaleString()}</strong><span>rendition gaps</span><small>approved copy readiness</small></article><article><strong>{(metrics?.missingSource || 0).toLocaleString()}</strong><span>missing source</span><small>custody evidence</small></article></div>
      <IntegrationTable rows={integrations.filter((row) => ["master-originals", "approved-copy-delivery", "metadata-source"].includes(row.id))} />
    </section>
  );
  if (activeNav === "ai-moderation") return (
    <section className="ed-card ed-admin-module">
      <header className="ed-card-head"><div><h3>AI Assist</h3><p>AI suggestions are assistive only. Human review and ResourceSpace fields remain truth.</p></div><StatusBadge status="Pending setup" /></header>
      <div className="ed-admin-stat-grid"><article><strong>{(metrics?.aiEnrichment || 0).toLocaleString()}</strong><span>AI enrichment</span><small>candidate queue</small></article><article><strong>{(metrics?.taxonomyDrift || 0).toLocaleString()}</strong><span>taxonomy drift</span><small>human cleanup</small></article><article><strong>{(metrics?.duplicateCandidates || 0).toLocaleString()}</strong><span>duplicates</span><small>review before merge</small></article></div>
    </section>
  );
  if (activeNav === "integrations") return (
    <section className="ed-card ed-admin-module">
      <header className="ed-card-head"><div><h3>Integrations</h3><p>Live/read-only/setup states by backend system.</p></div><SourcePill source={readiness?.source} live={mediaSourceIsLive(readiness?.source)} /></header>
      <IntegrationTable rows={integrations} />
    </section>
  );
  if (activeNav === "audit-logs") return <AuditTable readiness={readiness} />;
  return (
    <section className="ed-card ed-admin-module">
      <header className="ed-card-head"><div><h3>System Status</h3><p>Configuration status for ResourceSpace, writeback, preview proxy, and audit evidence.</p></div><StatusBadge status={readiness?.source.readOnly ? "Read-only" : "Operational"} /></header>
      <IntegrationTable rows={integrations} />
      <div className="ed-admin-stat-grid"><article><strong>{readiness?.score || 0}/100</strong><span>readiness</span><small>policy score</small></article><article><strong>{readiness?.auditLog.count || 0}</strong><span>audit events</span><small>portal log</small></article><article><strong>{readiness?.source.label || "Unknown"}</strong><span>source mode</span><small>{readiness?.source.detail || "not loaded"}</small></article></div>
    </section>
  );
}

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
        <aside className="ed-panel ed-admin-nav"><strong>Administration</strong>{adminNavItems.map((item) => {
          const Icon = moduleIcons[item.id as keyof typeof moduleIcons] || Settings;
          return <button className={activeNav === item.id ? "is-active" : ""} type="button" key={item.id} onClick={() => setActiveNav(item.id)}><Icon size={15} />{item.label}</button>;
        })}</aside>
        <section aria-label={`${adminNavLabel(activeNav)} administration module`}>
          <PageHeader title={adminNavLabel(activeNav)} subtitle="DAM Control Center: manage system governance, policies, user access, and integrations." />
          {admin.loading ? <LoadingCard /> : admin.error ? <ErrorCard message={admin.error} source={admin.source} /> : <>
            <AdminModuleContent activeNav={activeNav} readiness={readiness} onSelectModule={setActiveNav} />
          </>}
        </section>
        <aside className="ed-admin-rail"><section className="ed-card"><h3>Policy Summary</h3><p>{readiness?.source.detail || "Readiness not loaded."}</p><div className="ed-big-check"><Check size={30} /></div>{policySummaryRows(readiness).map((row) => <p className="ed-row-between" key={row.label}><span>{row.label}</span><strong>{row.value.toLocaleString()}</strong></p>)}<ActionButton onClick={() => setActiveNav("rights-policies")}>Manage policies</ActionButton></section><section className="ed-card"><header className="ed-card-head"><h3>Recent Activity</h3><button className="ed-link-button" type="button" onClick={() => setActiveNav("audit-logs")}>View all</button></header>{(readiness?.auditLog.recent || []).slice(0, 5).map((item) => <p className="ed-activity" key={item.id}><Bell size={16} />{item.summary}<small>{item.role} · {item.createdAt}</small></p>)}</section><section className="ed-card"><h3>System Health</h3>{systemHealthRows(readiness).map((item) => <p className="ed-row-between" key={item.id}><span>{item.label}</span><StatusBadge status={item.state} /></p>)}<button className="ed-link-button" type="button" onClick={() => setActiveNav("system-settings")}>View system status</button></section></aside>
      </div>
    </div>
  );
}
