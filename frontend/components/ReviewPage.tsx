"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Archive, Database, ExternalLink, FileWarning, Info, Lock, ShieldCheck, ShieldX, Users } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useDemoRole } from "@/components/RoleProvider";
import { canReview } from "@/lib/permissions";
import { StatusBadge, UsageBadge } from "@/components/StatusBadge";
import { MediaPreview } from "@/components/MediaPreview";
import { ReviewActionDialog } from "@/components/ReviewActionDialog";
import { assetPresentation, detailImageUrl, provenanceSummary } from "@/lib/presentation";
import { missingReviewFields, reviewActions, reviewRiskFlags, type ReviewQueueId } from "@/lib/workflow-policy";
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

function sourceSummary(asset: StockMediaAsset) {
  return provenanceSummary(asset, "Reviewer").publicLabel || asset.collection || "Source pending";
}

export function ReviewPage() {
  const { role, ready } = useDemoRole();
  const [data, setData] = useState<ReviewResponse | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [activeQueue, setActiveQueue] = useState<ReviewQueueId>("pending");
  const [auditPreview, setAuditPreview] = useState<AuditPreview | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [checklist, setChecklist] = useState<ReviewEvidenceChecklist>(emptyChecklist);
  const [pendingAction, setPendingAction] = useState<ReviewAction | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const workbenchRef = useRef<HTMLElement>(null);
  const reviewer = ready && canReview(role);

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

  useEffect(() => {
    setReviewNote("");
    setChecklist(emptyChecklist);
    setPendingAction(null);
  }, [selectedId]);

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

  if (!ready) {
    return <div className="px-3 py-5 md:px-5"><div className="skeleton h-[70dvh] rounded-lg" /></div>;
  }

  if (!reviewer) {
    return (
      <div className="mx-auto max-w-5xl px-3 py-5 md:px-5">
        <section className="rounded-lg border border-tjc-line bg-white/82 p-5">
          <span className="text-sm font-semibold text-tjc-evergreen">Govern</span>
          <h1 className="mt-2 text-3xl font-semibold">Review workbench requires reviewer access</h1>
          <p className="mt-2 max-w-[64ch] text-base leading-relaxed text-tjc-muted">Reviewers check source, rights, people/minors, usage scope, duplicates, and archive decisions before reuse.</p>
        </section>
        <section className="mt-4 grid grid-cols-[auto_1fr] gap-4 rounded-lg border border-tjc-line bg-white/76 p-5">
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
      <section className="grid gap-4 border-b border-tjc-line pb-4 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div>
          <span className="text-sm font-semibold text-tjc-evergreen">Govern</span>
          <h1 className="mt-2 dam-page-title">Review workbench</h1>
          <p className="mt-2 max-w-[78ch] text-sm leading-relaxed text-tjc-muted">Prioritize pending assets, children/youth, missing source, rights issues, duplicates, large media, and usage guidance gaps.</p>
        </div>
        <div className="rounded-md border border-tjc-line bg-white p-3">
          <span className="text-sm font-semibold text-tjc-muted">Current queue</span>
          <strong className="mt-1 block text-2xl font-semibold tabular-nums">{data?.assets.length ?? "-"} shown</strong>
          <span className="text-sm text-tjc-muted">{activeQueueSummary ? `first ${data?.assets.length ?? 0} of ${activeQueueSummary.count.toLocaleString()} ${activeQueueSummary.label}` : "Loading queue"}</span>
        </div>
	      </section>

	      {error ? (
	        <div className="mt-4 rounded-lg border border-[#e5b7b5] bg-[#fff0ef] p-3 text-sm font-semibold text-[#7d2d2a]" role="status">
	          {error}
	        </div>
	      ) : null}

	      {data?.source.readOnly ? (
        <div className="mt-3 grid grid-cols-[auto_1fr] gap-3 rounded-md border border-[#c8d7e6] bg-[#f2f7fb] p-3 text-[#27435b]">
          <Database size={18} strokeWidth={1.8} aria-hidden="true" />
          <div>
            <strong className="block font-semibold">Review queue is reading ResourceSpace export.</strong>
            <span className="text-sm">Review action is ready, but ResourceSpace API write mapping is not configured yet. Actions stay server-routed until field mapping is live.</span>
          </div>
        </div>
      ) : null}

      <section className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5 xl:grid-cols-10" aria-label="Governance metrics">
        {governanceCards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="grid min-h-16 content-center rounded-md border border-tjc-line bg-white p-2.5 shadow-[0_1px_0_rgba(32,34,31,.04)]" key={card.key}>
              <Icon size={16} strokeWidth={1.8} aria-hidden="true" className="text-tjc-evergreen" />
              <strong className="mt-1 text-lg font-semibold tabular-nums">{data?.governance[card.key]?.toLocaleString() ?? "-"}</strong>
              <span className="text-xs font-medium text-tjc-muted">{card.label}</span>
            </div>
          );
        })}
      </section>

      <section className="mt-4 flex max-w-full min-w-0 flex-wrap gap-2 pb-2" aria-label="Review queues">
        {(data?.queues || []).map((queue) => (
          <button
            key={queue.id}
            type="button"
            className={cn("inline-flex min-h-9 items-center gap-2 rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-[#3f4a43] transition hover:bg-[#eef7f1] active:translate-y-px", activeQueue === queue.id && "border-[#9bc5b5] bg-[#e8f5ef] text-tjc-evergreen")}
            onClick={() => setActiveQueue(queue.id)}
            aria-pressed={activeQueue === queue.id}
          >
            <span>{queue.label}</span>
            <strong className="tabular-nums">{queue.count.toLocaleString()}</strong>
          </button>
        ))}
      </section>

      {message ? <div className="mt-3 rounded-lg border border-[#c8d7e6] bg-[#f2f7fb] p-3 text-sm font-semibold text-[#27435b]">{message}</div> : null}

      <section ref={workbenchRef} className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_25rem]" aria-label="Review workbench">
        <div className="min-w-0 overflow-hidden rounded-md border border-tjc-line bg-white">
          <div className="hidden grid-cols-[7rem_minmax(12rem,1.1fr)_minmax(12rem,1fr)_minmax(13rem,1.1fr)_9rem] gap-3 border-b border-tjc-line px-3 py-2 text-xs font-semibold text-tjc-muted lg:grid">
            <span>Preview</span>
            <span>Asset</span>
            <span>Reason</span>
            <span>Missing / risk</span>
            <span>Action</span>
          </div>
          <div className="grid">
            {(data?.assets || []).slice(0, 80).map((asset) => {
              const display = assetPresentation(asset, role);
              const selected = selectedAsset?.id === asset.id;
              const risks = reviewRiskFlags(asset);
              const missing = missingReviewFields(asset);
              return (
                <article className={cn("grid gap-3 border-b border-tjc-line px-3 py-2.5 last:border-b-0 lg:grid-cols-[7rem_minmax(12rem,1.1fr)_minmax(12rem,1fr)_minmax(13rem,1.1fr)_9rem]", selected && "bg-[#f5fbf7]")} key={asset.id}>
                  <Link href={`/assets/${asset.id}`} className="review-media-reveal group block aspect-[4/3] overflow-hidden rounded-md bg-[#eef1ed]" aria-label={`Open ${display.title}`}>
                    <MediaPreview src={display.image} alt={asset.thumbnailAlt} imgClassName="transition duration-300 group-hover:scale-[1.025]" className="px-2" loading="eager" />
                  </Link>
                  <div className="min-w-0">
                    <h2 className="line-clamp-2 text-sm font-semibold leading-tight">{display.title}</h2>
                    <p className="mt-1 grid gap-1 text-sm text-tjc-muted"><span className="truncate">{asset.collection}</span><span className="truncate">{sourceSummary(asset)}</span></p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <StatusBadge status={asset.status} />
                      <UsageBadge scope={asset.usageScope} />
                    </div>
                  </div>
                  <div className="text-sm leading-snug text-[#4d554d]">
                    <strong className="block font-semibold text-tjc-ink">{risks[0] || "Standard review"}</strong>
                    <span>{asset.rightsNotes || "Review needed before reuse."}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs font-medium text-[#5d665f]">
                    {risks.slice(0, 4).map((flag) => <span className="rounded-md border border-[#ead6a8] bg-[#fff7e5] px-2 py-1 text-[#725216]" key={flag}>{flag}</span>)}
                    <span className="rounded-md bg-[#f1f4ef] px-2 py-1">{missing.length ? `Missing: ${missing.join(", ")}` : "Required fields present"}</span>
                    <span className="rounded-md bg-[#f1f4ef] px-2 py-1">RS {asset.resourceSpaceId || asset.id}</span>
                  </div>
                  <div className="flex flex-wrap content-start gap-2 lg:grid">
                    <button
                      className={cn("inline-flex min-h-8 items-center justify-center rounded-md border px-2.5 text-xs font-semibold transition hover:bg-[#eef7f1] active:translate-y-px", selected ? "border-[#9bc5b5] bg-[#e8f5ef] text-tjc-evergreen" : "border-tjc-line bg-white text-tjc-evergreen")}
                      type="button"
                      onClick={() => setSelectedId(asset.id)}
                      aria-pressed={selected}
                    >
                      Inspect
                    </button>
                    <Link className="inline-flex min-h-8 items-center justify-center gap-1 rounded-md border border-tjc-line bg-white px-2.5 text-xs font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1]" href={`/assets/${asset.id}`}>
                      <ExternalLink size={14} strokeWidth={1.8} aria-hidden="true" />
                      Detail
                    </Link>
                  </div>
                </article>
              );
            })}
            {data && !data.assets.length ? <div className="p-8 text-tjc-muted">No assets in this queue.</div> : null}
          </div>
        </div>

        {selectedAsset ? (
          <aside className="grid gap-3 self-start rounded-md border border-tjc-line bg-white p-3 shadow-[0_10px_24px_rgba(32,34,31,.07)] xl:sticky xl:top-24" aria-label="Selected asset review summary">
            <div className="block aspect-[4/3] overflow-hidden rounded-md bg-[#eef1ed]">
              <MediaPreview src={selectedPreview} alt={selectedAsset.thumbnailAlt} className="px-3" loading="eager" />
            </div>
            <div>
              <span className="text-sm font-semibold text-tjc-evergreen">Selected asset</span>
              <h2 className="mt-1 text-lg font-semibold leading-tight">{assetPresentation(selectedAsset, role).title}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={selectedAsset.status} />
              <UsageBadge scope={selectedAsset.usageScope} />
            </div>
            <dl className="grid gap-2">
              <div className={factItemClass}><dt className={factTermClass}>Raw ResourceSpace status</dt><dd className={factDescClass}>{selectedAsset.status}</dd></div>
              <div className={factItemClass}><dt className={factTermClass}>Why review</dt><dd className={factDescClass}>{reviewRiskFlags(selectedAsset).join(", ")}</dd></div>
              <div className={factItemClass}><dt className={factTermClass}>Source/provenance</dt><dd className={factDescClass}>{sourceSummary(selectedAsset)}</dd></div>
              <div className={factItemClass}><dt className={factTermClass}>People/minors</dt><dd className={factDescClass}>{selectedAsset.peopleRisk || "Unknown - reviewer should confirm before public use"}</dd></div>
              <div className={factItemClass}><dt className={factTermClass}>Usage guidance</dt><dd className={factDescClass}>{selectedAsset.usageGuidance || "Missing"}</dd></div>
              <div className={factItemClass}><dt className={factTermClass}>Review notes</dt><dd className={factDescClass}>{selectedAsset.rightsNotes || "No notes exported yet"}</dd></div>
              <div className={factItemClass}><dt className={factTermClass}>Portal reuse state</dt><dd className={factDescClass}>{selectedAsset.reuseDecision ? `${selectedAsset.reuseDecision.label} - ${selectedAsset.reuseDecision.summary}` : "Computed by TJC Stock Media policy"}</dd></div>
              <div className={factItemClass}><dt className={factTermClass}>Pending write</dt><dd className={factDescClass}>{selectedPendingWrite ? `${selectedPendingWrite.requestedStatus} / ${selectedPendingWrite.syncState}` : "None queued"}</dd></div>
              <div className={factItemClass}><dt className={factTermClass}>Status history</dt><dd className={factDescClass}>{assetPresentation(selectedAsset, role).reviewFacts.statusHistory.join(" -> ")}</dd></div>
            </dl>
            <section className="border-t border-tjc-line pt-3" aria-label="Review action area">
              <h3 className="text-sm font-semibold text-tjc-evergreen">Action area</h3>
              <label className="mt-2 grid gap-1 text-sm font-semibold text-tjc-ink">
                Review note
                <textarea
                  className="min-h-24 rounded-md border border-tjc-line bg-white p-3 text-sm font-medium text-tjc-ink placeholder:text-[#858f87]"
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
                  return (
                    <button className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-[#354139] transition hover:bg-[#eef7f1] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55" key={action.id} type="button" disabled={!reviewer || missing.length > 0} title={missing.length ? `Missing: ${missing.join(", ")}` : "Review evidence and queue pending write"} onClick={() => requestAction(action)}>
                      {action.backend === "Do Not Use" ? <ShieldX size={15} strokeWidth={1.8} aria-hidden="true" /> : <ShieldCheck size={15} strokeWidth={1.8} aria-hidden="true" />}
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </section>
            {auditPreview ? (
              <section className="rounded-lg border border-[#c8d7e6] bg-[#f2f7fb] p-3 text-sm text-[#52677a]" aria-label="Audit preview">
                <h3 className="font-semibold text-[#27435b]">Audit preview</h3>
                <dl className="mt-2 grid gap-1">
                  <div><dt className="font-semibold">Intended action</dt><dd>{auditPreview.action}</dd></div>
                  <div><dt className="font-semibold">Reviewer role</dt><dd>{auditPreview.role}</dd></div>
                  <div><dt className="font-semibold">Timestamp</dt><dd>{auditPreview.timestamp}</dd></div>
                  <div><dt className="font-semibold">Required before real write</dt><dd>ResourceSpace field mapping, signed API write, reviewer identity, and status audit fields.</dd></div>
                </dl>
              </section>
            ) : null}
            <div className="grid gap-2">
              <Link href={`/assets/${selectedAsset.id}`} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-tjc-evergreen px-3 text-sm font-semibold text-white transition hover:bg-tjc-evergreen-2 active:translate-y-px">
                <ExternalLink size={16} strokeWidth={1.8} aria-hidden="true" />
                Open detail
              </Link>
              {data?.resourceSpaceUrls[selectedAsset.id] ? (
                <a className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px" href={data.resourceSpaceUrls[selectedAsset.id]} target="_blank" rel="noreferrer">
                  <ExternalLink size={16} strokeWidth={1.8} aria-hidden="true" />
                  ResourceSpace
                </a>
              ) : null}
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
