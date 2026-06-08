"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Database, Download, Gauge, Layers, ListChecks, Lock, ScrollText, Search, Share2, Tags } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { DamTabs, damTabId, damTabPanelId } from "@/components/DamTabs";
import { useDemoRole } from "@/components/RoleProvider";
import type { AdminActionItem, DamReadinessItem, DamReadinessResult, IntegrationReadinessItem, VocabularyInsight } from "@/lib/types";
import { cn } from "@/lib/ui";

function toneClass(tone: "ok" | "warn" | "info") {
  if (tone === "ok") return "border-[#b8d9c6] bg-[#edf8f1] text-[#22563a]";
  if (tone === "warn") return "border-[#e5b7b5] bg-[#fff0ef] text-[#7d2d2a]";
  return "border-[#c8d7e6] bg-[#f2f7fb] text-[#27435b]";
}

function scoreTone(score: number) {
  if (score >= 80) return "ok";
  if (score >= 55) return "info";
  return "warn";
}

function severityClass(severity: "critical" | "high" | "medium" | "low") {
  if (severity === "critical") return "border-[#e5b7b5] bg-[#fff0ef] text-[#7d2d2a]";
  if (severity === "high") return "border-[#ead6a8] bg-[#fff7e5] text-[#725216]";
  if (severity === "medium") return "border-[#c8d7e6] bg-[#f2f7fb] text-[#27435b]";
  return "border-[#b8d9c6] bg-[#edf8f1] text-[#22563a]";
}

function pillarIcon(pillar: DamReadinessItem["pillar"]) {
  if (pillar === "Find") return Search;
  if (pillar === "Trust") return Lock;
  if (pillar === "Review") return ListChecks;
  if (pillar === "Share") return Share2;
  return Layers;
}

function MetricTile({ label, value }: { label: string; value?: number }) {
  return (
    <div className="min-w-0 border-r border-[#d6dfd8] px-3 py-2 last:border-r-0">
      <strong className="block text-lg font-black tabular-nums text-tjc-ink">{(value ?? 0).toLocaleString()}</strong>
      <span className="mt-0.5 block truncate text-xs font-semibold leading-tight text-tjc-muted">{label}</span>
    </div>
  );
}

function zeroCountLabel(item: AdminActionItem) {
  return item.owner === "DAM Admin" ? "View policy" : "No open items";
}

const adminNav = [
  { label: "Overview", href: "#overview", icon: Gauge },
  { label: "Launch gate", href: "#launch-gate", icon: Lock },
  { label: "Pillars", href: "#pillars", icon: Layers },
  { label: "Action backlog", href: "#backlog", icon: ListChecks },
  { label: "Mappings", href: "#mappings", icon: Database },
  { label: "Vocabulary", href: "#vocabulary", icon: Tags },
  { label: "Portal gate", href: "#portal-gate", icon: Share2 },
  { label: "Audit log", href: "#audit-log", icon: ScrollText }
];

const adminTabs = ["Overview", "Mapping", "Action backlog", "Audit", "Launch Gate"] as const;
type AdminTab = (typeof adminTabs)[number];

