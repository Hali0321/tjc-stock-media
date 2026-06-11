"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, Box, Check, CheckCircle2, ClipboardCheck, Database, Download, FileText, HardDrive, KeyRound, Lock, MessageSquareWarning, Plug, RefreshCw, Settings, Shield, ShieldCheck, Sparkles, Tags, Users, XCircle } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { useAdminReadiness } from "@/components/dam/useDamApi";
import { adminNavItems, adminNavLabel, integrationReadinessColumns, integrationState, policySummaryRows, systemHealthRows } from "@/lib/admin-control";
import { mediaSourceIsLive } from "@/lib/media-source/truth";
import { routeWithRole } from "@/lib/role-routes";
import type { BetaFeedbackRecord, BetaFeedbackSeverity, BetaFeedbackStatus, BetaReadinessFact, DamReadinessResult, IntegrationReadinessItem } from "@/lib/types";
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
  "feedback-inbox": MessageSquareWarning,
  "system-settings": Settings
} as const;

const feedbackStatuses: BetaFeedbackStatus[] = ["new", "triaged", "agent-ready", "fixed", "wont-fix"];
const feedbackSeverities: Array<BetaFeedbackSeverity | "all"> = ["all", "critical", "high", "medium", "low"];

function betaFactClass(fact: BetaReadinessFact) {
  if (fact.state === "pass") return "is-pass";
  if (fact.state === "block") return "is-block";
  return "is-warn";
}

function betaFactIcon(fact: BetaReadinessFact) {
  if (fact.state === "pass") return <CheckCircle2 size={16} aria-hidden="true" />;
  if (fact.state === "block") return <XCircle size={16} aria-hidden="true" />;
  return <AlertTriangle size={16} aria-hidden="true" />;
}

function betaFactSourceLabel(source: BetaReadinessFact["source"]) {
  return source.replace(/-/g, " ");
}

function betaCoverageGates(readiness?: DamReadinessResult | null) {
  const facts = readiness?.betaReadiness.facts || [];
  const fact = (id: string) => facts.find((item) => item.id === id);
  const fieldMappings = readiness?.fieldMappings || [];
  const requiredFields = fieldMappings.filter((item) => item.required);
  const requiredMapped = requiredFields.filter((item) => item.resourceSpaceField && item.coverage > 0);
  const requiredCoverage = requiredFields.length ? Math.round(requiredFields.reduce((sum, item) => sum + item.coverage, 0) / requiredFields.length) : 0;
  const browserQa = fact("browser-qa");
  const stopPolicy = fact("beta-stop-test-policy");
  const roleCopy = fact("beta-role-switch-copy");
  const auditReady = fact("audit-evidence");
  return [
    {
      id: "qa",
      label: "Browser QA coverage",
      value: browserQa?.ready ? "Pass" : "Missing",
      detail: browserQa?.detail || "No browser QA fact loaded.",
      state: browserQa?.state || "warn"
    },
    {
      id: "metadata",
      label: "Required field coverage",
      value: `${requiredCoverage}%`,
      detail: `${requiredMapped.length}/${requiredFields.length || 0} required ResourceSpace mappings have data.`,
      state: requiredCoverage >= 90 ? "pass" : requiredCoverage >= 70 ? "warn" : "block"
    },
    {
      id: "audit",
      label: "Actor audit proof",
      value: auditReady?.ready ? "Present" : "Needed",
      detail: auditReady?.detail || "No actor-backed audit fact loaded.",
      state: auditReady?.state || "warn"
    },
    {
      id: "policy",
      label: "Tester safety policy",
      value: stopPolicy?.ready && roleCopy?.ready ? "Clear" : "Review",
      detail: stopPolicy?.ready && roleCopy?.ready ? "Stop-test rules and simulated role copy are documented." : "Confirm stop-test policy and beta-only role copy before invite batch.",
      state: stopPolicy?.state === "pass" && roleCopy?.state === "pass" ? "pass" : "block"
    }
  ];
}

function betaNextActions(readiness?: DamReadinessResult | null) {
  const facts = readiness?.betaReadiness.facts || [];
  const blocked = facts.filter((item) => item.state === "block");
  const warnings = facts.filter((item) => item.state === "warn");
  const actions = [...blocked, ...warnings].slice(0, 5).map((item) => `${item.label}: ${item.detail}`);
  if (actions.length) return actions;
  return [
    "Run hosted smoke against invite URL before teammate batch.",
    "Export Feedback Inbox after first beta pass.",
    "Keep ResourceSpace writeback disabled unless owner approves."
  ];
}

