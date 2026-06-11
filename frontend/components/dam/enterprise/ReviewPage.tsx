"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRightCircle, CheckCircle2, ChevronDown, Clock3, Download, FileText, Filter, Grid3X3, Lock, ShieldAlert, ShieldCheck, Star } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { useDownloadGate, useReviewQueue } from "@/components/dam/useDamApi";
import { assetRecordRef, assetType, displayTitle, formatBytes } from "@/lib/enterprise-display";
import { reviewEvidenceRows, reviewMetadataRows } from "@/lib/enterprise-metadata";
import { assetEnterpriseStatus, type EnterpriseStatus } from "@/lib/enterprise-status";
import { emptyReviewChecklist, initialReviewChecklistForAsset, reviewChecklistItems, reviewDecisionDisabledReason, reviewDecisionMissingLabels, reviewEvidenceCompletion } from "@/lib/review-decision-presenter";
import { buildReviewQueueIntelligence, buildReviewQueueNextMove, buildSelectedReviewGuidance, reviewDecisionActions, reviewMetadataCompleteness, reviewWaitingDays, reviewWorkbenchTabs, type PendingReviewDecisionSummary } from "@/lib/review-workbench";
import { routeWithRole } from "@/lib/role-routes";
import type { ReviewEvidenceChecklist } from "@/lib/types";
import { cn } from "@/lib/ui";
import { ActionButton, AssetThumb, ErrorCard, IconButton, LoadingCard, PageHeader, SourcePill, StatusBadge } from "./EnterpriseShared";

const reviewQueuePageSizeOptions = [8, 12, 20];

