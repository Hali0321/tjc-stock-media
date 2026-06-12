"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ChevronDown, Download, FileText, Lock, PackageCheck, Share2, Star } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { useAssetDetail, useDownloadGate, useReviewRequest } from "@/components/dam/useDamApi";
import { assetHasRenditionGap } from "@/lib/asset-governance";
import { assetDetailTabs, isActivityTab } from "@/lib/asset-record-workbench";
import { assetRecordRef, assetType, displayTitle } from "@/lib/enterprise-display";
import { assetDetailMetadataRows, assetKeywordText } from "@/lib/enterprise-metadata";
import { presentAssetDetailContext } from "@/lib/portal-context-presenters";
import { routeWithRole } from "@/lib/role-routes";
import { cn } from "@/lib/ui";
import { ActionButton, AssetThumb, ErrorCard, LoadingCard, RightsVerdictCard, SourcePill } from "./EnterpriseShared";

function confidenceLabel(value: string) {
  return value.replace(/_/g, " ");
}

const LOW_RES_LONG_EDGE = 1600;
const LOW_RES_SHORT_EDGE = 900;

function parseDimensions(value?: string) {
  const match = value?.match(/(\d{2,5})\D+(\d{2,5})/);
  if (!match) return null;
  const width = Number.parseInt(match[1], 10);
  const height = Number.parseInt(match[2], 10);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  return { width, height };
}

function isLowResolution(dimensions: ReturnType<typeof parseDimensions>) {
  if (!dimensions) return false;
  const longEdge = Math.max(dimensions.width, dimensions.height);
  const shortEdge = Math.min(dimensions.width, dimensions.height);
  return longEdge < LOW_RES_LONG_EDGE || shortEdge < LOW_RES_SHORT_EDGE;
}

