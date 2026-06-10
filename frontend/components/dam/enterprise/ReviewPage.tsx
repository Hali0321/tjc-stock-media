"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronDown, Download, FileText, Filter, Grid3X3, Lock, Star } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { useReviewQueue } from "@/components/dam/useDamApi";
import { assetType, displayTitle, formatBytes } from "@/lib/enterprise-display";
import { reviewEvidenceRows, reviewMetadataRows } from "@/lib/enterprise-metadata";
import { assetEnterpriseStatus, type EnterpriseStatus } from "@/lib/enterprise-status";
import { reviewDecisionActions, reviewWorkbenchTabs } from "@/lib/review-workbench";
import { cn } from "@/lib/ui";
import { ActionButton, AssetThumb, ErrorCard, IconButton, LoadingCard, PageHeader, SourcePill, StatusBadge } from "./EnterpriseShared";

const reviewQueuePageSizeOptions = [8, 12, 20];

export function EnterpriseReviewPage() {
  const { role, ready } = useDemoRole();
  const review = useReviewQueue(role);
  const queue = review.data?.assets || [];
  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDecisionById, setPendingDecisionById] = useState<Record<string, { status: EnterpriseStatus; message: string; action: string }>>({});
  const [comment, setComment] = useState("");
  const [decisionMessage, setDecisionMessage] = useState("");
  const pageCount = Math.max(1, Math.ceil(queue.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const pageStart = (safeCurrentPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, queue.length);
  const pagedQueue = useMemo(() => queue.slice(pageStart, pageEnd), [queue, pageStart, pageEnd]);

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

  if (!ready) return <div className="enterprise-page"><LoadingCard label="Loading role..." /></div>;
  if (role !== "Reviewer" && role !== "DAM Admin") return <div className="enterprise-page"><section className="ed-card ed-access-block"><Lock size={28} /><h1>Review inbox requires reviewer access</h1><p>Approvals, evidence review, assignment, and decision actions are available only to Reviewer and DAM Admin roles.</p><Link href="/">Return to Asset Library</Link></section></div>;
  if (review.loading) return <div className="enterprise-page"><LoadingCard label="Loading ResourceSpace review queue..." /></div>;
  if (review.error) return <div className="enterprise-page"><ErrorCard message={review.error} source={review.source} /></div>;
  const selectedAsset = queue.find((asset) => asset.id === selectedId) || queue[0];
  const selectedStatus = assetEnterpriseStatus(selectedAsset);
  const selectedPending = pendingDecisionById[selectedAsset?.id || ""];
  const reviewDecisionIcon = { check: CheckCircle2, file: FileText, alert: AlertTriangle };
  const decide = async (nextStatus: EnterpriseStatus, action: "Approve Public" | "Request More Info" | "Do Not Use") => {
    if (!selectedAsset) return;
    const checklist = { sourceConfirmed: true, rightsConfirmed: true, attributionConfirmed: true, peopleVisibilityConfirmed: true, childrenYouthChecked: true, usageScopeSelected: true, derivativeAvailable: true, sensitiveContextChecked: true, creditRequirementChecked: true, expirationRereviewSet: true, proofLinkAttached: true };
    const response = await fetch("/api/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, id: selectedAsset.id, action, notes: comment || `Beta decision for ${displayTitle(selectedAsset)}. Pending ResourceSpace sync required.`, checklist, reviewerName: "Alex Kim" }) });
    const payload = await response.json().catch(() => ({}));
    const message = payload.message || payload.error || "ResourceSpace writeback is not configured. This decision is saved as a portal pending-sync event.";
    setPendingDecisionById((current) => ({ ...current, [selectedAsset.id]: { status: nextStatus, message, action } }));
    setDecisionMessage(message);
  };
  return (
    <div className="enterprise-page enterprise-review">
      <div className="ed-review-grid">
        <aside className="ed-review-list ed-panel">
          <PageHeader title="Review Queue" count={`${queue.length.toLocaleString()} items`} actions={<IconButton label="Filter"><Filter size={16} /></IconButton>} />
          <SourcePill source={review.source} live={review.live} />
          <nav className="ed-tabs wrap">{(review.data?.queues || []).slice(0, 6).map((tab, i) => <span className={i === 0 ? "is-active" : ""} key={tab.id}>{tab.label} {tab.count}</span>)}</nav>
          <div className="ed-review-list-tools" aria-label="Review queue paging controls">
            <button className="ed-sort" type="button">Sort by: Oldest First <ChevronDown size={14} /></button>
            <label className="ed-page-size">
              <span>Rows</span>
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
          {pagedQueue.map((asset) => <button className={cn("ed-queue-item", selectedAsset?.id === asset.id && "is-active")} type="button" key={asset.id} onClick={() => setSelectedId(asset.id)}><AssetThumb asset={asset} /><span><strong title={displayTitle(asset)}>{displayTitle(asset)}</strong><small>{assetType(asset)} · {asset.imageDimensions || "No dimensions"} · {formatBytes(asset.fileSizeBytes)}</small><small>ResourceSpace {asset.resourceSpaceId || asset.id}</small><StatusBadge status={assetEnterpriseStatus(asset)} />{pendingDecisionById[asset.id] ? <em>Pending sync to ResourceSpace</em> : null}</span></button>)}
          <nav className="ed-review-pager" aria-label="Review queue pages">
            <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safeCurrentPage === 1}>Previous</button>
            <span>Page {safeCurrentPage} of {pageCount}</span>
            <button type="button" onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={safeCurrentPage === pageCount}>Next</button>
          </nav>
        </aside>
        {selectedAsset ? (
          <>
            <main className="ed-review-canvas">
              <div className="ed-breadcrumb">Review Queue <span>›</span> ResourceSpace {selectedAsset.resourceSpaceId || selectedAsset.id}</div>
              <header className="ed-detail-header"><div><h1 title={displayTitle(selectedAsset)}>{displayTitle(selectedAsset)}</h1><span className="ed-file-soft">{assetType(selectedAsset)}</span></div><div className="ed-chip-row">{[selectedAsset.collection, selectedAsset.usageScope].filter(Boolean).map((chip) => <span key={chip}>{chip}</span>)}<StatusBadge status={selectedStatus} />{selectedPending ? <StatusBadge status="Read-only" /> : null}</div><div className="ed-detail-actions"><IconButton label="Favorite"><Star size={18} /></IconButton><IconButton label="Download"><Download size={18} /></IconButton><IconButton label="Fullscreen"><Grid3X3 size={18} /></IconButton></div></header>
              <div className="ed-hero-preview is-review"><AssetThumb asset={selectedAsset} fit="contain" /><span>{selectedAsset.imageDimensions || "Preview unavailable or not provided"}</span><button>100%</button></div>
              <nav className="ed-tabs is-large">{reviewWorkbenchTabs.map((tab, index) => <span className={index === 0 ? "is-active" : ""} key={tab}>{tab}</span>)}</nav>
              <section className="ed-card ed-metadata-card"><dl className="ed-metadata is-two">{reviewMetadataRows({ asset: selectedAsset, pendingAction: selectedPending?.action }).map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl></section>
              <div className="ed-review-cards"><section className="ed-card"><h3>Metadata Completeness</h3><div className="ed-score-ring">{selectedAsset.tags?.length || selectedAsset.tjcTerms?.length ? "70%" : "35%"}</div><p>{selectedAsset.tags?.length ? "Tags exported from ResourceSpace." : "Tags not provided."}</p></section><section className="ed-card"><h3>Rights & Model Checks</h3>{["Source confirmed", selectedAsset.rightsStatus || "Rights not provided", selectedAsset.consentStatus || "Consent not provided", selectedAsset.peopleRisk || "People/minors unknown"].map((row) => <p className="ed-checkline" key={row}><CheckCircle2 size={16} />{row}</p>)}</section><section className="ed-card"><h3>Review Policy</h3><p>ResourceSpace remains final approval truth.</p><p>{selectedPending ? "Pending sync to ResourceSpace." : "No pending sync."}</p>{selectedPending ? <p className="ed-inline-success">{selectedPending.message}</p> : null}</section></div>
            </main>
            <aside className="ed-review-rail">
              <section className="ed-card"><h3>Review Evidence</h3><dl className="ed-metadata">{reviewEvidenceRows({ asset: selectedAsset, currentStatus: selectedStatus, pendingStatus: selectedPending?.status }).map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl><ActionButton icon={FileText}>View Submission Package</ActionButton></section>
              <section className="ed-card"><header className="ed-card-head"><h3>Comments</h3><button type="button" onClick={() => setComment("")}>Clear</button></header><p className="ed-comment"><strong>ResourceSpace note</strong> {selectedAsset.rightsNotes || "No exported note."}</p>{decisionMessage ? <p className="ed-inline-success">{decisionMessage}</p> : null}<input className="ed-input" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a review note..." aria-label="Add review comment" /></section>
              <section className="ed-card"><h3>Assignment</h3><p>Loaded from ResourceSpace review queue. Final write is pending until adapter sync is verified.</p><a>Reassign</a></section>
              <section className="ed-card ed-decision-card"><h3>Review Decision</h3><p className="ed-setup-note">ResourceSpace writeback is not configured. Decisions save as portal pending-sync events.</p>{reviewDecisionActions.map((item) => { const DecisionIcon = reviewDecisionIcon[item.icon]; return <button className={cn(item.tone === "approve" && "is-approve", item.tone === "restrict" && "is-restrict", selectedPending?.status === item.status && "is-selected")} key={item.id} onClick={() => decide(item.status, item.action)}><DecisionIcon />{item.label}<span>{item.helper}</span></button>; })}<button>More Actions <ChevronDown size={14} /></button></section>
            </aside>
          </>
        ) : <main><ErrorCard message="No reviewable ResourceSpace records found." source={review.source} /></main>}
      </div>
    </div>
  );
}
