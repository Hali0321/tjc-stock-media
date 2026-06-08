"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, FileLock2, FileText, History, Image as ImageIcon, Info, Layers, Mail, ShieldCheck } from "lucide-react";
import { AssetActionsMenu } from "@/components/AssetActionsMenu";
import { AssetTrustPanel } from "@/components/AssetTrustPanel";
import { ErrorState, SkeletonDetail } from "@/components/DamStates";
import { DamTabs, damTabId, damTabPanelId } from "@/components/DamTabs";
import { DownloadOptionsPanel } from "@/components/DownloadOptionsPanel";
import { MediaPreview } from "@/components/MediaPreview";
import { MediaPreviewPanel } from "@/components/MediaPreviewPanel";
import { ReuseRequestDialog } from "@/components/ReuseRequestDialog";
import { useDemoRole } from "@/components/RoleProvider";
import { BlockerBadge, DownloadBadge, ReuseStateBadge, TjcStatusBadge } from "@/components/StatusBadge";
import { decideAccess } from "@/lib/access-decisions";
import { assetGovernancePassport } from "@/lib/asset-governance";
import { assetPresentation, collectionImageUrl, detailImageUrl, provenanceSummary } from "@/lib/presentation";
import type { DemoRole, MediaSourceStatus, StockMediaAsset } from "@/lib/types";
import { cn } from "@/lib/ui";

type DetailResponse = {
  asset: StockMediaAsset;
  source: MediaSourceStatus;
  related: StockMediaAsset[];
  resourceSpaceUrl: string | null;
};

const detailTabs = ["Use", "Source", "Review", "Files"] as const;
const viewerDetailTabs = ["Use", "Source", "Files"] as const;
type DetailTab = (typeof detailTabs)[number];
type RequestKind = "original" | "review" | "coworker";

const factItemClass = "border-t border-tjc-line/70 pt-3 first:border-t-0 first:pt-0";
const factTermClass = "text-xs font-semibold text-tjc-evergreen";
const factDescClass = "mt-1 break-words text-sm leading-relaxed text-[#4d554d]";

