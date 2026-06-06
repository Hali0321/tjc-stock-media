"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Database, Download, Gauge, Layers, ListChecks, Lock, Search, Share2, Tags } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import type { DamReadinessItem, DamReadinessResult } from "@/lib/types";
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
    <div className="grid min-h-20 content-center rounded-lg border border-tjc-line bg-white/82 p-3">
      <strong className="text-xl font-semibold tabular-nums text-tjc-ink">{(value ?? 0).toLocaleString()}</strong>
      <span className="mt-1 text-xs font-medium leading-tight text-tjc-muted">{label}</span>
    </div>
  );
}

function AdminLoadingState() {
  return (
    <div className="mx-auto w-full max-w-[1760px] px-3 py-5 md:px-5">
      <section className="rounded-lg border border-tjc-line bg-white/82 p-5">
        <span className="text-sm font-semibold text-tjc-evergreen">DAM Admin</span>
        <h1 className="mt-2 text-2xl font-semibold md:text-3xl">Loading production diagnostics</h1>
        <p className="mt-2 max-w-[72ch] text-sm leading-relaxed text-tjc-muted">
          Reading the ResourceSpace metadata export, field mapping coverage, pending write queue, and launch blockers.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, index) => (
            <div className="rounded-md border border-tjc-line bg-[#fbfcfa] p-3" key={index}>
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
        <section className="rounded-lg border border-tjc-line bg-white/82 p-5">
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
    <div className="mx-auto w-full max-w-[1760px] px-3 py-5 md:px-5">
      <section className="grid gap-4 border-b border-tjc-line pb-4 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div>
          <span className="text-sm font-semibold text-tjc-evergreen">DAM Admin</span>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Production readiness</h1>
          <p className="mt-2 max-w-[78ch] text-base leading-relaxed text-tjc-muted">Command center for find, trust, review, share, and govern quality across the ResourceSpace-backed archive.</p>
        </div>
        <div className={cn("grid content-center rounded-lg border p-4", toneClass(scoreTone(data.score)))}>
          <div className="flex items-center gap-2">
            <Gauge size={20} strokeWidth={1.8} aria-hidden="true" />
            <span className="text-sm font-semibold">Readiness score</span>
          </div>
          <strong className="mt-2 text-4xl font-semibold tabular-nums">{data.score}%</strong>
          <span className="mt-1 text-sm">{data.assetCount.toLocaleString()} assets checked from {data.source.label}</span>
          <button className="mt-3 inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-current bg-white/55 px-3 text-sm font-semibold transition hover:bg-white/80" type="button" onClick={exportReadinessCsv}>
            <Download size={15} strokeWidth={1.8} aria-hidden="true" />
            Export report
          </button>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5 xl:grid-cols-10" aria-label="DAM operating metrics">
        <MetricTile label="Approved public" value={data.metrics.approvedPublic} />
        <MetricTile label="Portal ready" value={data.metrics.portalReady} />
        <MetricTile label="Needs review" value={data.metrics.needsReview} />
        <MetricTile label="Rights review" value={data.metrics.rightsReview} />
        <MetricTile label="Missing source" value={data.metrics.missingSource} />
        <MetricTile label="Children/youth" value={data.metrics.childrenYouth} />
        <MetricTile label="AI enrichment" value={data.metrics.aiEnrichment} />
        <MetricTile label="Taxonomy drift" value={data.metrics.taxonomyDrift} />
        <MetricTile label="Duplicates" value={data.metrics.duplicateCandidates} />
        <MetricTile label="Rendition gaps" value={data.metrics.renditionGaps} />
      </section>

      <section className="mt-4 grid gap-2 rounded-lg border border-tjc-line bg-white/82 p-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Operational diagnostics">
        <div>
          <span className="text-xs font-semibold uppercase text-tjc-muted">Current data source</span>
          <strong className="mt-1 block text-sm text-tjc-ink">{data.source.label}</strong>
          <p className="mt-1 text-xs leading-relaxed text-tjc-muted">{data.source.detail}</p>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase text-tjc-muted">API read configured</span>
          <strong className="mt-1 block text-sm text-tjc-ink">{readBridge?.ready ? "yes" : "no"}</strong>
          <p className="mt-1 text-xs leading-relaxed text-tjc-muted">{readBridge?.detail || "Read bridge unavailable."}</p>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase text-tjc-muted">API write configured</span>
          <strong className="mt-1 block text-sm text-tjc-ink">{writeMapping?.ready ? "yes" : "no"}</strong>
          <p className="mt-1 text-xs leading-relaxed text-tjc-muted">{writeMapping?.detail || "Write mapping unavailable."}</p>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase text-tjc-muted">Required field refs</span>
          <strong className="mt-1 block text-sm text-tjc-ink">{requiredFieldRefsPresent} present / {Math.max(0, requiredFields.length - requiredFieldRefsPresent)} missing</strong>
          <p className="mt-1 text-xs leading-relaxed text-tjc-muted">Pending review write queue: {pendingQueue?.detail || "none"}</p>
        </div>
      </section>

      <section className="mt-4 grid gap-3 lg:grid-cols-5" aria-label="Production DAM pillars">
        {data.readiness.map((item) => {
          const Icon = pillarIcon(item.pillar);
          return (
            <article className="rounded-lg border border-tjc-line bg-white/82 p-3" key={item.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Icon size={17} strokeWidth={1.8} aria-hidden="true" className="text-tjc-evergreen" />
                  <span className="text-sm font-semibold text-tjc-evergreen">{item.pillar}</span>
                </div>
                <span className={cn("rounded-md border px-2 py-1 text-xs font-semibold tabular-nums", toneClass(item.tone))}>{item.score}%</span>
              </div>
              <h2 className="mt-3 text-lg font-semibold">{item.label}</h2>
              <p className="mt-1 text-sm leading-relaxed text-tjc-muted">{item.detail}</p>
              <p className="mt-3 text-sm font-semibold text-[#3f4a43]">{item.action}</p>
              {item.savedViewId ? (
                <Link className="mt-3 inline-flex min-h-9 items-center rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1]" href={`/?view=${encodeURIComponent(item.savedViewId)}`}>
                  Open queue
                </Link>
              ) : null}
            </article>
          );
        })}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,.65fr)]" aria-label="Admin work plan">
        <section className="rounded-lg border border-tjc-line bg-white/82 p-4">
          <h2 className="flex items-center gap-2 text-xl font-semibold"><ListChecks size={18} strokeWidth={1.8} aria-hidden="true" /> Action backlog</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {data.actionBacklog.map((item) => (
              <Link
                key={item.id}
                href={item.savedViewId ? `/?view=${encodeURIComponent(item.savedViewId)}` : "/admin"}
                className="grid gap-3 rounded-md border border-tjc-line bg-[#fbfcfa] p-3 transition hover:bg-[#f4f8f5]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase text-tjc-muted">{item.owner}</span>
                    <strong className="mt-1 block text-sm font-semibold text-tjc-ink">{item.label}</strong>
                  </div>
                  <span className={cn("rounded-md border px-2 py-1 text-xs font-semibold tabular-nums", severityClass(item.severity))}>{item.count.toLocaleString()}</span>
                </div>
                <p className="text-sm leading-relaxed text-tjc-muted">{item.action}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-tjc-line bg-white/82 p-4">
          <h2 className="flex items-center gap-2 text-xl font-semibold"><Lock size={18} strokeWidth={1.8} aria-hidden="true" /> Integration readiness</h2>
          <div className="mt-3 grid gap-2">
            {data.integrationReadiness.map((item) => (
              <div className="grid gap-2 rounded-md border border-tjc-line bg-[#fbfcfa] p-3" key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="text-sm font-semibold text-tjc-ink">{item.label}</strong>
                    <span className="mt-1 block text-xs font-semibold uppercase text-tjc-muted">{item.owner}</span>
                  </div>
                  <span className={cn("rounded-md border px-2 py-1 text-xs font-semibold", toneClass(item.ready ? "ok" : "warn"))}>{item.ready ? "Ready" : "Blocked"}</span>
                </div>
                <p className="text-sm leading-relaxed text-tjc-muted">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,.8fr)]">
        <section className="rounded-lg border border-tjc-line bg-white/82 p-4" aria-label="ResourceSpace field mapping">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold"><Database size={18} strokeWidth={1.8} aria-hidden="true" /> Field mapping coverage</h2>
              <p className="mt-1 text-sm text-tjc-muted">Required ResourceSpace/export fields for production confidence.</p>
            </div>
          </div>
          <div className="grid gap-2">
            {requiredFields.map((field) => (
              <div className="grid gap-2 rounded-md border border-tjc-line bg-[#fbfcfa] p-3 md:grid-cols-[minmax(10rem,.7fr)_minmax(12rem,.8fr)_minmax(10rem,1fr)_5rem]" key={field.key}>
                <strong className="text-sm text-tjc-ink">{field.label}</strong>
                <code className="truncate rounded bg-white px-2 py-1 text-xs text-tjc-muted">{field.resourceSpaceField}</code>
                <span className="h-2 self-center overflow-hidden rounded-full bg-[#e2e8df]">
                  <span className="block h-full rounded-full bg-tjc-evergreen" style={{ width: `${field.coverage}%` }} />
                </span>
                <span className="text-right text-sm font-semibold tabular-nums text-tjc-ink">{field.coverage}%</span>
              </div>
            ))}
          </div>
          <details className="mt-3 rounded-md border border-tjc-line bg-[#fbfcfa] p-3">
            <summary className="cursor-pointer text-sm font-semibold text-tjc-evergreen">Optional fields</summary>
            <div className="mt-3 grid gap-2">
              {optionalFields.map((field) => (
                <div className="grid gap-2 text-sm md:grid-cols-[minmax(10rem,.7fr)_minmax(12rem,.8fr)_5rem]" key={field.key}>
                  <span className="font-semibold text-tjc-ink">{field.label}</span>
                  <code className="truncate rounded bg-white px-2 py-1 text-xs text-tjc-muted">{field.resourceSpaceField}</code>
                  <span className="text-right font-semibold tabular-nums">{field.coverage}%</span>
                </div>
              ))}
            </div>
          </details>
        </section>

        <section className="rounded-lg border border-tjc-line bg-white/82 p-4" aria-label="Controlled vocabulary">
          <h2 className="flex items-center gap-2 text-xl font-semibold"><Tags size={18} strokeWidth={1.8} aria-hidden="true" /> Vocabulary control</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.vocabulary.map((term) => (
              <span
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-semibold",
                  term.kind === "canonical" && "border-[#b8d9c6] bg-[#edf8f1] text-[#22563a]",
                  term.kind === "candidate" && "border-[#c8d7e6] bg-[#f2f7fb] text-[#27435b]",
                  term.kind === "drift" && "border-[#ead6a8] bg-[#fff7e5] text-[#725216]"
                )}
                key={`${term.kind}-${term.term}`}
                title={term.kind}
              >
                {term.term} · {term.count}
              </span>
            ))}
          </div>
        </section>
      </section>

      <section className="mt-4 rounded-lg border border-tjc-line bg-white/82 p-4" aria-label="Portal policy">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Share2 size={18} strokeWidth={1.8} aria-hidden="true" /> Public portal gate</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
          {data.portalPolicy.map((policy) => (
            <Link
              key={policy.id}
              href={policy.savedViewId ? `/?view=${encodeURIComponent(policy.savedViewId)}` : "/"}
              className={cn("rounded-md border p-3 transition hover:brightness-[.98]", toneClass(policy.blocked ? "warn" : "ok"))}
              title={policy.detail}
            >
              <strong className="block text-xl font-semibold tabular-nums">{policy.blocked.toLocaleString()}</strong>
              <span className="mt-1 block text-xs font-semibold leading-tight">{policy.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