function BetaCommandCenter({ readiness, compact = false }: { readiness?: DamReadinessResult | null; compact?: boolean }) {
  const beta = readiness?.betaReadiness;
  const facts = beta?.facts || [];
  const blocked = facts.filter((item) => item.state === "block");
  const warnings = facts.filter((item) => item.state === "warn");
  const passes = facts.filter((item) => item.state === "pass");
  const coverageGates = betaCoverageGates(readiness);
  const recommendation = beta?.ready
    ? "Go for small internal teammate test"
    : blocked.length
      ? "No-go until blockers clear"
      : "Dry-run only until proof is current";
  const statusClass = beta?.ready ? "is-pass" : blocked.length ? "is-block" : "is-warn";

  if (compact) {
    return (
      <section className="ed-card ed-beta-command-center is-compact">
        <header className="ed-card-head"><div><h3>Beta Go/No-Go</h3><p>{recommendation}</p></div><span className={`ed-beta-verdict ${statusClass}`}>{beta?.ready ? "Go" : "Hold"}</span></header>
        <div className="ed-beta-mini-grid">
          <span><strong>{passes.length}</strong><small>pass</small></span>
          <span><strong>{warnings.length}</strong><small>warn</small></span>
          <span><strong>{blocked.length}</strong><small>block</small></span>
        </div>
        {betaNextActions(readiness).slice(0, 3).map((action) => <p className="ed-beta-action" key={action}>{action}</p>)}
      </section>
    );
  }

  return (
    <section className="ed-card ed-admin-module ed-beta-command-center">
      <header className="ed-card-head">
        <div>
          <h3>Beta Command Center</h3>
          <p>Go/no-go evidence for teammate testing. Blocks are invite stoppers; warnings are rehearsal follow-ups.</p>
        </div>
        <span className={`ed-beta-verdict ${statusClass}`}>{recommendation}</span>
      </header>
      <div className="ed-admin-stat-grid">
        <article><strong>{beta?.score || 0}%</strong><span>beta proof score</span><small>{beta?.generatedAt ? `generated ${new Date(beta.generatedAt).toLocaleString()}` : "not generated"}</small></article>
        <article><strong>{blocked.length}</strong><span>invite blockers</span><small>{warnings.length} warnings</small></article>
        <article><strong>{passes.length}/{facts.length || 0}</strong><span>facts passing</span><small>from script, QA, env, catalog</small></article>
      </div>
      <div className="ed-beta-coverage-grid" aria-label="Beta coverage gates">
        {coverageGates.map((gate) => <article className={`ed-beta-gate is-${gate.state}`} key={gate.id}><strong>{gate.value}</strong><span>{gate.label}</span><p>{gate.detail}</p></article>)}
      </div>
      <div className="ed-beta-fact-grid">
        {facts.map((fact) => (
          <article className={`ed-beta-fact ${betaFactClass(fact)}`} key={fact.id}>
            <span>{betaFactIcon(fact)}{fact.state}</span>
            <strong>{fact.label}</strong>
            <p>{fact.detail}</p>
            <small>{betaFactSourceLabel(fact.source)}</small>
          </article>
        ))}
      </div>
      <section className="ed-beta-next-actions">
        <h4>Next actions</h4>
        {betaNextActions(readiness).map((action) => <p key={action}>{action}</p>)}
      </section>
    </section>
  );
}