export function EnterpriseReviewPage() {
  const { role, ready } = useDemoRole();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [queueId, setQueueId] = useState(searchParams.get("queue") || "pending");
  const review = useReviewQueue(role, queueId);
  const rawQueue = review.data?.assets || [];
  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"oldest" | "newest">("oldest");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDecisionById, setPendingDecisionById] = useState<Record<string, PendingReviewDecisionSummary>>({});
  const [comment, setComment] = useState("");
  const [checklist, setChecklist] = useState<ReviewEvidenceChecklist>(emptyReviewChecklist);
  const [decisionMessage, setDecisionMessage] = useState("");
  const [reviewListMessage, setReviewListMessage] = useState("");
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);
  const [activeWorkbenchTab, setActiveWorkbenchTab] = useState(reviewWorkbenchTabs[0]);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const downloadGate = useDownloadGate(selectedId || "", role);
  const queue = useMemo(() => {
    const dateValue = (asset: (typeof rawQueue)[number]) => Date.parse(asset.importDate || asset.capturedDate || asset.reviewedDate || "") || 0;
    return [...rawQueue].sort((left, right) => sortOrder === "oldest" ? dateValue(left) - dateValue(right) : dateValue(right) - dateValue(left));
  }, [rawQueue, sortOrder]);
  const pageCount = Math.max(1, Math.ceil(queue.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const pageStart = (safeCurrentPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, queue.length);
  const pagedQueue = useMemo(() => queue.slice(pageStart, pageEnd), [queue, pageStart, pageEnd]);
  const queueIntelligence = useMemo(() => buildReviewQueueIntelligence(queue, pendingDecisionById), [queue, pendingDecisionById]);
  const queueNextMove = useMemo(() => buildReviewQueueNextMove(queue, pendingDecisionById), [queue, pendingDecisionById]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  useEffect(() => {
    if (!pagedQueue.length) {
      if (!selectedId && queue[0]) setSelectedId(queue[0].id);
      return;
    }

    if (!selectedId || !pagedQueue.some((asset) => asset.id === selectedId)) {
      setSelectedId(pagedQueue[0].id);
    }
  }, [pagedQueue, queue, selectedId]);

  useEffect(() => {
    const nextQueue = searchParams.get("queue") || "pending";
    setQueueId(nextQueue);
  }, [searchParams]);

  useEffect(() => {
    const selectedAsset = queue.find((asset) => asset.id === selectedId);
    setChecklist(initialReviewChecklistForAsset(selectedAsset));
    setComment("");
    setDecisionMessage("");
    setMoreActionsOpen(false);
    setActiveWorkbenchTab(reviewWorkbenchTabs[0]);
  }, [queue, selectedId]);

  if (!ready) return <div className="enterprise-page"><LoadingCard label="Loading role..." /></div>;
  if (role !== "Reviewer" && role !== "DAM Admin") return <div className="enterprise-page"><section className="ed-card ed-access-block"><Lock size={28} /><h1>Review inbox requires reviewer access</h1><p>Approvals, evidence review, assignment, and decision actions are available only to Reviewer and DAM Admin roles.</p><Link href={routeWithRole("/", role)}>Return to Asset Library</Link></section></div>;
  if (review.loading) return <div className="enterprise-page"><LoadingCard label="Loading ResourceSpace review queue..." /></div>;
  if (review.error) return <div className="enterprise-page"><ErrorCard message={review.error} source={review.source} /></div>;
  const selectedAsset = queue.find((asset) => asset.id === selectedId) || queue[0];
  const selectedStatus = assetEnterpriseStatus(selectedAsset);
  const selectedPending = pendingDecisionById[selectedAsset?.id || ""];
  const evidenceCompletion = reviewEvidenceCompletion(checklist, comment);
  const metadataCompleteness = reviewMetadataCompleteness(selectedAsset);
  const selectedGuidance = buildSelectedReviewGuidance({ asset: selectedAsset, checklist, comment, pending: selectedPending });
  const reviewDecisionIcon = { check: CheckCircle2, file: FileText, alert: AlertTriangle };
  const selectQueue = (nextQueue: string) => {
    setQueueId(nextQueue);
    setCurrentPage(1);
    setSelectedId(null);
    router.push(routeWithRole(nextQueue === "pending" ? "/review" : `/review?queue=${encodeURIComponent(nextQueue)}`, role), { scroll: false });
  };
  const toggleChecklist = (field: keyof ReviewEvidenceChecklist) => {
    setChecklist((current) => ({ ...current, [field]: !current[field] }));
  };
  const decide = async (nextStatus: EnterpriseStatus, action: "Approve Public" | "Request More Info" | "Do Not Use") => {
    if (!selectedAsset) return;
    const missing = reviewDecisionMissingLabels(action, checklist, comment);
    if (missing.length) {
      setDecisionMessage(`Review blocked. Missing evidence: ${missing.join(", ")}.`);
      return;
    }
    const response = await fetch("/api/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, id: selectedAsset.id, action, notes: comment || `Beta decision for ${displayTitle(selectedAsset)}. Pending ResourceSpace sync required.`, checklist, reviewerName: "Alex Kim" }) });
    const payload = await response.json().catch(() => ({}));
    const syncState = typeof payload.syncState === "string" ? payload.syncState : response.ok ? "queued" : "blocked";
    const prefix = syncState === "synced_to_resourcespace" ? "Synced to ResourceSpace." : syncState === "sync_failed" ? "Sync failed." : syncState === "blocked" ? "Blocked." : "Queued for ResourceSpace sync.";
    const message = `${prefix} ${payload.message || payload.error || "ResourceSpace writeback is not configured. This decision is saved as a portal pending-sync event."}`;
    if (response.ok) {
      setPendingDecisionById((current) => ({ ...current, [selectedAsset.id]: { status: nextStatus, message, action } }));
    }
    setDecisionMessage(message);
    setMoreActionsOpen(false);
  };
  const queuePortalNote = (action: string) => {
    if (!selectedAsset) return;
    const message = `${action} noted for ${displayTitle(selectedAsset)}. ResourceSpace remains unchanged until live writeback is configured.`;
    setPendingDecisionById((current) => ({ ...current, [selectedAsset.id]: { status: "Read-only", message, action } }));
    setDecisionMessage(message);
    setComment((current) => current || message);
    setMoreActionsOpen(false);
  };
  const requestGatedDownload = async () => {
    if (!selectedAsset) return;
    const payload = await downloadGate.requestDownload({ reason: `Reviewer gated download check for ${displayTitle(selectedAsset)}`, variant: "review-preview" });
    if (payload.allowed && payload.downloadUrl) {
      setDecisionMessage("Download gate approved by backend. Opening approved copy.");
      window.open(payload.downloadUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setDecisionMessage(payload.message || payload.reason || "Download gate blocked this request.");
  };
  return (
    <div className="enterprise-page enterprise-review">
      <div className="ed-review-grid">
        <aside className="ed-review-list ed-panel">
          <PageHeader title="Review Queue" count={`${queue.length.toLocaleString()} items`} actions={<IconButton label="Filter" onClick={() => setReviewListMessage("Use the queue tabs below as filters. More filter facets will stay disabled until ResourceSpace exposes stable review fields.")}><Filter size={16} /></IconButton>} />
          <SourcePill source={review.source} live={review.live} />
          <div className="ed-review-command-strip" aria-label="Review queue intelligence">
            {queueIntelligence.map((item) => <article className={`is-${item.tone}`} key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.detail}</small></article>)}
          </div>
          <section className={`ed-review-queue-move is-${queueNextMove.tone}`} aria-label="Review queue next operating move">
            <span><ArrowRightCircle size={15} />Next move</span>
            <strong>{queueNextMove.title}</strong>
            <p>{queueNextMove.detail}</p>
            <button type="button" onClick={() => setReviewListMessage(queueNextMove.detail)}>{queueNextMove.action}</button>
          </section>
          <nav className="ed-tabs wrap" role="tablist" aria-label="Review queues">{(review.data?.queues || []).slice(0, 6).map((tab) => <button className={queueId === tab.id ? "is-active" : ""} type="button" role="tab" aria-selected={queueId === tab.id} title={tab.description} key={tab.id} onClick={() => selectQueue(tab.id)}>{tab.label} {tab.count}</button>)}</nav>
          {reviewListMessage ? <p className="ed-inline-success">{reviewListMessage}</p> : null}
          <div className="ed-review-list-tools" aria-label="Review queue paging controls">
            <button className="ed-sort" type="button" onClick={() => { setSortOrder((order) => order === "oldest" ? "newest" : "oldest"); setCurrentPage(1); }}>Sort by: {sortOrder === "oldest" ? "Oldest First" : "Newest First"} <ChevronDown size={14} /></button>
            <label className="ed-page-size">
              <span>Rows per page</span>
              <select
                aria-label="Rows per review queue page"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
              >
                {reviewQueuePageSizeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>
          <p className="ed-review-page-status">{queue.length ? `${(pageStart + 1).toLocaleString()}-${pageEnd.toLocaleString()} of ${queue.length.toLocaleString()}` : "No review records"}</p>
          {pagedQueue.map((asset) => {
            const recordAgeDays = reviewWaitingDays(asset);
            return <button className={cn("ed-queue-item", selectedAsset?.id === asset.id && "is-active")} type="button" key={asset.id} onClick={() => setSelectedId(asset.id)}><AssetThumb asset={asset} /><span><strong title={displayTitle(asset)}>{displayTitle(asset)}</strong><small>{assetType(asset)} · {asset.imageDimensions || "No dimensions"} · {formatBytes(asset.fileSizeBytes)}</small><small>ResourceSpace {assetRecordRef(asset)}{recordAgeDays ? ` · ${recordAgeDays}d record age` : ""}</small><StatusBadge status={assetEnterpriseStatus(asset)} />{pendingDecisionById[asset.id] || asset.pendingReviewWrite ? <em>Pending sync to ResourceSpace</em> : null}</span></button>;
          })}
          <nav className="ed-review-pager" aria-label="Review queue pages">
            <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safeCurrentPage === 1}>Previous</button>
            <span>Page {safeCurrentPage} of {pageCount}</span>
            <button type="button" onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={safeCurrentPage === pageCount}>Next</button>
          </nav>
        </aside>
        {selectedAsset ? (
          <>
            <main className="ed-review-canvas">
              <div className="ed-breadcrumb">Review Queue <span>›</span> ResourceSpace {assetRecordRef(selectedAsset)}</div>
              <header className="ed-detail-header"><div><h1 title={displayTitle(selectedAsset)}>{displayTitle(selectedAsset)}</h1><span className="ed-file-soft">{assetType(selectedAsset)}</span></div><div className="ed-chip-row">{[selectedAsset.collection, selectedAsset.usageScope].filter(Boolean).map((chip) => <span key={chip}>{chip}</span>)}<StatusBadge status={selectedStatus} />{selectedPending ? <StatusBadge status="Read-only" /> : null}</div><div className="ed-detail-actions"><IconButton label="Favorite" onClick={() => queuePortalNote("Favorite for reviewer follow-up")}><Star size={18} /></IconButton><IconButton label="Download" onClick={requestGatedDownload}><Download size={18} /></IconButton><IconButton label={previewExpanded ? "Collapse preview" : "Expand preview"} onClick={() => setPreviewExpanded((expanded) => !expanded)}><Grid3X3 size={18} /></IconButton></div></header>
              <section className="ed-review-next-action">
                <span><ArrowRightCircle size={18} /> Next best action</span>
                <strong>{selectedGuidance.nextBestAction}</strong>
                <p>{selectedGuidance.blockedExplanation}</p>
              </section>
              <div className={cn("ed-hero-preview is-review", previewExpanded && "is-expanded")}><AssetThumb asset={selectedAsset} fit="contain" /><span>{selectedAsset.imageDimensions || "Preview unavailable or not provided"}</span><button type="button" onClick={() => setPreviewExpanded((expanded) => !expanded)}>{previewExpanded ? "Fit" : "100%"}</button></div>
              <nav className="ed-tabs is-large" role="tablist" aria-label="Review workbench sections">{reviewWorkbenchTabs.map((tab) => <button className={activeWorkbenchTab === tab ? "is-active" : ""} type="button" role="tab" aria-selected={activeWorkbenchTab === tab} key={tab} onClick={() => setActiveWorkbenchTab(tab)}>{tab}</button>)}</nav>
              <section className="ed-card ed-metadata-card"><dl className="ed-metadata is-two">{reviewMetadataRows({ asset: selectedAsset, pendingAction: selectedPending?.action }).map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl></section>
              <div className="ed-review-cards"><section className="ed-card"><h3>Metadata Completeness</h3><div className="ed-score-ring">{metadataCompleteness.percent}%</div><p>{metadataCompleteness.label} ready from exported ResourceSpace metadata.</p>{selectedGuidance.missingFields.length ? <p className="ed-review-missing">Gaps: {selectedGuidance.missingFields.slice(0, 4).join(", ")}{selectedGuidance.missingFields.length > 4 ? "..." : ""}</p> : <p className="ed-inline-success">No required exported metadata gaps detected.</p>}</section><section className="ed-card"><h3>Risk Signals</h3>{selectedGuidance.riskFlags.slice(0, 5).map((row, index) => <p className="ed-checkline" key={`${row}-${index}`}><ShieldAlert size={16} />{row}</p>)}{selectedGuidance.riskFlags.length > 5 ? <p className="ed-review-muted">+{selectedGuidance.riskFlags.length - 5} more signals</p> : null}</section><section className="ed-card"><h3>Review Policy</h3><p>ResourceSpace remains final approval truth.</p><p>{selectedPending || selectedAsset.pendingReviewWrite ? "Pending sync to ResourceSpace." : "No pending sync."}</p><p className={cn("ed-sync-honesty", `is-${selectedGuidance.syncTone}`)}>{selectedGuidance.syncHonesty}</p></section></div>
            </main>
            <aside className="ed-review-rail">
              <section className="ed-card"><h3>Review Evidence</h3><p className={cn("ed-review-lock", evidenceCompletion.completed === evidenceCompletion.total && "is-complete")}><strong>{evidenceCompletion.completed}/{evidenceCompletion.total}</strong> checks complete</p><div className="ed-evidence-meter" aria-label={`${evidenceCompletion.completed} of ${evidenceCompletion.total} review checks complete`}><span style={{ width: `${Math.round((evidenceCompletion.completed / evidenceCompletion.total) * 100)}%` }} /></div><dl className="ed-metadata">{reviewEvidenceRows({ asset: selectedAsset, currentStatus: selectedStatus, pendingStatus: selectedPending?.status }).map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl>{selectedGuidance.approveMissingLabels.length ? <p className="ed-review-missing">Approval needs: {selectedGuidance.approveMissingLabels.slice(0, 5).join(", ")}{selectedGuidance.approveMissingLabels.length > 5 ? "..." : ""}</p> : <p className="ed-inline-success">Evidence packet can be queued for approval review.</p>}<div className="ed-evidence-checks">{reviewChecklistItems.map((item) => <label className={checklist[item.field] ? "is-complete" : ""} key={item.field}><input type="checkbox" checked={checklist[item.field]} onChange={() => toggleChecklist(item.field)} /><span><strong>{item.label}</strong><small>{item.hint}</small></span></label>)}</div><ActionButton icon={FileText} onClick={() => queuePortalNote("Submission package review requested")}>View Submission Package</ActionButton></section>
              <section className="ed-card ed-review-assist"><h3>Reviewer Assist</h3><p><ArrowRightCircle size={16} />{selectedGuidance.nextBestAction}</p><p><Clock3 size={16} />{reviewWaitingDays(selectedAsset) ? `${reviewWaitingDays(selectedAsset)}d record age from exported dates.` : "Record age unavailable."}</p><p><ShieldCheck size={16} />Public approval stays blocked until all evidence is checked and note is specific.</p></section>
              <section className="ed-card"><header className="ed-card-head"><h3>Comments</h3><button type="button" onClick={() => setComment("")}>Clear</button></header><p className="ed-comment"><strong>ResourceSpace note</strong> {selectedAsset.rightsNotes || "No exported note."}</p>{decisionMessage ? <p className="ed-inline-success">{decisionMessage}</p> : null}<textarea className="ed-input ed-review-note" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add reviewer, scope, evidence link, and reason..." aria-label="Add review comment" /></section>
              <section className="ed-card"><h3>Assignment</h3><p>Loaded from ResourceSpace review queue. Final write is pending until adapter sync is verified.</p><button className="ed-link-button" type="button" onClick={() => queuePortalNote("Reassignment requested")}>Reassign</button></section>
              <section className="ed-card ed-decision-card"><h3>Review Decision</h3><p className="ed-setup-note">ResourceSpace is final truth. This button attempts live writeback only through the existing review API; otherwise it records a portal pending-sync event.</p>{evidenceCompletion.missingLabels.length ? <p className="ed-review-missing">{selectedGuidance.blockedExplanation}</p> : null}<p className={cn("ed-sync-honesty", `is-${selectedGuidance.syncTone}`)}>{selectedGuidance.syncHonesty}</p>{reviewDecisionActions.map((item) => { const DecisionIcon = reviewDecisionIcon[item.icon]; const disabledReason = reviewDecisionDisabledReason(item.action, checklist, comment); return <button className={cn(item.tone === "approve" && "is-approve", item.tone === "restrict" && "is-restrict", selectedPending?.status === item.status && "is-selected")} key={item.id} onClick={() => decide(item.status, item.action)} disabled={Boolean(disabledReason)} title={disabledReason || item.helper}><DecisionIcon />{item.label}<span>{disabledReason || item.helper}</span></button>; })}<button className="ed-more-actions-trigger" type="button" aria-expanded={moreActionsOpen} onClick={() => setMoreActionsOpen((open) => !open)}>More Actions <ChevronDown size={14} /></button>{moreActionsOpen ? <div className="ed-more-actions-menu" role="menu"><button type="button" onClick={() => queuePortalNote("Escalate to DAM Admin")}>Escalate to DAM Admin<span>Queue a portal note for admin follow-up.</span></button><button type="button" onClick={() => queuePortalNote("Flag possible duplicate")}>Flag possible duplicate<span>Mark for duplicate review without changing ResourceSpace.</span></button><button type="button" onClick={() => queuePortalNote("Request source verification")}>Request source verification<span>Ask for source/custody evidence before decision.</span></button></div> : null}</section>
            </aside>
          </>
        ) : <main><ErrorCard message="No reviewable ResourceSpace records found." source={review.source} /></main>}
      </div>
    </div>
  );
}
