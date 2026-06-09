"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, ShieldCheck, ShieldX } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DamTabs, damTabId, damTabPanelId } from "@/components/DamTabs";
import { DamAssetActionsMenu as AssetActionsMenu, DamMediaPreviewPanel as MediaPreviewPanel } from "@/components/dam/DamRecord";
import { DamDecisionActions, DamEvidenceMatrix, DamHoldToConfirmButton as HoldToConfirmButton, DamReviewActionDialog as ReviewActionDialog, DamReviewDecisionLockPanel, DamReviewQueueAssetCard as ReviewQueueAssetCard, DamReviewQueueHeader, DamReviewSelectedAsset } from "@/components/dam/DamOperations";
import { useDemoRole } from "@/components/RoleProvider";
import { StatusBanner } from "@/components/StatusBanner";
import { canReview } from "@/lib/permissions";
import { StatusBadge, UsageBadge } from "@/components/StatusBadge";
import { assetPresentation, detailImageUrl, provenanceSummary } from "@/lib/presentation";
import { toastPendingWriteQueued, toastReviewQueued, toastSaveFailed } from "@/lib/tjc-toasts";
import { missingReviewFields, reviewActions, reviewQueues, reviewRiskFlags, type ReviewQueueId } from "@/lib/workflow-policy";
import type { MediaSourceStatus, ReviewEvidenceChecklist, ReviewWriteRecordSummary, StockMediaAsset } from "@/lib/types";
import { cn } from "@/lib/ui";

type QueueSummary = {
  id: ReviewQueueId;
  label: string;
  description: string;
  count: number;
};

type Governance = {
  pendingReview: number;
  childrenYouth: number;
  missingSource: number;
  rightsReview: number;
  approvedThisMonth: number;
  archiveCandidates: number;
  duplicateCandidates: number;
  aiEnrichment: number;
  taxonomyDrift: number;
  renditionGaps: number;
  staleApprovals: number;
  missingRequiredFields: number;
};

type ReviewResponse = {
  assets: StockMediaAsset[];
  allAssets: StockMediaAsset[];
  source: MediaSourceStatus;
  canReview: boolean;
  queues: QueueSummary[];
  governance: Governance;
  resourceSpaceUrls: Record<string, string>;
  pendingWrites: Record<string, ReviewWriteRecordSummary>;
};

type AuditPreview = {
  action: string;
  role: string;
  timestamp: string;
  assetId: string;
};

const reviewInspectorTabs = ["Overview", "Metadata", "Usage", "Signals", "Queue"] as const;
type ReviewInspectorTab = (typeof reviewInspectorTabs)[number];
const desktopReviewRowsPageSize = 12;
const mobileReviewRowsPageSize = 6;
const highRiskActionIds = new Set(["archive-only", "do-not-publish"]);
const keyReviewerQueueIds: ReviewQueueId[] = ["pending", "rights-review", "children-youth", "usage-guidance", "archive-candidates"];
const advancedMetricCards: Array<{ key: keyof Governance; label: string }> = [
  { key: "missingSource", label: "Missing source" },
  { key: "duplicateCandidates", label: "Duplicates" },
  { key: "aiEnrichment", label: "Metadata enrichment" },
  { key: "taxonomyDrift", label: "Taxonomy drift" },
  { key: "renditionGaps", label: "Rendition gaps" },
  { key: "staleApprovals", label: "Stale approval" },
  { key: "missingRequiredFields", label: "Missing required fields" },
  { key: "approvedThisMonth", label: "Approved this month" }
];

const factItemClass = "border-t border-tjc-line/70 pt-3 first:border-t-0 first:pt-0";
const factTermClass = "text-xs font-semibold text-tjc-evergreen";
const factDescClass = "mt-1 break-words text-sm leading-relaxed text-[#4d554d]";
const checklistLabels: Array<[keyof ReviewEvidenceChecklist, string]> = [
  ["sourceConfirmed", "Source confirmed"],
  ["rightsConfirmed", "Rights confirmed"],
  ["peopleVisibilityConfirmed", "People visibility confirmed"],
  ["childrenYouthChecked", "Children/youth checked"],
  ["usageScopeSelected", "Usage scope selected"],
  ["derivativeAvailable", "Derivative available"],
  ["sensitiveContextChecked", "Sensitive context checked"],
  ["creditRequirementChecked", "Credit requirement checked"]
];
const checklistLabelByField = Object.fromEntries(checklistLabels) as Record<keyof ReviewEvidenceChecklist, string>;

const emptyChecklist: ReviewEvidenceChecklist = {
  sourceConfirmed: false,
  rightsConfirmed: false,
  peopleVisibilityConfirmed: false,
  childrenYouthChecked: false,
  usageScopeSelected: false,
  derivativeAvailable: false,
  sensitiveContextChecked: false,
  creditRequirementChecked: false
};

type ReviewAction = (typeof reviewActions)[number];

function normalizeInitialQueue(value?: string): ReviewQueueId {
  return reviewQueues.find((queue) => queue.id === value)?.id || "pending";
}