function AdminLoadingState() {
  return (
    <div className="mx-auto w-full max-w-[1760px] px-3 py-5 md:px-5">
      <section className="dam-card p-5">
        <span className="text-sm font-semibold text-tjc-evergreen">DAM Admin</span>
        <h1 className="mt-2 text-2xl font-semibold md:text-3xl">Loading production diagnostics</h1>
        <p className="mt-2 max-w-[72ch] text-sm leading-relaxed text-tjc-muted">
          Reading the ResourceSpace metadata export, field mapping coverage, pending write queue, and launch blockers.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, index) => (
            <div className="rounded-xl border border-tjc-line bg-[#fbfcfa] p-3" key={index}>
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton mt-3 h-8 w-16 rounded" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function AdminPage() {
  const { role, ready } = useDemoRole();
  const [data, setData] = useState<DamReadinessResult | null>(null);
  const [error, setError] = useState("");
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>("Action backlog");

  useEffect(() => {
    if (!ready || role !== "DAM Admin") return;
    let cancelled = false;
    setError("");
    fetch(`/api/admin/readiness?role=${encodeURIComponent(role)}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load DAM readiness");
        return body as DamReadinessResult;
      })
      .then((body) => {
        if (!cancelled) setData(body);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, role]);

  if (!ready) {
    return <AdminLoadingState />;
  }

  if (role !== "DAM Admin") {
    return (
      <div className="mx-auto max-w-5xl px-3 py-5 md:px-5">
        <section className="dam-card p-5">
          <span className="text-sm font-semibold text-tjc-evergreen">DAM Admin</span>
          <h1 className="mt-2 text-3xl font-semibold">Admin cockpit requires DAM Admin role</h1>
          <p className="mt-2 max-w-[64ch] text-base leading-relaxed text-tjc-muted">Field mapping, portal readiness, vocabulary control, stale approvals, and duplicate cleanup are admin-only.</p>
          <span className="mt-4 block rounded-md bg-[#eef7f1] px-3 py-2 text-sm font-semibold text-tjc-evergreen">Switch demo role to DAM Admin to inspect readiness.</span>
        </section>
      </div>
    );
  }

  if (error) {
    return <div className="mx-auto max-w-5xl px-3 py-5 text-[#7d2d2a] md:px-5">{error}</div>;
  }

  if (!data) {
    return <AdminLoadingState />;
  }

  const requiredFields = data.fieldMappings.filter((field) => field.required);
  const optionalFields = data.fieldMappings.filter((field) => !field.required);
  const readBridge = data.integrationReadiness.find((item) => item.id === "metadata-source");
  const writeMapping = data.integrationReadiness.find((item) => item.id === "review-writes");
  const pendingQueue = data.integrationReadiness.find((item) => item.id === "pending-review-writes");
  const requiredFieldRefsPresent = requiredFields.filter((field) => field.resourceSpaceField && field.coverage > 0).length;
  const topBlockers = [...data.actionBacklog]
    .sort((a, b) => {
      const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityRank[b.severity] - severityRank[a.severity] || b.count - a.count;
    })
    .slice(0, 3);
  const launchDecisions = [
    {
      question: "Can we read ResourceSpace?",
      answer: readBridge?.ready ? "yes" : "blocked",
      detail: readBridge?.detail || "Read bridge unavailable.",
      tone: readBridge?.ready ? "ok" : "warn"
    },
    {
      question: "Can we write ResourceSpace?",
      answer: writeMapping?.ready ? "yes" : "blocked",
      detail: writeMapping?.detail || "Write mapping unavailable.",
      tone: writeMapping?.ready ? "ok" : "warn"
    },
    {
      question: "Can users safely download?",
      answer: data.metrics.portalReady > 0 ? `${data.metrics.portalReady.toLocaleString()} portal ready` : "blocked",
      detail: `${data.metrics.needsReview.toLocaleString()} assets still need review; unsafe downloads remain blocked.`,
      tone: data.metrics.portalReady > 0 ? "ok" : "warn"
    },
    {
      question: "Can we launch beyond demo?",
      answer: data.score >= 80 ? "yes" : "not yet",
      detail: `Readiness score ${data.score}%; pending queue: ${pendingQueue?.detail || "none"}.`,
      tone: data.score >= 80 ? "ok" : "info"
    }
  ] as const;
  const fieldColumns: Array<DataTableColumn<typeof requiredFields[number]>> = [
    { key: "label", header: "Field", render: (field) => <strong className="text-tjc-ink">{field.label}</strong> },
    { key: "rs", header: "ResourceSpace field", render: (field) => <code className="truncate text-xs text-tjc-muted">{field.resourceSpaceField}</code> },
    {
      key: "coverage",
      header: "Coverage",
      render: (field) => (
        <span className="grid gap-1">
          <span className="h-2 overflow-hidden rounded-full bg-[#e2e8df]">
            <span className="block h-full rounded-full bg-tjc-evergreen" style={{ width: `${field.coverage}%` }} />
          </span>
          <span className="text-xs font-black tabular-nums text-tjc-ink">{field.coverage}%</span>
        </span>
      )
    },
    { key: "missing", header: "Missing", className: "text-right", render: (field) => <span className="font-black tabular-nums">{field.missing.toLocaleString()}</span> }
  ];
  const backlogColumns: Array<DataTableColumn<AdminActionItem>> = [
    {
      key: "label",
      header: "Blocker",
      sortValue: (item) => item.label,
      render: (item) => (
        <span className="grid gap-1">
          <strong className="text-tjc-ink">{item.label}</strong>
          <span className="text-xs font-semibold text-tjc-muted">{item.action}</span>
        </span>
      )
    },
    {
      key: "severity",
      header: "Severity",
      sortValue: (item) => ({ critical: 4, high: 3, medium: 2, low: 1 }[item.severity]),
      render: (item) => <span className={cn("w-fit rounded-md border px-2 py-1 text-xs font-black", severityClass(item.severity))}>{item.severity}</span>
    },
    { key: "count", header: "Count", className: "text-right", sortValue: (item) => item.count, render: (item) => <span className="font-black tabular-nums">{item.count.toLocaleString()}</span> },
    { key: "owner", header: "Owner", sortValue: (item) => item.owner, render: (item) => <span className="text-sm font-semibold text-tjc-muted">{item.owner}</span> },
    {
      key: "open",
      header: "Open",
      render: (item) => item.count > 0 && item.savedViewId ? (
        <Link className="inline-flex min-h-8 items-center rounded-lg border border-tjc-line bg-white px-3 text-xs font-black text-tjc-evergreen hover:bg-[#eef7f1]" href={`/?view=${encodeURIComponent(item.savedViewId)}`}>
          Review queue
        </Link>
      ) : (
        <span className={cn("inline-flex min-h-8 items-center rounded-lg border px-3 text-xs font-black", item.count === 0 ? "border-[#b8d9c6] bg-[#edf8f1] text-[#22563a]" : "border-tjc-line bg-white text-tjc-muted")}>
          {item.count === 0 ? zeroCountLabel(item) : "Admin"}
        </span>
      )
    }
  ];
  const integrationColumns: Array<DataTableColumn<IntegrationReadinessItem>> = [
    {
      key: "label",
      header: "Integration",
      sortValue: (item) => item.label,
      render: (item) => (
        <span className="grid gap-1">
          <strong className="text-tjc-ink">{item.label}</strong>
          <span className="text-xs font-semibold leading-snug text-tjc-muted">{item.detail}</span>
        </span>
      )
    },
    {
      key: "state",
      header: "State",
      sortValue: (item) => (item.ready ? 1 : 0),
      render: (item) => <span className={cn("w-fit rounded-md border px-2 py-1 text-xs font-black", toneClass(item.ready ? "ok" : "warn"))}>{item.ready ? "Ready" : "Blocked"}</span>
    },
    { key: "owner", header: "Owner", sortValue: (item) => item.owner, render: (item) => <span className="text-sm font-semibold text-tjc-muted">{item.owner}</span> }
  ];
  const vocabularyColumns: Array<DataTableColumn<VocabularyInsight>> = [
    { key: "term", header: "Term", sortValue: (term) => term.term, render: (term) => <strong className="text-tjc-ink">{term.term}</strong> },
    {
      key: "kind",
      header: "Kind",
      sortValue: (term) => term.kind,
      render: (term) => (
        <span className={cn(
          "w-fit rounded-md border px-2 py-1 text-xs font-black",
          term.kind === "canonical" && "border-[#b8d9c6] bg-[#edf8f1] text-[#22563a]",
          term.kind === "candidate" && "border-[#c8d7e6] bg-[#f2f7fb] text-[#27435b]",
          term.kind === "drift" && "border-[#ead6a8] bg-[#fff7e5] text-[#725216]"
        )}>
          {term.kind}
        </span>
      )
    },
    { key: "count", header: "Count", className: "text-right", sortValue: (term) => term.count, render: (term) => <span className="font-black tabular-nums">{term.count.toLocaleString()}</span> }
  ];

  function exportReadinessCsv() {
    if (!data) return;
    const rows = [
      ["section", "id", "label", "score_or_count", "owner", "status", "action_or_detail"],
      ...data.readiness.map((item) => ["pillar", item.id, item.label, item.score, item.pillar, item.tone, item.action]),
      ...data.actionBacklog.map((item) => ["backlog", item.id, item.label, item.count, item.owner, item.severity, item.action]),
      ...data.fieldMappings.map((field) => ["field", field.key, field.label, field.coverage, field.required ? "required" : "optional", field.resourceSpaceField, `${field.present} present / ${field.missing} missing`]),
      ...data.integrationReadiness.map((item) => ["integration", item.id, item.label, item.ready ? 1 : 0, item.owner, item.ready ? "ready" : "blocked", item.detail])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "tjc-dam-readiness.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto grid w-full max-w-[1760px] gap-5 px-3 py-5 md:px-5 xl:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="hidden xl:block">
        <div className="sticky top-24 grid gap-1 border-r border-[#d6dfd8] pr-3">
          <span className="px-3 pb-2 text-xs font-black uppercase text-tjc-muted">Governance</span>
          {adminNav.map((item) => {
            const Icon = item.icon;
            const tabForItem: AdminTab =
              item.label === "Mappings" || item.label === "Vocabulary"
                ? "Mapping"
                : item.label === "Action backlog"
                  ? "Action backlog"
                  : item.label === "Audit log"
                    ? "Audit"
                    : item.label === "Launch gate" || item.label === "Portal gate"
                      ? "Launch Gate"
                      : "Overview";
            return (
              <button className={cn("inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-left text-sm font-semibold transition hover:bg-[#eef7f1] hover:text-tjc-evergreen", activeAdminTab === tabForItem ? "bg-[#e5f6f2] text-tjc-evergreen" : "text-[#3f4a43]")} type="button" onClick={() => setActiveAdminTab(tabForItem)} key={item.href}>
                <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
          <div className="mt-6 border-t border-[#d6dfd8] px-3 pt-4 text-xs leading-relaxed text-tjc-muted">
            <strong className="block text-tjc-evergreen">Data source</strong>
            ResourceSpace export
          </div>
        </div>
      </aside>

      <main className="min-w-0">
      <section id="overview" className="scroll-mt-24 grid gap-4 border-b border-[#d6dfd8] pb-5 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div>
          <span className="text-sm font-black text-tjc-evergreen">Governance and operations</span>
          <h1 className="mt-2 dam-page-title">Launch blocked</h1>
          <p className="mt-2 max-w-[78ch] text-base font-semibold leading-relaxed text-tjc-muted">Private DAM pilot remains safe for curated workflows. Full production launch waits on identity, write mapping, audit, and rights coverage.</p>
          <ol className="mt-4 grid gap-2 text-sm font-black text-[#6f4608]">
            {[
              "ResourceSpace write mapping",
              "Real authentication / SSO",
              "Rights and consent review coverage"
            ].map((blocker, index) => (
              <li className="grid grid-cols-[auto_1fr] gap-2 rounded-xl border border-[#ead6a8] bg-[#fff8e8] p-3" key={blocker}>
                <span className="tabular-nums">{index + 1}.</span>
                <span>{blocker}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="grid content-center gap-3 rounded-[1.45rem] border border-[#d6dfd8] bg-white p-4 shadow-[0_14px_34px_rgba(25,34,29,.04)]">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#7d2d2a]">
              <AlertTriangle size={19} strokeWidth={1.8} aria-hidden="true" />
              Launch gate status
            </div>
            <strong className="mt-1 block text-3xl font-black text-tjc-ink">Blocked</strong>
            <span className="mt-1 block text-sm font-semibold text-tjc-muted">Readiness score {data.score}% across {data.assetCount.toLocaleString()} assets from {data.source.label}</span>
            <span className="mt-3 block h-2 overflow-hidden rounded-full bg-[#edf0eb]" aria-hidden="true">
              <span className={cn("block h-full rounded-full", scoreTone(data.score) === "ok" ? "bg-[#2f7d55]" : scoreTone(data.score) === "info" ? "bg-[#5a7f95]" : "bg-[#d64545]")} style={{ width: `${Math.max(3, Math.min(data.score, 100))}%` }} />
            </span>
          </div>
          <button className="inline-flex min-h-9 w-fit items-center justify-center gap-2 rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1]" type="button" onClick={exportReadinessCsv}>
            <Download size={15} strokeWidth={1.8} aria-hidden="true" />
            Export report
          </button>
        </div>
      </section>

      <DamTabs
        tabs={adminTabs}
        active={activeAdminTab}
        onChange={setActiveAdminTab}
        ariaLabel="Admin readiness sections"
        idPrefix="admin-readiness"
        className="mt-4"
      />

      <section
        id={damTabPanelId("admin-readiness", "Overview")}
        role="tabpanel"
        aria-labelledby={damTabId("admin-readiness", "Overview")}
        hidden={activeAdminTab !== "Overview"}
      >
      <section className="mt-4 grid gap-3 lg:grid-cols-3" aria-label="Top readiness blockers">
        {topBlockers.map((item, index) => (
          <Link
            key={item.id}
            href={item.savedViewId ? `/?view=${encodeURIComponent(item.savedViewId)}` : "/admin"}
            className="rounded-[1.35rem] border border-[#d6dfd8] bg-white p-4 shadow-[0_14px_34px_rgba(35,53,111,.045)] transition hover:-translate-y-0.5 hover:border-[#b9c8bf]"
          >
            <span className="text-xs font-black uppercase text-tjc-muted">Priority {index + 1}</span>
            <div className="mt-2 flex items-start justify-between gap-3">
              <strong className="text-base font-black leading-tight text-tjc-ink">{item.label}</strong>
              <span className={cn("rounded-full border px-2.5 py-1 text-xs font-black tabular-nums", severityClass(item.severity))}>{item.count.toLocaleString()}</span>
            </div>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-tjc-muted">{item.action}</p>
          </Link>
        ))}
      </section>
      </section>

      <section
        id={damTabPanelId("admin-readiness", "Launch Gate")}
        role="tabpanel"
        aria-labelledby={damTabId("admin-readiness", "Launch Gate")}
        hidden={activeAdminTab !== "Launch Gate"}
      >
      <section id="launch-gate" className="mt-4 scroll-mt-24 rounded-[1.25rem] border border-[#d6dfd8] bg-white" aria-label="Launch decisions">
        {launchDecisions.map((decision) => (
          <div className="grid gap-2 border-b border-[#d6dfd8] px-4 py-4 last:border-b-0 md:grid-cols-[15rem_8rem_minmax(0,1fr)]" key={decision.question}>
            <strong className="text-sm text-tjc-ink">{decision.question}</strong>
            <span className={cn("w-fit rounded border px-2 py-0.5 text-xs font-semibold", toneClass(decision.tone))}>{decision.answer}</span>
            <span className="text-sm leading-relaxed text-tjc-muted">{decision.detail}</span>
          </div>
        ))}
      </section>
      </section>

      <details className="mt-4 rounded-[1.25rem] border border-[#d6dfd8] bg-white p-4 md:hidden" aria-label="Collapsed admin diagnostics">
        <summary className="cursor-pointer font-black text-tjc-evergreen">Diagnostics and mapping details</summary>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {[
            ["Approved public", data.metrics.approvedPublic],
            ["Portal ready", data.metrics.portalReady],
            ["Needs review", data.metrics.needsReview],
            ["Rights review", data.metrics.rightsReview]
          ].map(([label, value]) => (
            <div className="rounded-xl border border-tjc-line bg-[#fbfcfa] p-3" key={label}>
              <strong className="block text-xl font-black tabular-nums text-tjc-ink">{Number(value).toLocaleString()}</strong>
              <span className="text-xs font-semibold text-tjc-muted">{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-2 border-t border-[#d6dfd8] pt-3">
          {data.integrationReadiness.slice(0, 3).map((item) => (
            <div className="grid gap-1 rounded-xl border border-tjc-line bg-[#fbfcfa] p-3" key={`mobile-${item.id}`}>
              <div className="flex items-center justify-between gap-2">
                <strong className="text-sm text-tjc-ink">{item.label}</strong>
                <span className={cn("rounded-full border px-2 py-0.5 text-xs font-black", toneClass(item.ready ? "ok" : "warn"))}>{item.ready ? "Ready" : "Blocked"}</span>
              </div>
              <p className="text-xs font-semibold leading-relaxed text-tjc-muted">{item.detail}</p>
            </div>
          ))}
        </div>
      </details>

      <section className={cn("mt-4 hidden grid-cols-2 overflow-hidden rounded-lg border border-[#d7dfd5] bg-white md:grid md:grid-cols-5 xl:grid-cols-10", activeAdminTab !== "Overview" && "md:hidden")} aria-label="Governance operating metrics">
        <MetricTile label="Approved public" value={data.metrics.approvedPublic} />
        <MetricTile label="External ready" value={data.metrics.portalReady} />
        <MetricTile label="Needs review" value={data.metrics.needsReview} />
        <MetricTile label="Rights review" value={data.metrics.rightsReview} />
        <MetricTile label="Missing source" value={data.metrics.missingSource} />
        <MetricTile label="Children/youth" value={data.metrics.childrenYouth} />
        <MetricTile label="AI enrichment" value={data.metrics.aiEnrichment} />
        <MetricTile label="Taxonomy drift" value={data.metrics.taxonomyDrift} />
        <MetricTile label="Duplicates" value={data.metrics.duplicateCandidates} />
        <MetricTile label="Rendition gaps" value={data.metrics.renditionGaps} />
      </section>

      <details className={cn("mt-4 hidden rounded-[1.2rem] border border-[#d6dfd8] bg-white p-4 md:block", activeAdminTab !== "Overview" && "md:hidden")} aria-label="Operational diagnostics">
        <summary className="cursor-pointer font-black text-tjc-evergreen">Operational diagnostics</summary>
        <section className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.25rem] border border-[#d6dfd8] bg-white p-4">
            <span className="text-xs font-semibold uppercase text-tjc-muted">Current data source</span>
            <strong className="mt-1 block text-sm text-tjc-ink">{data.source.label}</strong>
            <p className="mt-1 text-xs leading-relaxed text-tjc-muted">{data.source.detail}</p>
          </div>
          <div className="rounded-[1.25rem] border border-[#d6dfd8] bg-white p-4">
            <span className="text-xs font-semibold uppercase text-tjc-muted">API read configured</span>
            <strong className="mt-1 block text-sm text-tjc-ink">{readBridge?.ready ? "yes" : "no"}</strong>
            <p className="mt-1 text-xs leading-relaxed text-tjc-muted">{readBridge?.detail || "Read bridge unavailable."}</p>
          </div>
          <div className="rounded-[1.25rem] border border-[#d6dfd8] bg-white p-4">
            <span className="text-xs font-semibold uppercase text-tjc-muted">API write configured</span>
            <strong className="mt-1 block text-sm text-tjc-ink">{writeMapping?.ready ? "yes" : "no"}</strong>
            <p className="mt-1 text-xs leading-relaxed text-tjc-muted">{writeMapping?.detail || "Write mapping unavailable."}</p>
          </div>
          <div className="rounded-[1.25rem] border border-[#d6dfd8] bg-white p-4">
            <span className="text-xs font-semibold uppercase text-tjc-muted">Required field refs</span>
            <strong className="mt-1 block text-sm text-tjc-ink">{requiredFieldRefsPresent} present / {Math.max(0, requiredFields.length - requiredFieldRefsPresent)} missing</strong>
            <p className="mt-1 text-xs leading-relaxed text-tjc-muted">Pending review write queue: {pendingQueue?.detail || "none"}</p>
          </div>
        </section>
      </details>

      <section id="pillars" className={cn("mt-4 hidden scroll-mt-24 rounded-lg border border-[#d6dfd8] bg-white md:block", activeAdminTab !== "Overview" && "md:hidden")} aria-label="Production DAM pillars">
        {data.readiness.map((item) => {
          const Icon = pillarIcon(item.pillar);
          return (
            <article className="grid gap-3 border-b border-[#d6dfd8] px-3 py-3 last:border-b-0 md:grid-cols-[12rem_minmax(0,1fr)_10rem]" key={item.id}>
              <div className="flex items-center gap-2">
                  <Icon size={17} strokeWidth={1.8} aria-hidden="true" className="text-tjc-evergreen" />
                  <span className="text-sm font-semibold text-tjc-evergreen">{item.pillar}</span>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-black text-tjc-ink">{item.label}</h2>
                  <span className={cn("rounded border px-2 py-0.5 text-xs font-semibold tabular-nums", toneClass(item.tone))}>{item.score}%</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-tjc-muted">{item.detail}</p>
                <p className="mt-2 text-sm font-semibold text-[#3f4a43]">{item.action}</p>
              </div>
              <div className="self-center md:justify-self-end">
                {item.savedViewId ? (
                  <Link className="inline-flex min-h-9 items-center rounded-lg border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1]" href={`/?view=${encodeURIComponent(item.savedViewId)}`}>
                    Open queue
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>

      <section
        id={damTabPanelId("admin-readiness", "Action backlog")}
        role="tabpanel"
        aria-labelledby={damTabId("admin-readiness", "Action backlog")}
        hidden={activeAdminTab !== "Action backlog"}
      >
      <section className="mt-4 grid gap-3 md:hidden" aria-label="Mobile production blocker backlog" data-component="AdminMobileQueueContent">
        <div className="rounded-[1.2rem] border border-[#ead6a8] bg-[#fff8e8] p-4 text-[#725216]">
          <h2 className="text-base font-black">Top blockers</h2>
          <p className="mt-1 text-sm font-semibold leading-relaxed">
            Launch is blocked until these ResourceSpace and policy queues are cleared.
          </p>
        </div>
        {topBlockers.map((item) => (
          <Link
            className={cn("grid gap-2 rounded-[1.1rem] border border-[#d6dfd8] bg-white p-4 shadow-[0_12px_30px_rgba(35,53,111,.04)]", item.count === 0 && "pointer-events-none")}
            href={item.count > 0 && item.savedViewId ? `/?view=${encodeURIComponent(item.savedViewId)}` : "/admin"}
            key={`mobile-backlog-${item.id}`}
            aria-disabled={item.count === 0}
          >
            <div className="flex items-start justify-between gap-3">
              <strong className="text-sm font-black leading-tight text-tjc-ink">{item.label}</strong>
              <span className={cn("shrink-0 rounded-full border px-2.5 py-1 text-xs font-black tabular-nums", severityClass(item.severity))}>
                {item.count.toLocaleString()}
              </span>
            </div>
            <p className="text-sm font-semibold leading-relaxed text-tjc-muted">{item.action}</p>
            <span className="text-xs font-black uppercase tracking-[.06em] text-tjc-evergreen">{item.count === 0 ? zeroCountLabel(item) : `${item.owner} · ${item.severity}`}</span>
          </Link>
        ))}
        <div className="grid gap-2 rounded-[1.1rem] border border-[#c8d7e6] bg-[#f2f7fb] p-4 text-[#27435b]">
          <strong className="text-sm font-black">Launch decision</strong>
          <span className="text-sm font-semibold leading-relaxed">
            Reviewer/contributor pilot is safe for curated workflows; full production remains blocked by ResourceSpace write mapping and real auth.
          </span>
        </div>
      </section>
      <section id="backlog" className={cn("mt-4 hidden scroll-mt-24 gap-4 md:grid xl:grid-cols-[minmax(0,1fr)_minmax(24rem,.65fr)]", activeAdminTab !== "Action backlog" && "md:hidden")} aria-label="Admin work plan">
        <section className="rounded-lg border border-[#d6dfd8] bg-white p-4">
          <h2 className="flex items-center gap-2 text-xl font-semibold"><ListChecks size={18} strokeWidth={1.8} aria-hidden="true" /> Governance action backlog</h2>
          <div className="mt-3">
            <DataTable
              label="Production blocker backlog"
              rows={data.actionBacklog}
              columns={backlogColumns}
              getRowKey={(item) => item.id}
              getSearchText={(item) => `${item.label} ${item.owner} ${item.severity} ${item.action}`}
              gridTemplateColumns="minmax(12rem,1fr) 5.5rem 4.5rem 6rem 4.5rem"
              searchable
              searchPlaceholder="Filter blockers..."
              initialPageSize={8}
              pageSizeOptions={[5, 8, 12]}
              mobileCard={(item) => (
                <div className="grid gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-sm text-tjc-ink">{item.label}</strong>
                    <span className={cn("rounded-md border px-2 py-1 text-xs font-black", severityClass(item.severity))}>{item.count.toLocaleString()}</span>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed text-tjc-muted">{item.action}</p>
                  <span className="text-xs font-black text-tjc-muted">{item.count === 0 ? zeroCountLabel(item) : item.owner}</span>
                </div>
              )}
            />
          </div>
        </section>

        <section className="rounded-lg border border-[#d6dfd8] bg-white p-4">
          <h2 className="flex items-center gap-2 text-xl font-semibold"><Lock size={18} strokeWidth={1.8} aria-hidden="true" /> Source, sync, and write readiness</h2>
          <div className="mt-3">
            <DataTable
              label="Integration readiness"
              rows={data.integrationReadiness}
              columns={integrationColumns}
              getRowKey={(item) => item.id}
              getSearchText={(item) => `${item.label} ${item.owner} ${item.ready ? "ready" : "blocked"} ${item.detail}`}
              gridTemplateColumns="minmax(12rem,1fr) 5.5rem 6rem"
              searchable
              searchPlaceholder="Filter integrations..."
              initialPageSize={6}
              pageSizeOptions={[4, 6, 10]}
              mobileCard={(item) => (
                <div className="grid gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-sm text-tjc-ink">{item.label}</strong>
                    <span className={cn("rounded-md border px-2 py-1 text-xs font-black", toneClass(item.ready ? "ok" : "warn"))}>{item.ready ? "Ready" : "Blocked"}</span>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed text-tjc-muted">{item.detail}</p>
                  <span className="text-xs font-black text-tjc-muted">{item.owner}</span>
                </div>
              )}
            />
          </div>
        </section>
      </section>
      </section>

      <section
        id={damTabPanelId("admin-readiness", "Mapping")}
        role="tabpanel"
        aria-labelledby={damTabId("admin-readiness", "Mapping")}
        hidden={activeAdminTab !== "Mapping"}
      >
      <section className={cn("mt-4 hidden gap-4 md:grid xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,.8fr)]", activeAdminTab !== "Mapping" && "md:hidden")}>
        <section id="mappings" className={cn("scroll-mt-24 rounded-lg border border-[#d6dfd8] bg-white p-4", activeAdminTab !== "Mapping" && "hidden")} aria-label="ResourceSpace field mapping">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold"><Database size={18} strokeWidth={1.8} aria-hidden="true" /> Field mapping coverage</h2>
              <p className="mt-1 text-sm text-tjc-muted">Required ResourceSpace/export fields for production confidence.</p>
            </div>
          </div>
          <DataTable
            label="ResourceSpace required field mapping coverage"
            rows={requiredFields}
            columns={fieldColumns}
            getRowKey={(field) => field.key}
            gridTemplateColumns="minmax(10rem,.8fr) minmax(12rem,.9fr) minmax(10rem,1fr) 5rem"
            mobileCard={(field) => (
              <div className="grid gap-2">
                <strong className="text-sm text-tjc-ink">{field.label}</strong>
                <code className="truncate text-xs text-tjc-muted">{field.resourceSpaceField}</code>
                <span className="h-2 overflow-hidden rounded-full bg-[#e2e8df]">
                  <span className="block h-full rounded-full bg-tjc-evergreen" style={{ width: `${field.coverage}%` }} />
                </span>
                <span className="text-xs font-black tabular-nums text-tjc-muted">{field.coverage}% coverage / {field.missing.toLocaleString()} missing</span>
              </div>
            )}
          />
          <details className="mt-3 border-t border-[#d6dfd8] pt-3">
            <summary className="cursor-pointer text-sm font-semibold text-tjc-evergreen">Optional fields</summary>
            <div className="mt-3 grid gap-2">
              {optionalFields.map((field) => (
                <div className="grid gap-2 text-sm md:grid-cols-[minmax(10rem,.7fr)_minmax(12rem,.8fr)_5rem]" key={field.key}>
                  <span className="font-semibold text-tjc-ink">{field.label}</span>
                  <code className="truncate text-xs text-tjc-muted">{field.resourceSpaceField}</code>
                  <span className="text-right font-semibold tabular-nums">{field.coverage}%</span>
                </div>
              ))}
            </div>
          </details>
        </section>

        <section id="vocabulary" className="scroll-mt-24 rounded-lg border border-[#d6dfd8] bg-white p-4" aria-label="Controlled vocabulary">
          <h2 className="flex items-center gap-2 text-xl font-semibold"><Tags size={18} strokeWidth={1.8} aria-hidden="true" /> Vocabulary control</h2>
          <div className="mt-3">
            <DataTable
              label="Controlled vocabulary table"
              rows={data.vocabulary}
              columns={vocabularyColumns}
              getRowKey={(term) => `${term.kind}-${term.term}`}
              getSearchText={(term) => `${term.term} ${term.kind}`}
              gridTemplateColumns="minmax(10rem,1fr) 7rem 5rem"
              searchable
              searchPlaceholder="Filter vocabulary..."
              initialPageSize={8}
              pageSizeOptions={[8, 12, 20]}
            />
          </div>
        </section>
      </section>
      </section>

      <section id="portal-gate" className={cn("mt-4 hidden scroll-mt-24 rounded-lg border border-[#d6dfd8] bg-white p-4 md:block", activeAdminTab !== "Launch Gate" && "md:hidden")} aria-label="Portal policy">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Share2 size={18} strokeWidth={1.8} aria-hidden="true" /> Public portal gate</h2>
        <div className="mt-3 grid gap-x-5 gap-y-2 md:grid-cols-2 xl:grid-cols-3">
          {data.portalPolicy.map((policy) => (
            <Link
              key={policy.id}
              href={policy.savedViewId ? `/?view=${encodeURIComponent(policy.savedViewId)}` : "/"}
              className="grid grid-cols-[5rem_1fr] gap-3 border-b border-[#d6dfd8] py-3 text-tjc-ink transition last:border-b-0 hover:bg-[#f8fbf8]"
              title={policy.detail}
            >
              <strong className={cn("text-xl font-black tabular-nums", policy.blocked ? "text-[#7d2d2a]" : "text-[#22563a]")}>{policy.blocked.toLocaleString()}</strong>
              <span>
                <span className="block text-sm font-semibold leading-tight">{policy.label}</span>
                <span className="mt-1 block text-xs leading-relaxed text-tjc-muted">{policy.detail}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section
        id={damTabPanelId("admin-readiness", "Audit")}
        role="tabpanel"
        aria-labelledby={damTabId("admin-readiness", "Audit")}
        hidden={activeAdminTab !== "Audit"}
      >
      <section id="audit-log" className="mt-4 hidden scroll-mt-24 rounded-lg border border-[#d6dfd8] bg-white p-4 md:block" aria-label="Audit log">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><ScrollText size={18} strokeWidth={1.8} aria-hidden="true" /> Audit log</h2>
        <p className="mt-1 max-w-[78ch] text-sm leading-relaxed text-tjc-muted">
          Read-only portal audit signals. Pending writes are local queue records until ResourceSpace write mapping is configured.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {[
            ["events", data.auditLog.count],
            ["denied/blocked", data.auditLog.denied],
            ["queued writes", data.auditLog.queued],
            ["latest", data.auditLog.latestAt ? new Date(data.auditLog.latestAt).toLocaleDateString() : "none"]
          ].map(([label, value]) => (
            <div className="rounded-lg border border-[#d6dfd8] bg-[#fbfcfa] p-3" key={label}>
              <strong className="block text-lg font-black tabular-nums text-tjc-ink">{typeof value === "number" ? value.toLocaleString() : value}</strong>
              <span className="mt-0.5 block text-xs font-semibold text-tjc-muted">{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-[#d6dfd8]">
          <div className="grid grid-cols-[11rem_8rem_minmax(0,1fr)_9rem] gap-3 border-b border-[#d6dfd8] bg-[#eef2f3] px-3 py-2 text-xs font-black uppercase text-[#536057]">
            <span>Time</span><span>Status</span><span>Event</span><span>Asset</span>
          </div>
          {data.auditLog.recent.length ? data.auditLog.recent.map((event) => (
            <div className="grid grid-cols-[11rem_8rem_minmax(0,1fr)_9rem] gap-3 border-b border-[#d6dfd8] px-3 py-3 text-sm last:border-b-0" key={event.id}>
              <span className="text-xs font-semibold text-tjc-muted">{new Date(event.createdAt).toLocaleString()}</span>
              <span className={cn("h-fit w-fit rounded border px-2 py-0.5 text-xs font-black", event.status === "allowed" || event.status === "preview" ? toneClass("ok") : event.status === "queued" ? toneClass("info") : toneClass("warn"))}>
                {event.status}
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-tjc-ink">{event.type.replaceAll("_", " ")}</strong>
                <span className="mt-0.5 block truncate text-xs font-semibold text-tjc-muted">{event.summary}</span>
              </span>
              <span className="truncate text-xs font-black text-tjc-muted">{event.resourceSpaceId || event.assetId || "system"}</span>
            </div>
          )) : (
            <div className="px-3 py-4 text-sm font-semibold text-tjc-muted">No local portal audit events recorded yet.</div>
          )}
        </div>
        <div className="mt-3 divide-y divide-[#d6dfd8] rounded-lg border border-[#d6dfd8]">
          {data.integrationReadiness.map((item) => (
            <div className="grid gap-2 px-3 py-3 text-sm md:grid-cols-[12rem_10rem_minmax(0,1fr)]" key={`audit-${item.id}`}>
              <strong className="text-tjc-ink">{item.label}</strong>
              <span className={cn("w-fit rounded border px-2 py-0.5 text-xs font-semibold", toneClass(item.ready ? "ok" : "warn"))}>
                {item.ready ? "Ready" : "Blocked"}
              </span>
              <span className="leading-relaxed text-tjc-muted">{item.detail}</span>
            </div>
          ))}
          {data.actionBacklog.slice(0, 5).map((item) => (
            <div className="grid gap-2 px-3 py-3 text-sm md:grid-cols-[12rem_10rem_minmax(0,1fr)]" key={`audit-backlog-${item.id}`}>
              <strong className="text-tjc-ink">{item.label}</strong>
              <span className={cn("w-fit rounded border px-2 py-0.5 text-xs font-semibold", severityClass(item.severity))}>
                {item.severity}
              </span>
              <span className="leading-relaxed text-tjc-muted">{item.count.toLocaleString()} affected. {item.action}</span>
            </div>
          ))}
        </div>
      </section>
      </section>
      </main>
    </div>
  );
}
