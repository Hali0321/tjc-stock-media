"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, Database, ExternalLink, FileWarning, Info, LayoutGrid, List, Lock, ShieldCheck, ShieldX, SlidersHorizontal, Users } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AssetActionsMenu } from "@/components/AssetActionsMenu";
import { DamTabs, damTabId, damTabPanelId } from "@/components/DamTabs";
import { DisplayCard } from "@/components/DisplayCard";
import { HoldReleaseButton } from "@/components/HoldReleaseButton";
import { useDemoRole } from "@/components/RoleProvider";
import { StatusBanner } from "@/components/StatusBanner";
import { canReview } from "@/lib/permissions";
import { StatusBadge, UsageBadge } from "@/components/StatusBadge";
import { MediaPreview } from "@/components/MediaPreview";
import { ReviewActionDialog } from "@/components/ReviewActionDialog";
import { ReviewQueueAssetCard } from "@/components/ReviewQueueAssetCard";
import { ReviewTriageStrip } from "@/components/ReviewTriageStrip";
import { assetPresentation, detailImageUrl, provenanceSummary } from "@/lib/presentation";
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

const governanceCards = [
  { key: "pendingReview", label: "Pending review", icon: ShieldCheck },
  { key: "childrenYouth", label: "Children/youth", icon: Users },
  { key: "missingSource", label: "Missing source", icon: FileWarning },
  { key: "rightsReview", label: "Rights review", icon: Lock },
  { key: "duplicateCandidates", label: "Duplicates", icon: Archive },
  { key: "aiEnrichment", label: "AI enrichment", icon: Info },
  { key: "taxonomyDrift", label: "Taxonomy drift", icon: FileWarning },
  { key: "renditionGaps", label: "Rendition gaps", icon: Database },
  { key: "staleApprovals", label: "Stale approval", icon: Archive },
  { key: "archiveCandidates", label: "Archive candidates", icon: Archive }
] as const;

const reviewInspectorTabs = ["Overview", "Metadata", "Usage", "AI Insights", "Pending write"] as const;
type ReviewInspectorTab = (typeof reviewInspectorTabs)[number];
const reviewRowsPageSize = 24;
const highRiskActionIds = new Set(["archive-only", "do-not-publish"]);

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

