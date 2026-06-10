"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, Box, Calendar, Check, CheckCircle2, ChevronDown, Cloud, Database, Download, Eye, FileText, Filter, Folder, Grid3X3, HardDrive, Lock, MoreHorizontal, PackageCheck, Plus, Search, Settings, Share2, Shield, ShieldCheck, Star, UploadCloud, Users } from "lucide-react";
import { adminRoles, auditRows, damAssetGrid, damAssets, packageSections, type DamAsset, type DamAssetStatus } from "@/data/damMockData";
import { useDemoRole } from "@/components/RoleProvider";
import { cn } from "@/lib/ui";

function StatusBadge({ status }: { status: DamAssetStatus | "Active" | "Compliant" | "Operational" | "Draft" | "Approved only" }) {
  const tone =
    status === "Approved" || status === "Active" || status === "Compliant" || status === "Operational" || status === "Approved only"
      ? "is-success"
      : status === "Restricted" || status === "Missing Consent"
        ? "is-danger"
        : "is-warning";
  return <span className={cn("ed-badge", tone)}>{status}</span>;
}

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return <button className="ed-icon-button" type="button" aria-label={label} onClick={onClick}>{children}</button>;
}

function ActionButton({ children, tone = "secondary", icon: Icon, onClick, disabled = false }: { children: React.ReactNode; tone?: "primary" | "secondary" | "dark"; icon?: typeof Download; onClick?: () => void; disabled?: boolean }) {
  return (
    <button className={cn("ed-action", tone === "primary" && "is-primary", tone === "dark" && "is-dark")} type="button" onClick={onClick} disabled={disabled}>
      {Icon ? <Icon size={16} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

function PageHeader({ title, subtitle, count, actions }: { title: string; subtitle?: string; count?: string; actions?: React.ReactNode }) {
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

function AssetThumb({ asset, className }: { asset: DamAsset; className?: string }) {
  if (!asset.thumbnail) {
    return (
      <div className={cn("ed-doc-thumb", className)}>
        <strong>TJC</strong>
        <span>Brand Guidelines</span>
      </div>
    );
  }
  return <img className={cn("ed-thumb", className)} src={asset.thumbnail} alt={asset.title} />;
}

function AssetCard({ asset, selected = false, onSelect }: { asset: DamAsset; selected?: boolean; onSelect?: () => void }) {
  return (
    <article className={cn("ed-asset-card", selected && "is-selected")}>
      <button className="ed-card-media" type="button" onClick={onSelect} aria-pressed={selected} aria-label={`Select ${asset.title}`}>
        <AssetThumb asset={asset} />
        <span className="ed-file-chip">{asset.type}</span>
        <span className="ed-check">{selected ? <Check size={13} /> : null}</span>
        <span className="ed-card-tools"><Star size={14} /><Download size={14} /><MoreHorizontal size={14} /></span>
      </button>
      <strong>{asset.title}</strong>
      <small>{asset.createdAt} · {asset.size}</small>
      <div className="ed-card-footer"><StatusBadge status={asset.status} /><Link href={`/assets/${asset.id}`}>Open record</Link></div>
    </article>
  );
}

function SavedViewPanel() {
  return (
    <aside className="ed-panel ed-facet-panel">
      <section>
        <div className="ed-panel-title"><h3>Saved views</h3><button type="button"><Plus size={14} /></button></div>
        {[
          ["All approved", "8,422"],
          ["Recently added", "152"],
          ["Campaign: Spring 2024", "312"],
          ["Mountain collection", "86"],
          ["Lifestyle people", "645"]
        ].map(([label, value], index) => <button className={cn(index === 0 && "is-active")} type="button" key={label}><span>{label}</span><em>{value}</em></button>)}
        <a>Show all saved views</a>
      </section>
      {[
        ["File type", [["Images", "7,145"], ["Videos", "964"], ["Documents", "189"], ["Audio", "124"], ["Collections", "36"]]],
        ["Categories", [["Nature", "2,842"], ["Lifestyle", "2,101"], ["Business", "1,356"], ["Travel", "1,029"], ["Product", "634"]]],
        ["Aspect ratio", [["Landscape (3:2)", "5,653"], ["Portrait (4:5)", "1,987"], ["Square (1:1)", "782"], ["Panoramic (16:9)", "548"]]],
        ["Usage channel", [["Website", "4,215"], ["Social Media", "2,987"], ["Email", "1,904"], ["Print", "1,221"]]]
      ].map(([group, rows]) => (
        <section key={group as string}>
          <div className="ed-panel-title"><h3>{group as string}</h3><ChevronDown size={14} /></div>
          {(rows as string[][]).map(([label, value]) => <label className="ed-check-row" key={label}><input type="checkbox" /><span>{label}</span><em>{value}</em></label>)}
        </section>
      ))}
    </aside>
  );
}

function RightsVerdictCard({ approved = true }: { approved?: boolean }) {
  return (
    <section className={cn("ed-card ed-verdict-card", approved ? "is-approved" : "is-blocked")}>
      <div className="ed-card-head">
        <h3>Can I use this?</h3>
        <StatusBadge status={approved ? "Approved" : "Needs Review"} />
      </div>
      <div className="ed-verdict-body">
        <span>{approved ? <Check size={28} /> : <Lock size={24} />}</span>
        <div>
          <strong>{approved ? "Yes, you can use this asset." : "Review required before use."}</strong>
          <p>{approved ? "This asset is approved for use in accordance with True Jesus Church media guidelines." : "Rights, people visibility, or usage scope needs reviewer confirmation."}</p>
        </div>
      </div>
      <ActionButton>View Usage Guidelines</ActionButton>
    </section>
  );
}

function InspectorDrawer({ asset = damAssets[0] }: { asset?: DamAsset }) {
  const [tab, setTab] = useState("Details");
  const tabs = ["Details", "Rights & restrictions", "Versions", "Activity"];
  const tabRows =
    tab === "Rights & restrictions"
      ? [["License type", asset.licenseType], ["Usage", asset.usageRights], ["Territory", asset.territory], ["Duration", asset.duration], ["Model release", asset.modelRelease], ["Property release", asset.propertyRelease]]
      : tab === "Versions"
        ? asset.versions.map((version) => [version.label, `${version.date} · ${version.size}${version.current ? " · Current" : ""}`])
        : tab === "Activity"
          ? asset.activity.map((item, index) => [`Activity ${index + 1}`, item])
          : [["Asset ID", `TJC_${asset.id}`], ["File type", asset.type], ["Dimensions", asset.dimensions], ["Color profile", "sRGB IEC61966-2.1"], ["File size", asset.size], ["Created by", asset.createdBy], ["Capture date", "May 21, 2024, 6:42 AM"], ["Location", "Banff National Park, Alberta, Canada"], ["Categories", asset.categories.join(", ")], ["Keywords", asset.keywords.join(", ")]];
  return (
    <aside className="ed-inspector ed-panel">
      <div className="ed-drawer-top"><span>‹</span><strong>1 of 8,422</strong><span>›</span><button type="button">×</button></div>
      <AssetThumb asset={asset} className="ed-inspector-preview" />
      <h2>{asset.title}</h2>
      <div className="ed-meta-line"><StatusBadge status={asset.status} /><span>{asset.createdAt}</span><span>{asset.size}</span></div>
      <RightsVerdictCard approved={asset.status === "Approved"} />
      <nav className="ed-tabs" aria-label="Asset inspector tabs">{tabs.map((item) => <button className={cn(tab === item && "is-active")} type="button" key={item} onClick={() => setTab(item)}>{item}{item === "Versions" ? ` (${asset.versions.length})` : ""}</button>)}</nav>
      <dl className="ed-metadata">
        {tabRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      <div className="ed-inspector-actions">
        <ActionButton tone="dark" icon={Download}>Download</ActionButton>
        <ActionButton icon={Folder}>Add to collection</ActionButton>
        <ActionButton icon={Share2}>Share asset</ActionButton>
      </div>
    </aside>
  );
}

function MiniLine({ tone = "indigo" }: { tone?: "indigo" | "green" | "orange" | "red" }) {
  const values = [20, 34, 28, 36, 31, 45, 62, 38, 35, 42, 29, 51, 44, 58];
  return <svg className={cn("ed-spark", `is-${tone}`)} viewBox="0 0 140 44" aria-hidden="true"><polyline points={values.map((v, i) => `${i * 10},${44 - v * .55}`).join(" ")} /></svg>;
}

function KpiCard({ label, value, delta, icon: Icon, danger = false }: { label: string; value: string; delta: string; icon: typeof Download; danger?: boolean }) {
  return (
    <article className="ed-card ed-kpi">
      <div><span>{label}</span><strong>{value}</strong><small className={danger ? "is-down" : ""}>{delta}</small><small>vs Apr 15 - May 14, 2024</small></div>
      <i><Icon size={18} /></i>
      <MiniLine tone={danger ? "red" : "indigo"} />
    </article>
  );
}

function ChartCard({ title, large = false, children }: { title: string; large?: boolean; children?: React.ReactNode }) {
  return (
    <section className={cn("ed-card ed-chart", large && "is-large")}>
      <header><h3>{title}</h3><button type="button">View all</button></header>
      {children || <MiniLine />}
    </section>
  );
}

function CustodyMapPanel() {
  const systems = [
    ["Google Shared Drive", "Master-original custody", "Original files stay restricted and request-based.", HardDrive, "Operational"],
    ["ResourceSpace", "Metadata and review truth", "Asset records, rights, review state, and policy fields remain source of truth.", Database, "Operational"],
    ["Amazon S3", "Approved derivative delivery", "Preview and approved copies are delivered without exposing source files.", Cloud, "Operational"],
    ["Media Library UI", "Role-aware access layer", "Search, review, package, and download gates enforce policy in front of the stack.", ShieldCheck, "Operational"]
  ] as const;
  return (
    <section className="ed-card ed-custody-map">
      <header className="ed-card-head"><div><h3>DAM custody map</h3><p>Backend truth stays layered: Drive, ResourceSpace, S3, then this UI.</p></div><StatusBadge status="Operational" /></header>
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
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(damAssets[0].id);
  const [selectedIds, setSelectedIds] = useState<string[]>([damAssets[0].id, damAssets[1].id]);
  const filteredAssets = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return damAssetGrid.slice(0, 15);
    return damAssetGrid.filter((asset) => `${asset.title} ${asset.filename} ${asset.categories.join(" ")} ${asset.keywords.join(" ")}`.toLowerCase().includes(needle)).slice(0, 15);
  }, [query]);
  const selected = damAssetGrid.find((asset) => asset.id === selectedId) || filteredAssets[0] || damAssets[0];
  const selectedCount = selectedIds.length;
  const toggleAsset = (asset: DamAsset) => {
    setSelectedId(asset.id);
    setSelectedIds((current) => current.includes(asset.id) ? current.filter((id) => id !== asset.id) : [...current, asset.id]);
  };
  return (
    <div className="enterprise-page enterprise-library">
      <PageHeader title="Asset Library" count="8,422 assets" actions={<><ActionButton>Saved views <ChevronDown size={14} /></ActionButton><ActionButton tone="primary">Save this search</ActionButton><IconButton label="More"><MoreHorizontal size={17} /></IconButton></>} />
      <section className="ed-approved-banner"><CheckCircle2 size={24} /><div><strong>Showing approved assets for use</strong><span>Assets are approved in accordance with TJC brand guidelines and rights clearances.</span></div><ActionButton>View Usage Guidelines</ActionButton><button type="button">×</button></section>
      <form className="ed-library-search" role="search" onSubmit={(event) => event.preventDefault()}>
        <Search size={17} aria-hidden="true" />
        <label className="sr-only" htmlFor="library-local-search">Search visible assets</label>
        <input id="library-local-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter visible assets by title, keyword, category, or filename..." />
        {query ? <button type="button" onClick={() => setQuery("")}>Clear</button> : null}
      </form>
      <div className="ed-filter-bar">{["Type", "Orientation", "Usage rights", "People", "Color", "Channel", "AI safety", "Campaign", "More filters"].map((item) => <button type="button" key={item}>{item}<ChevronDown size={14} /></button>)}<a>Clear all</a></div>
      <div className="ed-library-grid">
        <SavedViewPanel />
        <main className="ed-asset-workspace">
          <div className="ed-bulk-toolbar"><strong>{selectedCount} selected</strong><button><Download size={15} />Download</button><button><Folder size={15} />Add to collection</button><button><Share2 size={15} />Share</button><button><MoreHorizontal size={15} />More</button><button type="button" onClick={() => setSelectedIds(filteredAssets.map((asset) => asset.id))}>Select visible</button></div>
          {filteredAssets.length ? (
            <div className="ed-grid">{filteredAssets.map((asset) => <AssetCard asset={asset} selected={selectedIds.includes(asset.id)} onSelect={() => toggleAsset(asset)} key={asset.id} />)}</div>
          ) : (
            <section className="ed-empty-state"><Search size={24} /><h2>No assets match this search</h2><p>Try a broader ministry, category, channel, or rights term.</p><ActionButton onClick={() => setQuery("")}>Clear search</ActionButton></section>
          )}
        </main>
        <InspectorDrawer asset={selected} />
      </div>
    </div>
  );
}

export function EnterpriseAssetDetailPage({ id }: { id: string }) {
  const { role } = useDemoRole();
  const [tab, setTab] = useState("Metadata");
  const asset = damAssetGrid.find((item) => item.id === id) || damAssets[0];
  const approved = asset.status === "Approved";
  const detailTabs = ["Metadata", "Keywords", "AI Insights", "Comments", "Activity", "Usage History"];
  const metadataRows = [
    ["Title", asset.title],
    ["Description", "Sunrise over alpine lake with rugged peaks and pine forest reflections in calm water."],
    ["Creator", "TJC Media Library"],
    ["Capture Date", "May 21, 2024 · 6:42 AM"],
    ["Location", "Banff National Park, Alberta, Canada"],
    ["Categories", asset.categories.join(", ")],
    ["Keywords", asset.keywords.join(", ")],
    ["AI Tags", "Reflections, Golden Hour, Wilderness"],
    ["Asset ID", "TJC_2024_MountainLake_0123"],
    ["File Type", asset.type],
    ["Dimensions", asset.dimensions],
    ["File Size", asset.size],
    ["Color Profile", "sRGB IEC61966-2.1"],
    ["Uploaded", asset.uploadedAt],
    ["Uploaded By", asset.uploadedBy],
    ["Source", "Canon EOS R5"],
    ...(role === "DAM Admin" ? [["Checksum", "9f7d8c0a3b2e4f6a...c1d9e2f4"]] : [])
  ];
  return (
    <div className="enterprise-page enterprise-detail">
      <div className="ed-breadcrumb">Library <span>›</span> Photos <span>›</span> Landscapes <span>›</span> {asset.filename}</div>
      <div className="ed-detail-layout">
        <main>
          <header className="ed-detail-header">
            <div><h1>{asset.title}</h1><span className="ed-file-soft">{asset.type}</span></div>
            <div className="ed-chip-row">{["Landscape", "Nature", "Mountains", "Lake"].map((chip) => <span key={chip}>{chip}</span>)}<button>+</button></div>
            <div className="ed-detail-actions"><IconButton label="Favorite"><Star size={18} /></IconButton><IconButton label="Download"><Download size={18} /></IconButton><IconButton label="Versions"><FileText size={18} /></IconButton><IconButton label="Share"><Share2 size={18} /></IconButton><IconButton label="Fullscreen"><Grid3X3 size={18} /></IconButton></div>
          </header>
          <div className="ed-hero-preview"><AssetThumb asset={asset} /><span>1:1</span><button><Search size={18} /></button></div>
          <nav className="ed-tabs is-large" aria-label="Asset record tabs">{detailTabs.map((item) => <button className={cn(tab === item && "is-active")} type="button" key={item} onClick={() => setTab(item)}>{item}</button>)}</nav>
          <section className="ed-card ed-metadata-card">
            {tab === "Metadata" ? <dl className="ed-metadata is-two">{metadataRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : null}
            {tab === "Keywords" ? <div className="ed-chip-row">{asset.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div> : null}
            {tab === "AI Insights" ? <div className="ed-two-col"><p>Suggested tags: reflections, worship background, outdoor retreat, calm water.</p><p>Human review still controls usage, people visibility, rights, and reuse scope.</p></div> : null}
            {tab === "Comments" ? <div className="ed-comment-stack"><p className="ed-comment"><strong>Maria Santos</strong> Approved for web and ministry presentation use.</p><input className="ed-input" aria-label="Add asset comment" placeholder="Add a comment..." /></div> : null}
            {tab === "Activity" || tab === "Usage History" ? <div className="ed-table-mini">{asset.activity.map((item) => <p key={item}>{item}</p>)}</div> : null}
          </section>
          <section className="ed-card"><header className="ed-card-head"><h3>Related Media</h3><span>12 results</span></header><div className="ed-related-strip">{damAssetGrid.slice(9, 14).map((item) => <AssetThumb asset={item} key={item.id} />)}</div></section>
          {role === "Reviewer" || role === "DAM Admin" ? <CustodyMapPanel /> : null}
        </main>
        <aside className="ed-detail-rail">
          <RightsVerdictCard approved={approved} />
          <section className="ed-card"><h3>Rights & Restrictions</h3><dl className="ed-metadata">{[["License Type", asset.licenseType], ["Usage", asset.usageRights], ["Territory", asset.territory], ["Duration", asset.duration], ["Model Release", asset.modelRelease], ["Property Release", asset.propertyRelease], ["Restrictions", "No authorization for resale."]].map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl><a>View Full License ↗</a></section>
          <section className="ed-card"><header className="ed-card-head"><h3>Versions</h3><a>View all</a></header>{asset.versions.map((version) => <div className="ed-version-row" key={version.label}><AssetThumb asset={asset} /><strong>{version.label}{version.current ? " Current" : ""}</strong><span>{asset.type} · {asset.dimensions} · {version.size}</span></div>)}</section>
          <section className="ed-card"><header className="ed-card-head"><h3>Recent Activity</h3><a>View all</a></header>{asset.activity.map((item) => <p className="ed-activity" key={item}><CheckCircle2 size={16} />{item}<small>May 21, 2024</small></p>)}</section>
        </aside>
      </div>
      <div className={cn("ed-sticky-action-bar", !approved && "is-blocked")}>
        <div>{approved ? <ShieldCheck size={28} /> : <Lock size={28} />}<span><strong>{approved ? "Approved for use" : "Review required before use"}</strong><small>{approved ? "You are clear to go." : "Download approved copy is blocked until evidence clears."}</small></span></div>
        {approved ? <ActionButton tone="primary" icon={Download}>Download approved copy</ActionButton> : <ActionButton icon={FileText}>Request DAM review</ActionButton>}
        <ActionButton icon={PackageCheck}>Add to package</ActionButton>
        <ActionButton icon={Share2}>Create share link</ActionButton>
        <ActionButton>More actions <ChevronDown size={14} /></ActionButton>
      </div>
    </div>
  );
}

export function EnterpriseReviewPage() {
  const { role, ready } = useDemoRole();
  const initialQueue = [damAssets[0], damAssets[1], damAssetGrid[10], damAssets[7], damAssets[2], damAssetGrid[11], damAssets[6], damAssetGrid[12]];
  const [selectedId, setSelectedId] = useState(initialQueue[0].id);
  const [statusById, setStatusById] = useState<Record<string, DamAssetStatus>>({
    [initialQueue[0].id]: "Needs Review",
    [initialQueue[1].id]: "Needs Review",
    [initialQueue[2].id]: "Approved",
    [initialQueue[4].id]: "Restricted",
    [initialQueue[5].id]: "Missing Consent"
  });
  const [comment, setComment] = useState("");
  if (!ready) return <div className="enterprise-page"><section className="ed-card">Loading review queue...</section></div>;
  if (role !== "Reviewer" && role !== "DAM Admin") {
    return (
      <div className="enterprise-page">
        <section className="ed-card ed-access-block">
          <Lock size={28} />
          <h1>Review inbox requires reviewer access</h1>
          <p>Approvals, evidence review, assignment, and decision actions are available only to Reviewer and DAM Admin roles.</p>
          <Link href="/">Return to Asset Library</Link>
        </section>
      </div>
    );
  }
  const queue = initialQueue;
  const selectedAsset = queue.find((asset) => asset.id === selectedId) || queue[0];
  const selectedStatus = statusById[selectedAsset.id] || "Needs Review";
  const decide = (nextStatus: DamAssetStatus) => setStatusById((current) => ({ ...current, [selectedAsset.id]: nextStatus }));
  return (
    <div className="enterprise-page enterprise-review">
      <div className="ed-review-grid">
        <aside className="ed-review-list ed-panel">
          <PageHeader title="Review Queue" count="128 items" actions={<IconButton label="Filter"><Filter size={16} /></IconButton>} />
          <nav className="ed-tabs wrap">{["All 128", "Needs Review 28", "Approved 62", "Restricted 9", "Missing Consent 7", "Expiring Soon 12"].map((tab, i) => <span className={i === 0 ? "is-active" : ""} key={tab}>{tab}</span>)}</nav>
          <button className="ed-sort" type="button">Sort by: Oldest First <ChevronDown size={14} /></button>
          {queue.map((asset) => <button className={cn("ed-queue-item", selectedAsset.id === asset.id && "is-active")} type="button" key={asset.id} onClick={() => setSelectedId(asset.id)}><AssetThumb asset={asset} /><span><strong>{asset.filename}</strong><small>{asset.type} · {asset.dimensions} · {asset.size}</small><small>Submitted May 21 · Maria Santos</small><StatusBadge status={statusById[asset.id] || "Needs Review"} /></span></button>)}
        </aside>
        <main className="ed-review-canvas">
          <div className="ed-breadcrumb">Review Queue <span>›</span> {selectedAsset.filename}</div>
          <header className="ed-detail-header"><div><h1>{selectedAsset.filename}</h1><span className="ed-file-soft">{selectedAsset.type}</span></div><div className="ed-chip-row">{selectedAsset.categories.map((chip) => <span key={chip}>{chip}</span>)}<StatusBadge status={selectedStatus} /></div><div className="ed-detail-actions"><IconButton label="Favorite"><Star size={18} /></IconButton><IconButton label="Download"><Download size={18} /></IconButton><IconButton label="Fullscreen"><Grid3X3 size={18} /></IconButton></div></header>
          <div className="ed-hero-preview is-review"><AssetThumb asset={selectedAsset} /><span>1:1</span><button>100%</button></div>
          <nav className="ed-tabs is-large"><span className="is-active">Details</span><span>Metadata 24</span><span>Rights & Checks 6</span><span>Comments 2</span><span>Activity</span><span>History</span></nav>
          <section className="ed-card ed-metadata-card"><dl className="ed-metadata is-two">{[["Title", selectedAsset.title], ["Description", "Reviewer packet includes source, rights, people visibility, and usage scope."], ["Creator", selectedAsset.createdBy], ["Capture Date", "May 21, 2024 · 6:42 AM"], ["Location", "TJC media library"], ["Asset ID", `TJC_${selectedAsset.id}`], ["File Type", selectedAsset.type], ["Dimensions", selectedAsset.dimensions], ["File Size", selectedAsset.size], ["Uploaded By", selectedAsset.uploadedBy], ["Source", "Media team intake"]].map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl></section>
          <div className="ed-review-cards"><section className="ed-card"><h3>Metadata Completeness</h3><div className="ed-score-ring">86%</div><p>Good. All required fields are completed.</p></section><section className="ed-card"><h3>Rights & Model Checks</h3>{["Copyright cleared", "Model release not required", "Property release verified", "Trademark clear", "AI generated: No"].map((row) => <p className="ed-checkline" key={row}><CheckCircle2 size={16} />{row}</p>)}</section><section className="ed-card"><h3>Review Policy</h3><p>Commercial & Editorial v2.1</p><p>Priority: Normal</p><p>Review note: Colorado campaign imagery.</p></section></div>
        </main>
        <aside className="ed-review-rail">
          <section className="ed-card"><h3>Review Evidence</h3><dl className="ed-metadata">{[["Submitted by", `${selectedAsset.uploadedBy} · May 21, 2024`], ["Assigned to", "Maria Santos · Due May 24"], ["Policy", "Commercial & Editorial v2.1"], ["Source", "Media team intake"], ["Attachments", "2 files"], ["Current decision", selectedStatus]].map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl><ActionButton icon={FileText}>View Submission Package</ActionButton></section>
          <section className="ed-card"><header className="ed-card-head"><h3>Comments</h3><button type="button" onClick={() => setComment("")}>Clear</button></header><p className="ed-comment"><strong>Alex Kim</strong> Captured early morning. No people visible.</p><p className="ed-comment"><strong>Maria Santos</strong> Looks great. Please add alt text and GPS coordinates if available.</p>{comment ? <p className="ed-comment"><strong>You</strong> {comment}</p> : null}<input className="ed-input" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a comment..." aria-label="Add review comment" /></section>
          <section className="ed-card"><h3>Assignment</h3><p>Assigned to Maria Santos, due May 24, 2024.</p><a>Reassign</a></section>
          <section className="ed-card ed-decision-card"><h3>Review Decision</h3><button className={cn("is-approve", selectedStatus === "Approved" && "is-selected")} onClick={() => decide("Approved")}><CheckCircle2 />Approve<span>Asset is approved and ready for use.</span></button><button className={cn(selectedStatus === "Needs Review" && "is-selected")} onClick={() => decide("Needs Review")}><FileText />Request Changes<span>Send back to uploader for updates.</span></button><button className={cn("is-restrict", selectedStatus === "Restricted" && "is-selected")} onClick={() => decide("Restricted")}><AlertTriangle />Restrict<span>Limit or block usage of this asset.</span></button><button>More Actions <ChevronDown size={14} /></button></section>
        </aside>
      </div>
    </div>
  );
}

export function EnterpriseBrandHubPage() {
  const [section, setSection] = useState("How to use these assets");
  const [invite, setInvite] = useState("");
  const [sentInvite, setSentInvite] = useState("");
  const navItems = ["How to use these assets", "Key messages", "Logo usage", "Color & typography", "Photography style", "Example applications", "Downloads 24", "Allowed channels", "FAQs"];
  return (
    <div className="enterprise-page enterprise-brand">
      <div className="ed-brand-top"><div className="ed-breadcrumb">Brand Hub <span>›</span> Ministry Kits <span>›</span> Easter at TJC 2024</div><div><ActionButton icon={Star}>Save</ActionButton><ActionButton icon={Share2}>Share Kit</ActionButton><ActionButton tone="dark" icon={Download}>Download Kit</ActionButton><IconButton label="More"><MoreHorizontal size={16} /></IconButton></div></div>
      <div className="ed-brand-layout">
        <aside className="ed-panel ed-brand-nav"><strong>Kit Overview</strong>{navItems.map((item) => <button className={section === item ? "is-active" : ""} type="button" key={item} onClick={() => setSection(item)}>{item}</button>)}<div className="ed-help-card">Need help?<br /><a>Contact Brand Steward ↗</a></div></aside>
        <main>
          <section className="ed-brand-hero"><div><span>MINISTRY KIT</span><h1>Easter at TJC 2024 <em>v1.0</em></h1><p>Everything you need to promote Easter services across digital, print, and in-person experiences.</p><dl><div><dt>Owner</dt><dd>Brand Team</dd></div><div><dt>Last updated</dt><dd>May 14, 2024</dd></div><div><dt>Next review</dt><dd>Mar 1, 2025</dd></div></dl></div></section>
          <section className="ed-card"><h3>Our brand principles</h3><div className="ed-principle-grid">{[["Worship God", "Keep communication reverent, accurate, and centered on faith."], ["Follow Christ", "Use approved words and visuals with humility and clarity."], ["Love People", "Protect consent, privacy, and dignity in every media choice."], ["Bring Hope", "Choose images and messages that feel welcoming and truthful."]].map(([a, b]) => <article key={a}><CheckCircle2 size={20} /><strong>{a}</strong><p>{b}</p></article>)}</div></section>
          <section className="ed-card"><header className="ed-card-head"><h3>Logo usage</h3><a>View all logo assets →</a></header><div className="ed-logo-grid">{["Primary logo", "Reverse logo", "On photo", "Don't alter"].map((item, i) => <article key={item} className={i === 3 ? "is-wrong" : ""}><div><img src={i === 1 ? "/brand/tjc-logo-english-white.png" : "/brand/tjc-logo-english-color.png"} alt="True Jesus Church logo" /></div><strong>{item}</strong><small>{i === 0 ? "Preferred" : i === 3 ? "No effects or distortions" : "Ensure clear contrast"}</small></article>)}</div></section>
          <div className="ed-two-col"><section className="ed-card"><h3>Key messages</h3>{["Easter changes everything.", "Everyone is welcome.", "Hope is here.", "Celebrate the resurrection."].map((item) => <p className="ed-checkline" key={item}><CheckCircle2 size={16} />{item}</p>)}</section><section className="ed-card"><header className="ed-card-head"><h3>Photography style</h3><a>View all photos →</a></header><div className="ed-photo-row">{damAssetGrid.slice(10, 14).map((asset) => <AssetThumb asset={asset} key={asset.id} />)}</div><p>Use natural light, genuine emotion, and compositions that feel open and inviting.</p></section></div>
          <section className="ed-card"><header className="ed-card-head"><h3>Example applications</h3><a>View all applications →</a></header><div className="ed-photo-row is-apps">{["Social Post", "Web Banner", "Email Header", "Poster", "Flyer"].map((item) => <article key={item}><div>EASTER CHANGES EVERYTHING</div><strong>{item}</strong></article>)}</div></section>
        </main>
        <aside className="ed-brand-rail"><section className="ed-card"><h3>Share this kit</h3><p>Invite others to view or use Easter at TJC 2024.</p><input className="ed-input" value={invite} onChange={(event) => setInvite(event.target.value)} placeholder="Enter email address" aria-label="Invite email address" /><ActionButton tone="primary" disabled={!invite.trim()} onClick={() => { setSentInvite(invite); setInvite(""); }}>Send Invite</ActionButton>{sentInvite ? <p className="ed-inline-success">Invite prepared for {sentInvite}</p> : null}</section><section className="ed-card"><h3>Kit details</h3><dl className="ed-metadata">{[["Current section", section], ["Audience", "All Campuses"], ["Channels", "Digital, Print, In-Person"], ["Language", "English"], ["Region", "Global"], ["Owner", "Brand Team"], ["Review cycle", "Annually"]].map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl></section><section className="ed-card"><header className="ed-card-head"><h3>Quick downloads</h3><a>View all</a></header>{["Easter_Logo_Pack.zip", "Easter_Photo_Collection.zip", "Easter_Social_Templates.zip", "Easter_Presentation_Template.pptx", "Easter_Flyer_Template.indd"].map((item) => <p className="ed-file-row" key={item}><FileText size={17} />{item}<small>ZIP · 8.4 MB</small></p>)}</section><section className="ed-card"><h3>Allowed channels</h3>{["Website", "Email", "Social Media", "Print", "In-Person"].map((item) => <p className="ed-checkline" key={item}><CheckCircle2 size={16} />{item}</p>)}</section></aside>
      </div>
    </div>
  );
}

export function EnterpriseInsightsPage() {
  return (
    <div className="enterprise-page enterprise-insights">
      <PageHeader title="Insights / Analytics" subtitle="Track usage, engagement and asset performance across your organization." actions={<><ActionButton icon={Calendar}>May 15 - Jun 14, 2024</ActionButton><ActionButton>vs Apr 15 - May 14, 2024</ActionButton><ActionButton icon={Filter}>Filters</ActionButton><ActionButton icon={Download}>Export</ActionButton></>} />
      <div className="ed-kpi-grid"><KpiCard label="Total Downloads" value="4,724" delta="▲ 18.6%" icon={Download} /><KpiCard label="Unique Users" value="286" delta="▲ 12.3%" icon={Users} /><KpiCard label="Assets Viewed" value="9,842" delta="▲ 20.1%" icon={Eye} /><KpiCard label="Storage Used" value="2.45 TB" delta="▲ 4.7%" icon={Box} /><KpiCard label="Packages Created" value="32" delta="▲ 14.3%" icon={PackageCheck} /><KpiCard label="Blocked Download Attempts" value="43" delta="▼ 12.2%" icon={Shield} danger /></div>
      <div className="ed-insights-grid"><ChartCard title="Downloads Trend" large><div className="ed-big-line"><MiniLine /><MiniLine tone="green" /></div></ChartCard><ChartCard title="Usage Trend" large><div className="ed-big-line"><MiniLine /><MiniLine tone="indigo" /></div></ChartCard><ChartCard title="Top Assets">{damAssets.slice(0,5).map((asset, i) => <p className="ed-top-asset" key={asset.id}><span>{i + 1}</span><AssetThumb asset={asset} /><strong>{asset.filename}</strong><small>{1842 - i * 210}</small></p>)}</ChartCard><ChartCard title="Channel Performance"><div className="ed-table-mini">{["Website 2,412 51.0%", "Social Media 1,128 23.9%", "Email / Newsletter 642 13.6%", "Partner Portal 312 6.6%", "Mobile App 230 4.9%"].map((r) => <p key={r}>{r}</p>)}</div></ChartCard><ChartCard title="Top Searches"><div className="ed-table-mini">{["mountains 256", "lake 198", "summer 162", "forest 134", "sunrise 116"].map((r) => <p key={r}>{r}</p>)}</div></ChartCard><ChartCard title="Zero-Result Searches"><div className="ed-table-mini">{["waterfall 28", "aurora 17", "space 14", "abstract 3d 11", "vintage car 9"].map((r) => <p key={r}>{r}</p>)}</div></ChartCard><ChartCard title="Package Performance"><div className="ed-table-mini">{["Q2 Campaign Assets 1,243", "Summer Collection 2024 1,105", "Brand Refresh Kit 934", "Website Hero Library 723"].map((r) => <p key={r}>{r}</p>)}</div></ChartCard></div>
      <section className="ed-card"><h3>Asset Health & Governance</h3><div className="ed-health-grid">{[["Missing Previews", "12"], ["Missing Metadata", "28"], ["Duplicate Assets", "34"], ["Unused Assets", "512"], ["Compliance Exceptions", "7"], ["Health Score", "87/100"]].map(([label, value], i) => <article key={label}><strong>{value}</strong><span>{label}</span><MiniLine tone={i === 0 ? "orange" : i === 4 ? "red" : "indigo"} /></article>)}</div></section>
    </div>
  );
}

export function EnterprisePackageBuilderPage() {
  const [activeSection, setActiveSection] = useState(packageSections[0].name);
  const [approvedOnly, setApprovedOnly] = useState(true);
  const [packageName, setPackageName] = useState("Summer Launch Toolkit");
  const visibleSections = useMemo(() => {
    if (!approvedOnly) return [["01. Hero Assets", damAssetGrid.slice(1,6)], ["02. Social Media", damAssetGrid.slice(6,11)], ["03. Product", damAssetGrid.slice(11,15)]];
    return [["01. Hero Assets", damAssetGrid.slice(1,6).filter((asset) => asset.status === "Approved")], ["02. Social Media", damAssetGrid.slice(6,11).filter((asset) => asset.status === "Approved")], ["03. Product", damAssetGrid.slice(11,15).filter((asset) => asset.status === "Approved")]];
  }, [approvedOnly]);
  return (
    <div className="enterprise-page enterprise-package-builder">
      <PageHeader title={packageName || "Untitled Toolkit"} subtitle={`${approvedOnly ? "Approved only" : "All draft assets"} · Last saved 2m ago · Draft`} actions={<><ActionButton icon={Eye}>Preview package</ActionButton><ActionButton icon={Users}>Share</ActionButton><ActionButton tone="primary" icon={Lock}>Publish package</ActionButton><ActionButton icon={UploadCloud}>Save draft</ActionButton></>} />
      <div className="ed-builder-grid">
        <aside className="ed-panel ed-package-outline"><div className="ed-panel-title"><h3>Package outline</h3><button><Plus size={15} /></button></div>{packageSections.map((section) => <button className={activeSection === section.name ? "is-active" : ""} type="button" key={section.name} onClick={() => setActiveSection(section.name)}>{section.image ? <img src={section.image} alt="" /> : <FileText size={28} />}<span><strong>{section.name}</strong><small>{section.count} assets</small></span><MoreHorizontal size={15} /></button>)}<div className="ed-dropzone"><UploadCloud size={38} /><span>Drag and drop assets or folders</span><ActionButton>Browse assets</ActionButton></div></aside>
        <main className="ed-package-canvas"><section className="ed-card ed-cover-section"><header><h2>Cover</h2><a>Replace cover</a></header><div><AssetThumb asset={damAssets[0]} /><div><h3>Serene mountain lake at sunrise</h3><p>JPG · 9.8 MB · 6720 x 4480</p><StatusBadge status="Approved" /><ActionButton>View asset details</ActionButton></div></div></section>{visibleSections.map(([section, assets]) => <section className={cn("ed-card ed-builder-section", activeSection === section && "is-active")} key={section as string}><header><h2>{section as string}</h2><div><a>Add assets</a><MoreHorizontal size={16} /></div></header><p>{section === "01. Hero Assets" ? "Foundational imagery for campaigns and key visuals." : "Square, vertical, and short-form content."}</p><div className="ed-builder-assets">{(assets as DamAsset[]).map((asset) => <AssetCard asset={asset} key={asset.id} />)}</div><footer><span>{(assets as DamAsset[]).length} assets</span><button type="button" onClick={() => setActiveSection(section as string)}>Select section</button></footer></section>)}</main>
        <aside className="ed-panel ed-package-details"><h3>Package details</h3><label>Package name<input className="ed-input" value={packageName} onChange={(event) => setPackageName(event.target.value)} /></label>{["Description", "Purpose", "Campaign", "Labels"].map((label, i) => <label key={label}>{label}<input className="ed-input" defaultValue={i === 0 ? "Approved assets for the Summer Launch campaign across all channels." : i === 1 ? "Marketing Campaign" : ""} /></label>)}<h3>Sharing & access</h3><label>Visibility<select className="ed-input" defaultValue="Shared"><option>Shared with specific people</option></select></label><label>Message<input className="ed-input" placeholder="Add a message to recipients..." /></label><h3>Access control</h3>{["Download original files", "Download watermarked", "Add to collection", "Upload to library"].map((item, i) => <label className="ed-check-row" key={item}><input type="checkbox" defaultChecked={i < 3} /><span>{item}</span></label>)}<h3>Governance</h3><p className="ed-checkline"><CheckCircle2 size={16} />Usage rights compliant</p><p className="ed-checkline"><CheckCircle2 size={16} />Brand compliance</p><label className="ed-toggle">Approved only <input type="checkbox" checked={approvedOnly} onChange={(event) => setApprovedOnly(event.target.checked)} /></label><h3>Package summary</h3><div className="ed-summary-grid">{[["6", "Sections"], [String(visibleSections.reduce((total, [, assets]) => total + (assets as DamAsset[]).length, 1)), "Assets"], ["6", "Recipients"], ["321.4 MB", "Total size"]].map(([v,l]) => <span key={l}><strong>{v}</strong><small>{l}</small></span>)}</div></aside>
      </div>
    </div>
  );
}

export function EnterpriseAdminPage() {
  const { role, ready } = useDemoRole();
  const [activeNav, setActiveNav] = useState("Overview");
  if (!ready) return <div className="enterprise-page"><section className="ed-card">Loading control center...</section></div>;
  if (role !== "DAM Admin") {
    return (
      <div className="enterprise-page">
        <section className="ed-card ed-access-block">
          <Lock size={28} />
          <h1>Governance requires DAM Admin role</h1>
          <p>System governance, policies, user access, integrations, and audit controls are restricted to DAM Admins.</p>
          <Link href="/">Return to Asset Library</Link>
        </section>
      </div>
    );
  }
  const adminNav = ["Overview", "Users & Roles", "Roles & Permissions", "Teams", "Taxonomy", "Metadata Schemas", "Rights & Policies", "Review Workflows", "Storage & Retention", "AI Moderation", "Integrations", "Audit Logs", "System Settings"];
  return (
    <div className="enterprise-page enterprise-admin-control">
      <div className="ed-admin-grid">
        <aside className="ed-panel ed-admin-nav"><strong>Administration</strong>{adminNav.map((item) => <button className={activeNav === item ? "is-active" : ""} type="button" key={item} onClick={() => setActiveNav(item)}><Settings size={15} />{item}</button>)}</aside>
        <main>
          <PageHeader title="DAM Control Center" subtitle={`Manage system governance, policies, user access, and integrations. Current module: ${activeNav}.`} />
          <CustodyMapPanel />
          <div className="ed-kpi-grid is-four"><KpiCard label="Users" value="256" delta="▲ 8 this month" icon={Users} /><KpiCard label="Roles" value="12" delta="▲ 1 this month" icon={Shield} /><KpiCard label="Policies" value="18" delta="▲ 2 this month" icon={FileText} /><KpiCard label="Integrations" value="8" delta="No change" icon={Box} /></div>
          <section className="ed-card"><header className="ed-card-head"><div><h3>Roles & Permissions</h3><p>Manage user roles and permission levels across the DAM.</p></div><ActionButton>View all roles</ActionButton></header><table className="ed-table"><thead><tr><th>Role name</th><th>Users</th><th>Scope</th><th>Last updated</th><th>Status</th><th /></tr></thead><tbody>{adminRoles.map((row) => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td><td><StatusBadge status="Active" /></td><td><MoreHorizontal size={16} /></td></tr>)}</tbody></table></section>
          <div className="ed-module-grid">{[["Rights & Policies", "Define usage rights, license rules, and restricted content policies.", "18 active policies"], ["Review Workflows", "Configure multi-step approval workflows and assignments.", "6 active workflows"], ["Storage & Retention", "Manage storage, retention periods, and automated cleanup.", "2.45 TB of 5 TB used"], ["AI Moderation", "Configure AI detection, moderation rules, and auto-actions.", "All systems operational"], ["Integrations", "Connect and manage external tools and services.", "8 integrations connected"], ["Audit Logs", "View system activity, access logs, and change history.", "12,842 events (30 days)"]].map(([a,b,c]) => <section className="ed-card ed-module-card" key={a}><ShieldCheck size={22} /><h3>{a}</h3><p>{b}</p><small>{c}</small><a>›</a></section>)}</div>
          <section className="ed-card"><header className="ed-card-head"><h3>Recent Audit Activity</h3><ActionButton>View all logs</ActionButton></header><table className="ed-table"><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Object</th><th>Details</th></tr></thead><tbody>{auditRows.map((row) => <tr key={row.join("-")}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></section>
        </main>
        <aside className="ed-admin-rail"><section className="ed-card"><h3>Policy Summary</h3><p>All policies are active and up to date.</p><div className="ed-big-check"><Check size={30} /></div>{[["Usage rights policies", "8"], ["License compliance rules", "4"], ["Restricted content rules", "3"], ["AI moderation rules", "2"], ["Retention policies", "1"]].map(([l,v]) => <p className="ed-row-between" key={l}><span>{l}</span><strong>{v}</strong></p>)}<ActionButton>Manage policies</ActionButton></section><section className="ed-card"><header className="ed-card-head"><h3>Recent Activity</h3><a>View all</a></header>{["Rights Policy updated", "New user added", "Workflow published", "AI moderation rule updated", "Integration connected"].map((item) => <p className="ed-activity" key={item}><Bell size={16} />{item}<small>by Alex Kim · May 20</small></p>)}</section><section className="ed-card"><h3>System Health</h3>{["Storage", "Database", "Search Service", "AI Moderation", "Integrations"].map((item) => <p className="ed-row-between" key={item}><span>{item}</span><StatusBadge status="Operational" /></p>)}<a>View system status</a></section></aside>
      </div>
    </div>
  );
}
