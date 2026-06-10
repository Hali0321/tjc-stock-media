"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Box,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Cloud,
  Database,
  Download,
  Eye,
  FileText,
  Filter,
  Folder,
  Grid3X3,
  HardDrive,
  Lock,
  MoreHorizontal,
  PackageCheck,
  Plus,
  Search,
  Settings,
  Share2,
  Shield,
  ShieldCheck,
  Star,
  UploadCloud,
  Users,
  type LucideIcon
} from "lucide-react";
import type { DamReadinessResult, DemoRole, MediaSourceStatus, StockMediaAsset } from "@/lib/types";
import { useDemoRole } from "@/components/RoleProvider";
import { assetDate, assetType, displayTitle, formatBytes, metadataQualityLabel, recordIdLabel, sourceLabel, sourceNoun } from "@/lib/enterprise-display";
import { assetEnterpriseStatus, statusToneClass, type EnterpriseStatus } from "@/lib/enterprise-status";
import { mediaSourceIsLive } from "@/lib/media-source/truth";
import { addPackageAssetRef, availableAssetsForSection, createPackageDraft, packagePublishReadiness, removePackageAssetRef, resolvePackageSections, seedPackageDraft, updatePackageTitle } from "@/lib/package-drafts";
import { cn } from "@/lib/ui";
import { useAdminReadiness, useAssetDetail, useAssetsSearch, useBrandKit, useDownloadGate, useReviewQueue } from "@/components/dam/useDamApi";

function StatusBadge({ status }: { status: EnterpriseStatus }) {
  return <span className={cn("ed-badge", statusToneClass(status))}>{status}</span>;
}

function IconButton({ label, children, onClick }: { label: string; children: ReactNode; onClick?: () => void }) {
  return <button className="ed-icon-button" type="button" aria-label={label} onClick={onClick}>{children}</button>;
}