function AuditPreviewPanel({ auditPreview }: { auditPreview: AuditPreview }) {
  return (
    <section className="rounded-md border border-[#c8d7e6] bg-[#f2f7fb] p-3 text-sm text-[#52677a]" aria-label="Audit preview">
      <h3 className="font-semibold text-[#27435b]">Audit preview</h3>
      <dl className="mt-2 grid gap-1">
        <div><dt className="font-semibold">Intended action</dt><dd>{auditPreview.action}</dd></div>
        <div><dt className="font-semibold">Reviewer role</dt><dd>{auditPreview.role}</dd></div>
        <div><dt className="font-semibold">Asset ID</dt><dd>{auditPreview.assetId}</dd></div>
        <div><dt className="font-semibold">Timestamp</dt><dd>{auditPreview.timestamp}</dd></div>
        <div><dt className="font-semibold">Required before real write</dt><dd>ResourceSpace field mapping, signed API write, reviewer identity, and status audit fields.</dd></div>
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
  const [visibleReviewCount, setVisibleReviewCount] = useState(reviewRowsPageSize);
  const [submittingReview, setSubmittingReview] = useState(false);
  const workbenchRef = useRef<HTMLElement>(null);
  const reviewer = ready && canReview(role);

  useEffect(() => {
    setActiveQueue(normalizeInitialQueue(initialQueue));
  }, [initialQueue]);

  useEffect(() => {
	    if (!ready) return;
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
  }, [role, activeQueue, ready]);

  const selectedAsset = useMemo(() => data?.assets.find((asset) => asset.id === selectedId) || data?.assets[0], [data?.assets, selectedId]);
  const activeQueueSummary = data?.queues.find((queue) => queue.id === activeQueue);
  const selectedPendingWrite = selectedAsset ? data?.pendingWrites[selectedAsset.id] : undefined;
  const selectedPreview = selectedAsset ? detailImageUrl(selectedAsset, role) : undefined;
  const visibleReviewAssets = useMemo(() => (data?.assets || []).slice(0, visibleReviewCount), [data?.assets, visibleReviewCount]);

  useEffect(() => {
    setReviewNote("");
    setChecklist(emptyChecklist);
    setPendingAction(null);
    setAuditPreview(null);
  }, [activeQueue, selectedId]);

  useEffect(() => {
    setVisibleReviewCount(reviewRowsPageSize);
  }, [activeQueue, role]);

  useEffect(() => {
    if (!data?.assets.length || !selectedId) return;
    const selectedIndex = data.assets.findIndex((asset) => asset.id === selectedId);
    if (selectedIndex >= visibleReviewCount) {
      setVisibleReviewCount(Math.min(data.assets.length, Math.max(reviewRowsPageSize, selectedIndex + 1)));
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
      return;
    }
    setMessage("");
    setPendingAction(action);
  }

  function selectQueue(queueId: ReviewQueueId) {
    setActiveQueue(queueId);
    router.replace(`/review?queue=${queueId}`, { scroll: false });
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
        setReviewNote("");
        setChecklist(emptyChecklist);
        setPendingAction(null);
      }
    } catch {
      setMessage("Review route did not respond. No ResourceSpace write was attempted.");
    } finally {
      setSubmittingReview(false);
    }
  }

  const confirmedChecklistLabels = checklistLabels.filter(([field]) => checklist[field]).map(([, label]) => label);
  const selectedAuditPreview = selectedAsset && auditPreview?.assetId === selectedAsset.id ? auditPreview : null;

  if (!ready) {
    return <div className="px-3 py-5 md:px-5"><div className="skeleton h-[70dvh] rounded-lg" /></div>;
  }

  if (!reviewer) {
    return (
      <div className="mx-auto max-w-5xl px-3 py-5 md:px-5">
        <section className="dam-card p-5">
          <span className="text-sm font-semibold text-tjc-evergreen">Govern</span>
          <h1 className="mt-2 text-3xl font-semibold">Review workbench requires reviewer access</h1>
          <p className="mt-2 max-w-[64ch] text-base leading-relaxed text-tjc-muted">Reviewers check source, rights, people/minors, usage scope, duplicates, and archive decisions before reuse.</p>
        </section>
        <section className="mt-4 grid grid-cols-[auto_1fr] gap-4 dam-card p-5">
          <ShieldCheck size={28} strokeWidth={1.8} aria-hidden="true" className="text-tjc-evergreen" />
          <div>
            <h2 className="text-xl font-semibold">What reviewers check</h2>
            <p className="mt-1 text-tjc-muted">Approval status, source/provenance, people visibility, children/youth risk, rights notes, usage guidance, and download eligibility.</p>
            <span className="mt-3 block rounded-md bg-[#eef7f1] px-3 py-2 text-sm font-semibold text-tjc-evergreen">Use role switch to Reviewer or DAM Admin to inspect the governance workbench.</span>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="dam-shell">
      <section className="grid gap-5 border-b border-[#d6dfd8] pb-5 xl:grid-cols-[minmax(0,1fr)_30rem]">
        <div>
          <span className="text-sm font-black text-tjc-evergreen">Govern</span>
          <h1 className="mt-2 dam-page-title">Review workbench</h1>
          <p className="mt-2 max-w-[78ch] text-base font-semibold leading-relaxed text-tjc-muted">Prioritize pending assets, children/youth, missing source, rights issues, duplicates, large media, and usage guidance gaps.</p>
        </div>
        <div className="grid content-center gap-1 border-t border-[#d6dfd8] pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
          <span className="text-sm font-black text-tjc-evergreen">Current queue</span>
          <strong className="block text-4xl font-black tabular-nums text-tjc-ink">{data?.assets.length ?? "-"} shown</strong>
          <span className="block text-sm font-semibold text-tjc-muted">{activeQueueSummary ? `loaded ${data?.assets.length ?? 0} of ${activeQueueSummary.count.toLocaleString()} ${activeQueueSummary.label}` : "Loading queue"}</span>
        </div>
	      </section>

	      {error ? (
	        <StatusBanner className="mt-4" tone="critical" title="Review queue did not load">{error}</StatusBanner>
	      ) : null}

	      {data?.source.readOnly ? (
        <StatusBanner className="mt-3" tone="info" title="Review queue is reading ResourceSpace export" icon={Database}>
          Review action is ready, but ResourceSpace API write mapping is not configured yet. Actions stay server-routed until field mapping is live.
        </StatusBanner>
      ) : null}

      <section className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5 xl:grid-cols-10" aria-label="Governance metrics">
        {governanceCards.map((card) => {
          const Icon = card.icon;
          return (
            <DisplayCard key={card.key} icon={Icon} label={card.label} value={data?.governance[card.key] ?? "-"} tone={card.key === "pendingReview" || card.key === "rightsReview" ? "warn" : "info"} />
          );
        })}
      </section>

      <section className="mt-4 flex max-w-full min-w-0 flex-wrap gap-2 border-y border-[#d6dfd8] py-3" aria-label="Review queues">
        {(data?.queues || []).map((queue) => (
          <button
            key={queue.id}
            type="button"
            className={cn("inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold text-[#3f4a43] transition hover:bg-[#eef7f1] active:translate-y-px", activeQueue === queue.id && "bg-white text-tjc-evergreen shadow-[inset_0_-2px_0_#063f39]")}
            onClick={() => selectQueue(queue.id)}
            aria-pressed={activeQueue === queue.id}
          >
            <span>{queue.label}</span>
            <strong className="tabular-nums">{queue.count.toLocaleString()}</strong>
          </button>
        ))}
      </section>

      {message ? <div className="mt-3 rounded-lg border border-[#c8d7e6] bg-[#f2f7fb] p-3 text-sm font-semibold text-[#27435b]">{message}</div> : null}

      <section ref={workbenchRef} className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_25rem]" aria-label="Review workbench">
        <div className="order-2 grid min-w-0 gap-4 xl:order-1">
          {data?.assets.length ? (
            <ReviewTriageStrip assets={data.assets} role={role} selectedId={selectedAsset?.id} onSelect={setSelectedId} />
          ) : null}

          <div className="min-w-0 overflow-hidden rounded-[1.35rem] border border-[#b9c9bf] bg-white shadow-[0_12px_34px_rgba(25,34,29,.035)]">
          <div className="grid gap-3 border-b border-tjc-line bg-[#f8faf8] px-3 py-3 text-sm lg:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <strong className="font-black text-tjc-ink">Showing {Math.min(visibleReviewAssets.length, data?.assets.length || 0).toLocaleString()} of {(data?.assets.length || 0).toLocaleString()} loaded queue assets</strong>
              {activeQueueSummary ? <span className="mt-1 block text-xs font-semibold text-tjc-muted">{activeQueueSummary.count.toLocaleString()} total in {activeQueueSummary.label}</span> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#d6dfd8] bg-white px-3 py-1 text-xs font-black text-tjc-muted">{selectedAsset ? "1 selected" : "0 selected"}</span>
              <button className="inline-flex min-h-9 items-center gap-2 rounded-full border border-tjc-line bg-white px-3 text-xs font-black text-tjc-evergreen transition hover:bg-[#eef7f1]" type="button">
                <SlidersHorizontal size={14} strokeWidth={1.8} aria-hidden="true" />
                Filters
              </button>
              <select className="min-h-9 rounded-full border border-tjc-line bg-white px-3 text-xs font-black text-[#3f4a43]" aria-label="Triage action" defaultValue="triage">
                <option value="triage">Triage</option>
                <option value="rights">Rights first</option>
                <option value="source">Missing source</option>
              </select>
              <select className="min-h-9 rounded-full border border-tjc-line bg-white px-3 text-xs font-black text-[#3f4a43]" aria-label="Sort review queue" defaultValue="risk">
                <option value="risk">Risk first</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
              <span className="inline-flex rounded-full border border-tjc-line bg-white p-1" aria-label="Review view mode">
                <button className="grid h-8 w-8 place-items-center rounded-full bg-[#e6f0eb] text-tjc-evergreen" type="button" aria-label="Grid queue view"><LayoutGrid size={14} strokeWidth={1.8} aria-hidden="true" /></button>
                <button className="grid h-8 w-8 place-items-center rounded-full text-tjc-muted" type="button" aria-label="List queue view"><List size={14} strokeWidth={1.8} aria-hidden="true" /></button>
              </span>
            </div>
          </div>
          <div className="hidden grid-cols-[7.25rem_minmax(14rem,1.15fr)_minmax(15rem,1fr)_minmax(13rem,.9fr)] gap-3 border-b border-tjc-line px-3 py-2 text-xs font-semibold text-tjc-muted lg:grid">
            <span>Preview</span>
            <span>Asset record</span>
            <span>Risk signal</span>
            <span>Next check</span>
          </div>
          <div className="grid">
            {visibleReviewAssets.map((asset) => (
              <ReviewQueueAssetCard
                key={asset.id}
                asset={asset}
                role={role}
                selected={selectedAsset?.id === asset.id}
                onInspect={setSelectedId}
              />
            ))}
            {data && !data.assets.length ? <div className="p-8 text-tjc-muted">No assets in this queue.</div> : null}
          </div>
          {data && visibleReviewCount < data.assets.length ? (
            <div className="border-t border-tjc-line bg-[#fbfcfa] p-3">
              <button className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px" type="button" onClick={() => setVisibleReviewCount((current) => Math.min(current + reviewRowsPageSize, data.assets.length))}>
                Show more review items
              </button>
            </div>
          ) : null}
          </div>
        </div>

        {selectedAsset ? (
          <aside className="order-1 grid gap-3 self-start rounded-lg border border-[#d4ded7] bg-white p-3 xl:order-2 xl:sticky xl:top-24" aria-label="Selected asset review summary">
            <div className="block aspect-[4/3] overflow-hidden rounded-md bg-[#eef1ed]">
              <MediaPreview src={selectedPreview} alt={selectedAsset.thumbnailAlt} className="px-3" loading="eager" />
            </div>
            <div>
              <span className="text-sm font-semibold text-tjc-evergreen">Selected asset</span>
              <h2 className="mt-1 text-xl font-black leading-tight">{assetPresentation(selectedAsset, role).title}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={selectedAsset.status} />
              <UsageBadge scope={selectedAsset.usageScope} />
            </div>
            <DamTabs tabs={reviewInspectorTabs} active={activeInspectorTab} onChange={setActiveInspectorTab} ariaLabel="Review inspector sections" idPrefix="review-inspector" className="[&_[role=tab]]:text-xs" />

            <section id={damTabPanelId("review-inspector", "Overview")} role="tabpanel" aria-labelledby={damTabId("review-inspector", "Overview")} className="border-t border-tjc-line pt-3" aria-label="Review action area" hidden={activeInspectorTab !== "Overview"}>
                <h3 className="text-sm font-semibold text-tjc-evergreen">Action evidence</h3>
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
                <div className="mt-3 grid gap-2 sm:grid-cols-2" aria-label="Review checklist">
                  {checklistLabels.map(([field, label]) => (
                    <label className="flex min-h-9 items-center gap-2 rounded-md border border-tjc-line bg-white px-2.5 text-xs font-semibold text-[#3f4a43]" key={field}>
                      <input className="h-4 w-4 accent-tjc-evergreen" type="checkbox" checked={checklist[field]} onChange={() => toggleChecklist(field)} />
                      {label}
                    </label>
                  ))}
                </div>
                <div className="mt-2 grid gap-2">
                  {reviewActions.map((action) => {
                    const missing = missingEvidenceFor(action);
                    const title = missing.length ? `Missing: ${missing.join(", ")}` : "Review evidence and queue pending write";
                    const icon = action.backend === "Do Not Use" ? <ShieldX size={15} strokeWidth={1.8} aria-hidden="true" /> : <ShieldCheck size={15} strokeWidth={1.8} aria-hidden="true" />;
                    if (highRiskActionIds.has(action.id)) {
                      return (
                        <HoldReleaseButton
                          key={action.id}
                          disabled={!reviewer || missing.length > 0}
                          title={missing.length ? title : `Hold to queue ${action.label}`}
                          ariaLabel={`Hold to queue ${action.label}`}
                          onComplete={() => requestAction(action)}
                        >
                          {icon}
                          Hold to queue {action.label}
                        </HoldReleaseButton>
                      );
                    }
                    return (
                      <button className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-tjc-line bg-white px-3 text-sm font-semibold text-[#354139] transition hover:bg-[#eef7f1] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55" key={action.id} type="button" disabled={!reviewer || missing.length > 0} title={title} onClick={() => requestAction(action)}>
                        {icon}
                        {action.label}
                      </button>
                    );
                  })}
                </div>
                {selectedAuditPreview ? <div className="mt-3"><AuditPreviewPanel auditPreview={selectedAuditPreview} /></div> : null}
            </section>

            <section id={damTabPanelId("review-inspector", "Metadata")} role="tabpanel" aria-labelledby={damTabId("review-inspector", "Metadata")} hidden={activeInspectorTab !== "Metadata"}>
                <dl className="grid gap-2">
                  <div className={factItemClass}><dt className={factTermClass}>Raw ResourceSpace status</dt><dd className={factDescClass}>{selectedAsset.status}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>Portal reuse state</dt><dd className={factDescClass}>{selectedAsset.reuseDecision ? `${selectedAsset.reuseDecision.label} - ${selectedAsset.reuseDecision.summary}` : "Computed by TJC Stock Media policy"}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>ResourceSpace ID</dt><dd className={factDescClass}>{selectedAsset.resourceSpaceId || selectedAsset.id}</dd></div>
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

            <section id={damTabPanelId("review-inspector", "AI Insights")} role="tabpanel" aria-labelledby={damTabId("review-inspector", "AI Insights")} hidden={activeInspectorTab !== "AI Insights"}>
                <dl className="grid gap-2">
                  <div className={factItemClass}><dt className={factTermClass}>Reviewer</dt><dd className={factDescClass}>{selectedAsset.reviewer || "Not reviewed"}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>Reviewed date</dt><dd className={factDescClass}>{selectedAsset.reviewedDate || "Pending"}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>AI enrichment signal</dt><dd className={factDescClass}>{missingReviewFields(selectedAsset).length ? "Suggested metadata needs reviewer confirmation before write." : "Exported fields look complete; reviewer evidence still required for action."}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>Status history</dt><dd className={factDescClass}>{assetPresentation(selectedAsset, role).reviewFacts.statusHistory.join(" -> ")}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>Last exported state</dt><dd className={factDescClass}>Read from ResourceSpace metadata export. Local pending writes are shown separately.</dd></div>
                </dl>
                {selectedAuditPreview ? <div className="mt-3"><AuditPreviewPanel auditPreview={selectedAuditPreview} /></div> : null}
            </section>

            <section id={damTabPanelId("review-inspector", "Pending write")} role="tabpanel" aria-labelledby={damTabId("review-inspector", "Pending write")} hidden={activeInspectorTab !== "Pending write"}>
                <dl className="grid gap-2">
                  <div className={factItemClass}><dt className={factTermClass}>Pending write</dt><dd className={factDescClass}>{selectedPendingWrite ? `${selectedPendingWrite.requestedStatus} / ${selectedPendingWrite.syncState}` : "None queued"}</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>Write mode</dt><dd className={factDescClass}>Pending local queue only until ResourceSpace API field mapping is configured.</dd></div>
                  <div className={factItemClass}><dt className={factTermClass}>ResourceSpace truth</dt><dd className={factDescClass}>Raw status remains {selectedAsset.status}. Pending review write is not final ResourceSpace persistence.</dd></div>
                </dl>
                {selectedAuditPreview ? <div className="mt-3"><AuditPreviewPanel auditPreview={selectedAuditPreview} /></div> : null}
            </section>
            <div className="grid gap-2">
              <Link href={`/assets/${selectedAsset.id}`} className="inline-flex min-h-9 items-center justify-center gap-2 dam-button-primary px-3 text-sm font-semibold transition active:translate-y-px">
                <ExternalLink size={16} strokeWidth={1.8} aria-hidden="true" />
                Open detail
              </Link>
              <AssetActionsMenu
                asset={selectedAsset}
                resourceSpaceUrl={data?.resourceSpaceUrls[selectedAsset.id] || null}
                canOpenResourceSpace={Boolean(data?.resourceSpaceUrls[selectedAsset.id])}
              />
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-2 rounded-lg border border-[#c8d7e6] bg-[#f2f7fb] p-3 text-sm text-[#52677a]">
              <Info size={16} strokeWidth={1.8} aria-hidden="true" />
              <span>Review action is ready, but ResourceSpace API write mapping is not configured yet.</span>
            </div>
          </aside>
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