function sourceSummary(asset: StockMediaAsset) {
  return provenanceSummary(asset, "Reviewer").publicLabel || asset.collection || "Source pending";
}

function reviewNextCheckLabel(asset: StockMediaAsset) {
  const missing = missingReviewFields(asset);
  const risks = reviewRiskFlags(asset);
  if (missing.includes("source")) return "Verify source";
  if (missing.includes("people/minors")) return "Check people/minors";
  if (missing.includes("consent") || risks.includes("Rights unclear")) return "Confirm rights";
  if (missing.includes("usage guidance")) return "Add guidance";
  if (missing.includes("reviewer") || missing.includes("review date")) return "Record reviewer";
  return "Decision ready";
}

function reviewDecisionLanes(asset: StockMediaAsset) {
  const missing = missingReviewFields(asset);
  const risks = reviewRiskFlags(asset);
  const lane = (label: string, blocked: boolean, detail: string) => ({ label, blocked, detail });
  return [
    lane("Rights", missing.includes("consent") || risks.includes("Rights unclear") || !asset.rightsStatus, asset.rightsStatus || "Rights evidence needed"),
    lane("People/minors", missing.includes("people/minors") || /child|youth|minor/i.test(asset.peopleRisk || ""), asset.peopleRisk || "Visibility unknown"),
    lane("Source", missing.includes("source"), sourceSummary(asset)),
    lane("Derivative", missing.includes("derivative"), asset.imageUrls?.download || asset.downloadPolicy.includes("approved-copy") ? "Approved copy available" : "Approved rendition missing"),
    lane("Usage", missing.includes("usage guidance"), asset.usageGuidance || asset.usageScope)
  ];
}

function AuditPreviewPanel({ auditPreview }: { auditPreview: AuditPreview }) {
  return (
    <section className="rounded-md border border-[#c8d7e6] bg-[#f2f7fb] p-3 text-sm text-[#52677a]" aria-label="Audit preview">
      <h3 className="font-semibold text-[#27435b]">Audit preview</h3>
      <dl className="mt-2 grid gap-1">
        <div><dt className="font-semibold">Intended action</dt><dd>{auditPreview.action}</dd></div>
        <div><dt className="font-semibold">Reviewer role</dt><dd>{auditPreview.role}</dd></div>
        <div><dt className="font-semibold">Asset ID</dt><dd>{auditPreview.assetId}</dd></div>
        <div><dt className="font-semibold">Timestamp</dt><dd>{auditPreview.timestamp}</dd></div>
        <div><dt className="font-semibold">Required before queueing</dt><dd>Reviewer identity, evidence, audit fields, and media-team follow-up.</dd></div>
      </dl>
    </section>
  );
}