export function EnterpriseAssetDetailPage({ id }: { id: string }) {
  const { role } = useDemoRole();
  const detail = useAssetDetail(id, role);
  const downloadGate = useDownloadGate(id, role);
  const reviewRequest = useReviewRequest(id, role);
  const [tab, setTab] = useState(assetDetailTabs[0]);
  const [downloadMessage, setDownloadMessage] = useState("");
  const [assetActionMessage, setAssetActionMessage] = useState("");
  const [assetActionPending, setAssetActionPending] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const asset = detail.data?.asset;
  const related = detail.data?.related || [];
  if (detail.loading) return <div className="enterprise-page"><LoadingCard label="Loading media asset record..." /></div>;
  if (detail.error || !asset) return <div className="enterprise-page"><ErrorCard message={detail.error || "Asset not found."} source={detail.source} /></div>;
  const metadataRows = assetDetailMetadataRows(asset, role);
  const presentation = presentAssetDetailContext(asset, role, detail.source);
  const reusePacket = presentation.packet;
  const approved = presentation.approved;
  const actionLabel = assetActionPending ? "Queueing review..." : presentation.requestReviewLabel;
  const parsedDimensions = parseDimensions(asset.imageDimensions);
  const lowResolutionPreview = asset.mediaType === "photo" && isLowResolution(parsedDimensions);
  const limitedDerivative = assetHasRenditionGap(asset);
  const derivativeStatus = !asset.thumbnail
    ? "Preview unavailable"
    : limitedDerivative
      ? "Derivative limited"
      : lowResolutionPreview
        ? "Low-res derivative"
        : approved
          ? "Approved derivative"
          : "Role-safe derivative";
  const summaryFacts = presentation.summaryFacts;
  const hasVersionData = Boolean(asset.originalFilename || asset.duplicateRole || asset.duplicateGroup);
  const activityItems = [
    asset.reviewedDate ? `Reviewed ${asset.reviewedDate} by ${asset.reviewer || "review team"}` : "",
    asset.pendingReviewWrite ? "Pending sync to ResourceSpace" : "",
    downloadMessage
  ].filter(Boolean);
  const requestReview = async () => {
    if (assetActionPending) return;
    setAssetActionPending(true);
    setAssetActionMessage("");
    const result = await reviewRequest.requestReview({
      notes: `DAM review requested from Asset Detail for ${displayTitle(asset)}. Reason: ${asset.reuseDecision?.summary || reusePacket.viewerVerdict.reason || "Usage decision requires reviewer confirmation."}`
    });
    setAssetActionPending(false);
    if (!result.ok) {
      setAssetActionMessage(`Review request failed: ${result.error || "Reviewer queue did not accept this request."}`);
      return;
    }
    const queueReference = result.pendingWriteId || result.pendingWrite?.id;
    setAssetActionMessage(`${result.message || "Review request queued for reviewer follow-up."}${queueReference ? ` Queue id: ${queueReference}.` : ""}`);
    detail.refresh();
  };
  const requestApprovedDownload = async () => {
    const result = await downloadGate.requestDownload({ termsAccepted: true, usageChannel: "portal", reason: `Asset detail approved-copy request for ${displayTitle(asset)}` });
    setDownloadMessage(result.allowed ? `Download gate allowed. Audit ${result.auditId || "recorded"}.` : `Download blocked: ${result.reason || result.requiredAction || "Not allowed"}.`);
    if (result.allowed && result.downloadUrl) window.location.href = result.downloadUrl;
  };
  const canOpenResourceSpace = reusePacket.access.viewResourceSpaceAdminLink.allowed;
  return (
    <div className="enterprise-page enterprise-detail">
      <div className="ed-detail-layout">
        <main>
          <header className="ed-detail-header">
            <div className="ed-detail-title-block">
              <nav className="ed-breadcrumb" aria-label="Breadcrumb">
                <Link href={routeWithRole("/", role)}>Library</Link>
                <span aria-hidden="true">/</span>
                <span>Asset {assetRecordRef(asset)}</span>
              </nav>
              <h1 title={displayTitle(asset)}>{displayTitle(asset)}</h1>
              <p className="ed-asset-summary-line">
                {summaryFacts.map((fact, index) => (
                  <Fragment key={fact}>
                    {index ? <span className="ed-fact-separator" aria-hidden="true"> · </span> : null}
                    <span>{fact}</span>
                  </Fragment>
                ))}
              </p>
            </div>
            <div className="ed-detail-actions">
              <ActionButton icon={FileText} onClick={requestReview} disabled={assetActionPending}>{actionLabel}</ActionButton>
              <div className="ed-action-menu-wrap">
                <ActionButton onClick={() => setActionsOpen((open) => !open)}>More actions <ChevronDown size={14} /></ActionButton>
                {actionsOpen ? (
                  <div className="ed-more-actions-menu ed-detail-actions-menu" role="menu">
                    {approved ? <button type="button" role="menuitem" onClick={() => { void requestApprovedDownload(); setActionsOpen(false); }}><Download size={15} />Download approved copy<span>Runs backend gate and audit before delivery.</span></button> : null}
                    <button type="button" role="menuitem" onClick={() => { setAssetActionMessage("Favorite saved for this beta session."); setActionsOpen(false); }}><Star size={15} />Favorite<span>Save this record for this beta session.</span></button>
                    <button type="button" role="menuitem" onClick={() => { setTab("Activity"); setActionsOpen(false); }}><FileText size={15} />View activity<span>Open exported activity and review notes.</span></button>
                    <button type="button" role="menuitem" onClick={() => { setAssetActionMessage("Share links wait for identity and access policy. No public link was created."); setActionsOpen(false); }}><Share2 size={15} />Share options<span>Policy-backed links are not connected yet.</span></button>
                    <button type="button" role="menuitem" onClick={() => { setAssetActionMessage("Use Package Builder to add media references without copying originals."); setActionsOpen(false); }}><PackageCheck size={15} />Add to package<span>Collect reference without moving source files.</span></button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>
          {assetActionMessage ? <p className="ed-inline-success">{assetActionMessage}</p> : null}
          <section className={cn("ed-detail-preview-workbench", lowResolutionPreview && "is-low-resolution", limitedDerivative && "has-limited-derivative")} aria-label="Role-safe media preview workbench">
            <div className="ed-hero-preview">
              <AssetThumb asset={asset} fit="contain" className="ed-detail-preview-media" />
              <div className="ed-preview-caption" aria-label="Preview derivative facts">
                <span>Preview only · Zoom unavailable until safe derivative is exported</span>
                <span>{derivativeStatus} · {asset.imageDimensions || "Dimensions not provided"}</span>
              </div>
            </div>
          </section>
          <nav className="ed-tabs is-large" aria-label="Asset record tabs">{assetDetailTabs.map((item) => <button className={cn(tab === item && "is-active")} type="button" key={item} onClick={() => setTab(item)}>{item}</button>)}</nav>
          <section className="ed-card ed-metadata-card">
            {tab === "Metadata" ? <dl className="ed-metadata is-two">{metadataRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : null}
            {tab === "Keywords" ? <div className="ed-chip-row">{assetKeywordText(asset) !== "Not provided" ? [...(asset.tags || []), ...(asset.tjcTerms || [])].map((keyword) => <span key={keyword}>{keyword}</span>) : <p>Not provided in the current data source.</p>}</div> : null}
            {tab === "AI Insights" ? <div className="ed-two-col"><p>AI suggestions are not live. Approved metadata remains review truth.</p><p>Human review controls usage, people visibility, rights, and reuse scope.</p></div> : null}
            {tab === "Comments" ? <div className="ed-comment-stack"><p className="ed-comment"><strong>Review note</strong> {asset.rightsNotes || "No reviewer note exported."}</p><input className="ed-input" aria-label="Add asset comment" placeholder="Add a local follow-up note..." /></div> : null}
            {isActivityTab(tab) ? <div className="ed-table-mini">{[asset.reviewedDate ? `Reviewed ${asset.reviewedDate} by ${asset.reviewer || "review team"}` : "Review activity not provided", asset.pendingReviewWrite ? "Pending sync to ResourceSpace" : "No pending write", downloadMessage || "No download gate action this session"].map((item) => <p key={item}>{item}</p>)}</div> : null}
          </section>
          <section className="ed-card"><header className="ed-card-head"><h3>Related Media</h3><span>{related.length} results</span></header><div className="ed-related-strip">{related.length ? related.slice(0, 5).map((item) => <AssetThumb asset={item} key={item.id} />) : <p>No related media records found.</p>}</div></section>
        </main>
        <aside className="ed-detail-rail">
          <RightsVerdictCard asset={asset} source={detail.source} onRequestReview={() => { void requestReview(); }} />
          <section className="ed-card"><h3>Rights & Restrictions</h3><dl className="ed-metadata">{presentation.rightsRows.map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl></section>
          <section className="ed-card"><h3>Source & File Facts</h3><SourcePill source={detail.source} live={detail.live} /><dl className="ed-metadata">{presentation.sourceRows.map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl>{canOpenResourceSpace && detail.data?.resourceSpaceUrl ? <a href={detail.data.resourceSpaceUrl}>Open in ResourceSpace ↗</a> : null}</section>
          <section className="ed-card"><h3>Review Confidence</h3><dl className="ed-metadata">{presentation.confidenceRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{confidenceLabel(String(value))}</dd></div>)}</dl></section>
          {hasVersionData ? <section className="ed-card"><header className="ed-card-head"><h3>Versions</h3></header><dl className="ed-metadata">{[
            ["Original file", asset.originalFilename || "Not provided"],
            ["Duplicate role", asset.duplicateRole || "Not provided"],
            ["Duplicate group", asset.duplicateGroup || "Not provided"]
          ].map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl></section> : null}
          <section className="ed-card"><header className="ed-card-head"><h3>Recent Activity</h3></header>{activityItems.length ? <div className="ed-table-mini">{activityItems.map((item) => <p key={item}>{item}</p>)}</div> : <p className="ed-empty-copy">No review activity provided.</p>}</section>
        </aside>
      </div>
      {!approved ? (
        <div className="ed-sticky-action-bar is-blocked">
          <div><Lock size={18} /><span><strong>{presentation.canUseTitle}</strong></span></div>
          <ActionButton icon={FileText} onClick={requestReview} disabled={assetActionPending}>{assetActionPending ? "Queueing review..." : "Request DAM review"}</ActionButton>
          <ActionButton onClick={() => setAssetActionMessage("More actions are limited until policy-backed actions are connected.")}>More actions <ChevronDown size={14} /></ActionButton>
        </div>
      ) : null}
    </div>
  );
}
