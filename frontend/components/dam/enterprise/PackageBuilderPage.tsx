"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, FileText, Lock, MoreHorizontal, Plus, ShieldCheck, UploadCloud, Users } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { useAssetsSearch } from "@/components/dam/useDamApi";
import { assetType, displayTitle, formatBytes, sourceLabel } from "@/lib/enterprise-display";
import { assetEnterpriseStatus } from "@/lib/enterprise-status";
import { buildPackageGovernance } from "@/lib/package-governance";
import { addPackageAssetRef, availableAssetsForSection, createPackageDraft, removePackageAssetRef, resolvePackageSections, seedPackageDraft, updatePackageTitle } from "@/lib/package-drafts";
import { buildPortalReuseDecision } from "@/lib/portal-reuse-decision";
import { cn } from "@/lib/ui";
import { ActionButton, AssetCard, AssetThumb, ErrorCard, LoadingCard, PageHeader, SourcePill, StatusBadge } from "./EnterpriseShared";

export function EnterprisePackageBuilderPage() {
  const { role } = useDemoRole();
  const search = useAssetsSearch({ role, view: "approved-church-wide", limit: 18 });
  const [activeSection, setActiveSection] = useState("cover");
  const [approvedOnly, setApprovedOnly] = useState(true);
  const [draft, setDraft] = useState(() => createPackageDraft());
  const [packageMessage, setPackageMessage] = useState("");
  const assets = search.data?.assets || [];
  const packageAssetStatus = (asset: (typeof assets)[number]) => buildPortalReuseDecision(asset, role).reuse.state === "portal-ready" ? "Approved" : "Needs Review";
  useEffect(() => {
    if (!assets.length) return;
    setDraft((current) => seedPackageDraft(current, assets, packageAssetStatus));
  }, [assets, role]);
  const sections = useMemo(() => resolvePackageSections(draft, assets), [assets, draft]);
  const governance = useMemo(() => buildPackageGovernance(draft, sections, role), [draft, role, sections]);
  const sectionGovernance = useMemo(() => new Map(governance.sections.map((section) => [section.id, section])), [governance.sections]);
  const activeAvailableAssets = availableAssetsForSection({ draft, sectionId: activeSection, assets, approvedOnly, statusOf: packageAssetStatus });
  const publishBlocked = !governance.canPublish;
  const cover = sections[0]?.assets[0] || assets[0];
  const addFirstAvailableAsset = (sectionId: string) => {
    const nextAsset = activeAvailableAssets[0];
    if (!nextAsset) {
      setPackageMessage("No approved ResourceSpace asset is available for this section.");
      return;
    }
    setDraft((current) => addPackageAssetRef(current, sectionId, nextAsset));
    setPackageMessage(`${displayTitle(nextAsset)} added as a governed ResourceSpace reference.`);
  };
  return (
    <div className="enterprise-page enterprise-package-builder">
      <PageHeader title={draft.title || "Untitled Toolkit"} subtitle={`${approvedOnly ? "Portal Ready only" : "All visible assets"} · Portal-local draft · ResourceSpace references only`} actions={<><ActionButton icon={Eye} disabled={!governance.canPreview} onClick={() => setPackageMessage(`${sections.length} sections, ${governance.totalRefs} ResourceSpace refs, ${governance.blockedRefs} publish blockers.`)}>Preview package</ActionButton><ActionButton icon={Users} disabled={!governance.canShare} onClick={() => setPackageMessage("Share invite prepared locally. No external email or public link is sent in this beta.")}>Share</ActionButton><ActionButton tone="primary" icon={Lock} disabled={publishBlocked} onClick={() => setPackageMessage("Package publish would queue a portal-local package. ResourceSpace originals are not copied.")}>Publish package</ActionButton><ActionButton icon={UploadCloud} onClick={() => setPackageMessage("Draft saved locally for this beta session. Persistent package storage is not connected yet.")}>Save draft</ActionButton></>} />
      {packageMessage ? <p className="ed-inline-success">{packageMessage}</p> : null}
      {search.loading ? <LoadingCard /> : search.error ? <ErrorCard message={search.error} source={search.source} /> : (
        <div className="ed-builder-grid">
          <aside className="ed-panel ed-package-outline"><div className="ed-panel-title"><h3>Package outline</h3><button type="button" onClick={() => setPackageMessage("Fixed beta sections are used for this test. Rename package or add ResourceSpace refs inside a section.")} aria-label="Show section setup note"><Plus size={15} /></button></div>{sections.map((section) => {
            const sectionPacket = sectionGovernance.get(section.id);
            return <button className={activeSection === section.id ? "is-active" : ""} type="button" key={section.id} onClick={() => setActiveSection(section.id)}>{section.assets[0] ? <AssetThumb asset={section.assets[0]} /> : <FileText size={28} />}<span><strong>{section.title}</strong><small>{section.resourceSpaceAssetIds.length} refs · {sectionPacket?.portalReadyRefs || 0} Portal Ready</small></span><MoreHorizontal size={15} /></button>;
          })}<div className="ed-dropzone"><UploadCloud size={38} /><span>Use Library search to add ResourceSpace records</span><ActionButton disabled={!activeAvailableAssets[0]} onClick={() => addFirstAvailableAsset(activeSection)}>Browse assets</ActionButton></div></aside>
          <main className="ed-package-canvas"><section className="ed-card ed-cover-section"><header><h2>Cover</h2><button className="ed-link-button" type="button" onClick={() => addFirstAvailableAsset("cover")}>Replace cover</button></header>{cover ? <div><AssetThumb asset={cover} fit="contain" /><div><h3 title={displayTitle(cover)}>{displayTitle(cover)}</h3><p>{assetType(cover)} · {formatBytes(cover.fileSizeBytes)} · ResourceSpace {cover.resourceSpaceId || cover.id}</p><StatusBadge status={assetEnterpriseStatus(cover)} /><p className="ed-governance-note">{buildPortalReuseDecision(cover, role).reuse.summary}</p><ActionButton onClick={() => setPackageMessage(`Open record /assets/${cover.id} to inspect this ResourceSpace reference.`)}>View asset details</ActionButton></div></div> : <p>No Portal Ready ResourceSpace asset selected.</p>}</section>{sections.slice(1).map((section) => {
            const sectionPacket = sectionGovernance.get(section.id);
            return <section className={cn("ed-card ed-builder-section", activeSection === section.id && "is-active")} key={section.id}><header><h2>{section.title}</h2><div><button type="button" onClick={() => addFirstAvailableAsset(section.id)}>Add assets</button><button className="ed-link-button" type="button" onClick={() => setPackageMessage(`${section.title}: package settings stay portal-local in this beta.`)}>More</button></div></header><p>Portal package stores ResourceSpace IDs only. Asset records stay canonical in ResourceSpace.</p><div className="ed-builder-assets">{section.assets.length ? section.assets.map((asset) => {
              const governedAsset = sectionPacket?.assets.find((item) => item.asset.id === asset.id);
              return <div className="ed-package-ref" key={asset.id}><AssetCard asset={asset} /><p className="ed-ref-governance">{governedAsset?.reuseLabel || "Review"} · {governedAsset?.reason || "Governance check pending"}</p><button type="button" onClick={() => setDraft((current) => removePackageAssetRef(current, section.id, asset))}>Remove ref</button></div>;
            }) : <p>No matching ResourceSpace assets for this section.</p>}</div><footer><span>{section.resourceSpaceAssetIds.length} references · {sectionPacket?.blockedRefs || 0} publish blockers</span><button type="button" onClick={() => setActiveSection(section.id)}>Select section</button></footer></section>;
          })}
            <section className="ed-card"><header className="ed-card-head"><h3>Browse ResourceSpace assets</h3><SourcePill source={search.source} live={search.live} /></header><div className="ed-table-mini">{activeAvailableAssets.length ? activeAvailableAssets.map((asset) => <p key={asset.id}><strong>{displayTitle(asset)}</strong><span>ResourceSpace {asset.resourceSpaceId || asset.id} · {buildPortalReuseDecision(asset, role).reuse.label}</span><button type="button" onClick={() => setDraft((current) => addPackageAssetRef(current, activeSection, asset))}>Add to {sections.find((section) => section.id === activeSection)?.title || "section"}</button></p>) : <p>No additional Portal Ready assets available for this section.</p>}</div></section>
          </main>
          <aside className="ed-panel ed-package-details"><h3>Package details</h3><label>Package name<input className="ed-input" value={draft.title} onChange={(event) => setDraft((current) => updatePackageTitle(current, event.target.value))} /></label><label>Description<input className="ed-input" defaultValue="A portal-local package draft referencing ResourceSpace assets." /></label><h3>Sharing & access</h3><label>Visibility<select className="ed-input" defaultValue="Shared"><option>Shared with specific people</option></select></label><label>Message<input className="ed-input" placeholder="Add a message to recipients..." /></label><h3>Governance</h3><p className="ed-checkline"><CheckCircle2 size={16} />ResourceSpace IDs retained</p><p className="ed-checkline"><CheckCircle2 size={16} />Backend download gate required</p><p className={cn("ed-checkline", publishBlocked && "is-warn")}><ShieldCheck size={16} />{governance.reason}</p><div className="ed-command-readiness">{governance.commandCenter.map((item) => <p className={`is-${item.status}`} key={item.label}><strong>{item.label}</strong><span>{item.detail}</span></p>)}</div><p className="ed-governance-note">{governance.auditMessage}</p><label className="ed-toggle">Portal Ready only <input type="checkbox" checked={approvedOnly} onChange={(event) => setApprovedOnly(event.target.checked)} /></label><h3>Package summary</h3><div className="ed-summary-grid">{[[String(sections.length), "Sections"], [String(governance.totalRefs), "Refs"], [String(governance.portalReadyRefs), "Portal Ready"], [sourceLabel(search.source), "Source"]].map(([v,l]) => <span key={l}><strong>{v}</strong><small>{l}</small></span>)}</div></aside>
        </div>
      )}
    </div>
  );
}
