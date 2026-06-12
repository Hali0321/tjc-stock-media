"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  FileText,
  Lock,
  MoreHorizontal,
  PackageCheck,
  Plus,
  Search,
  Send,
  ShieldCheck,
  UploadCloud
} from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { useAssetsSearch } from "@/components/dam/useDamApi";
import { displayTitle, sourceLabel } from "@/lib/enterprise-display";
import { buildPackageGovernance } from "@/lib/package-governance";
import { presentPackageBuilderContext } from "@/lib/portal-context-presenters";
import {
  addPackageAssetRef,
  availableAssetsForSection,
  createPackageDraft,
  packageAssetsForCollection,
  removePackageAssetRef,
  resolvePackageSections,
  updatePackageTitle
} from "@/lib/package-drafts";
import { packageAssetRef } from "@/lib/package-refs";
import { buildPortalReuseDecision } from "@/lib/portal-reuse-decision";
import { routeWithRole } from "@/lib/role-routes";
import { matchesCatalogFilter } from "@/lib/catalog-language";
import { cn } from "@/lib/ui";
import { ActionButton, AssetCard, AssetThumb, ErrorCard, LoadingCard, SourcePill } from "./EnterpriseShared";

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
  const [packageFilters, setPackageFilters] = useState<string[]>([]);
  const [packageFacetQuery, setPackageFacetQuery] = useState("");
  const [draft, setDraft] = useState(() => createPackageDraft());
  const [packageMessage, setPackageMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const search = useAssetsSearch({
    role,
    view: sourceCollectionId ? undefined : "approved-church-wide",
    collection: sourceCollectionId || undefined,
    filters: packageFilters,
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
      setDraft((current) => ({
        ...current,
        title: current.title === "ResourceSpace Toolkit Draft" ? `${selectedCollection.name} Toolkit Draft` : current.title,
        description: current.description || `Started from ${selectedCollection.name}. Add approved media references manually; full archive membership remains in the DAM.`,
        collectionId: selectedCollection.id
      }));
      return;
    }
  }, [selectedCollection, sourceCollectionChecked, sourceCollectionId]);

  const sourceAssets = useMemo(
    () => selectedCollection ? packageAssetsForCollection(selectedCollection, assets, packageAssetStatus) : assets,
    [assets, packageAssetStatus, selectedCollection]
  );
  const sections = useMemo(() => resolvePackageSections(draft, sourceAssets), [sourceAssets, draft]);
  const governance = useMemo(() => buildPackageGovernance(draft, sections, role), [draft, role, sections]);
  const packagePresentation = useMemo(() => presentPackageBuilderContext(governance), [governance]);
  const sectionGovernance = useMemo(() => new Map(governance.sections.map((section) => [section.id, section])), [governance.sections]);
  const allSectionsEmpty = governance.totalRefs === 0;
  const activeAvailableAssets = availableAssetsForSection({ draft, sectionId: activeSection, assets: sourceAssets, approvedOnly, statusOf: packageAssetStatus });
  const publishBlocked = !governance.canPublish;
  const canSaveDraft = role === "Contributor" || role === "Reviewer" || role === "DAM Admin";
  const referenceLabel = (asset: (typeof assets)[number]) => packageAssetRef(asset) || "media-reference";
  const sourceScopeLabel = selectedCollection ? `${selectedCollection.name} collection` : sourceRecordLabel;
  const collectionVisibleCount = selectedCollection ? assets.length : 0;
  const collectionSkippedCount = selectedCollection ? Math.max(0, collectionVisibleCount - sourceAssets.length) : 0;
  const packageFacetOptions = [
    { label: "Worship", filter: "worship" },
    { label: "Sermon", filter: "sermon" },
    { label: "Stage", filter: "stage" },
    { label: "Website hero", filter: "landscape" },
    { label: "No people", filter: "no people" },
    { label: "Photo", filter: "photo" },
    { label: "Graphic", filter: "graphic" },
    { label: "Approved public", filter: "approved public" },
    { label: "Approved internal", filter: "approved internal" },
    { label: "Metadata enrichment", filter: "metadata enrichment" }
  ];
  const visiblePackageFacets = packageFacetOptions.filter((option) => option.label.toLowerCase().includes(packageFacetQuery.trim().toLowerCase()));
  const packageFacetCount = (filter: string) => assets.filter((asset) => matchesCatalogFilter(asset, filter)).length;
  const readinessReason = governance.totalRefs
    ? governance.reason
    : "Package needs approved media references before readiness review.";
  const previewDisabledReason = governance.canPreview ? undefined : `Reference preview locked: ${readinessReason}`;
  const shareDisabledReason = governance.canShare ? undefined : `Access scope locked: ${readinessReason}`;
  const publishDisabledReason = governance.canPublish ? undefined : `Readiness review locked: ${readinessReason}`;
  const saveDisabledReason = canSaveDraft ? undefined : "Save draft requires Contributor, Reviewer, or DAM Admin role.";
  const availableAssetsForTargetSection = (sectionId: string) => availableAssetsForSection({ draft, sectionId, assets: sourceAssets, approvedOnly, statusOf: packageAssetStatus });
  const addFirstAvailableAsset = (sectionId: string) => {
    const nextAsset = availableAssetsForTargetSection(sectionId)[0];
    if (!nextAsset) {
      setPackageMessage(`No approved ${sourceScopeLabel} media reference is available for this section.`);
      return;
    }
    setDraft((current) => addPackageAssetRef(current, sectionId, nextAsset));
    setPackageMessage(`${displayTitle(nextAsset)} added as a governed ${refLabelSingular}.`);
  };
  const togglePackageFilter = (filter: string) => {
    setPackageFilters((current) => current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]);
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
    setPackageMessage(`${sections.length} sections, ${governance.totalRefs} selected ${refLabel}, ${governance.readinessScore}% ready. No files copied.`);
  };

  const prepareShare = () => {
    setPackageMessage("Access scope checked locally. No external email, public link, ZIP, or download was created.");
  };

  const queuePublish = () => {
    setPackageMessage(opsView ? "Readiness review can be queued locally. ResourceSpace originals stay canonical and are not copied." : "Readiness review can be queued locally. Original files stay protected and are not copied.");
  };

  const sectionLabel = (title: string) => title.replace(/^\d+\.\s*/, "");
  const sectionStatusLabel = (status?: "ready" | "review" | "blocked" | "empty") => {
    if (status === "ready") return "Ready";
    if (status === "empty") return "Needs assets";
    if (status === "review") return "Needs review";
    if (status === "blocked") return "Blocked";
    return "Needs assets";
  };
  const commandLabel = (label: string) => {
    if (/preview/i.test(label)) return "Reference preview";
    if (/share/i.test(label)) return "Access scope";
    if (/publish/i.test(label)) return "Readiness review";
    return label;
  };
  const commandStatusLabel = (status: "ready" | "blocked" | "review") => {
    if (status === "ready") return "Ready";
    if (status === "review") return "Needs review";
    return "Locked";
  };
  const commandDetail = (label: string, detail: string) => {
    if (/preview/i.test(label)) return governance.canPreview ? "All references can render a role-safe preview." : "Reference preview waits for approved, resolvable media references.";
    if (/share/i.test(label)) return governance.canShare ? "Access scope passes without public-link creation." : "Access scope waits for approved references and role-safe permissions.";
    if (/publish/i.test(label)) return governance.canPublish ? "Readiness checks pass while originals stay protected." : readinessReason;
    return detail;
  };
  const handlePrimaryPackageAction = () => {
    if (governance.totalRefs) {
      if (governance.canPreview) previewPackage();
      else setPackageMessage(`Review package readiness: ${governance.reason}`);
      return;
    }
    if (activeAvailableAssets[0]) {
      addFirstAvailableAsset(activeSection);
      return;
    }
    router.push(routeWithRole("/", role));
  };

  return (
    <div className="enterprise-page enterprise-package-builder">
      <header className="ed-package-builder-header">
        <div>
          <span className="ed-package-builder-kicker">Package Builder</span>
          <h1>{draft.title || "ResourceSpace Toolkit Draft"}</h1>
          <p>{draft.status === "draft" ? "Draft" : draft.status} · {packagePresentation.selectedAssetLabel} · {packagePresentation.readinessState}</p>
        </div>
        <div className="ed-package-builder-actions" aria-label="Package builder actions">
          <ActionButton tone="primary" icon={Plus} ariaLabel={`${packagePresentation.primaryActionLabel} for package draft`} onClick={handlePrimaryPackageAction}>{packagePresentation.primaryActionLabel}</ActionButton>
          <ActionButton icon={UploadCloud} ariaLabel="Save package draft" disabled={saving || !canSaveDraft} disabledReason={saving ? "Saving draft now." : saveDisabledReason} onClick={saveDraft}>{saving ? "Saving..." : "Save draft"}</ActionButton>
          <ActionButton icon={MoreHorizontal} ariaLabel="Review package readiness actions" onClick={() => setPackageMessage("Readiness actions stay locked until selected references pass governance.")}>More actions</ActionButton>
        </div>
      </header>

      {selectedCollection ? (
        <section className="ed-package-source-strip">
          <PackageCheck size={20} />
          <div>
            <strong>Started from {selectedCollection.name}</strong>
            <span>{sourceAssets.length.toLocaleString()} visible Portal Ready package refs available here; {collectionVisibleCount.toLocaleString()} visible collection records loaded from {sourceRecordLabel}. {collectionSkippedCount ? `${collectionSkippedCount.toLocaleString()} stay out until readiness evidence passes. ` : ""}Full archive membership stays in DAM source.</span>
          </div>
          <button type="button" onClick={() => setPackageMessage("Collection path imports visible Portal Ready refs only. Review-only or hidden media remain out of this draft.")}>Ref policy</button>
        </section>
      ) : null}

      <section className={cn("ed-package-readiness ed-package-readiness-compact", `is-${governance.readinessStatus}`)} aria-label="Package readiness summary">
        <div>
          <span>Package readiness</span>
          <strong>{governance.readinessScore}% ready</strong>
        </div>
        <div>
          <span>Selected</span>
          <strong>{governance.totalRefs.toLocaleString()} assets selected</strong>
        </div>
        <div>
          <span>Structure</span>
          <strong>{sections.length.toLocaleString()} sections</strong>
        </div>
        <div>
          <span>Next step</span>
          <strong>{packagePresentation.nextStep}</strong>
        </div>
        <p>{packagePresentation.readinessMessage}</p>
      </section>

      <section className={cn("ed-package-assembly", `is-${governance.readinessStatus}`)} aria-labelledby="package-assembly-title">
        <div className="ed-package-assembly-primary">
          <span>Package Assembly</span>
          <h2 id="package-assembly-title">{draft.title || "ResourceSpace Toolkit Draft"}</h2>
          <p>{packagePresentation.readinessMessage}</p>
          <div className="ed-package-assembly-actions" aria-label="Package assembly actions">
            <ActionButton tone="primary" icon={Plus} ariaLabel={`${packagePresentation.primaryActionLabel} for package assembly`} onClick={handlePrimaryPackageAction}>{packagePresentation.primaryActionLabel}</ActionButton>
            <ActionButton icon={UploadCloud} ariaLabel="Save package assembly draft" disabled={saving || !canSaveDraft} disabledReason={saving ? "Saving draft now." : saveDisabledReason} onClick={saveDraft}>{saving ? "Saving..." : "Save draft"}</ActionButton>
          </div>
        </div>
        <div className="ed-package-assembly-stats" aria-label="Current package assembly status">
          <p><strong>{governance.readinessScore}%</strong><span>Ready</span></p>
          <p><strong>{governance.totalRefs.toLocaleString()}</strong><span>Assets selected</span></p>
          <p><strong>{sections.length.toLocaleString()}</strong><span>Sections</span></p>
          <p><strong>{governance.blockedRefs.toLocaleString()}</strong><span>Blockers</span></p>
        </div>
        <div className="ed-package-assembly-next">
          <div>
            <span>Next required step</span>
            <strong>{packagePresentation.nextStep}</strong>
            <small>{readinessReason}</small>
          </div>
          <div className="ed-package-assembly-commands" aria-label="Readiness commands">
            {governance.commandCenter.map((item) => (
              <p className={`is-${item.status}`} key={item.label}>
                <span>{commandLabel(item.label)}</span>
                <strong>{commandStatusLabel(item.status)}</strong>
              </p>
            ))}
          </div>
        </div>
      </section>

      {packageMessage ? <p className="ed-inline-success">{packageMessage}</p> : null}

      {search.loading ? <LoadingCard /> : search.error ? <ErrorCard message={search.error} source={search.source} /> : (
        <div className="ed-builder-grid">
          <aside className="ed-package-left-rail" aria-label="Package assembly controls">
            <section className="ed-panel ed-package-outline" aria-labelledby="package-outline-title">
              <div className="ed-panel-title">
                <h3 id="package-outline-title">Package outline</h3>
                <span>{sections.length.toLocaleString()} sections</span>
              </div>
              <div className="ed-package-outline-list">
                {sections.map((section) => {
                  const sectionPacket = sectionGovernance.get(section.id);
                  return (
                    <button className={cn(activeSection === section.id && "is-active", sectionPacket && `is-${sectionPacket.readinessStatus}`)} type="button" key={section.id} onClick={() => setActiveSection(section.id)} aria-label={`${sectionLabel(section.title)}: ${section.resourceSpaceAssetIds.length} selected, ${sectionStatusLabel(sectionPacket?.readinessStatus)}`}>
                      {section.assets[0] ? <AssetThumb asset={section.assets[0]} /> : <FileText size={24} />}
                      <span>
                        <strong>{sectionLabel(section.title)}</strong>
                        <small>{section.resourceSpaceAssetIds.length} selected</small>
                        <em>{sectionStatusLabel(sectionPacket?.readinessStatus)}</em>
                      </span>
                      <MoreHorizontal size={15} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
              <details className="ed-package-taxonomy">
                <summary>Filters and source collections</summary>
                <header>
                  <span>Taxonomy</span>
                  {packageFilters.length ? <button type="button" onClick={() => setPackageFilters([])}>Clear</button> : <em>{assets.length.toLocaleString()}</em>}
                </header>
                <label className="ed-taxonomy-search">
                  <Search size={14} aria-hidden="true" />
                  <span className="sr-only">Search package filters</span>
                  <input value={packageFacetQuery} onChange={(event) => setPackageFacetQuery(event.target.value)} placeholder="Search tags, source, type..." />
                </label>
                <div>
                  {collections.slice(0, 5).map((collection) => (
                    <button className={cn(sourceCollectionId === collection.id && "is-active")} type="button" key={collection.id} aria-current={sourceCollectionId === collection.id ? "true" : undefined} onClick={() => { setSourceCollectionId(sourceCollectionId === collection.id ? "" : collection.id); setPackageFilters([]); }}>
                      <span>{collection.name}</span>
                      <em>{collection.count.toLocaleString()}</em>
                    </button>
                  ))}
                </div>
                <div>
                  {visiblePackageFacets.map((option) => (
                    <button className={cn(packageFilters.includes(option.filter) && "is-active")} type="button" key={option.filter} aria-pressed={packageFilters.includes(option.filter)} onClick={() => togglePackageFilter(option.filter)}>
                      <span>{option.label}</span>
                      <em>{packageFacetCount(option.filter).toLocaleString()}</em>
                    </button>
                  ))}
                </div>
              </details>
            </section>

            <section className="ed-panel ed-package-browse-panel" aria-labelledby="package-browse-title">
              <header className="ed-card-head">
                <div>
                  <h3 id="package-browse-title">Browse approved assets</h3>
                  <p>Add governed refs to {sectionLabel(sections.find((section) => section.id === activeSection)?.title || "selected section")}.</p>
                </div>
                <SourcePill source={search.source} live={search.live} />
              </header>
              <div className="ed-dropzone">
                <UploadCloud size={34} />
                <span>Add governed refs from {sourceScopeLabel}</span>
                <ActionButton ariaLabel={`Add approved media reference to ${sectionLabel(sections.find((section) => section.id === activeSection)?.title || "selected section")}`} disabled={!activeAvailableAssets[0]} disabledReason={`No approved ${sourceScopeLabel} media reference is available for this section.`} onClick={() => addFirstAvailableAsset(activeSection)}>Add approved media references</ActionButton>
              </div>
              <div className="ed-table-mini ed-ref-picker">
                {activeAvailableAssets.length ? activeAvailableAssets.slice(0, 4).map((asset) => (
                  <p key={asset.id}>
                    <strong>{displayTitle(asset)}</strong>
                    <span>{opsView ? `ResourceSpace ${referenceLabel(asset)}` : `Reference ${referenceLabel(asset)}`} · {buildPortalReuseDecision(asset, role).reuse.label}</span>
                    <button type="button" aria-label={`Add ${displayTitle(asset)} to ${sectionLabel(sections.find((section) => section.id === activeSection)?.title || "selected section")}`} onClick={() => setDraft((current) => addPackageAssetRef(current, activeSection, asset))}>Add</button>
                  </p>
                )) : <p>No approved media references available for this section.</p>}
              </div>
            </section>
          </aside>

          <main className={cn("ed-package-canvas", allSectionsEmpty && "is-empty-package")}>
            {sections.map((section) => {
              const sectionPacket = sectionGovernance.get(section.id);
              return (
                <section className={cn("ed-card ed-builder-section", activeSection === section.id && "is-active")} key={section.id}>
                  <header>
                    <div>
                      <h2>{sectionLabel(section.title)}</h2>
                      <p>{section.resourceSpaceAssetIds.length} selected · {sectionStatusLabel(sectionPacket?.readinessStatus)}</p>
                    </div>
                    <div className="ed-section-actions">
                      <button type="button" aria-label={`Add approved media references to ${sectionLabel(section.title)}`} onClick={() => addFirstAvailableAsset(section.id)}>Add approved media references</button>
                      <button className="ed-link-button" type="button" aria-label={`Review portal-local settings for ${sectionLabel(section.title)}`} onClick={() => setPackageMessage(`${sectionLabel(section.title)} settings stay portal-local in this beta.`)}>Section settings</button>
                    </div>
                  </header>
                  <p>{section.resourceSpaceAssetIds.length ? sectionPacket?.readinessSummary : "Ready for approved media references."}</p>
                  <div className="ed-builder-assets">
                    {section.assets.length ? section.assets.map((asset) => {
                      const governedAsset = sectionPacket?.assets.find((item) => item.asset.id === asset.id);
                      return (
                        <div className="ed-package-ref" key={asset.id}>
                          <AssetCard asset={asset} />
                          <p className="ed-ref-governance">{governedAsset?.reuseLabel || "Review"} · {governedAsset?.reason || "Governance check pending"}</p>
                          <button type="button" aria-label={`Remove ${displayTitle(asset)} from ${sectionLabel(section.title)}`} onClick={() => setDraft((current) => removePackageAssetRef(current, section.id, asset))}>Remove ref</button>
                        </div>
                      );
                    }) : (
                      <div className="ed-section-empty">
                        <FileText size={20} />
                        <span>Add approved media references when ready.</span>
                        <button type="button" aria-label={`Add approved media references to ${sectionLabel(section.title)}`} onClick={() => addFirstAvailableAsset(section.id)}>Add approved media references</button>
                      </div>
                    )}
                  </div>
                  <footer>
                    <span>{section.resourceSpaceAssetIds.length} refs · {sectionPacket?.blockedRefs || 0} readiness blockers · {sectionPacket?.readinessScore || 0}% ready</span>
                    <button type="button" aria-label={`Select ${sectionLabel(section.title)} section`} onClick={() => setActiveSection(section.id)}>Select section</button>
                  </footer>
                </section>
              );
            })}
          </main>

          <aside className="ed-panel ed-package-details">
            <section>
              <h3>Package readiness</h3>
              <div className="ed-command-readiness">{governance.commandCenter.map((item) => <p className={`is-${item.status}`} key={item.label}><strong>{commandLabel(item.label)}</strong><span>{commandDetail(item.label, item.detail)}</span></p>)}</div>
              <div className="ed-package-rail-actions">
                <ActionButton icon={Eye} ariaLabel="Check role-safe reference preview" disabled={!governance.canPreview} disabledReason={previewDisabledReason} onClick={previewPackage}>Check preview</ActionButton>
                <ActionButton icon={Send} ariaLabel="Check package access scope" disabled={!governance.canShare} disabledReason={shareDisabledReason} onClick={prepareShare}>Check access</ActionButton>
                <ActionButton tone="primary" icon={Lock} ariaLabel="Review package readiness gate" disabled={publishBlocked} disabledReason={publishDisabledReason} onClick={queuePublish}>Review readiness</ActionButton>
              </div>
              <p className="ed-governance-note">{packagePresentation.governanceNote}</p>
            </section>
            <section>
              <h3>Package details</h3>
              <label>Package name<input className="ed-input" value={draft.title} onChange={(event) => setDraft((current) => updatePackageTitle(current, event.target.value))} /></label>
              <label>Description<input className="ed-input" value={draft.description || `A portal-local package draft referencing ${sourceScopeLabel} assets.`} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} /></label>
            </section>
            <section>
              <h3>Sharing & access</h3>
              <label>Visibility<select className="ed-input" defaultValue="Shared with specific people"><option>Shared with specific people</option></select></label>
              <label>Message<input className="ed-input" placeholder="Add a message to recipients..." /></label>
            </section>
            <section>
              <h3>Governance</h3>
              <p className="ed-checkline"><CheckCircle2 size={16} />{opsView ? "ResourceSpace IDs retained" : "Media references retained"}</p>
              <p className="ed-checkline"><CheckCircle2 size={16} />No ZIP, no public link, no copied originals</p>
              <p className={cn("ed-checkline", publishBlocked && "is-warn")}><ShieldCheck size={16} />{readinessReason}</p>
              <p className="ed-governance-note">{governance.auditMessage}</p>
              <label className="ed-toggle">Portal Ready only <input type="checkbox" checked={approvedOnly} onChange={(event) => setApprovedOnly(event.target.checked)} /></label>
            </section>
            <section>
              <h3>Package summary</h3>
              <div className="ed-summary-grid">{[[String(sections.length), "Sections"], [String(governance.totalRefs), "Selected refs"], [String(governance.portalReadyRefs), "Portal Ready"], [String(governance.blockedRefs), "Readiness blockers"], ["0", "Copied assets"], [sourceLabel(search.source), "Source"]].map(([v, l]) => <span key={l}><strong>{v}</strong><small>{l}</small></span>)}</div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