export function ReviewPage({ initialQueue = "pending" }: { initialQueue?: string }) {
  const router = useRouter();
  const { role, ready } = useDemoRole();
  const [data, setData] = useState<ReviewResponse | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [activeQueue, setActiveQueue] = useState<ReviewQueueId>(() => normalizeInitialQueue(initialQueue));
  const [auditPreview, setAuditPreview] = useState<AuditPreview | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [checklist, setChecklist] = useState<ReviewEvidenceChecklist>(emptyChecklist);
  const [pendingAction, setPendingAction] = useState<ReviewAction | null>(null);
  const [activeInspectorTab, setActiveInspectorTab] = useState<ReviewInspectorTab>("Overview");
  const [visibleReviewCount, setVisibleReviewCount] = useState(desktopReviewRowsPageSize);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const workbenchRef = useRef<HTMLElement>(null);
  const selectedWorkspaceRef = useRef<HTMLElement>(null);
  const reviewer = ready && canReview(role);

  useEffect(() => {
    setActiveQueue(normalizeInitialQueue(initialQueue));
  }, [initialQueue]);

  useEffect(() => {
    if (!ready) return;
    if (!reviewer) {
      setError("");
      setData(null);
      setSelectedId("");
      return;
    }
    let cancelled = false;
    setError("");
    fetch(`/api/review?role=${encodeURIComponent(role)}&queue=${encodeURIComponent(activeQueue)}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load review queue.");
        return body as ReviewResponse;
      })
      .then((body: ReviewResponse) => {
        if (!cancelled) {
          setData(body);
          setSelectedId((current) => (body.assets.some((asset) => asset.id === current) ? current : body.assets[0]?.id || ""));
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setData(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [role, activeQueue, ready, reviewer]);

  const selectedAsset = useMemo(() => data?.assets.find((asset) => asset.id === selectedId) || data?.assets[0], [data?.assets, selectedId]);
  const activeQueueSummary = data?.queues.find((queue) => queue.id === activeQueue);
  const selectedPendingWrite = selectedAsset ? data?.pendingWrites[selectedAsset.id] : undefined;
  const selectedPreview = selectedAsset ? detailImageUrl(selectedAsset, role) : undefined;
  const visibleReviewAssets = useMemo(() => (data?.assets || []).slice(0, visibleReviewCount), [data?.assets, visibleReviewCount]);
  const keyReviewerQueues = useMemo(() => {
    const summaries = data?.queues || [];
    return keyReviewerQueueIds
      .map((queueId) => summaries.find((queue) => queue.id === queueId))
      .filter(Boolean) as QueueSummary[];
  }, [data?.queues]);
  const advancedQueues = useMemo(() => {
    const keyIds = new Set(keyReviewerQueueIds);
    return (data?.queues || []).filter((queue) => !keyIds.has(queue.id));
  }, [data?.queues]);

  useEffect(() => {
    setReviewNote("");
    setChecklist(emptyChecklist);
    setPendingAction(null);
    setAuditPreview(null);
  }, [activeQueue, selectedId]);

  function resetSelectedWorkspace({ bringIntoView = false }: { bringIntoView?: boolean } = {}) {
    const workspace = selectedWorkspaceRef.current;
    if (!workspace || typeof window === "undefined") return;
    workspace.scrollTop = 0;
    workspace.scrollTo({ top: 0, left: 0, behavior: "auto" });
    if (bringIntoView) {
      const alignWorkspaceBelowHeader = () => {
        const currentWorkspace = selectedWorkspaceRef.current;
        if (!currentWorkspace) return;
        const appHeader = window.getComputedStyle(document.documentElement).getPropertyValue("--app-header-height");
        const headerOffset = Number.parseFloat(appHeader) || 0;
        const targetTop = window.scrollY + currentWorkspace.getBoundingClientRect().top - headerOffset - 12;
        const root = document.documentElement;
        const priorScrollBehavior = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        window.scrollTo(0, Math.max(0, targetTop));
        root.style.scrollBehavior = priorScrollBehavior;
      };
      alignWorkspaceBelowHeader();
      window.requestAnimationFrame(() => {
        alignWorkspaceBelowHeader();
        window.setTimeout(alignWorkspaceBelowHeader, 100);
      });
    }
  }

  useEffect(() => {
    if (!selectedId) return;
    setActiveInspectorTab("Overview");
    setEvidenceOpen(true);
    resetSelectedWorkspace();
  }, [selectedId]);

  useEffect(() => {
    const compactMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
    setVisibleReviewCount(compactMobile ? mobileReviewRowsPageSize : desktopReviewRowsPageSize);
    setEvidenceOpen(true);
  }, [activeQueue, role]);

  useEffect(() => {
    if (!data?.assets.length || !selectedId) return;
    const selectedIndex = data.assets.findIndex((asset) => asset.id === selectedId);
    if (selectedIndex >= visibleReviewCount) {
      setVisibleReviewCount(Math.min(data.assets.length, Math.max(mobileReviewRowsPageSize, selectedIndex + 1)));
    }
  }, [data?.assets, selectedId, visibleReviewCount]);

  function missingEvidenceFor(action: ReviewAction) {
    const required: Array<keyof ReviewEvidenceChecklist> = [
      "sourceConfirmed",
      "rightsConfirmed",
      "peopleVisibilityConfirmed",
      "childrenYouthChecked",
      "usageScopeSelected"
    ];
    if (action.backend === "Approve Public") {
      required.push("derivativeAvailable", "sensitiveContextChecked", "creditRequirementChecked");
    }
    const missing = required.filter((field) => !checklist[field]).map((field) => String(field));
    if (reviewNote.trim().length <= 10) missing.push("reviewNote");
    return missing;
  }

  function toggleChecklist(field: keyof ReviewEvidenceChecklist) {
    setChecklist((current) => ({ ...current, [field]: !current[field] }));
  }

  useEffect(() => {
    if (!reviewer || !data?.assets.length || !workbenchRef.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".review-media-reveal").forEach((item) => {
        gsap.fromTo(
          item,
          { scale: 0.97, opacity: 0.75 },
          {
            scale: 1,
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: item,
              start: "top 92%",
              end: "top 58%",
              scrub: true
            }
          }
        );
      });
    }, workbenchRef);
    return () => ctx.revert();
  }, [reviewer, data?.assets.length, activeQueue]);

  function requestAction(action: ReviewAction) {
    const missing = missingEvidenceFor(action);
    if (missing.length) {
      setMessage("Review evidence is incomplete. Add required checklist items and a review note before submitting.");
      toastSaveFailed("Checklist and reviewer note are required before queueing.");
      return;
    }
    setMessage("");
    setPendingAction(action);
  }

  function selectQueue(queueId: ReviewQueueId) {
    setActiveQueue(queueId);
    router.replace(`/review?queue=${queueId}`, { scroll: false });
  }

  function inspectAsset(assetId: string) {
    const bringIntoView = typeof window !== "undefined" && window.matchMedia("(max-width: 1279px)").matches;
    if (assetId === selectedId) {
      setActiveInspectorTab("Overview");
      setEvidenceOpen(true);
      resetSelectedWorkspace({ bringIntoView });
      return;
    }
    setSelectedId(assetId);
    if (bringIntoView) {
      resetSelectedWorkspace({ bringIntoView: true });
      window.setTimeout(() => resetSelectedWorkspace({ bringIntoView: true }), 0);
    }
  }

  async function confirmPendingAction() {
    if (!selectedAsset || !pendingAction) return;
    const timestamp = new Date().toISOString();
    setAuditPreview({ action: pendingAction.label, role, timestamp, assetId: selectedAsset.id });
    setMessage("");
    setSubmittingReview(true);
    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, id: selectedAsset.id, action: pendingAction.backend, label: pendingAction.label, notes: reviewNote, checklist })
      });
      const body = await response.json();
      setMessage(body.message || body.error || "Review route responded.");
      if (response.ok) {
        toastReviewQueued({ label: "Open review queue", onClick: () => router.push(`/review?queue=${activeQueue}`) });
        toastPendingWriteQueued({ label: "View queue status", onClick: () => setActiveInspectorTab("Queue") });
        setActiveInspectorTab("Queue");
        setReviewNote("");
        setChecklist(emptyChecklist);
        setPendingAction(null);
      } else {
        toastSaveFailed(body.error || "No review queue update was attempted.");
      }
    } catch {
      setMessage("Review route did not respond. No review queue update was attempted.");
      toastSaveFailed("Review route did not respond. No review queue update was attempted.");
    } finally {
      setSubmittingReview(false);
    }
  }

  const confirmedChecklistLabels = checklistLabels.filter(([field]) => checklist[field]).map(([, label]) => label);
  const selectedAuditPreview = selectedAsset && auditPreview?.assetId === selectedAsset.id ? auditPreview : null;
  const completedEvidenceCount = checklistLabels.filter(([field]) => checklist[field]).length;
  const reviewNoteReady = reviewNote.trim().length > 10;
  const decisionRequirements = [
    ...checklistLabels.map(([field, label]) => ({ id: String(field), label, complete: checklist[field] })),
    { id: "reviewNote", label: "Review note added", complete: reviewNoteReady }
  ];
  const completedRequirementCount = decisionRequirements.filter((item) => item.complete).length;
  const missingRequirementLabels = decisionRequirements.filter((item) => !item.complete).map((item) => item.label);
  const formatMissingEvidence = (missing: string[]) => missing
    .map((field) => field === "reviewNote" ? "Review note added" : checklistLabelByField[field as keyof ReviewEvidenceChecklist] || field)
    .join(", ");
  const reviewEvidenceControls = (
    <div className="min-w-0 max-w-full" data-component="ReviewActionEvidencePanel">
      <h3 className="text-sm font-semibold text-tjc-evergreen">Review evidence</h3>
      <label className="mt-2 grid gap-1 text-sm font-semibold text-tjc-ink">
        Review note
        <textarea
          className="min-h-24 rounded-lg border border-tjc-line bg-white p-3 text-sm font-medium text-tjc-ink placeholder:text-[#858f87]"
          value={reviewNote}
          onChange={(event) => setReviewNote(event.target.value)}
          placeholder="Record what was checked and why this action is appropriate..."
          rows={3}
        />
      </label>
      <div className="mt-3">
        <DamEvidenceMatrix
          items={checklistLabels.map(([field, label]) => ({ id: field, label, complete: checklist[field] }))}
          onToggle={(field) => toggleChecklist(field as keyof ReviewEvidenceChecklist)}
        />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-tjc-evergreen">Decision</h3>
      <DamReviewDecisionLockPanel missingLabels={missingRequirementLabels} completed={completedRequirementCount} total={decisionRequirements.length} />
      <DamDecisionActions>
        {reviewActions.map((action) => {
          const missing = missingEvidenceFor(action);
          const title = missing.length ? `Missing: ${formatMissingEvidence(missing)}` : "Review evidence and queue decision for sync";
          const icon = action.backend === "Do Not Use" ? <ShieldX size={15} strokeWidth={1.8} aria-hidden="true" /> : <ShieldCheck size={15} strokeWidth={1.8} aria-hidden="true" />;
          if (highRiskActionIds.has(action.id)) {
            return (
              <div key={action.id} data-component="HoldButtonLocation">
                <HoldToConfirmButton
                  disabled={!reviewer || missing.length > 0}
                  title={missing.length ? title : `Hold to queue ${action.label}`}
                  ariaLabel={`Hold to queue ${action.label}`}
                  onComplete={() => requestAction(action)}
                  className="w-full min-w-0 justify-center whitespace-normal text-center disabled:opacity-45"
                >
                  {icon}
                  Hold to queue {action.label}
                </HoldToConfirmButton>
              </div>
            );
          }
          return (
            <div className="grid gap-1" key={action.id}>
              <button className="inline-flex min-h-9 w-full min-w-0 max-w-full items-center justify-center gap-2 whitespace-normal rounded-md border border-tjc-line bg-white px-3 text-center text-sm font-semibold text-[#354139] transition hover:bg-[#eef7f1] active:translate-y-px disabled:cursor-not-allowed disabled:bg-[#f8faf8] disabled:text-[#77827a] disabled:opacity-55" type="button" disabled={!reviewer || missing.length > 0} title={title} onClick={() => requestAction(action)}>
                {icon}
                {action.label}
              </button>
            </div>
          );
        })}
      </DamDecisionActions>
      {selectedAuditPreview ? <div className="mt-3"><AuditPreviewPanel auditPreview={selectedAuditPreview} /></div> : null}
    </div>
  );

  if (!ready) {
    return <div className="px-3 py-5 md:px-5"><div className="skeleton h-[70dvh] rounded-lg" /></div>;
  }

  if (!reviewer) {
    return (
      <div className="mx-auto max-w-5xl px-3 py-5 md:px-5">
        <section className="dam-card p-5">
          <span className="text-sm font-semibold text-tjc-evergreen">Govern</span>
          <h1 className="mt-2 text-3xl font-semibold">Review inbox requires reviewer access</h1>
          <p className="mt-2 max-w-[64ch] text-base leading-relaxed text-tjc-muted">Reviewers check source, rights, people/minors, usage scope, duplicates, and archive decisions before reuse.</p>
        </section>
        <section className="mt-4 grid grid-cols-[auto_1fr] gap-4 dam-card p-5">
          <ShieldCheck size={28} strokeWidth={1.8} aria-hidden="true" className="text-tjc-evergreen" />
          <div>
            <h2 className="text-xl font-semibold">What reviewers check</h2>
            <p className="mt-1 text-tjc-muted">Approval status, source/provenance, people visibility, children/youth risk, rights notes, usage guidance, and download eligibility.</p>
            <span className="mt-3 block rounded-md bg-[#eef7f1] px-3 py-2 text-sm font-semibold text-tjc-evergreen">Ask a DAM admin for reviewer access if you need to clear reuse decisions.</span>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="dam-shell">
      {error ? (
        <StatusBanner className="mt-4" tone="critical" title="Review queue did not load">{error}</StatusBanner>
      ) : null}

      <section className="mt-4 rounded-lg border border-[#d6dfd8] bg-white p-3 md:hidden" aria-label="Review queues">
        <label className="grid gap-1 text-sm font-black text-tjc-evergreen">
          Review queue
          <select
            className="min-h-10 rounded-lg border border-[#b9c9bf] bg-white px-3 text-sm font-semibold text-tjc-ink"
            value={activeQueue}
            onChange={(event) => selectQueue(event.target.value as ReviewQueueId)}
            aria-describedby="review-queue-mobile-summary"
          >
            {(data?.queues || []).map((queue) => (
              <option key={queue.id} value={queue.id}>
                {queue.label} - {queue.count.toLocaleString()}
              </option>
            ))}
          </select>
        </label>
        <p id="review-queue-mobile-summary" className="mt-2 text-xs font-semibold text-tjc-muted">
          {activeQueueSummary ? `${activeQueueSummary.count.toLocaleString()} assets need this review path. Decisions remain locked until evidence is complete.` : "Loading queue summary."}
        </p>
      </section>

      <section className="review-workbench-command mt-1 hidden gap-3 rounded-[12px] border border-[#d9e2dc] bg-white p-3 md:grid" aria-label="Review filters">
        <div className="review-workbench-command-head">
          <div>
            <span className="dam-kicker">Review Inbox</span>
            <h1>{activeQueueSummary?.label || "Current queue"}</h1>
            <p>Approval remains locked until evidence is complete.</p>
          </div>
          <dl aria-label="Review queue summary">
            <div>
              <dt>Awaiting</dt>
              <dd>{data?.governance.pendingReview.toLocaleString() ?? "-"}</dd>
            </div>
            <div>
              <dt>Rights</dt>
              <dd>{data?.governance.rightsReview.toLocaleString() ?? "-"}</dd>
            </div>
            <div>
              <dt>People/youth</dt>
              <dd>{data?.governance.childrenYouth.toLocaleString() ?? "-"}</dd>
            </div>
            <div>
              <dt>Approved</dt>
              <dd>{data?.governance.approvedThisMonth.toLocaleString() ?? "-"}</dd>
            </div>
          </dl>
        </div>
        <div className="flex max-w-full min-w-0 flex-wrap gap-2">
          {keyReviewerQueues.map((queue) => (
            <button
              key={queue.id}
              type="button"
              className={cn("inline-flex min-h-10 shrink-0 items-center gap-2 rounded-[9px] border px-3 text-sm font-black text-[#3f4a43] transition hover:bg-[#eef7f1] active:translate-y-px", activeQueue === queue.id ? "border-[#8fb2a5] bg-[#e8f4ed] text-tjc-evergreen" : "border-[#e0e8e2] bg-white")}
              onClick={() => selectQueue(queue.id)}
              aria-pressed={activeQueue === queue.id}
            >
              <span>{queue.label}</span>
              <strong className="tabular-nums">{queue.count.toLocaleString()}</strong>
            </button>
          ))}
        </div>
        <details className="rounded-lg border border-[#d6dfd8] bg-white px-3 py-2" aria-label="More review filters">
          <summary className="cursor-pointer text-sm font-black text-tjc-evergreen">More filters</summary>
          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.55fr)]">
            <div className="flex flex-wrap gap-2">
              {advancedQueues.map((queue) => (
                <button
                  key={queue.id}
                  type="button"
                  className={cn("inline-flex min-h-8 items-center gap-2 rounded-md border border-tjc-line bg-[#fbfcfa] px-2.5 text-xs font-semibold text-[#4d554d] transition hover:bg-[#eef7f1]", activeQueue === queue.id && "border-[#8fb2a5] bg-[#e5f3ea] text-tjc-evergreen")}
                  onClick={() => selectQueue(queue.id)}
                  aria-pressed={activeQueue === queue.id}
                >
                  <span>{queue.label}</span>
                  <strong className="tabular-nums">{queue.count.toLocaleString()}</strong>
                </button>
              ))}
            </div>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              {advancedMetricCards.map((card) => (
                <div key={card.key} className="rounded-md border border-[#d6dfd8] bg-[#fbfcfa] p-2">
                  <dt className="font-black text-tjc-muted">{card.label}</dt>
                  <dd className="mt-1 text-base font-black tabular-nums text-tjc-ink">{data?.governance[card.key]?.toLocaleString?.() ?? data?.governance[card.key] ?? "-"}</dd>
                </div>
              ))}
            </dl>
          </div>
        </details>
      </section>

      {message ? <div className="mt-3 rounded-lg border border-[#c8d7e6] bg-[#f2f7fb] p-3 text-sm font-semibold text-[#27435b]">{message}</div> : null}

      <section ref={workbenchRef} className="mt-4 grid min-w-0 max-w-full gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,28rem)] 2xl:grid-cols-[minmax(0,1fr)_minmax(25rem,30rem)]" aria-label="Review workbench">
        <div className="order-2 grid min-w-0 max-w-full gap-4 xl:order-none">
          <details className="review-mobile-queue rounded-xl border border-[#d7dde2] bg-white md:hidden" data-testid="review-mobile-collapsed-queue">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-black text-[#111827]">
              <span>Queue below</span>
              <span className="rounded-md bg-[#f3f4f6] px-2 py-1 text-xs tabular-nums text-[#4b5563]">{data?.assets.length || 0} loaded</span>
            </summary>
            <div className="border-t border-[#e5e7eb] p-2">
              {visibleReviewAssets.map((asset) => {
                const title = assetPresentation(asset, role).title;
                const selected = selectedAsset?.id === asset.id;
                return (
                  <button
                    className={cn("grid w-full grid-cols-[1fr_auto] gap-2 rounded-lg px-3 py-2 text-left text-sm", selected ? "bg-[#eef6f2] text-[#0f3d2e]" : "text-[#111827] hover:bg-[#f8fafc]")}
                    key={`mobile-${asset.id}`}
                    type="button"
                    onClick={() => inspectAsset(asset.id)}
                    data-testid={selected ? "review-selected-queue-item" : undefined}
                  >
                    <span className="min-w-0">
                      <strong className="block truncate font-black">{title}</strong>
                      <span className="mt-0.5 block truncate text-xs font-medium text-[#6b7280]">{reviewNextCheckLabel(asset)}</span>
                    </span>
                    <span className="text-xs font-black tabular-nums text-[#6b7280]">Ref {asset.id}</span>
                  </button>
                );
              })}
              {data && visibleReviewCount < data.assets.length ? (
                <button className="mt-2 min-h-10 w-full rounded-lg border border-[#d1d5db] bg-white text-sm font-black text-[#0f3d2e]" type="button" onClick={() => setVisibleReviewCount((current) => Math.min(current + mobileReviewRowsPageSize, data.assets.length))}>
                  Show more
                </button>
              ) : null}
            </div>
          </details>

          <div className="hidden min-w-0 max-w-full overflow-hidden rounded-[12px] border border-[#d7dde2] bg-white md:block" data-testid="review-primary-queue" data-component="ReviewPrimaryQueueSurface">
          <DamReviewQueueHeader
            loaded={Math.min(visibleReviewAssets.length, data?.assets.length || 0)}
            total={activeQueueSummary?.count}
            queueLabel={activeQueueSummary?.label}
          />
          <div className="grid min-w-0 max-w-full">
            {visibleReviewAssets.map((asset) => (
                <ReviewQueueAssetCard
                  key={asset.id}
                  asset={asset}
                  role={role}
                  selected={selectedAsset?.id === asset.id}
                  onInspect={inspectAsset}
                />
              ))}
              {data && !data.assets.length ? <div className="p-8 text-tjc-muted">No assets in this queue.</div> : null}
          </div>
          {data && visibleReviewCount < data.assets.length ? (
            <div className="border-t border-tjc-line bg-[#fbfcfa] p-3">
              <button className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px" type="button" onClick={() => setVisibleReviewCount((current) => Math.min(current + desktopReviewRowsPageSize, data.assets.length))}>
                Show more review items
              </button>
            </div>
          ) : null}
          </div>
        </div>

        {selectedAsset ? (
          <DamReviewSelectedAsset ref={selectedWorkspaceRef}>
            <section className="grid gap-3" aria-label="Selected asset review summary">
              <MediaPreviewPanel className="review-selected-preview" asset={selectedAsset} src={selectedPreview} alt={selectedAsset.thumbnailAlt} title={assetPresentation(selectedAsset, role).title} compact />
              <div>
                <span className="text-sm font-semibold text-tjc-evergreen">Currently reviewing</span>
                <h2 className="mt-1 text-xl font-black leading-tight">{assetPresentation(selectedAsset, role).title}</h2>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-tjc-muted">{sourceSummary(selectedAsset)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={selectedAsset.status} />
                <UsageBadge scope={selectedAsset.usageScope} />
              </div>
              <div className="rounded-md border border-[#ead6a8] bg-[#fff8e6] p-3 text-sm text-[#684a10]">
                <strong className="block font-black">{reviewRiskFlags(selectedAsset)[0] || "Standard review"}</strong>
                <span className="mt-1 block leading-snug">{reviewNextCheckLabel(selectedAsset)}</span>
              </div>
              <div className="grid gap-1 rounded-md border border-tjc-line bg-[#fbfcfa] p-3 text-xs font-semibold text-tjc-muted sm:grid-cols-2">
                <span>{role === "DAM Admin" ? `ResourceSpace ${selectedAsset.resourceSpaceId || selectedAsset.id}` : `Ref ${selectedAsset.id}`}</span>
                <span>Source access restricted</span>
              </div>
              <section className="grid gap-2 rounded-md border border-[#d6dfd8] bg-[#fbfcfa] p-3" aria-label="Typed decision lanes">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-black text-tjc-evergreen">Decision lanes</h3>
                  <span className="text-xs font-semibold text-tjc-muted">Typed review evidence</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {reviewDecisionLanes(selectedAsset).map((lane) => (
                    <div className={cn("rounded-md border px-2.5 py-2 text-xs", lane.blocked ? "border-[#ead6a8] bg-[#fff8e8] text-[#725216]" : "border-[#b8d9c6] bg-white text-[#22563a]")} key={lane.label}>
                      <strong className="block font-black">{lane.label}</strong>
                      <span className="mt-1 block truncate font-semibold">{lane.detail}</span>
                    </div>
                  ))}
                </div>
              </section>
            </section>

            <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 border-t border-tjc-line pt-3" aria-label="Review action inspector">
            <div className="min-w-0" data-component="ReviewInspectorTabs">
              <DamTabs tabs={reviewInspectorTabs} active={activeInspectorTab} onChange={setActiveInspectorTab} ariaLabel="Review inspector sections" idPrefix="review-inspector" className="[&_[role=tab]]:text-xs" size="sm" />
            </div>

            <section id={damTabPanelId("review-inspector", "Overview")} role="tabpanel" aria-labelledby={damTabId("review-inspector", "Overview")} className="border-t border-tjc-line pt-3" aria-label="Review action area" hidden={activeInspectorTab !== "Overview"}>
                <details
                  className="min-w-0 max-w-full rounded-xl border border-[#d6dfd8] bg-[#f8faf8] p-3 md:border-0 md:bg-transparent md:p-0"
                  data-component="CollapsedEvidenceControls"
                  open={evidenceOpen}
                  onToggle={(event) => setEvidenceOpen(event.currentTarget.open)}
                >
                  <summary className="cursor-pointer list-none md:hidden">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="block text-sm font-black text-tjc-evergreen">Action evidence</span>
                        <span className="mt-1 block text-xs font-semibold text-tjc-muted">Approval stays locked until required checks and reviewer notes are complete.</span>
                      </div>
                      <span className="rounded-md border border-[#d6dfd8] bg-white px-2.5 py-1 text-xs font-black text-tjc-evergreen">
                        {completedEvidenceCount}/{checklistLabels.length}
                      </span>
                    </div>
                  </summary>
                  <div className="mt-3 min-w-0 max-w-full">{reviewEvidenceControls}</div>
                </details>
            </section>

            <section id={damTabPanelId("review-inspector", "Metadata")} role="tabpanel" aria-labelledby={damTabId("review-inspector", "Metadata")} hidden={activeInspectorTab !== "Metadata"}>
                <dl className="grid gap-2">
                  <div className={factItemClass}><dt className={factTermClass}>Library status</dt><dd className={factDescClass}>{selectedAsset.status}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>Portal reuse state</dt><dd className={factDescClass}>{selectedAsset.reuseDecision ? `${selectedAsset.reuseDecision.label} - ${selectedAsset.reuseDecision.summary}` : "Computed by TJC Stock Media policy"}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>Record reference</dt><dd className={factDescClass}>{selectedAsset.resourceSpaceId || selectedAsset.id}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>Collection</dt><dd className={factDescClass}>{selectedAsset.collection}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>Usage scope</dt><dd className={factDescClass}>{selectedAsset.usageScope}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>Missing fields</dt><dd className={factDescClass}>{missingReviewFields(selectedAsset).length ? missingReviewFields(selectedAsset).join(", ") : "Required fields present"}</dd></div>
                </dl>
            </section>

            <section id={damTabPanelId("review-inspector", "Usage")} role="tabpanel" aria-labelledby={damTabId("review-inspector", "Usage")} hidden={activeInspectorTab !== "Usage"}>
                <dl className="grid gap-2">
                  <div className={factItemClass}><dt className={factTermClass}>Why review</dt><dd className={factDescClass}>{reviewRiskFlags(selectedAsset).join(", ")}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>Source/provenance</dt><dd className={factDescClass}>{sourceSummary(selectedAsset)}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>People/minors</dt><dd className={factDescClass}>{selectedAsset.peopleRisk || "Unknown - reviewer should confirm before public use"}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>Rights status</dt><dd className={factDescClass}>{selectedAsset.rightsStatus || "Unknown - reviewer should confirm before public use"}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>Consent status</dt><dd className={factDescClass}>{selectedAsset.consentStatus || "Unknown - reviewer should confirm before public use"}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>Usage guidance</dt><dd className={factDescClass}>{selectedAsset.usageGuidance || "Missing"}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>Review notes</dt><dd className={factDescClass}>{selectedAsset.rightsNotes || "No notes exported yet"}</dd></div>
                </dl>
            </section>

            <section id={damTabPanelId("review-inspector", "Signals")} role="tabpanel" aria-labelledby={damTabId("review-inspector", "Signals")} hidden={activeInspectorTab !== "Signals"}>
                <dl className="grid gap-2">
                  <div className={factItemClass}><dt className={factTermClass}>Reviewer</dt><dd className={factDescClass}>{selectedAsset.reviewer || "Not reviewed"}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>Reviewed date</dt><dd className={factDescClass}>{selectedAsset.reviewedDate || "Pending"}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>Metadata signal</dt><dd className={factDescClass}>{missingReviewFields(selectedAsset).length ? "Suggested metadata needs reviewer confirmation before write." : "Exported fields look complete; reviewer evidence still required for action."}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>Status history</dt><dd className={factDescClass}>{assetPresentation(selectedAsset, role).reviewFacts.statusHistory.join(" -> ")}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>Last library state</dt><dd className={factDescClass}>Read from the current media-library export. Queue status is shown separately.</dd></div>
                </dl>
                {selectedAuditPreview ? <div className="mt-3"><AuditPreviewPanel auditPreview={selectedAuditPreview} /></div> : null}
            </section>

            <section id={damTabPanelId("review-inspector", "Queue")} role="tabpanel" aria-labelledby={damTabId("review-inspector", "Queue")} hidden={activeInspectorTab !== "Queue"}>
                <dl className="grid gap-2">
                  <div className={factItemClass}><dt className={factTermClass}>Queued decision</dt><dd className={factDescClass}>{selectedPendingWrite ? `${selectedPendingWrite.requestedStatus} / ${selectedPendingWrite.syncState}` : "None queued"}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>Queue mode</dt><dd className={factDescClass}>Review decisions are queued for media-team follow-up; record status stays unchanged here.</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>Current library state</dt><dd className={factDescClass}>Current status remains {selectedAsset.status}. Queued review decisions are not final until completed by the media team.</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>Next team step</dt><dd className={factDescClass}>Media team completes the final source update outside this review page.</dd></div>
                </dl>
                {selectedAuditPreview ? <div className="mt-3"><AuditPreviewPanel auditPreview={selectedAuditPreview} /></div> : null}
            </section>
            <div className="grid min-w-0 gap-2">
              <Link href={`/assets/${selectedAsset.id}`} className="inline-flex min-h-9 w-full min-w-0 max-w-full items-center justify-center gap-2 dam-button-primary px-3 text-center text-sm font-semibold transition active:translate-y-px">
                <ExternalLink size={16} strokeWidth={1.8} aria-hidden="true" />
                Open detail
              </Link>
              <AssetActionsMenu
                asset={selectedAsset}
                resourceSpaceUrl={data?.resourceSpaceUrls[selectedAsset.id] || null}
                canOpenResourceSpace={Boolean(data?.resourceSpaceUrls[selectedAsset.id])}
                canExposeResourceSpaceId={role === "DAM Admin"}
              />
            </div>
            </section>
          </DamReviewSelectedAsset>
        ) : null}
      </section>
      {selectedAsset && pendingAction ? (
        <ReviewActionDialog
          open={Boolean(pendingAction)}
          actionLabel={pendingAction.label}
          requestedStatus={pendingAction.targetStatus}
          assetTitle={assetPresentation(selectedAsset, role).title}
          resourceSpaceId={selectedAsset.resourceSpaceId || selectedAsset.id}
          rawStatus={selectedAsset.status}
          portalReuseState={selectedAsset.reuseDecision ? `${selectedAsset.reuseDecision.label} - ${selectedAsset.reuseDecision.summary}` : "Computed by TJC Stock Media policy"}
          blockers={(selectedAsset.reuseDecision?.blockers || []).map((blocker) => blocker.label)}
          checklistSummary={confirmedChecklistLabels}
          note={reviewNote}
          sourceReadOnly={Boolean(data?.source.readOnly)}
          submitting={submittingReview}
          onCancel={() => setPendingAction(null)}
          onConfirm={confirmPendingAction}
        />
      ) : null}
    </div>
  );
}