function formatBytes(value?: number) {
  if (!value) return "Not exported";
  if (value > 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (value > 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(value / 1024)).toLocaleString()} KB`;
}

function passportTone(tone: "ok" | "warn" | "info") {
  if (tone === "ok") return "border-[#b8d9c6] bg-[#edf8f1] text-[#22563a]";
  if (tone === "warn") return "border-[#ead6a8] bg-[#fff8e8] text-[#725216]";
  return "border-[#c8d7e6] bg-[#f2f7fb] text-[#27435b]";
}

function RelatedStrip({ assets, role }: { assets: StockMediaAsset[]; role: DemoRole }) {
  if (!assets.length) return <div className="rounded-xl border border-tjc-line bg-white p-4 text-sm text-tjc-muted">No related approved assets found in this local export.</div>;
  const visibleRelated = assets
    .map((asset) => ({ asset, imageUrl: collectionImageUrl(asset, role) }))
    .filter((item) => Boolean(item.imageUrl))
    .slice(0, 4);

  if (!visibleRelated.length) {
    return (
      <div className="rounded-xl border border-[#d6dfd8] bg-[#f8faf8] p-4 text-sm font-semibold leading-relaxed text-tjc-muted">
        Related previews are unavailable for this role. Open Find after review clears a role-safe approved copy.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {visibleRelated.map(({ asset, imageUrl }) => {
        const presentation = assetPresentation(asset, role);
        return (
          <Link href={`/assets/${asset.id}`} key={asset.id} className="group overflow-hidden rounded-xl border border-tjc-line bg-white transition hover:border-[#9fb8ae] active:translate-y-px">
            <span className="grid aspect-[4/3] place-items-center overflow-hidden bg-[#eef1ed]">
              <MediaPreview src={imageUrl} alt={asset.thumbnailAlt} imgClassName="transition duration-300 group-hover:scale-[1.025]" />
            </span>
            <span className="grid gap-1 p-2">
              <span className="line-clamp-2 text-xs font-black leading-tight text-tjc-ink">{presentation.title}</span>
              <span className="text-[10px] font-black text-tjc-muted">Related asset</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function ReuseDecisionRecord({ asset, role }: { asset: StockMediaAsset; role: DemoRole }) {
  const [requestKind, setRequestKind] = useState<RequestKind | null>(null);
  const display = assetPresentation(asset, role);
  const opsView = role === "Reviewer" || role === "DAM Admin";
  const state = display.download;
  const decision = state.reuse;
  const approved = state.approvedCopy.allowed;
  const assetTitle = display.title;
  const resourceSpaceId = asset.resourceSpaceId || asset.id;
  const downloadHref = `/api/download/${asset.id}?role=${encodeURIComponent(role)}`;
  const requestLinks: Record<RequestKind, string> = {
    original: `mailto:media@tjc.org?subject=Original access request for ${encodeURIComponent(assetTitle)}&body=ResourceSpace ID: ${encodeURIComponent(resourceSpaceId)}%0ARequest:%20Original/master access%0AReason:%20`,
    review: `mailto:media@tjc.org?subject=Review request for ${encodeURIComponent(assetTitle)}&body=ResourceSpace ID: ${encodeURIComponent(resourceSpaceId)}%0ARaw status: ${encodeURIComponent(asset.status)}%0AReuse state: ${encodeURIComponent(state.reuse.label)}%0AReason:%20`,
    coworker: `mailto:media@tjc.org?subject=TJC Stock Media asset question&body=ResourceSpace ID: ${encodeURIComponent(resourceSpaceId)}%0AAsset: ${encodeURIComponent(assetTitle)}%0AQuestion:%20`
  };
  const blockerLabels = decision.blockers.map((blocker) => blocker.label).slice(0, 3);

  return (
    <section
      className={cn(
        "rounded-md border p-4",
        approved ? "border-[#9fcfb4] bg-[#f0faf4]" : "border-[#dfbd73] bg-[#fff7df]"
      )}
      aria-label="Reuse decision record"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-xs font-black text-tjc-evergreen">{opsView ? "Reuse decision" : "Can I use this?"}</span>
          <h2 className="mt-1 text-2xl font-black leading-tight text-tjc-ink">{approved ? "Approved copy can be reused" : "Review required before use"}</h2>
        </div>
        <ReuseStateBadge asset={asset} size="sm" />
      </div>

      {approved ? (
        <p className="mt-3 text-sm font-semibold leading-relaxed text-[#4d554d]">{asset.usageGuidance || decision.summary}</p>
      ) : (
        <div className="mt-3 grid gap-2 text-sm font-semibold leading-relaxed text-[#4d554d]">
          <p>You cannot download this yet because rights, consent, people/minors, or approved-copy review is incomplete.</p>
          {blockerLabels.length ? (
            <ul className="grid gap-1">
              {blockerLabels.map((label) => <li key={label}>- {label}</li>)}
            </ul>
          ) : null}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <span data-testid="asset-download-unavailable">
          <DownloadBadge asset={asset} size="sm" />
        </span>
        <TjcStatusBadge
          domain="source"
          status="original-master-restricted"
          tone="neutral"
          icon={FileLock2}
          label={opsView ? "Original/master restricted" : "Source file restricted"}
          tooltip={opsView ? "Original/master files remain in ResourceSpace and Google Shared Drive." : "Source files stay restricted. Use approved copies only."}
          size="sm"
        />
        {decision.blockers.length ? <BlockerBadge asset={asset} size="sm" /> : null}
      </div>

      <div className="mt-4 grid gap-2 rounded-md border border-[#d8e1da] bg-white p-3">
        {approved ? (
          <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-tjc-evergreen px-4 text-sm font-black text-white transition hover:bg-[#062d24] active:translate-y-px" href={downloadHref}>
            <Download size={16} strokeWidth={1.8} aria-hidden="true" />
            Download approved copy
          </a>
        ) : (
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-tjc-evergreen px-4 text-sm font-black text-white transition hover:bg-[#062d24] active:translate-y-px" type="button" data-testid="asset-primary-request-review" onClick={() => setRequestKind("review")}>
            <Mail size={16} strokeWidth={1.8} aria-hidden="true" />
            Request DAM review
          </button>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#c5d1c9] bg-white px-3 text-sm font-black text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px" type="button" onClick={() => setRequestKind("coworker")}>
            <Mail size={15} strokeWidth={1.8} aria-hidden="true" />
            Ask media team
          </button>
          <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#c5d1c9] bg-white px-3 text-sm font-black text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px" type="button" onClick={() => setRequestKind("original")}>
            <FileLock2 size={15} strokeWidth={1.8} aria-hidden="true" />
            Request original access
          </button>
        </div>
        <p className="text-xs font-semibold leading-snug text-[#4d554d]">
          {approved
            ? "Use approved copies. Original/master access remains restricted."
            : "Review request keeps downloads blocked until reviewer evidence is complete."}
        </p>
      </div>
      {requestKind ? (
        <ReuseRequestDialog
          open={Boolean(requestKind)}
          kind={requestKind}
          assetTitle={assetTitle}
          resourceSpaceId={resourceSpaceId}
          rawStatus={asset.status}
          portalReuseState={state.reuse.label}
          blockers={decision.blockers.map((blocker) => blocker.label)}
          mailtoHref={requestLinks[requestKind]}
          opsView={opsView}
          onCancel={() => setRequestKind(null)}
        />
      ) : null}
    </section>
  );
}

function GovernancePassportSection({ passport }: { passport: ReturnType<typeof assetGovernancePassport> }) {
  return (
    <details className="min-w-0 rounded-md border border-[#d4ded7] bg-white p-4" aria-label="Governance passport">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black"><ShieldCheck size={18} strokeWidth={1.8} aria-hidden="true" /> Governance passport</h2>
            <p className="mt-1 text-sm font-semibold leading-snug text-tjc-muted">Evidence, blockers, and portal readiness.</p>
          </div>
          <div className={cn("rounded-md border px-3 py-2 text-sm font-semibold", passportTone(passport.portalReady ? "ok" : "warn"))}>
            {passport.score}% · {passport.decision}
          </div>
        </div>
      </summary>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {passport.evidence.map((item) => (
          <div className={cn("rounded-md border p-3", passportTone(item.tone))} key={item.label}>
            <strong className="block text-xs font-semibold">{item.label}</strong>
            <span className="mt-1 block break-words text-sm leading-snug">{item.value}</span>
          </div>
        ))}
      </div>
      {passport.blockers.length || passport.warnings.length ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-md border border-[#ead6a8] bg-[#fff8e8] p-3 text-[#725216]">
            <strong className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle size={15} strokeWidth={1.8} aria-hidden="true" /> Portal blockers</strong>
            <div className="mt-2 grid gap-1">
              {(passport.blockers.length ? passport.blockers : ["None"]).map((item) => <span className="text-xs font-semibold" key={item}>{item}</span>)}
            </div>
          </div>
          <div className="rounded-md border border-[#c8d7e6] bg-[#f2f7fb] p-3 text-[#27435b]">
            <strong className="flex items-center gap-2 text-sm font-semibold"><Info size={15} strokeWidth={1.8} aria-hidden="true" /> Improvement notes</strong>
            <div className="mt-2 grid gap-1">
              {(passport.warnings.length ? passport.warnings : ["None"]).map((item) => <span className="text-xs font-semibold" key={item}>{item}</span>)}
            </div>
          </div>
        </div>
      ) : null}
    </details>
  );
}

function AssetTagsSection({ asset }: { asset: StockMediaAsset }) {
  return (
    <section className="min-w-0 rounded-lg border border-[#d4ded7] bg-white p-4" aria-label="Tags">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><ImageIcon size={18} strokeWidth={1.8} aria-hidden="true" /> Tags</h2>
      <div className="flex flex-wrap gap-2">
        {(asset.usageTerms || []).map((tag) => <span className="rounded-md bg-[#eef4f0] px-2.5 py-1 text-xs font-semibold text-[#4b5b51]" key={tag}>{tag}</span>)}
        {(asset.tags || []).map((tag) => <span className="rounded-md bg-[#eef4f0] px-2.5 py-1 text-xs font-semibold text-[#4b5b51]" key={tag}>{tag}</span>)}
        {(asset.tjcTerms || []).map((tag) => <span className="rounded-md bg-[#edf3fb] px-2.5 py-1 text-xs font-semibold text-tjc-blue" key={tag}>{tag}</span>)}
      </div>
    </section>
  );
}

function RelatedAssetsSection({ related, role }: { related: StockMediaAsset[]; role: DemoRole }) {
  return (
    <details className="min-w-0 rounded-lg border border-[#d4ded7] bg-white p-4" aria-label="Related assets" open={role !== "Viewer"}>
      <summary className="cursor-pointer list-none">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><Layers size={18} strokeWidth={1.8} aria-hidden="true" /> Related</h2>
      </summary>
      <RelatedStrip assets={related} role={role} />
    </details>
  );
}

export function AssetDetailPage({ id }: { id: string }) {
  const { role, ready } = useDemoRole();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<DetailTab>("Use");

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setError("");
    fetch(`/api/assets/${id}?role=${encodeURIComponent(role)}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load asset");
        return body as DetailResponse;
      })
      .then((body) => {
        if (!cancelled) setData(body);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id, role, ready]);

  useEffect(() => {
    if (role === "Viewer" && activeTab === "Review") setActiveTab("Use");
  }, [activeTab, role]);

  if (error) {
    return (
      <div className="px-3 py-5 md:px-5">
        <Link href="/" className="inline-flex min-h-10 items-center gap-2 dam-card px-3 text-sm font-semibold text-tjc-evergreen">
          <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
          Back to Find
        </Link>
        <ErrorState className="mt-5" title="Asset did not load" detail={error} />
      </div>
    );
  }

  if (!data) {
    return <div className="px-3 py-5 md:px-5"><SkeletonDetail /></div>;
  }

  const { asset, related } = data;
  const display = assetPresentation(asset, role);
  const provenance = provenanceSummary(asset, role);
  const canSeeOriginal = decideAccess(role, "viewOriginalMetadata", asset).allowed;
  const canOpenResourceSpace = decideAccess(role, "viewResourceSpaceAdminLink", asset).allowed;
  const opsView = role === "Reviewer" || role === "DAM Admin";
  const preview = detailImageUrl(asset, role);
  const passport = assetGovernancePassport(asset);
  const visibleDetailTabs: readonly DetailTab[] = role === "Viewer" ? viewerDetailTabs : detailTabs;
  const thumbnailStrip = [asset, ...related].slice(0, 5);
  const thumbnailVariants = thumbnailStrip
    .map((item, index) => ({
      item,
      index,
      imageUrl: index === 0 ? preview : collectionImageUrl(item, role)
    }))
    .filter((item) => Boolean(item.imageUrl));
  const comparisonDeferredReason = opsView
    ? "Image comparison deferred: current export has role-safe display and download copies, but no paired before/after approved copy. Showing a slider would imply master comparison access."
    : "Image comparison is unavailable for this media record. Use the approved copy and guidance shown here.";

  return (
    <div className="dam-shell">
      <Link href="/" className="inline-flex min-h-10 items-center gap-2 dam-card px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px">
        <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
        Back to Find
      </Link>
      <section className="mt-4 min-w-0 border-b border-[#d6dfd8] pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-sm font-black text-tjc-evergreen">{opsView ? asset.collection : "Media record / Use guidance"}</span>
            <h1 className="asset-detail-title mt-2">{display.title}</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-tjc-muted">{provenance.publicLabel}</p>
          </div>
          <div className="w-full sm:w-auto">
            <AssetActionsMenu asset={asset} resourceSpaceUrl={data.resourceSpaceUrl} canOpenResourceSpace={canOpenResourceSpace} canExposeResourceSpaceId={opsView} label={opsView ? "Asset actions" : "Record actions"} />
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,420px)] xl:items-start">
        <div className="min-w-0">
          <MediaPreviewPanel
            asset={asset}
            src={preview}
            alt={asset.thumbnailAlt}
            title={display.title}
            detail={opsView
              ? (preview ? "Role-safe display copy. Original/master remains restricted." : "No display copy is exported for this role. Reuse is still governed by the trust record.")
              : (preview ? "Safe display copy. Download depends on the use guidance." : "Preview unavailable for this record. Check the use guidance before sharing.")}
            variants={thumbnailVariants.map(({ item, index, imageUrl }) => ({
              label: index === 0 ? "Current" : assetPresentation(item, role).title,
              src: imageUrl,
              active: index === 0
            }))}
          />
          {thumbnailVariants.length ? (
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5" aria-label="Asset thumbnail strip">
              {thumbnailVariants.map(({ item, index, imageUrl }) => {
              return (
                <Link
                  href={index === 0 ? `/assets/${asset.id}` : `/assets/${item.id}`}
                  key={`${item.id}-${index}`}
                  className={cn("grid h-16 min-w-0 place-items-center overflow-hidden rounded-md border bg-white transition hover:border-[#9fb8ae]", index === 0 ? "border-[#0f3d2e] ring-1 ring-inset ring-[#9fb8ae]" : "border-[#d6dfd8]")}
                  aria-label={index === 0 ? "Current asset preview" : `Open related asset ${assetPresentation(item, role).title}`}
                >
                  <MediaPreview src={imageUrl} alt={item.thumbnailAlt} imgClassName="h-full w-full object-cover" className="px-1" />
                </Link>
              );
              })}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-[#d6dfd8] bg-[#f8faf8] p-3 text-sm font-semibold leading-relaxed text-tjc-muted" role="status">
              Preview copies are unavailable for this role. Request review from the decision card instead of reading blank thumbnails as failed media.
            </div>
          )}
          <section className="mt-5 hidden min-w-0 xl:block" aria-label="Asset detail tabs">
            <DamTabs tabs={visibleDetailTabs} active={activeTab} onChange={setActiveTab} ariaLabel="Asset detail sections" idPrefix="asset-detail-desktop" />
            <section id={damTabPanelId("asset-detail-desktop", "Use")} role="tabpanel" aria-labelledby={damTabId("asset-detail-desktop", "Use")} className="mt-3 min-w-0 rounded-lg border border-[#d4ded7] bg-white p-4" aria-label="Usage guidance" hidden={activeTab !== "Use"}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><ShieldCheck size={18} strokeWidth={1.8} aria-hidden="true" /> Use guidance</h2>
              <dl className="grid gap-3">
                {display.guidanceFacts.map((fact) => (
                  <div className={factItemClass} key={fact.label}><dt className={factTermClass}>{fact.label}</dt><dd className={factDescClass}>{fact.value}</dd></div>
                ))}
              </dl>
            </section>
            <section id={damTabPanelId("asset-detail-desktop", "Source")} role="tabpanel" aria-labelledby={damTabId("asset-detail-desktop", "Source")} className="mt-3 min-w-0 rounded-lg border border-[#d4ded7] bg-white p-4" aria-label="Source and provenance" hidden={activeTab !== "Source"}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><Info size={18} strokeWidth={1.8} aria-hidden="true" /> Source and provenance</h2>
              <dl className="grid gap-3">
                <div className={factItemClass}><dt className={factTermClass}>{opsView ? "Source system" : "Media source"}</dt><dd className={factDescClass}>{opsView ? asset.sourceSystem || asset.sourcePlatform || "ResourceSpace export" : asset.sourceAccount || asset.collection || "Media archive"}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Source / photographer</dt><dd className={factDescClass}>{asset.sourceAccount || asset.collection || "Not provided"}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>{opsView ? "Event / collection" : "Event / package"}</dt><dd className={factDescClass}>{asset.eventName || asset.collection}</dd></div>
                {opsView ? <div className={factItemClass}><dt className={factTermClass}>ResourceSpace ID</dt><dd className={factDescClass}>{asset.resourceSpaceId || asset.id}</dd></div> : <div className={factItemClass}><dt className={factTermClass}>Media record</dt><dd className={factDescClass}>{asset.resourceSpaceId || asset.id}</dd></div>}
              </dl>
            </section>
            {opsView ? <section id={damTabPanelId("asset-detail-desktop", "Review")} role="tabpanel" aria-labelledby={damTabId("asset-detail-desktop", "Review")} className="mt-3 min-w-0 rounded-lg border border-[#d4ded7] bg-white p-4" aria-label="Review status" hidden={activeTab !== "Review"}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><History size={18} strokeWidth={1.8} aria-hidden="true" /> Review record</h2>
              <dl className="grid gap-3">
                <div className={factItemClass}><dt className={factTermClass}>Reviewer</dt><dd className={factDescClass}>{asset.reviewer || "Not reviewed"}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Review date</dt><dd className={factDescClass}>{asset.reviewedDate || "Pending"}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Pending review write</dt><dd className={factDescClass}>{asset.pendingReviewWrite ? `${asset.pendingReviewWrite.requestedStatus} / ${asset.pendingReviewWrite.syncState}` : "None queued"}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Missing fields</dt><dd className={factDescClass}>{display.reviewFacts.missingFields.length ? display.reviewFacts.missingFields.join(", ") : "None for current export"}</dd></div>
              </dl>
              <p className="mt-3 rounded-md bg-[#f3f6f0] p-3 text-sm text-tjc-muted">{asset.rightsNotes || "No reviewer notes exported yet. Ask a media coworker if public use is unclear."}</p>
            </section> : null}
            <section id={damTabPanelId("asset-detail-desktop", "Files")} role="tabpanel" aria-labelledby={damTabId("asset-detail-desktop", "Files")} className="mt-3 min-w-0 rounded-lg border border-[#d4ded7] bg-white p-4" aria-label="File options" hidden={activeTab !== "Files"}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><FileText size={18} strokeWidth={1.8} aria-hidden="true" /> Files</h2>
              <div className="mb-4 grid gap-2 rounded-xl border border-[#c8d7e6] bg-[#f2f7fb] p-3 text-[#27435b]">
                <div className="flex flex-wrap items-center gap-2">
                  <TjcStatusBadge domain="download" status="comparison-deferred" tone="info" icon={ImageIcon} label="Image comparison deferred" size="sm" />
                <TjcStatusBadge domain="source" status="master-hidden" tone="neutral" icon={FileLock2} label={opsView ? "Master hidden" : "Source file restricted"} size="sm" />
                </div>
                <p className="text-sm font-semibold leading-relaxed">{comparisonDeferredReason}</p>
              </div>
              <dl className="grid gap-3">
                <div className={factItemClass}><dt className={factTermClass}>Media type</dt><dd className={factDescClass}>{asset.mediaType}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Format</dt><dd className={factDescClass}>{asset.fileExtension?.toUpperCase() || "Not exported"}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Dimensions</dt><dd className={factDescClass}>{asset.imageDimensions || "Not exported"}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>File size</dt><dd className={factDescClass}>{formatBytes(asset.fileSizeBytes)}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>{opsView ? "Original filename" : "Source filename"}</dt><dd className={factDescClass}>{canSeeOriginal ? asset.originalFilename || "Not exported" : "Restricted for this role"}</dd></div>
                {opsView ? <div className={factItemClass}><dt className={factTermClass}>Checksum</dt><dd className={factDescClass}>{canSeeOriginal ? asset.checksumSha256 || "Not exported" : "Hidden for this role"}</dd></div> : null}
              </dl>
            </section>
          </section>
          <section className="mt-5 hidden min-w-0 gap-4 xl:grid" aria-label="Desktop asset governance continuation">
            {opsView ? <GovernancePassportSection passport={passport} /> : null}
            <AssetTagsSection asset={asset} />
            <RelatedAssetsSection related={related} role={role} />
          </section>
        </div>

        <aside className="grid min-w-0 gap-3 xl:sticky xl:top-24 xl:self-start">
          <ReuseDecisionRecord asset={asset} role={role} />
          <DownloadOptionsPanel asset={asset} role={role} />
          <AssetTrustPanel asset={asset} role={role} />
          {opsView ? <section className="hidden rounded-md border border-[#d4ded7] bg-white p-4 xl:block" aria-label="ResourceSpace source actions">
            <h2 className="text-sm font-black text-tjc-evergreen">ResourceSpace source</h2>
            <p className="mt-1 text-sm font-semibold leading-snug text-tjc-muted">Secondary admin actions. Delivery decisions stay above.</p>
            <div className="mt-3">
              <AssetActionsMenu
                asset={asset}
                resourceSpaceUrl={data.resourceSpaceUrl}
                canOpenResourceSpace={canOpenResourceSpace}
                canExposeResourceSpaceId
                label="Source actions"
              />
            </div>
          </section> : null}
        </aside>
      </section>

      <section className="mt-5 min-w-0 xl:hidden" aria-label="Asset detail tabs">
          <DamTabs tabs={visibleDetailTabs} active={activeTab} onChange={setActiveTab} ariaLabel="Asset detail sections" idPrefix="asset-detail" />

          <section id={damTabPanelId("asset-detail", "Use")} role="tabpanel" aria-labelledby={damTabId("asset-detail", "Use")} className="mt-3 min-w-0 rounded-lg border border-[#d4ded7] bg-white p-4" aria-label="Usage guidance" hidden={activeTab !== "Use"}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><ShieldCheck size={18} strokeWidth={1.8} aria-hidden="true" /> Use guidance</h2>
              <dl className="grid gap-3">
                {display.guidanceFacts.map((fact) => (
                  <div className={factItemClass} key={fact.label}><dt className={factTermClass}>{fact.label}</dt><dd className={factDescClass}>{fact.value}</dd></div>
                ))}
              </dl>
          </section>

          <section id={damTabPanelId("asset-detail", "Source")} role="tabpanel" aria-labelledby={damTabId("asset-detail", "Source")} className="mt-3 min-w-0 rounded-lg border border-[#d4ded7] bg-white p-4" aria-label="Source and provenance" hidden={activeTab !== "Source"}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><Info size={18} strokeWidth={1.8} aria-hidden="true" /> Source and provenance</h2>
              <dl className="grid gap-3">
                <div className={factItemClass}><dt className={factTermClass}>{opsView ? "Source system" : "Media source"}</dt><dd className={factDescClass}>{opsView ? asset.sourceSystem || asset.sourcePlatform || "ResourceSpace export" : asset.sourceAccount || asset.collection || "Media archive"}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Source / photographer</dt><dd className={factDescClass}>{asset.sourceAccount || asset.collection || "Not exported"}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>{opsView ? "Event / collection" : "Event / package"}</dt><dd className={factDescClass}>{asset.eventName || asset.collection}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Captured / event date</dt><dd className={factDescClass}>{asset.capturedDate || asset.eventDate || "Not exported"}</dd></div>
                {opsView ? <div className={factItemClass}><dt className={factTermClass}>ResourceSpace ID</dt><dd className={factDescClass}>{asset.resourceSpaceId || asset.id}</dd></div> : <div className={factItemClass}><dt className={factTermClass}>Media record</dt><dd className={factDescClass}>{asset.resourceSpaceId || asset.id}</dd></div>}
                {canSeeOriginal ? <div className={factItemClass}><dt className={factTermClass}>Original import path</dt><dd className={factDescClass}>{asset.sourcePath || "Source path not exported"}</dd></div> : null}
                {canSeeOriginal ? <div className={factItemClass}><dt className={factTermClass}>Master Drive path</dt><dd className={factDescClass}>{asset.masterDrivePath || "Visible after Shared Drive staging"}</dd></div> : null}
              </dl>
          </section>

          {opsView ? <section id={damTabPanelId("asset-detail", "Review")} role="tabpanel" aria-labelledby={damTabId("asset-detail", "Review")} className="mt-3 min-w-0 rounded-lg border border-[#d4ded7] bg-white p-4" aria-label="Review status" hidden={activeTab !== "Review"}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><History size={18} strokeWidth={1.8} aria-hidden="true" /> Review record</h2>
              <dl className="grid gap-3">
                <div className={factItemClass}><dt className={factTermClass}>Reviewer</dt><dd className={factDescClass}>{asset.reviewer || "Not reviewed"}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Review date</dt><dd className={factDescClass}>{asset.reviewedDate || "Pending"}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Pending review write</dt><dd className={factDescClass}>{asset.pendingReviewWrite ? `${asset.pendingReviewWrite.requestedStatus} / ${asset.pendingReviewWrite.syncState}` : "None queued"}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Rights status</dt><dd className={factDescClass}>{asset.rightsStatus || "Unknown - reviewer should confirm before public use"}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Consent</dt><dd className={factDescClass}>{asset.consentStatus || "Unknown - reviewer should confirm before public use"}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Risk flags</dt><dd className={factDescClass}>{display.reviewFacts.riskFlags.join(", ")}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Missing fields</dt><dd className={factDescClass}>{display.reviewFacts.missingFields.length ? display.reviewFacts.missingFields.join(", ") : "None for current export"}</dd></div>
              </dl>
              <div className="mt-4 grid gap-2 border-t border-tjc-line pt-3">
                {passport.auditTrail.map((item) => (
                  <div className={cn("grid grid-cols-[auto_1fr] gap-3 rounded-md border p-3", passportTone(item.tone))} key={`${item.event}-${item.date}`}>
                    {item.tone === "ok" ? <CheckCircle2 size={16} strokeWidth={1.8} aria-hidden="true" /> : <AlertTriangle size={16} strokeWidth={1.8} aria-hidden="true" />}
                    <div>
                      <strong className="block text-sm font-semibold">{item.event}</strong>
                      <span className="mt-1 block text-xs font-semibold">{item.actor} · {item.date}</span>
                      <span className="mt-1 block break-words text-sm leading-snug">{item.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 rounded-md bg-[#f3f6f0] p-3 text-sm text-tjc-muted">{asset.rightsNotes || "No reviewer notes exported yet. Ask a media coworker if public use is unclear."}</p>
          </section> : null}

          <section id={damTabPanelId("asset-detail", "Files")} role="tabpanel" aria-labelledby={damTabId("asset-detail", "Files")} className="mt-3 min-w-0 rounded-lg border border-[#d4ded7] bg-white p-4" aria-label="File options" hidden={activeTab !== "Files"}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><FileText size={18} strokeWidth={1.8} aria-hidden="true" /> Files</h2>
              <MediaPreviewPanel
                className="mb-4"
                mode={asset.mediaType === "document" ? "document" : asset.mediaType === "video" ? "video" : asset.mediaType === "audio" ? "audio" : preview ? "image" : "restricted"}
                asset={asset}
                src={preview}
                alt={asset.thumbnailAlt}
                title={`${asset.mediaType} preview`}
                detail={opsView ? "Safe approved-copy preview only. Original/master remains hidden unless policy grants access." : "Safe preview only. Source files stay restricted unless access is approved."}
                compact
              />
              <div className="mb-4 grid gap-2 rounded-xl border border-[#c8d7e6] bg-[#f2f7fb] p-3 text-[#27435b]">
                <div className="flex flex-wrap items-center gap-2">
                  <TjcStatusBadge domain="download" status="comparison-deferred" tone="info" icon={ImageIcon} label="Image comparison deferred" size="sm" />
                  <TjcStatusBadge domain="source" status="master-hidden" tone="neutral" icon={FileLock2} label={opsView ? "Master hidden" : "Source file restricted"} size="sm" />
                </div>
                <p className="text-sm font-semibold leading-relaxed">{comparisonDeferredReason}</p>
              </div>
              <dl className="grid gap-3">
                <div className={factItemClass}><dt className={factTermClass}>Media type</dt><dd className={factDescClass}>{asset.mediaType}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Format</dt><dd className={factDescClass}>{asset.fileExtension?.toUpperCase() || "Not exported"}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Dimensions</dt><dd className={factDescClass}>{asset.imageDimensions || "Not exported"}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>File size</dt><dd className={factDescClass}>{formatBytes(asset.fileSizeBytes)}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>{opsView ? "Original filename" : "Source filename"}</dt><dd className={factDescClass}>{canSeeOriginal ? asset.originalFilename || "Not exported" : "Restricted for this role"}</dd></div>
                {opsView ? <div className={factItemClass}><dt className={factTermClass}>Checksum</dt><dd className={factDescClass}>{canSeeOriginal ? asset.checksumSha256 || "Not exported" : "Hidden for this role"}</dd></div> : null}
              </dl>
              <div className="mt-4 grid gap-2 border-t border-tjc-line pt-3">
                {passport.renditions.map((item) => (
                  <div className={cn("grid grid-cols-[auto_1fr] gap-3 rounded-md border p-3", passportTone(item.available ? "ok" : "info"))} key={item.label}>
                    {item.available ? <CheckCircle2 size={16} strokeWidth={1.8} aria-hidden="true" /> : <Info size={16} strokeWidth={1.8} aria-hidden="true" />}
                    <div>
                      <strong className="block text-sm font-semibold">{item.label}</strong>
                      <span className="mt-1 block text-xs font-semibold">{item.intent}</span>
                      <span className="mt-1 block text-sm leading-snug">{item.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
          </section>
      </section>

      <section className="mt-5 grid gap-4 xl:hidden">
          {opsView ? <GovernancePassportSection passport={passport} /> : null}
          <AssetTagsSection asset={asset} />
      </section>

      <section className="mt-5 xl:hidden">
        <RelatedAssetsSection related={related} role={role} />
      </section>
    </div>
  );
}
