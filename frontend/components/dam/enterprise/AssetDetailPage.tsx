"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Download, FileText, Grid3X3, Lock, PackageCheck, Search, Share2, ShieldCheck, Star } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { useAssetDetail, useDownloadGate } from "@/components/dam/useDamApi";
import { assetDetailTabs, isActivityTab } from "@/lib/asset-record-workbench";
import { assetType, displayTitle, sourceNoun } from "@/lib/enterprise-display";
import { assetDetailMetadataRows, assetKeywordText, rightsRestrictionRows } from "@/lib/enterprise-metadata";
import { assetEnterpriseStatus } from "@/lib/enterprise-status";
import { cn } from "@/lib/ui";
import { ActionButton, AssetThumb, ErrorCard, IconButton, LoadingCard, RightsVerdictCard, SourcePill } from "./EnterpriseShared";

export function EnterpriseAssetDetailPage({ id }: { id: string }) {
  const { role } = useDemoRole();
  const detail = useAssetDetail(id, role);
  const downloadGate = useDownloadGate(id, role);
  const [tab, setTab] = useState(assetDetailTabs[0]);
  const [downloadMessage, setDownloadMessage] = useState("");
  const asset = detail.data?.asset;
  const related = detail.data?.related || [];
  const approved = asset?.reuseDecision?.downloadable || assetEnterpriseStatus(asset) === "Approved";
  if (detail.loading) return <div className="enterprise-page"><LoadingCard label="Loading media asset record..." /></div>;
  if (detail.error || !asset) return <div className="enterprise-page"><ErrorCard message={detail.error || "Asset not found."} source={detail.source} /></div>;
  const metadataRows = assetDetailMetadataRows(asset, role);
  return (
    <div className="enterprise-page enterprise-detail">
      <div className="ed-breadcrumb">Library <span>›</span> {sourceNoun(detail.source)} <span>›</span> {asset.resourceSpaceId || asset.id}</div>
      <div className="ed-detail-layout">
        <main>
          <header className="ed-detail-header">
            <div><h1 title={displayTitle(asset)}>{displayTitle(asset)}</h1><span className="ed-file-soft">{assetType(asset)}</span></div>
            <div className="ed-chip-row">{[asset.collection, asset.status, asset.usageScope].filter(Boolean).slice(0, 4).map((chip) => <span key={chip}>{chip}</span>)}<SourcePill source={detail.source} live={detail.live} /></div>
            <div className="ed-detail-actions"><IconButton label="Favorite"><Star size={18} /></IconButton><IconButton label="Download"><Download size={18} /></IconButton><IconButton label="Versions"><FileText size={18} /></IconButton><IconButton label="Share"><Share2 size={18} /></IconButton><IconButton label="Fullscreen"><Grid3X3 size={18} /></IconButton></div>
          </header>
          <div className="ed-hero-preview"><AssetThumb asset={asset} fit="contain" /><span>{asset.imageDimensions || "Preview unavailable or not provided"}</span><button><Search size={18} /></button></div>
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
          <RightsVerdictCard asset={asset} source={detail.source} />
          <section className="ed-card"><h3>Rights & Restrictions</h3><dl className="ed-metadata">{rightsRestrictionRows(asset).map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl>{detail.data?.resourceSpaceUrl ? <a href={detail.data.resourceSpaceUrl}>Open in ResourceSpace ↗</a> : null}</section>
          <section className="ed-card"><header className="ed-card-head"><h3>Versions</h3></header><p>Versions/alternates are not provided by the current ResourceSpace export.</p></section>
          <section className="ed-card"><header className="ed-card-head"><h3>Recent Activity</h3></header><p className="ed-activity"><CheckCircle2 size={16} />{asset.reviewedDate ? `Reviewed by ${asset.reviewer || "ResourceSpace"}` : "No review activity exported"}<small>{asset.reviewedDate || "Not provided"}</small></p></section>
        </aside>
      </div>
      <div className={cn("ed-sticky-action-bar", !approved && "is-blocked")}>
        <div>{approved ? <ShieldCheck size={28} /> : <Lock size={28} />}<span><strong>{approved ? "Approved for use" : "Review required before use"}</strong><small>{approved ? "Download still goes through backend gate." : "Approved copy is blocked until evidence clears."}</small></span></div>
        {approved ? <ActionButton tone="primary" icon={Download} onClick={async () => {
          const result = await downloadGate.requestDownload({ termsAccepted: true, usageChannel: "portal", reason: `Asset detail approved-copy request for ${displayTitle(asset)}` });
          setDownloadMessage(result.allowed ? `Download gate allowed. Audit ${result.auditId || "recorded"}.` : `Download blocked: ${result.reason || result.requiredAction || "Not allowed"}.`);
          if (result.allowed && result.downloadUrl) window.location.href = result.downloadUrl;
        }}>Download approved copy</ActionButton> : <ActionButton icon={FileText}>Request DAM review</ActionButton>}
        <ActionButton icon={PackageCheck}>Add to package</ActionButton>
        <ActionButton icon={Share2}>Create share link</ActionButton>
        <ActionButton>More actions <ChevronDown size={14} /></ActionButton>
      </div>
    </div>
  );
}