function FeedbackInboxModule() {
  const [feedback, setFeedback] = useState<BetaFeedbackRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<BetaFeedbackStatus | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<BetaFeedbackSeverity | "all">("all");
  const [routeFilter, setRouteFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadFeedback() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/beta-feedback?role=DAM%20Admin", { headers: { Accept: "application/json" } });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setMessage(payload.error || "Feedback inbox failed to load.");
      return;
    }
    setFeedback(payload.feedback || []);
  }

  useEffect(() => {
    void loadFeedback();
  }, []);

  const routes = useMemo(() => ["all", ...Array.from(new Set(feedback.map((item) => item.route.split("?")[0]).filter(Boolean))).sort()], [feedback]);
  const roles = useMemo(() => ["all", ...Array.from(new Set(feedback.map((item) => item.role))).sort()], [feedback]);
  const filtered = useMemo(() => feedback.filter((item) => (
    (statusFilter === "all" || item.status === statusFilter)
    && (severityFilter === "all" || item.severity === severityFilter)
    && (routeFilter === "all" || item.route.startsWith(routeFilter))
    && (roleFilter === "all" || item.role === roleFilter)
  )), [feedback, roleFilter, routeFilter, severityFilter, statusFilter]);

  async function updateFeedback(id: string, patch: Partial<Pick<BetaFeedbackRecord, "status" | "severity" | "notes">>) {
    const response = await fetch(`/api/beta-feedback/${encodeURIComponent(id)}?role=DAM%20Admin`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(patch)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(payload.error || "Feedback update failed.");
      return;
    }
    setFeedback((current) => current.map((item) => (item.id === id ? payload.feedback : item)));
  }

  async function exportJson() {
    const params = new URLSearchParams({
      role: "DAM Admin",
      status: statusFilter,
      severity: severityFilter,
      feedbackRole: roleFilter,
      route: routeFilter
    });
    const response = await fetch(`/api/beta-feedback/export?${params.toString()}`, { headers: { Accept: "application/json" } });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) {
      setMessage(payload?.error || "Feedback export failed.");
      return;
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `tjc-beta-feedback-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(href);
  }

  return (
    <section className="ed-card ed-admin-module beta-feedback-inbox">
      <header className="ed-card-head">
        <div><h3>Feedback Inbox</h3><p>Teammate reports from internal beta task mode. Use agent-ready for implementation backlog.</p></div>
        <div className="beta-feedback-actions">
          <button className="ed-link-button" type="button" onClick={() => void loadFeedback()}><RefreshCw size={14} />Refresh</button>
          <button className="ed-link-button" type="button" onClick={() => void exportJson()}><Download size={14} />Export JSON</button>
        </div>
      </header>
      <div className="ed-admin-stat-grid">
        <article><strong>{feedback.length.toLocaleString()}</strong><span>reports</span><small>all beta feedback</small></article>
        <article><strong>{feedback.filter((item) => item.severity === "critical" || item.severity === "high").length.toLocaleString()}</strong><span>high priority</span><small>critical + high</small></article>
        <article><strong>{feedback.filter((item) => item.status === "agent-ready").length.toLocaleString()}</strong><span>agent-ready</span><small>ready for fix pass</small></article>
      </div>
      <div className="beta-feedback-filters">
        <label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as BetaFeedbackStatus | "all")}>{["all", ...feedbackStatuses].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Severity<select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value as BetaFeedbackSeverity | "all")}>{feedbackSeverities.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Route<select value={routeFilter} onChange={(event) => setRouteFilter(event.target.value)}>{routes.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Role<select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>{roles.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      {loading ? <LoadingCard label="Loading beta feedback..." /> : message ? <ErrorCard message={message} /> : (
        <div className="beta-feedback-list">
          {filtered.length ? filtered.map((item) => (
            <article className="beta-feedback-item" key={item.id}>
              <header>
                <div><strong>{item.task}</strong><small>{item.role} · {item.route} · {new Date(item.createdAt).toLocaleString()}</small></div>
                <span className={`beta-severity is-${item.severity}`}>{item.severity}</span>
              </header>
              <dl>
                <div><dt>Expected</dt><dd>{item.expected}</dd></div>
                <div><dt>Actual</dt><dd>{item.actual}</dd></div>
                <div><dt>Context</dt><dd>{[item.browser, item.device, item.viewport].filter(Boolean).join(" · ") || "No device context"}</dd></div>
              </dl>
              {item.attachmentUrl ? <a className="beta-feedback-attachment" href={item.attachmentUrl} target="_blank" rel="noreferrer">Open attachment</a> : null}
              <footer>
                <label>Status<select value={item.status} onChange={(event) => void updateFeedback(item.id, { status: event.target.value as BetaFeedbackStatus })}>{feedbackStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
                <label>Severity<select value={item.severity} onChange={(event) => void updateFeedback(item.id, { severity: event.target.value as BetaFeedbackSeverity })}>{feedbackSeverities.filter((value) => value !== "all").map((severity) => <option key={severity}>{severity}</option>)}</select></label>
                <label>Admin notes<textarea value={item.notes || ""} onChange={(event) => setFeedback((current) => current.map((row) => row.id === item.id ? { ...row, notes: event.target.value } : row))} onBlur={(event) => void updateFeedback(item.id, { notes: event.target.value })} placeholder="Triage note for next agent..." /></label>
              </footer>
            </article>
          )) : <section className="ed-empty-state"><MessageSquareWarning size={24} /><h2>No feedback in this filter</h2><p>Share role invite links with teammates, then reports appear here.</p></section>}
        </div>
      )}
    </section>
  );
}

function IntegrationTable({ rows = [] }: { rows?: IntegrationReadinessItem[] }) {
  return (
    <table className="ed-table">
      <thead><tr>{integrationReadinessColumns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
      <tbody>{rows.map((row) => <tr key={row.id}><td>{row.label}</td><td>{row.owner}</td><td><StatusBadge status={integrationState(row)} /></td><td>{row.detail}</td></tr>)}</tbody>
    </table>
  );
}

function AuditTable({ readiness, onViewAll }: { readiness?: DamReadinessResult | null; onViewAll?: () => void }) {
  const actorRows = (readiness?.auditLog.recent || []).filter((row) => row.actor).slice(0, 8);
  return (
    <section className="ed-card">
      <header className="ed-card-head"><h3>Recent Audit Activity</h3>{onViewAll ? <button className="ed-link-button" type="button" onClick={onViewAll}>View all logs</button> : null}</header>
      {actorRows.length ? <div className="ed-beta-audit-proof" aria-label="Actor-backed audit proof">{actorRows.map((row) => <p key={`proof-${row.id}`}><strong>{row.actor}</strong><span>{row.role} · {row.type} · {row.status}</span></p>)}</div> : null}
      <table className="ed-table">
        <thead><tr><th>Time</th><th>Actor</th><th>Role</th><th>Action</th><th>Object</th><th>Summary</th></tr></thead>
        <tbody>{(readiness?.auditLog.recent || []).slice(0, 10).map((row) => <tr key={row.id}><td>{row.createdAt}</td><td>{row.actor || "Unknown"}</td><td>{row.role}</td><td>{row.type}</td><td>{row.assetId || row.resourceSpaceId || "Portal"}</td><td>{row.summary}</td></tr>)}</tbody>
      </table>
    </section>
  );
}

function OverviewModule({ readiness, onSelectModule }: { readiness?: DamReadinessResult | null; onSelectModule: (id: string) => void }) {
  return (
    <>
      <BetaCommandCenter readiness={readiness} />
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
  if (activeNav === "feedback-inbox") return <FeedbackInboxModule />;
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
  if (role !== "DAM Admin") return <div className="enterprise-page"><section className="ed-card ed-access-block"><Lock size={28} /><h1>Governance requires DAM Admin role</h1><p>System governance, policies, user access, integrations, and audit controls are restricted to DAM Admins.</p><Link href={routeWithRole("/", role)}>Return to Asset Library</Link></section></div>;
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
        <aside className="ed-admin-rail"><BetaCommandCenter readiness={readiness} compact /><section className="ed-card"><h3>Policy Summary</h3><p>{readiness?.source.detail || "Readiness not loaded."}</p><div className="ed-big-check"><Check size={30} /></div>{policySummaryRows(readiness).map((row) => <p className="ed-row-between" key={row.label}><span>{row.label}</span><strong>{row.value.toLocaleString()}</strong></p>)}<ActionButton onClick={() => setActiveNav("rights-policies")}>Manage policies</ActionButton></section><section className="ed-card"><header className="ed-card-head"><h3>Recent Activity</h3><button className="ed-link-button" type="button" onClick={() => setActiveNav("audit-logs")}>View all</button></header>{(readiness?.auditLog.recent || []).slice(0, 5).map((item) => <p className="ed-activity" key={item.id}><Bell size={16} />{item.summary}<small>{item.actor ? `${item.actor} · ` : ""}{item.role} · {item.createdAt}</small></p>)}</section><section className="ed-card"><h3>System Health</h3>{systemHealthRows(readiness).map((item) => <p className="ed-row-between" key={item.id}><span>{item.label}</span><StatusBadge status={item.state} /></p>)}<button className="ed-link-button" type="button" onClick={() => setActiveNav("system-settings")}>View system status</button></section></aside>
      </div>
    </div>
  );
}
