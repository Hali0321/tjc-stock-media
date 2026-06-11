"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileText,
  Lock,
  MoreHorizontal,
  PackageCheck,
  Plus,
  Send,
  ShieldCheck,
  UploadCloud
} from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { useAssetsSearch } from "@/components/dam/useDamApi";
import { assetType, displayTitle, formatBytes, sourceLabel } from "@/lib/enterprise-display";
import { assetEnterpriseStatus } from "@/lib/enterprise-status";
import { buildPackageGovernance } from "@/lib/package-governance";
import {
  addPackageAssetRef,
  availableAssetsForSection,
  createPackageDraft,
  packageAssetsForCollection,
  removePackageAssetRef,
  resolvePackageSections,
  seedPackageDraft,
  seedPackageDraftFromCollection,
  updatePackageTitle
} from "@/lib/package-drafts";
import { packageAssetRef } from "@/lib/package-refs";
import { buildPortalReuseDecision } from "@/lib/portal-reuse-decision";
import { routeWithRole } from "@/lib/role-routes";
import { cn } from "@/lib/ui";
import { ActionButton, AssetCard, AssetThumb, ErrorCard, LoadingCard, PageHeader, SourcePill, StatusBadge } from "./EnterpriseShared";

export function EnterprisePackageBuilderPage() {
  const router = useRouter();
  const { role } = useDemoRole();
  const opsView = role === "Reviewer" || role === "DAM Admin";
  const sourceRecordLabel = opsView ? "ResourceSpace" : "media library";
  const refLabel = opsView ? "ResourceSpace refs" : "media references";
  const refLabelSingular = opsView ? "ResourceSpace reference" : "media reference";
  const [activeSection, setActiveSection] = useState("cover");
  const [approvedOnly, setApprovedOnly] = useState(true);
  const [sourceCollectionId, setSourceCollectionId] = useState("");
  const [sourceCollectionChecked, setSourceCollectionChecked] = useState(false);
  const [draft, setDraft] = useState(() => createPackageDraft());
  const [packageMessage, setPackageMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const search = useAssetsSearch({
    role,
    view: sourceCollectionId ? undefined : "approved-church-wide",
    collection: sourceCollectionId || undefined,
    limit: sourceCollectionId ? 72 : 18
  });
  const assets = search.data?.assets || [];
  const collections = search.data?.collections || [];
  const selectedCollection = collections.find((collection) => collection.id === sourceCollectionId);

  const packageAssetStatus = useCallback(
    (asset: (typeof assets)[number]) => buildPortalReuseDecision(asset, role).reuse.state === "portal-ready" ? "Approved" : "Needs Review",
    [role]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const collectionId = new URLSearchParams(window.location.search).get("collection") || "";
    setSourceCollectionId(collectionId);
    setSourceCollectionChecked(true);
  }, []);

  useEffect(() => {
    if (!sourceCollectionChecked) return;
    if (sourceCollectionId) {
      if (!selectedCollection) return;
      setDraft((current) => seedPackageDraftFromCollection(current, selectedCollection, assets, packageAssetStatus));
      return;
    }
    if (!assets.length) return;
    setDraft((current) => seedPackageDraft(current, assets, packageAssetStatus));
  }, [assets, packageAssetStatus, selectedCollection, sourceCollectionChecked, sourceCollectionId]);

  const sourceAssets = useMemo(
    () => selectedCollection ? packageAssetsForCollection(selectedCollection, assets, packageAssetStatus) : assets,
    [assets, packageAssetStatus, selectedCollection]
  );
  const sections = useMemo(() => resolvePackageSections(draft, sourceAssets), [sourceAssets, draft]);
  const governance = useMemo(() => buildPackageGovernance(draft, sections, role), [draft, role, sections]);
  const sectionGovernance = useMemo(() => new Map(governance.sections.map((section) => [section.id, section])), [governance.sections]);
  const activeSectionPacket = sectionGovernance.get(activeSection);
  const activeAvailableAssets = availableAssetsForSection({ draft, sectionId: activeSection, assets: sourceAssets, approvedOnly, statusOf: packageAssetStatus });
  const publishBlocked = !governance.canPublish;
  const canSaveDraft = role === "Contributor" || role === "Reviewer" || role === "DAM Admin";
  const cover = sections[0]?.assets[0];
  const referenceLabel = (asset: (typeof assets)[number]) => packageAssetRef(asset) || "media-reference";
  const sourceScopeLabel = selectedCollection ? `${selectedCollection.name} collection` : sourceRecordLabel;
  const collectionVisibleCount = selectedCollection ? assets.length : 0;
  const collectionSkippedCount = selectedCollection ? Math.max(0, collectionVisibleCount - sourceAssets.length) : 0;
  const previewDisabledReason = governance.canPreview ? undefined : `Preview locked: ${governance.reason}`;
  const shareDisabledReason = governance.canShare ? undefined : `Share packet locked: ${governance.reason}`;
  const publishDisabledReason = governance.canPublish ? undefined : `Publish review locked: ${governance.reason}`;
  const saveDisabledReason = canSaveDraft ? undefined : "Save draft requires Contributor, Reviewer, or DAM Admin role.";
  const addFirstAvailableAsset = (sectionId: string) => {
    const nextAsset = activeAvailableAssets[0];
    if (!nextAsset) {
      setPackageMessage(`No Portal Ready ${sourceScopeLabel} asset is available for this section.`);
      return;
    }
    setDraft((current) => addPackageAssetRef(current, sectionId, nextAsset));
    setPackageMessage(`${displayTitle(nextAsset)} added as a governed ${refLabelSingular}.`);
  };

  const saveDraft = async () => {
    if (!canSaveDraft) {
      setPackageMessage("Package draft save requires Contributor, Reviewer, or DAM Admin role.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/packages?role=${encodeURIComponent(role)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ draft })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Package draft save failed.");
      if (payload.package?.id) setDraft((current) => ({ ...current, id: payload.package.id, updatedAt: payload.package.updatedAt }));
      setPackageMessage(`Draft saved to ${payload.storageMode || "local-json"} with ${payload.package?.governance?.totalRefs ?? governance.totalRefs} ${refLabel}.`);
    } catch (error) {
      setPackageMessage(error instanceof Error ? error.message : "Package draft save failed.");
    } finally {
      setSaving(false);
    }
  };

  const previewPackage = () => {
    setPackageMessage(`${sections.length} sections, ${governance.totalRefs} selected ${refLabel}, ${governance.readinessScore}% publish-ready. No files copied.`);
  };

  const prepareShare = () => {
    setPackageMessage("Share packet prepared locally. No external email, public link, ZIP, or download was created.");
  };

  const queuePublish = () => {
    setPackageMessage(opsView ? "Publish review can be queued locally. ResourceSpace originals stay canonical and are not copied." : "Publish review can be queued locally. Original files stay protected and are not copied.");
  };

  const nextSafeAction = (() => {
    if (governance.canPublish) {
      return {
        title: "Ready for publish review",
        body: "All selected refs are Portal Ready. Queue publish review without copying originals.",
        action: "Queue publish review",
        onClick: queuePublish,
        tone: "ready" as const
      };
    }
    if (collectionSkippedCount) {
      if (!opsView) {
        return {
          title: "Review evidence before packaging",
          body: `${collectionSkippedCount.toLocaleString()} visible collection record${collectionSkippedCount === 1 ? "" : "s"} stayed out because publish evidence is incomplete. Ask a reviewer to clear usage scope, people/minors, and notes first.`,
          action: "Request review",
          onClick: () => setPackageMessage("Review request prepared locally. A Reviewer or DAM Admin must clear evidence before these records can enter a package."),
          tone: "review" as const
        };
      }
      return {
        title: "Review evidence before packaging",
        body: `${collectionSkippedCount.toLocaleString()} visible collection record${collectionSkippedCount === 1 ? "" : "s"} stayed out because publish evidence is incomplete.`,
        action: "Open review queue",
        onClick: () => router.push(routeWithRole("/review", role)),
        tone: "review" as const
      };
    }
    if (sourceAssets.length) {
      return {
        title: "Add Portal Ready refs",
        body: `${sourceAssets.length.toLocaleString()} Portal Ready ref${sourceAssets.length === 1 ? "" : "s"} can be added to the selected package section.`,
        action: "Add first ref",
        onClick: () => addFirstAvailableAsset(activeSection),
        tone: "ready" as const
      };
    }
    return {
      title: "Find usable media first",
      body: "Package commands stay locked until at least one Portal Ready ref is selected.",
      action: "Open library",
      onClick: () => router.push(routeWithRole("/", role)),
      tone: "blocked" as const
    };
  })();

  return (
    <div className="enterprise-page enterprise-package-builder">
      <PageHeader
        title={draft.title || "Untitled Toolkit"}
        subtitle={`${approvedOnly ? "Portal Ready only" : "Visible refs"} · Portal-local draft · ${refLabel} only`}
        actions={
          <>
            <ActionButton icon={Eye} disabled={!governance.canPreview} disabledReason={previewDisabledReason} onClick={previewPackage}>Preview package</ActionButton>
            <ActionButton icon={Send} disabled={!governance.canShare} disabledReason={shareDisabledReason} onClick={prepareShare}>Prepare share packet</ActionButton>
            <ActionButton tone="primary" icon={Lock} disabled={publishBlocked} disabledReason={publishDisabledReason} onClick={queuePublish}>Queue publish review</ActionButton>
            <ActionButton icon={UploadCloud} disabled={saving || !canSaveDraft} disabledReason={saving ? "Saving draft now." : saveDisabledReason} onClick={saveDraft}>{saving ? "Saving..." : "Save draft"}</ActionButton>
          </>
        }
      />

      {selectedCollection ? (
        <section className="ed-package-source-strip">
          <PackageCheck size={20} />
          <div>
            <strong>Started from {selectedCollection.name}</strong>
            <span>{sourceAssets.length.toLocaleString()} visible Portal Ready package refs available here; {collectionVisibleCount.toLocaleString()} visible collection records loaded from {sourceRecordLabel}. {collectionSkippedCount ? `${collectionSkippedCount.toLocaleString()} stay out until publish evidence passes. ` : ""}Full archive membership stays in DAM source.</span>
          </div>
          <button type="button" onClick={() => setPackageMessage("Collection path imports visible Portal Ready refs only. Review-only or hidden media remain out of this draft.")}>Ref policy</button>
        </section>
      ) : null}

      <section className={cn("ed-package-readiness", `is-${governance.readinessStatus}`)}>
        <div>
          <span>Package readiness</span>
          <strong>{governance.readinessScore}%</strong>
          <small>{governance.readinessLabel}</small>
        </div>
        <div className="ed-readiness-meter" aria-label={`Package readiness ${governance.readinessScore}%`}>
          <span style={{ width: `${governance.readinessScore}%` }} />
        </div>
        <p>{governance.reason}</p>
      </section>

      <section className={cn("ed-package-action-guide", `is-${nextSafeAction.tone}`)}>
        <div>
          <strong>{nextSafeAction.title}</strong>
          <span>{nextSafeAction.body}</span>
        </div>
        <button type="button" onClick={nextSafeAction.onClick}>{nextSafeAction.action}</button>
      </section>

      {packageMessage ? <p className="ed-inline-success">{packageMessage}</p> : null}

      {search.loading ? <LoadingCard /> : search.error ? <ErrorCard message={search.error} source={search.source} /> : (
        <div className="ed-builder-grid">
          <aside className="ed-panel ed-package-outline">
            <div className="ed-panel-title">
              <h3>Package outline</h3>
              <button type="button" onClick={() => setPackageMessage(`Fixed beta sections are used for this test. Rename package or add ${refLabel} inside a section.`)} aria-label="Show section setup note"><Plus size={15} /></button>
            </div>
            {sections.map((section) => {
              const sectionPacket = sectionGovernance.get(section.id);
              return (
                <button className={cn(activeSection === section.id && "is-active", sectionPacket && `is-${sectionPacket.readinessStatus}`)} type="button" key={section.id} onClick={() => setActiveSection(section.id)}>
                  {section.assets[0] ? <AssetThumb asset={section.assets[0]} /> : <FileText size={28} />}
                  <span>
                    <strong>{section.title}</strong>
                    <small>{section.resourceSpaceAssetIds.length} refs · {sectionPacket?.readinessScore || 0}% ready</small>
                    <em>{sectionPacket?.blockedRefs ? `${sectionPacket.blockedRefs} blockers` : sectionPacket?.readinessSummary}</em>
                  </span>
                  <MoreHorizontal size={15} />
                </button>
              );
            })}
            <div className="ed-dropzone">
              <UploadCloud size={38} />
              <span>Add governed refs from {sourceScopeLabel}</span>
              <ActionButton disabled={!activeAvailableAssets[0]} onClick={() => addFirstAvailableAsset(activeSection)}>Browse assets</ActionButton>
            </div>
          </aside>

          <main className="ed-package-canvas">
            {activeSectionPacket ? (
              <section className={cn("ed-card ed-section-blockers", activeSectionPacket.blockedRefs > 0 && "is-warn")}>
                <header className="ed-card-head">
                  <h3>{activeSectionPacket.title} readiness</h3>
                  <span>{activeSectionPacket.readinessScore}% Portal Ready</span>
                </header>
                <p>{activeSectionPacket.readinessSummary}</p>
                {activeSectionPacket.blockers.length ? (
                  <div>
                    {activeSectionPacket.blockers.slice(0, 4).map((blocker) => <span key={blocker}><AlertTriangle size={14} />{blocker}</span>)}
                  </div>
                ) : (
                  <div><span><CheckCircle2 size={14} />No publish blockers in selected refs.</span></div>
                )}
              </section>
            ) : null}

            <section className="ed-card ed-cover-section">
              <header>
                <h2>Cover</h2>
                <button className="ed-link-button" type="button" onClick={() => addFirstAvailableAsset("cover")}>Replace cover</button>
              </header>
              {cover ? (
                <div>
                  <AssetThumb asset={cover} fit="contain" />
                  <div>
                    <h3 title={displayTitle(cover)}>{displayTitle(cover)}</h3>
                    <p>{assetType(cover)} · {formatBytes(cover.fileSizeBytes)} · {opsView ? `ResourceSpace ${referenceLabel(cover)}` : `Reference ${referenceLabel(cover)}`}</p>
                    <StatusBadge status={assetEnterpriseStatus(cover)} />
                    <p className="ed-governance-note">{buildPortalReuseDecision(cover, role).reuse.summary}</p>
                    <ActionButton onClick={() => router.push(routeWithRole(`/assets/${encodeURIComponent(cover.id)}`, role))}>View asset details</ActionButton>
                  </div>
                </div>
              ) : <p>{collectionVisibleCount ? `${collectionVisibleCount.toLocaleString()} ${sourceScopeLabel} records are visible, but none have enough publish evidence to become the package cover yet.` : `No Portal Ready ${sourceScopeLabel} asset selected.`}</p>}
            </section>

            {sections.slice(1).map((section) => {
              const sectionPacket = sectionGovernance.get(section.id);
              return (
                <section className={cn("ed-card ed-builder-section", activeSection === section.id && "is-active")} key={section.id}>
                  <header>
                    <h2>{section.title}</h2>
                    <div>
                      <button type="button" onClick={() => addFirstAvailableAsset(section.id)}>Add assets</button>
                      <button className="ed-link-button" type="button" onClick={() => setPackageMessage(`${section.title}: package settings stay portal-local in this beta.`)}>More</button>
                    </div>
                  </header>
                  <p>{opsView ? "Portal package stores ResourceSpace IDs only. Asset records stay canonical in ResourceSpace." : "Portal package stores media references only. Asset records stay canonical in the media library."}</p>
                  <div className="ed-builder-assets">
                    {section.assets.length ? section.assets.map((asset) => {
                      const governedAsset = sectionPacket?.assets.find((item) => item.asset.id === asset.id);
                      return (
                        <div className="ed-package-ref" key={asset.id}>
                          <AssetCard asset={asset} />
                          <p className="ed-ref-governance">{governedAsset?.reuseLabel || "Review"} · {governedAsset?.reason || "Governance check pending"}</p>
                          <button type="button" onClick={() => setDraft((current) => removePackageAssetRef(current, section.id, asset))}>Remove ref</button>
                        </div>
                      );
                    }) : <p>No matching {sourceScopeLabel} assets for this section.</p>}
                  </div>
                  <footer>
                    <span>{section.resourceSpaceAssetIds.length} refs · {sectionPacket?.blockedRefs || 0} publish blockers · {sectionPacket?.readinessScore || 0}% ready</span>
                    <button type="button" onClick={() => setActiveSection(section.id)}>Select section</button>
                  </footer>
                </section>
              );
            })}

            <section className="ed-card">
              <header className="ed-card-head">
                <h3>Browse {sourceScopeLabel} assets</h3>
                <SourcePill source={search.source} live={search.live} />
              </header>
              <div className="ed-table-mini ed-ref-picker">
                {activeAvailableAssets.length ? activeAvailableAssets.map((asset) => (
                  <p key={asset.id}>
                    <strong>{displayTitle(asset)}</strong>
                    <span>{opsView ? `ResourceSpace ${referenceLabel(asset)}` : `Reference ${referenceLabel(asset)}`} · {buildPortalReuseDecision(asset, role).reuse.label}</span>
                    <button type="button" onClick={() => setDraft((current) => addPackageAssetRef(current, activeSection, asset))}>Add to {sections.find((section) => section.id === activeSection)?.title || "section"}</button>
                  </p>
                )) : <p>No additional Portal Ready assets available for this section.</p>}
              </div>
            </section>
          </main>

          <aside className="ed-panel ed-package-details">
            <h3>Package details</h3>
            <label>Package name<input className="ed-input" value={draft.title} onChange={(event) => setDraft((current) => updatePackageTitle(current, event.target.value))} /></label>
            <label>Description<input className="ed-input" value={draft.description || `A portal-local package draft referencing ${sourceScopeLabel} assets.`} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} /></label>
            <h3>Sharing & access</h3>
            <label>Visibility<select className="ed-input" defaultValue="Shared with specific people"><option>Shared with specific people</option></select></label>
            <label>Message<input className="ed-input" placeholder="Add a message to recipients..." /></label>
            <h3>Governance</h3>
            <p className="ed-checkline"><CheckCircle2 size={16} />{opsView ? "ResourceSpace IDs retained" : "Media references retained"}</p>
            <p className="ed-checkline"><CheckCircle2 size={16} />No ZIP, no public link, no copied originals</p>
            <p className={cn("ed-checkline", publishBlocked && "is-warn")}><ShieldCheck size={16} />{governance.reason}</p>
            <div className="ed-command-readiness">{governance.commandCenter.map((item) => <p className={`is-${item.status}`} key={item.label}><strong>{item.label}</strong><span>{item.detail}</span></p>)}</div>
            <p className="ed-governance-note">{governance.auditMessage}</p>
            <label className="ed-toggle">Portal Ready only <input type="checkbox" checked={approvedOnly} onChange={(event) => setApprovedOnly(event.target.checked)} /></label>
            <h3>Package summary</h3>
            <div className="ed-summary-grid">{[[String(sections.length), "Sections"], [String(governance.totalRefs), "Selected refs"], [String(governance.portalReadyRefs), "Portal Ready"], [String(governance.blockedRefs), "Blockers"], ["0", "Copied assets"], [sourceLabel(search.source), "Source"]].map(([v, l]) => <span key={l}><strong>{v}</strong><small>{l}</small></span>)}</div>
          </aside>
        </div>
      )}
    </div>
  );
}