function ActionButton({ children, tone = "secondary", icon: Icon, onClick, disabled = false }: { children: ReactNode; tone?: "primary" | "secondary" | "dark"; icon?: LucideIcon; onClick?: () => void; disabled?: boolean }) {
  return (
    <button className={cn("ed-action", tone === "primary" && "is-primary", tone === "dark" && "is-dark")} type="button" onClick={onClick} disabled={disabled}>
      {Icon ? <Icon size={16} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

function PageHeader({ title, subtitle, count, actions }: { title: string; subtitle?: string; count?: string; actions?: ReactNode }) {
  return (
    <header className="ed-page-header">
      <div>
        <h1>{title} {count ? <span>{count}</span> : null}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="ed-page-actions">{actions}</div> : null}
    </header>
  );
}

function SourcePill({ source, live }: { source?: MediaSourceStatus | null; live?: boolean }) {
  return <span className={cn("ed-source-pill", live && "is-live", source?.adapter === "demo-fallback" && "is-fallback")}>{sourceLabel(source)}</span>;
}

function LoadingCard({ label = "Loading ResourceSpace data..." }: { label?: string }) {
  return <section className="ed-card ed-empty-state" role="status"><Database size={24} /><h2>{label}</h2><p>Reading through backend API routes. No frontend secrets are used.</p></section>;
}

function ErrorCard({ message, source }: { message: string; source?: MediaSourceStatus | null }) {
  return <section className="ed-card ed-empty-state"><AlertTriangle size={24} /><h2>{sourceNoun(source)} data unavailable</h2><p>{message}</p><SourcePill source={source} /></section>;
}

function AssetThumb({ asset, className, fit = "cover" }: { asset?: StockMediaAsset; className?: string; fit?: "cover" | "contain" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [asset?.thumbnail]);
  if (!asset || failed || !asset.thumbnail) {
    const state = !asset ? "Preview loading" : failed ? "Preview failed" : asset.mediaType === "audio" ? "Unsupported file type" : "Preview unavailable";
    return (
      <div className={cn("ed-doc-thumb", className)}>
        <strong>{asset ? assetType(asset) : "DAM"}</strong>
        <span>{state}</span>
        {asset ? <small>{recordIdLabel()} {asset.resourceSpaceId || asset.id}</small> : null}
      </div>
    );
  }
  return <img className={cn("ed-thumb", fit === "contain" && "is-contain", className)} src={asset.thumbnail} alt={asset.thumbnailAlt || displayTitle(asset)} onError={() => setFailed(true)} />;
}

function AssetCard({ asset, selected = false, onSelect }: { asset: StockMediaAsset; selected?: boolean; onSelect?: () => void }) {
  return (
    <article className={cn("ed-asset-card", selected && "is-selected")}>
      <button className="ed-card-media" type="button" onClick={onSelect} aria-pressed={selected} aria-label={`Select ${asset.title}`}>
        <AssetThumb asset={asset} />
        <span className="ed-file-chip">{assetType(asset)}</span>
        <span className="ed-check">{selected ? <Check size={13} /> : null}</span>
        <span className="ed-card-tools"><Star size={14} /><Download size={14} /><MoreHorizontal size={14} /></span>
      </button>
      <strong title={displayTitle(asset)}>{displayTitle(asset)}</strong>
      <small>{recordIdLabel()} {asset.resourceSpaceId || asset.id} · {assetDate(asset)} · {formatBytes(asset.fileSizeBytes)}</small>
      <div className="ed-card-footer"><StatusBadge status={assetEnterpriseStatus(asset)} /><span className="ed-quality-chip">{metadataQualityLabel(asset)}</span><Link href={`/assets/${asset.id}`}>Open record</Link></div>
    </article>
  );
}

function SavedViewPanel({ savedViews = [], collections = [], source }: { savedViews?: Array<{ id: string; label: string; count: number }>; collections?: Array<{ id: string; name: string; count: number }>; source?: MediaSourceStatus | null }) {
  const firstViews = savedViews.slice(0, 5);
  return (
    <aside className="ed-panel ed-facet-panel">
      <section>
        <div className="ed-panel-title"><h3>Saved views</h3><button type="button"><Plus size={14} /></button></div>
        {firstViews.map((view, index) => <button className={cn(index === 0 && "is-active")} type="button" key={view.id}><span>{view.label}</span><em>{view.count.toLocaleString()}</em></button>)}
        {!firstViews.length ? <p>No saved views mapped yet.</p> : <a>Show all saved views</a>}
      </section>
      <section>
        <div className="ed-panel-title"><h3>{sourceNoun(source)} collections</h3><ChevronDown size={14} /></div>
        {collections.slice(0, 7).map((collection) => <label className="ed-check-row" key={collection.id}><input type="checkbox" /><span>{collection.name}</span><em>{collection.count.toLocaleString()}</em></label>)}
      </section>
      {[
        ["File type", ["photo", "video", "document", "audio", "graphic"]],
        ["Usage state", ["Approved Public", "Approved Internal", "Needs Review", "Do Not Use"]],
        ["Review risk", ["No people", "People unknown", "Possible minors", "Rights review"]]
      ].map(([group, rows]) => (
        <section key={group as string}>
          <div className="ed-panel-title"><h3>{group as string}</h3><ChevronDown size={14} /></div>
          {(rows as string[]).map((label) => <label className="ed-check-row" key={label}><input type="checkbox" /><span>{label}</span></label>)}
        </section>
      ))}
    </aside>
  );
}

function RightsVerdictCard({ asset, source }: { asset?: StockMediaAsset; source?: MediaSourceStatus | null }) {
  const approved = asset?.reuseDecision?.downloadable || assetEnterpriseStatus(asset) === "Approved";
  const blocked = asset?.reuseDecision && !asset.reuseDecision.downloadable;
  const noun = sourceNoun(source);
  return (
    <section className={cn("ed-card ed-verdict-card", approved ? "is-approved" : "is-blocked")}>
      <div className="ed-card-head">
        <h3>Can I use this?</h3>
        <StatusBadge status={approved ? "Approved" : blocked ? "Needs Review" : "Not configured"} />
      </div>
      <div className="ed-verdict-body">
        <span>{approved ? <Check size={28} /> : <Lock size={24} />}</span>
        <div>
          <strong>{approved ? `Yes, this ${noun} record is approved.` : "Review required before use."}</strong>
          <p>{asset?.reuseDecision?.summary || asset?.usageGuidance || `Usage rights are not fully provided in ${noun}.`}</p>
        </div>
      </div>
      <ActionButton>View Usage Guidelines</ActionButton>
    </section>
  );
}

function InspectorDrawer({ asset, source, live }: { asset?: StockMediaAsset; source?: MediaSourceStatus | null; live?: boolean }) {
  const [tab, setTab] = useState("Details");
  const tabs = ["Details", "Rights & restrictions", "Versions", "Activity"];
  if (!asset) return <aside className="ed-inspector ed-panel"><h2>Select an asset</h2><p>{sourceNoun(source)} search returned no visible assets.</p></aside>;
  const tabRows =
    tab === "Rights & restrictions"
      ? [["Approval status", asset.status], ["Usage scope", asset.usageScope], ["Rights status", asset.rightsStatus || "Not provided"], ["Consent status", asset.consentStatus || "Not provided"], ["People/minors", asset.peopleRisk || "Not provided"], ["Policy", asset.downloadPolicy]]
        : tab === "Versions"
        ? [["Versions", "Not provided by current ResourceSpace export"], [recordIdLabel(source), asset.resourceSpaceId || asset.id]]
        : tab === "Activity"
          ? [["Reviewer", asset.reviewer || "Not provided"], ["Reviewed date", asset.reviewedDate || "Not provided"], ["Pending sync", asset.pendingReviewWrite ? "Pending ResourceSpace write" : "None"]]
          : [[recordIdLabel(source), asset.resourceSpaceId || asset.id], ["File type", assetType(asset)], ["Dimensions", asset.imageDimensions || "Not provided"], ["File size", formatBytes(asset.fileSizeBytes)], ["Created by", asset.sourceAccount || "Not provided"], ["Capture date", asset.capturedDate || "Not provided"], ["Collection", asset.collection || "Not provided"], ["Keywords", [...(asset.tags || []), ...(asset.tjcTerms || [])].join(", ") || "Not provided"]];
  return (
    <aside className="ed-inspector ed-panel">
      <div className="ed-drawer-top"><span>‹</span><strong>{recordIdLabel(source)} {asset.resourceSpaceId || asset.id}</strong><span>›</span><button type="button">×</button></div>
      <AssetThumb asset={asset} className="ed-inspector-preview" fit="contain" />
      <h2 title={displayTitle(asset)}>{displayTitle(asset)}</h2>
      <div className="ed-meta-line"><StatusBadge status={assetEnterpriseStatus(asset)} /><span>{assetDate(asset)}</span><span>{formatBytes(asset.fileSizeBytes)}</span></div>
      <SourcePill source={source} live={live} />
      <RightsVerdictCard asset={asset} source={source} />
      <nav className="ed-tabs" aria-label="Asset inspector tabs">{tabs.map((item) => <button className={cn(tab === item && "is-active")} type="button" key={item} onClick={() => setTab(item)}>{item}</button>)}</nav>
      <dl className="ed-metadata">
        {tabRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      <div className="ed-inspector-actions">
        <ActionButton tone="dark" icon={Download} disabled={!asset.reuseDecision?.downloadable}>Download</ActionButton>
        <ActionButton icon={Folder}>Add to package</ActionButton>
        <ActionButton icon={Share2}>Share asset</ActionButton>
      </div>
    </aside>
  );
}

function MiniLine({ tone = "indigo" }: { tone?: "indigo" | "green" | "orange" | "red" }) {
  const values = [20, 34, 28, 36, 31, 45, 62, 38, 35, 42, 29, 51, 44, 58];
  return <svg className={cn("ed-spark", `is-${tone}`)} viewBox="0 0 140 44" aria-hidden="true"><polyline points={values.map((v, i) => `${i * 10},${44 - v * .55}`).join(" ")} /></svg>;
}

function KpiCard({ label, value, delta, icon: Icon, danger = false }: { label: string; value: string; delta: string; icon: LucideIcon; danger?: boolean }) {
  return (
    <article className="ed-card ed-kpi">
      <div><span>{label}</span><strong>{value}</strong><small className={danger ? "is-down" : ""}>{delta}</small><small>ResourceSpace / portal period</small></div>
      <i><Icon size={18} /></i>
      <MiniLine tone={danger ? "red" : "indigo"} />
    </article>
  );
}

function ChartCard({ title, large = false, sample = false, children }: { title: string; large?: boolean; sample?: boolean; children?: ReactNode }) {
  return (
    <section className={cn("ed-card ed-chart", large && "is-large")}>
      <header><h3>{title}</h3><button type="button">View all</button></header>
      {sample ? <p className="ed-sample-label">Sample until portal usage logging is connected</p> : null}
      {children || <MiniLine />}
    </section>
  );
}

function CustodyMapPanel({ readiness }: { readiness?: DamReadinessResult | null }) {
  const integration = new Map((readiness?.integrationReadiness || []).map((item) => [item.id, item]));
  const statusFor = (id: string): EnterpriseStatus => {
    const item = integration.get(id);
    if (item?.state) return item.state;
    const ready = item?.ready;
    if (ready === true) return "Operational";
    if (id === "review-writes" && readiness?.source?.readOnly) return "Read-only";
    return ready === false ? "Not configured" : "Degraded";
  };
  const systems = [
    ["Google Shared Drive", "Master-original custody", integration.get("master-originals")?.detail || "Source intake and original custody must be confirmed.", HardDrive, statusFor("master-originals")],
    ["ResourceSpace", "Metadata and review truth", readiness?.source?.detail || "ResourceSpace connection not checked yet.", Database, statusFor("metadata-source")],
    ["Amazon S3", "Approved derivative delivery", integration.get("approved-copy-delivery")?.detail || "Approved derivative delivery status not configured.", Cloud, statusFor("approved-copy-delivery")],
    ["Media Library UI", "Role-aware access layer", integration.get("audit-log")?.detail || "Portal gates route all access through backend APIs.", ShieldCheck, statusFor("audit-log")]
  ] as const;
  return (
    <section className="ed-card ed-custody-map">
      <header className="ed-card-head"><div><h3>DAM custody map</h3><p>Backend truth stays layered: Drive, ResourceSpace, S3, then this UI.</p></div><StatusBadge status={statusFor("metadata-source")} /></header>
      <div className="ed-custody-grid">
        {systems.map(([name, role, detail, Icon, status]) => (
          <article key={name}>
            <Icon size={20} aria-hidden="true" />
            <strong>{name}</strong>
            <span>{role}</span>
            <p>{detail}</p>
            <StatusBadge status={status} />
          </article>
        ))}
      </div>
    </section>
  );
}

export function EnterpriseLibraryPage() {
  const { role } = useDemoRole();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const search = useAssetsSearch({ role, query, limit: 15 });
  const assets = search.data?.assets || [];
  useEffect(() => {
    if (!selectedId && assets[0]) {
      setSelectedId(assets[0].id);
      setSelectedIds([assets[0].id]);
    }
  }, [assets, selectedId]);
  const selected = assets.find((asset) => asset.id === selectedId) || assets[0];
  const toggleAsset = (asset: StockMediaAsset) => {
    setSelectedId(asset.id);
    setSelectedIds((current) => current.includes(asset.id) ? current.filter((id) => id !== asset.id) : [...current, asset.id]);
  };
  return (
    <div className="enterprise-page enterprise-library">
      <PageHeader title="Asset Library" count={search.data ? `${search.data.total.toLocaleString()} assets` : undefined} actions={<><ActionButton>Saved views <ChevronDown size={14} /></ActionButton><ActionButton tone="primary">Save this search</ActionButton><IconButton label="More"><MoreHorizontal size={17} /></IconButton></>} />
      <section className="ed-approved-banner"><CheckCircle2 size={24} /><div><strong>{search.live ? `Showing ${sourceNoun(search.source)}-backed records` : `${sourceNoun(search.source)} disconnected or read-only`}</strong><span>{search.source?.detail || "The UI is waiting for the backend DAM source."}</span></div><SourcePill source={search.source} live={search.live} /><button type="button">×</button></section>
      <form className="ed-library-search" role="search" onSubmit={(event) => event.preventDefault()}>
        <Search size={17} aria-hidden="true" />
        <label className="sr-only" htmlFor="library-local-search">Search media assets</label>
        <input id="library-local-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${sourceNoun(search.source)} title, keyword, collection, source, or filename...`} />
        {query ? <button type="button" onClick={() => setQuery("")}>Clear</button> : null}
      </form>
      <div className="ed-filter-bar">{["Type", "Usage rights", "People", "Status", "Collection", "Review risk", "More filters"].map((item) => <button type="button" key={item}>{item}<ChevronDown size={14} /></button>)}<a>Clear all</a></div>
      {search.loading ? <LoadingCard /> : search.error ? <ErrorCard message={search.error} source={search.source} /> : (
        <div className="ed-library-grid">
          <SavedViewPanel savedViews={search.data?.savedViews} collections={search.data?.collections} source={search.source} />
          <main className="ed-asset-workspace">
            <div className="ed-bulk-toolbar"><strong>{selectedIds.length} selected</strong><button><Download size={15} />Download</button><button><Folder size={15} />Add to collection</button><button><Share2 size={15} />Share</button><button><MoreHorizontal size={15} />More</button><button type="button" onClick={() => setSelectedIds(assets.map((asset) => asset.id))}>Select visible</button></div>
            {assets.length ? <div className="ed-grid">{assets.map((asset) => <AssetCard asset={asset} selected={selectedIds.includes(asset.id)} onSelect={() => toggleAsset(asset)} key={asset.id} />)}</div> : <section className="ed-empty-state"><Search size={24} /><h2>No {sourceNoun(search.source)} records match this search</h2><p>Try a broader ministry, category, channel, or rights term.</p><ActionButton onClick={() => setQuery("")}>Clear search</ActionButton></section>}
          </main>
          <InspectorDrawer asset={selected} source={search.source} live={search.live} />
        </div>
      )}
    </div>
  );
}

export function EnterpriseAssetDetailPage({ id }: { id: string }) {
  const { role } = useDemoRole();
  const detail = useAssetDetail(id, role);
  const downloadGate = useDownloadGate(id, role);
  const [tab, setTab] = useState("Metadata");
  const [downloadMessage, setDownloadMessage] = useState("");
  const asset = detail.data?.asset;
  const related = detail.data?.related || [];
  const approved = asset?.reuseDecision?.downloadable || assetEnterpriseStatus(asset) === "Approved";
  const detailTabs = ["Metadata", "Keywords", "AI Insights", "Comments", "Activity", "Usage History"];
  if (detail.loading) return <div className="enterprise-page"><LoadingCard label="Loading media asset record..." /></div>;
  if (detail.error || !asset) return <div className="enterprise-page"><ErrorCard message={detail.error || "Asset not found."} source={detail.source} /></div>;
  const metadataRows = [
    ["Title", displayTitle(asset)],
    ["Description", asset.usageGuidance || "Not provided"],
    ["Creator", asset.sourceAccount || "Not provided"],
    ["Capture Date", asset.capturedDate || "Not provided"],
    ["Collection", asset.collection || "Not provided"],
    ["Categories", asset.tjcTerms?.join(", ") || "Not provided"],
    ["Keywords", asset.tags?.join(", ") || "Not provided"],
    [recordIdLabel(detail.source), asset.resourceSpaceId || asset.id],
    ["File Type", assetType(asset)],
    ["Dimensions", asset.imageDimensions || "Not provided"],
    ["File Size", formatBytes(asset.fileSizeBytes)],
    ["Uploaded", asset.importDate || "Not provided"],
    ["Uploaded By", asset.sourceAccount || "Not provided"],
    ["Source", asset.sourceSystem || "Not provided"],
    ...(role === "DAM Admin" ? [["Checksum", asset.checksumSha256 || "Not provided"], ["Original filename", asset.originalFilename || "Not provided"]] : [])
  ];
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
          <nav className="ed-tabs is-large" aria-label="Asset record tabs">{detailTabs.map((item) => <button className={cn(tab === item && "is-active")} type="button" key={item} onClick={() => setTab(item)}>{item}</button>)}</nav>
          <section className="ed-card ed-metadata-card">
            {tab === "Metadata" ? <dl className="ed-metadata is-two">{metadataRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : null}
            {tab === "Keywords" ? <div className="ed-chip-row">{[...(asset.tags || []), ...(asset.tjcTerms || [])].length ? [...(asset.tags || []), ...(asset.tjcTerms || [])].map((keyword) => <span key={keyword}>{keyword}</span>) : <p>Not provided in the current data source.</p>}</div> : null}
            {tab === "AI Insights" ? <div className="ed-two-col"><p>AI suggestions are not live. Approved metadata remains review truth.</p><p>Human review controls usage, people visibility, rights, and reuse scope.</p></div> : null}
            {tab === "Comments" ? <div className="ed-comment-stack"><p className="ed-comment"><strong>Review note</strong> {asset.rightsNotes || "No reviewer note exported."}</p><input className="ed-input" aria-label="Add asset comment" placeholder="Add a local follow-up note..." /></div> : null}
            {tab === "Activity" || tab === "Usage History" ? <div className="ed-table-mini">{[asset.reviewedDate ? `Reviewed ${asset.reviewedDate} by ${asset.reviewer || "review team"}` : "Review activity not provided", asset.pendingReviewWrite ? "Pending sync to ResourceSpace" : "No pending write", downloadMessage || "No download gate action this session"].map((item) => <p key={item}>{item}</p>)}</div> : null}
          </section>
          <section className="ed-card"><header className="ed-card-head"><h3>Related Media</h3><span>{related.length} results</span></header><div className="ed-related-strip">{related.length ? related.slice(0, 5).map((item) => <AssetThumb asset={item} key={item.id} />) : <p>No related media records found.</p>}</div></section>
        </main>
        <aside className="ed-detail-rail">
          <RightsVerdictCard asset={asset} source={detail.source} />
          <section className="ed-card"><h3>Rights & Restrictions</h3><dl className="ed-metadata">{[["Approval status", asset.status], ["Usage", asset.usageScope], ["Rights status", asset.rightsStatus || "Not provided"], ["Consent", asset.consentStatus || "Not provided"], ["People/minors", asset.peopleRisk || "Not provided"], ["Restrictions", asset.reuseDecision?.summary || "Not provided"]].map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl>{detail.data?.resourceSpaceUrl ? <a href={detail.data.resourceSpaceUrl}>Open in ResourceSpace ↗</a> : null}</section>
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

export function EnterpriseReviewPage() {
  const { role, ready } = useDemoRole();
  const review = useReviewQueue(role);
  const queue = review.data?.assets || [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDecisionById, setPendingDecisionById] = useState<Record<string, { status: EnterpriseStatus; message: string; action: string }>>({});
  const [comment, setComment] = useState("");
  const [decisionMessage, setDecisionMessage] = useState("");
  useEffect(() => {
    if (!selectedId && queue[0]) setSelectedId(queue[0].id);
  }, [queue, selectedId]);
  if (!ready) return <div className="enterprise-page"><LoadingCard label="Loading role..." /></div>;
  if (role !== "Reviewer" && role !== "DAM Admin") return <div className="enterprise-page"><section className="ed-card ed-access-block"><Lock size={28} /><h1>Review inbox requires reviewer access</h1><p>Approvals, evidence review, assignment, and decision actions are available only to Reviewer and DAM Admin roles.</p><Link href="/">Return to Asset Library</Link></section></div>;
  if (review.loading) return <div className="enterprise-page"><LoadingCard label="Loading ResourceSpace review queue..." /></div>;
  if (review.error) return <div className="enterprise-page"><ErrorCard message={review.error} source={review.source} /></div>;
  const selectedAsset = queue.find((asset) => asset.id === selectedId) || queue[0];
  const selectedStatus = assetEnterpriseStatus(selectedAsset);
  const selectedPending = pendingDecisionById[selectedAsset?.id || ""];
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
          <button className="ed-sort" type="button">Sort by: Oldest First <ChevronDown size={14} /></button>
          {queue.map((asset) => <button className={cn("ed-queue-item", selectedAsset?.id === asset.id && "is-active")} type="button" key={asset.id} onClick={() => setSelectedId(asset.id)}><AssetThumb asset={asset} /><span><strong title={displayTitle(asset)}>{displayTitle(asset)}</strong><small>{assetType(asset)} · {asset.imageDimensions || "No dimensions"} · {formatBytes(asset.fileSizeBytes)}</small><small>ResourceSpace {asset.resourceSpaceId || asset.id}</small><StatusBadge status={assetEnterpriseStatus(asset)} />{pendingDecisionById[asset.id] ? <em>Pending sync to ResourceSpace</em> : null}</span></button>)}
        </aside>
        {selectedAsset ? (
          <>
            <main className="ed-review-canvas">
              <div className="ed-breadcrumb">Review Queue <span>›</span> ResourceSpace {selectedAsset.resourceSpaceId || selectedAsset.id}</div>
              <header className="ed-detail-header"><div><h1 title={displayTitle(selectedAsset)}>{displayTitle(selectedAsset)}</h1><span className="ed-file-soft">{assetType(selectedAsset)}</span></div><div className="ed-chip-row">{[selectedAsset.collection, selectedAsset.usageScope].filter(Boolean).map((chip) => <span key={chip}>{chip}</span>)}<StatusBadge status={selectedStatus} />{selectedPending ? <StatusBadge status="Read-only" /> : null}</div><div className="ed-detail-actions"><IconButton label="Favorite"><Star size={18} /></IconButton><IconButton label="Download"><Download size={18} /></IconButton><IconButton label="Fullscreen"><Grid3X3 size={18} /></IconButton></div></header>
              <div className="ed-hero-preview is-review"><AssetThumb asset={selectedAsset} fit="contain" /><span>{selectedAsset.imageDimensions || "Preview unavailable or not provided"}</span><button>100%</button></div>
              <nav className="ed-tabs is-large"><span className="is-active">Details</span><span>Metadata</span><span>Rights & Checks</span><span>Comments</span><span>Activity</span><span>History</span></nav>
              <section className="ed-card ed-metadata-card"><dl className="ed-metadata is-two">{[["Title", displayTitle(selectedAsset)], ["Review summary", selectedAsset.reuseDecision?.summary || "Needs reviewer decision."], ["Pending sync", selectedPending ? selectedPending.action : "None"], ["Source", selectedAsset.sourceSystem || "Not provided"], ["Capture Date", selectedAsset.capturedDate || "Not provided"], ["Collection", selectedAsset.collection], ["Asset ID", selectedAsset.resourceSpaceId || selectedAsset.id], ["File Type", assetType(selectedAsset)], ["Dimensions", selectedAsset.imageDimensions || "Not provided"], ["File Size", formatBytes(selectedAsset.fileSizeBytes)], ["Uploaded By", selectedAsset.sourceAccount || "Not provided"]].map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl></section>
              <div className="ed-review-cards"><section className="ed-card"><h3>Metadata Completeness</h3><div className="ed-score-ring">{selectedAsset.tags?.length || selectedAsset.tjcTerms?.length ? "70%" : "35%"}</div><p>{selectedAsset.tags?.length ? "Tags exported from ResourceSpace." : "Tags not provided."}</p></section><section className="ed-card"><h3>Rights & Model Checks</h3>{["Source confirmed", selectedAsset.rightsStatus || "Rights not provided", selectedAsset.consentStatus || "Consent not provided", selectedAsset.peopleRisk || "People/minors unknown"].map((row) => <p className="ed-checkline" key={row}><CheckCircle2 size={16} />{row}</p>)}</section><section className="ed-card"><h3>Review Policy</h3><p>ResourceSpace remains final approval truth.</p><p>{selectedPending ? "Pending sync to ResourceSpace." : "No pending sync."}</p>{selectedPending ? <p className="ed-inline-success">{selectedPending.message}</p> : null}</section></div>
            </main>
            <aside className="ed-review-rail">
              <section className="ed-card"><h3>Review Evidence</h3><dl className="ed-metadata">{[["ResourceSpace ID", selectedAsset.resourceSpaceId || selectedAsset.id], ["Assigned to", "Reviewer queue"], ["Policy", selectedAsset.downloadPolicy], ["Source", selectedAsset.sourceSystem || "Not provided"], ["Current ResourceSpace status", selectedStatus], ["Portal pending decision", selectedPending ? selectedPending.status : "None"]].map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl><ActionButton icon={FileText}>View Submission Package</ActionButton></section>
              <section className="ed-card"><header className="ed-card-head"><h3>Comments</h3><button type="button" onClick={() => setComment("")}>Clear</button></header><p className="ed-comment"><strong>ResourceSpace note</strong> {selectedAsset.rightsNotes || "No exported note."}</p>{decisionMessage ? <p className="ed-inline-success">{decisionMessage}</p> : null}<input className="ed-input" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a review note..." aria-label="Add review comment" /></section>
              <section className="ed-card"><h3>Assignment</h3><p>Loaded from ResourceSpace review queue. Final write is pending until adapter sync is verified.</p><a>Reassign</a></section>
              <section className="ed-card ed-decision-card"><h3>Review Decision</h3><p className="ed-setup-note">ResourceSpace writeback is not configured. Decisions save as portal pending-sync events.</p><button className={cn("is-approve", selectedPending?.status === "Approved" && "is-selected")} onClick={() => decide("Approved", "Approve Public")}><CheckCircle2 />Approve<span>Queues a pending ResourceSpace write.</span></button><button className={cn(selectedPending?.status === "Needs Review" && "is-selected")} onClick={() => decide("Needs Review", "Request More Info")}><FileText />Request Changes<span>Send back to uploader for updates.</span></button><button className={cn("is-restrict", selectedPending?.status === "Restricted" && "is-selected")} onClick={() => decide("Restricted", "Do Not Use")}><AlertTriangle />Restrict<span>Limit or block usage of this asset.</span></button><button>More Actions <ChevronDown size={14} /></button></section>
            </aside>
          </>
        ) : <main><ErrorCard message="No reviewable ResourceSpace records found." source={review.source} /></main>}
      </div>
    </div>
  );
}

export function EnterpriseBrandHubPage() {
  const { role } = useDemoRole();
  const brandKit = useBrandKit("easter-2024", role);
  const [section, setSection] = useState("How to use these assets");
  const [invite, setInvite] = useState("");
  const [sentInvite, setSentInvite] = useState("");
  const navItems = ["How to use these assets", "Key messages", "Logo usage", "Color & typography", "Photography style", "Example applications", "Downloads", "Allowed channels", "FAQs"];
  const kit = brandKit.data?.kit;
  const kitAssets = brandKit.data?.assets || [];
  const connected = Boolean(kit?.configured);
  const noun = sourceNoun(brandKit.source);
  const recordLabel = recordIdLabel(brandKit.source);
  return (
    <div className="enterprise-page enterprise-brand">
      <div className="ed-brand-top"><div className="ed-breadcrumb">Brand Hub <span>›</span> Ministry Kits <span>›</span> Easter at TJC 2024</div><div><ActionButton icon={Star}>Save</ActionButton><ActionButton icon={Share2}>Share Kit</ActionButton><ActionButton tone="dark" icon={Download} disabled={!connected}>Download Kit</ActionButton><IconButton label="More"><MoreHorizontal size={16} /></IconButton></div></div>
      <div className="ed-brand-layout">
        <aside className="ed-panel ed-brand-nav"><strong>Kit Overview</strong>{navItems.map((item) => <button className={section === item ? "is-active" : ""} type="button" key={item} onClick={() => setSection(item)}>{item}</button>)}<div className="ed-help-card">Need help?<br /><a>Contact Brand Steward ↗</a></div></aside>
        <main>
          <section className="ed-brand-hero"><div><span>MINISTRY KIT</span><h1>{kit?.title || "Easter at TJC 2024"} <em>{connected ? "Connected" : "Setup needed"}</em></h1><p>Editorial guidance can be curated here, but downloadable media must resolve to {noun} records or collections.</p><dl><div><dt>Owner</dt><dd>{kit?.owner || "Brand Team"}</dd></div><div><dt>Data source</dt><dd>{sourceLabel(brandKit.source)}</dd></div><div><dt>Next step</dt><dd>{connected ? "Review mapped assets" : "Connect collection"}</dd></div></dl></div></section>
          {brandKit.loading ? <LoadingCard label="Loading Brand Kit mapping..." /> : null}
          {!brandKit.loading && !connected ? <section className="ed-card ed-empty-state"><Database size={24} /><h2>Connect this kit to a {noun} collection</h2><p>Set <strong>{kit?.collectionEnvKey || "BRAND_KIT_EASTER_2024_COLLECTION_ID"}</strong> before showing downloadable kit files. Fake ZIP downloads are disabled.</p><ActionButton>Configure ResourceSpace collection</ActionButton></section> : null}
          {(brandKit.data?.warnings || []).length ? <section className="ed-card ed-setup-note"><strong>Setup warnings</strong>{brandKit.data?.warnings.map((warning) => <p key={warning}>{warning}</p>)}</section> : null}
          <section className="ed-card"><h3>Our brand principles</h3><div className="ed-principle-grid">{[["Worship God", "Keep communication reverent, accurate, and centered on faith."], ["Follow Christ", "Use approved words and visuals with humility and clarity."], ["Love People", "Protect consent, privacy, and dignity in every media choice."], ["Bring Hope", "Choose images and messages that feel welcoming and truthful."]].map(([a, b]) => <article key={a}><CheckCircle2 size={20} /><strong>{a}</strong><p>{b}</p></article>)}</div></section>
          <section className="ed-card"><header className="ed-card-head"><h3>Logo usage</h3><a>View mapped logo assets →</a></header><div className="ed-logo-grid">{["Primary logo", "Reverse logo", "On photo", "Don't alter"].map((item, i) => <article key={item} className={i === 3 ? "is-wrong" : ""}><div><img src={i === 1 ? "/brand/tjc-logo-english-white.png" : "/brand/tjc-logo-english-color.png"} alt="True Jesus Church logo" /></div><strong>{item}</strong><small>{i === 0 ? "Preferred" : i === 3 ? "No effects or distortions" : "Ensure clear contrast"}</small></article>)}</div></section>
          <div className="ed-two-col"><section className="ed-card"><h3>Key messages</h3>{["Easter changes everything.", "Everyone is welcome.", "Hope is here.", "Celebrate the resurrection."].map((item) => <p className="ed-checkline" key={item}><CheckCircle2 size={16} />{item}</p>)}</section><section className="ed-card"><header className="ed-card-head"><h3>{noun} kit assets</h3><SourcePill source={brandKit.source} live={brandKit.live} /></header><div className="ed-photo-row">{kitAssets.slice(0, 4).map((asset) => <AssetThumb asset={asset} key={asset.id} />)}</div><p>{kitAssets.length ? `Assets matched configured ResourceSpace collection/source membership.` : "No mapped collection assets yet."}</p></section></div>
        </main>
        <aside className="ed-brand-rail"><section className="ed-card"><h3>Share this kit</h3><p>Invite others to view or use Easter at TJC 2024.</p><input className="ed-input" value={invite} onChange={(event) => setInvite(event.target.value)} placeholder="Enter email address" aria-label="Invite email address" /><ActionButton tone="primary" disabled={!invite.trim()} onClick={() => { setSentInvite(invite); setInvite(""); }}>Send Invite</ActionButton>{sentInvite ? <p className="ed-inline-success">Invite prepared for {sentInvite}</p> : null}</section><section className="ed-card"><h3>Kit details</h3><dl className="ed-metadata">{[["Current section", section], ["Collection", connected ? String(kit?.resourceSpaceCollectionId || "Configured") : "Not connected"], ["Config key", kit?.collectionEnvKey || "BRAND_KIT_EASTER_2024_COLLECTION_ID"], ["Downloads", connected ? `${kitAssets.length} ${noun} assets` : "Disabled"], ["Owner", kit?.owner || "Brand Team"]].map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl></section><section className="ed-card"><header className="ed-card-head"><h3>Quick downloads</h3></header>{connected && kitAssets.length ? kitAssets.slice(0, 5).map((asset) => <p className="ed-file-row" key={asset.id}><FileText size={17} />{displayTitle(asset)}<small>{recordLabel} {asset.resourceSpaceId || asset.id}</small></p>) : <p>Connect this kit to a {noun} collection.</p>}</section></aside>
      </div>
    </div>
  );
}

export function EnterpriseInsightsPage() {
  const { role } = useDemoRole();
  const insights = useAssetsSearch({ role: role === "Viewer" ? "DAM Admin" : role, limit: 5 });
  const counts = insights.data?.counts;
  return (
    <div className="enterprise-page enterprise-insights">
      <PageHeader title="Insights / Analytics" subtitle="Track ResourceSpace records, review queues, and portal usage readiness." actions={<><ActionButton icon={Calendar}>Current export</ActionButton><ActionButton icon={Filter}>Filters</ActionButton><ActionButton icon={Download}>Export</ActionButton></>} />
      <section className="ed-approved-banner"><Database size={22} /><div><strong>{sourceLabel(insights.source)}</strong><span>{insights.source?.detail || "ResourceSpace not connected."}</span></div><span>Sample analytics until usage logging is connected</span></section>
      {insights.loading ? <LoadingCard /> : insights.error ? <ErrorCard message={insights.error} source={insights.source} /> : <>
        <div className="ed-kpi-grid"><KpiCard label="ResourceSpace Records" value={(counts?.rawTotal || 0).toLocaleString()} delta="from DAM source" icon={Database} /><KpiCard label="Visible to Role" value={(counts?.visibleToRole || 0).toLocaleString()} delta="permission-filtered" icon={Users} /><KpiCard label="Approved Public" value={(counts?.approvedRaw || 0).toLocaleString()} delta="raw approval" icon={Eye} /><KpiCard label="Needs Review" value={(counts?.needsReview || 0).toLocaleString()} delta="review queue" icon={Box} /><KpiCard label="Portal Ready" value={(counts?.portalReady || 0).toLocaleString()} delta="policy cleared" icon={PackageCheck} /><KpiCard label="Blocked / Risk" value={(counts?.rightsReview || 0).toLocaleString()} delta="rights review" icon={Shield} danger /></div>
        <div className="ed-insights-grid"><ChartCard title="Review Load" large><div className="ed-big-line"><MiniLine /><MiniLine tone="orange" /></div></ChartCard><ChartCard title="Usage Trend" large sample><div className="ed-big-line"><MiniLine /><MiniLine tone="green" /></div></ChartCard><ChartCard title="Top Assets">{(insights.data?.assets || []).map((asset, i) => <p className="ed-top-asset" key={asset.id}><span>{i + 1}</span><AssetThumb asset={asset} /><strong title={displayTitle(asset)}>{displayTitle(asset)}</strong><small>{asset.resourceSpaceId || asset.id}</small></p>)}</ChartCard><ChartCard title="Top Searches" sample><div className="ed-table-mini">{["Bible", "worship", "fellowship", "Sabbath", "newsletter"].map((r) => <p key={r}>{r}</p>)}</div></ChartCard><ChartCard title="Zero-Result Searches" sample><div className="ed-table-mini"><p>Usage logging not connected</p><p>Sample analytics only</p></div></ChartCard><ChartCard title="Package Performance" sample><div className="ed-table-mini"><p>Portal package logging not connected</p></div></ChartCard></div>
        <section className="ed-card"><h3>Asset Health & Governance</h3><div className="ed-health-grid">{[["Missing Metadata", counts?.pendingReview || 0], ["Rights Review", counts?.rightsReview || 0], ["Children/Youth", counts?.childrenYouth || 0], ["Missing Source", counts?.missingSource || 0], ["Archive", counts?.archive || 0], ["Portal Ready", counts?.portalReady || 0]].map(([label, value], i) => <article key={label}><strong>{Number(value).toLocaleString()}</strong><span>{label}</span><MiniLine tone={i === 1 ? "red" : i === 3 ? "orange" : "indigo"} /></article>)}</div></section>
      </>}
    </div>
  );
}

export function EnterprisePackageBuilderPage() {
  const { role } = useDemoRole();
  const search = useAssetsSearch({ role, view: "approved-church-wide", limit: 18 });
  const [activeSection, setActiveSection] = useState("cover");
  const [approvedOnly, setApprovedOnly] = useState(true);
  const [draft, setDraft] = useState(() => createPackageDraft());
  const assets = search.data?.assets || [];
  useEffect(() => {
    if (!assets.length) return;
    setDraft((current) => seedPackageDraft(current, assets, assetEnterpriseStatus));
  }, [assets]);
  const sections = useMemo(() => resolvePackageSections(draft, assets), [assets, draft]);
  const activeAvailableAssets = availableAssetsForSection({ draft, sectionId: activeSection, assets, approvedOnly, statusOf: assetEnterpriseStatus });
  const readiness = packagePublishReadiness(draft, sections, assetEnterpriseStatus);
  const publishBlocked = !readiness.canPublish;
  const cover = sections[0]?.assets[0] || assets[0];
  return (
    <div className="enterprise-page enterprise-package-builder">
      <PageHeader title={draft.title || "Untitled Toolkit"} subtitle={`${approvedOnly ? "Approved only" : "All visible assets"} · Portal-local draft · ResourceSpace references only`} actions={<><ActionButton icon={Eye}>Preview package</ActionButton><ActionButton icon={Users}>Share</ActionButton><ActionButton tone="primary" icon={Lock} disabled={publishBlocked}>Publish package</ActionButton><ActionButton icon={UploadCloud}>Save draft</ActionButton></>} />
      {search.loading ? <LoadingCard /> : search.error ? <ErrorCard message={search.error} source={search.source} /> : (
        <div className="ed-builder-grid">
          <aside className="ed-panel ed-package-outline"><div className="ed-panel-title"><h3>Package outline</h3><button><Plus size={15} /></button></div>{sections.map((section) => <button className={activeSection === section.id ? "is-active" : ""} type="button" key={section.id} onClick={() => setActiveSection(section.id)}>{section.assets[0] ? <AssetThumb asset={section.assets[0]} /> : <FileText size={28} />}<span><strong>{section.title}</strong><small>{section.resourceSpaceAssetIds.length} ResourceSpace refs</small></span><MoreHorizontal size={15} /></button>)}<div className="ed-dropzone"><UploadCloud size={38} /><span>Use Library search to add ResourceSpace records</span><ActionButton disabled={!activeAvailableAssets[0]} onClick={() => activeAvailableAssets[0] && setDraft((current) => addPackageAssetRef(current, activeSection, activeAvailableAssets[0]))}>Browse assets</ActionButton></div></aside>
          <main className="ed-package-canvas"><section className="ed-card ed-cover-section"><header><h2>Cover</h2><a>Replace cover</a></header>{cover ? <div><AssetThumb asset={cover} fit="contain" /><div><h3 title={displayTitle(cover)}>{displayTitle(cover)}</h3><p>{assetType(cover)} · {formatBytes(cover.fileSizeBytes)} · ResourceSpace {cover.resourceSpaceId || cover.id}</p><StatusBadge status={assetEnterpriseStatus(cover)} /><ActionButton>View asset details</ActionButton></div></div> : <p>No approved ResourceSpace asset selected.</p>}</section>{sections.slice(1).map((section) => <section className={cn("ed-card ed-builder-section", activeSection === section.id && "is-active")} key={section.id}><header><h2>{section.title}</h2><div><button type="button" onClick={() => activeAvailableAssets[0] && setDraft((current) => addPackageAssetRef(current, section.id, activeAvailableAssets[0]))}>Add assets</button><MoreHorizontal size={16} /></div></header><p>Portal package stores ResourceSpace IDs only. Asset records stay canonical in ResourceSpace.</p><div className="ed-builder-assets">{section.assets.length ? section.assets.map((asset) => <div className="ed-package-ref" key={asset.id}><AssetCard asset={asset} /><button type="button" onClick={() => setDraft((current) => removePackageAssetRef(current, section.id, asset))}>Remove ref</button></div>) : <p>No matching ResourceSpace assets for this section.</p>}</div><footer><span>{section.resourceSpaceAssetIds.length} references · {section.assets.filter((asset) => assetEnterpriseStatus(asset) !== "Approved").length + section.missingResourceSpaceAssetIds.length} blocked</span><button type="button" onClick={() => setActiveSection(section.id)}>Select section</button></footer></section>)}
            <section className="ed-card"><header className="ed-card-head"><h3>Browse ResourceSpace assets</h3><SourcePill source={search.source} live={search.live} /></header><div className="ed-table-mini">{activeAvailableAssets.length ? activeAvailableAssets.map((asset) => <p key={asset.id}><strong>{displayTitle(asset)}</strong><span>ResourceSpace {asset.resourceSpaceId || asset.id}</span><button type="button" onClick={() => setDraft((current) => addPackageAssetRef(current, activeSection, asset))}>Add to {sections.find((section) => section.id === activeSection)?.title || "section"}</button></p>) : <p>No additional approved assets available for this section.</p>}</div></section>
          </main>
          <aside className="ed-panel ed-package-details"><h3>Package details</h3><label>Package name<input className="ed-input" value={draft.title} onChange={(event) => setDraft((current) => updatePackageTitle(current, event.target.value))} /></label><label>Description<input className="ed-input" defaultValue="A portal-local package draft referencing ResourceSpace assets." /></label><h3>Sharing & access</h3><label>Visibility<select className="ed-input" defaultValue="Shared"><option>Shared with specific people</option></select></label><label>Message<input className="ed-input" placeholder="Add a message to recipients..." /></label><h3>Governance</h3><p className="ed-checkline"><CheckCircle2 size={16} />ResourceSpace IDs retained</p><p className="ed-checkline"><CheckCircle2 size={16} />Backend download gate required</p><p className={cn("ed-checkline", publishBlocked && "is-warn")}><ShieldCheck size={16} />{readiness.reason}</p><label className="ed-toggle">Approved only <input type="checkbox" checked={approvedOnly} onChange={(event) => setApprovedOnly(event.target.checked)} /></label><h3>Package summary</h3><div className="ed-summary-grid">{[[String(sections.length), "Sections"], [String(readiness.totalRefs), "Refs"], ["0", "Copied assets"], [sourceLabel(search.source), "Source"]].map(([v,l]) => <span key={l}><strong>{v}</strong><small>{l}</small></span>)}</div></aside>
        </div>
      )}
    </div>
  );
}

export function EnterpriseAdminPage() {
  const { role, ready } = useDemoRole();
  const [activeNav, setActiveNav] = useState("Overview");
  const admin = useAdminReadiness(role);
  if (!ready) return <div className="enterprise-page"><LoadingCard label="Loading control center..." /></div>;
  if (role !== "DAM Admin") return <div className="enterprise-page"><section className="ed-card ed-access-block"><Lock size={28} /><h1>Governance requires DAM Admin role</h1><p>System governance, policies, user access, integrations, and audit controls are restricted to DAM Admins.</p><Link href="/">Return to Asset Library</Link></section></div>;
  const adminNav = ["Overview", "Users & Roles", "Roles & Permissions", "Teams", "Taxonomy", "Metadata Schemas", "Rights & Policies", "Review Workflows", "Storage & Retention", "AI Moderation", "Integrations", "Audit Logs", "System Settings"];
  const readiness = admin.data;
  return (
    <div className="enterprise-page enterprise-admin-control">
      <div className="ed-admin-grid">
        <aside className="ed-panel ed-admin-nav"><strong>Administration</strong>{adminNav.map((item) => <button className={activeNav === item ? "is-active" : ""} type="button" key={item} onClick={() => setActiveNav(item)}><Settings size={15} />{item}</button>)}</aside>
        <main>
          <PageHeader title="DAM Control Center" subtitle={`Manage system governance, policies, user access, and integrations. Current module: ${activeNav}.`} />
          {admin.loading ? <LoadingCard /> : admin.error ? <ErrorCard message={admin.error} source={admin.source} /> : <>
            <CustodyMapPanel readiness={readiness} />
            <div className="ed-kpi-grid is-four"><KpiCard label="Records" value={(readiness?.assetCount || 0).toLocaleString()} delta="ResourceSpace-backed" icon={Database} /><KpiCard label="Readiness" value={`${readiness?.score || 0}/100`} delta="policy score" icon={Shield} /><KpiCard label="Needs Review" value={(readiness?.metrics.needsReview || 0).toLocaleString()} delta="queue count" icon={FileText} /><KpiCard label="Audit Events" value={(readiness?.auditLog.count || 0).toLocaleString()} delta="portal log" icon={Box} /></div>
            <section className="ed-card"><header className="ed-card-head"><div><h3>Integration Status</h3><p>ResourceSpace, Drive, S3, and portal readiness.</p></div><SourcePill source={readiness?.source} live={mediaSourceIsLive(readiness?.source)} /></header><table className="ed-table"><thead><tr><th>Module</th><th>Owner</th><th>Status</th><th>Detail</th></tr></thead><tbody>{(readiness?.integrationReadiness || []).map((row) => <tr key={row.id}><td>{row.label}</td><td>{row.owner}</td><td><StatusBadge status={row.state || (row.ready ? "Operational" : "Not configured")} /></td><td>{row.detail}</td></tr>)}</tbody></table></section>
            <div className="ed-module-grid">{(readiness?.actionBacklog || []).slice(0, 6).map((item) => <section className="ed-card ed-module-card" key={item.id}><ShieldCheck size={22} /><h3>{item.label}</h3><p>{item.action}</p><small>{item.count.toLocaleString()} · {item.owner}</small><a>›</a></section>)}</div>
            <section className="ed-card"><header className="ed-card-head"><h3>Recent Audit Activity</h3><ActionButton>View all logs</ActionButton></header><table className="ed-table"><thead><tr><th>Time</th><th>Role</th><th>Action</th><th>Object</th><th>Summary</th></tr></thead><tbody>{(readiness?.auditLog.recent || []).slice(0, 6).map((row) => <tr key={row.id}><td>{row.createdAt}</td><td>{row.role}</td><td>{row.type}</td><td>{row.assetId || row.resourceSpaceId || "Portal"}</td><td>{row.summary}</td></tr>)}</tbody></table></section>
          </>}
        </main>
        <aside className="ed-admin-rail"><section className="ed-card"><h3>Policy Summary</h3><p>{readiness?.source.detail || "Readiness not loaded."}</p><div className="ed-big-check"><Check size={30} /></div>{[["Approved public", readiness?.metrics.approvedPublic || 0], ["Portal ready", readiness?.metrics.portalReady || 0], ["Rights review", readiness?.metrics.rightsReview || 0], ["Missing source", readiness?.metrics.missingSource || 0], ["Rendition gaps", readiness?.metrics.renditionGaps || 0]].map(([l,v]) => <p className="ed-row-between" key={l}><span>{l}</span><strong>{Number(v).toLocaleString()}</strong></p>)}<ActionButton>Manage policies</ActionButton></section><section className="ed-card"><header className="ed-card-head"><h3>Recent Activity</h3><a>View all</a></header>{(readiness?.auditLog.recent || []).slice(0, 5).map((item) => <p className="ed-activity" key={item.id}><Bell size={16} />{item.summary}<small>{item.role} · {item.createdAt}</small></p>)}</section><section className="ed-card"><h3>System Health</h3>{(readiness?.integrationReadiness || []).slice(0, 5).map((item) => <p className="ed-row-between" key={item.id}><span>{item.label}</span><StatusBadge status={item.state || (item.ready ? "Operational" : "Not configured")} /></p>)}<a>View system status</a></section></aside>
      </div>
    </div>
  );
}
