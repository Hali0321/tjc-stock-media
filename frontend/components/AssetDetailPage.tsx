"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, FileText, History, Image as ImageIcon, Info, Layers, ShieldCheck } from "lucide-react";
import { AssetActionsMenu } from "@/components/AssetActionsMenu";
import { AssetTrustPanel } from "@/components/AssetTrustPanel";
import { DamTabs, damTabId, damTabPanelId } from "@/components/DamTabs";
import { DownloadOptionsPanel } from "@/components/DownloadOptionsPanel";
import { ImageComparisonPanel } from "@/components/ImageComparisonPanel";
import { MediaPreview } from "@/components/MediaPreview";
import { useDemoRole } from "@/components/RoleProvider";
import { StatusBanner } from "@/components/StatusBanner";
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

const detailTabs = ["Use", "Source", "Review", "Files", "Related"] as const;
type DetailTab = (typeof detailTabs)[number];

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
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {assets.slice(0, 6).map((asset) => {
        const imageUrl = collectionImageUrl(asset, role);
        return (
          <Link href={`/assets/${asset.id}`} key={asset.id} className="group overflow-hidden rounded-xl border border-tjc-line bg-white transition hover:border-[#9fb8ae] active:translate-y-px">
            <span className="block aspect-[4/3] overflow-hidden bg-[#eef1ed]">
              <MediaPreview src={imageUrl} alt={asset.thumbnailAlt} label={imageUrl ? "Preview pending" : "Preview restricted"} imgClassName="transition duration-300 group-hover:scale-[1.025]" />
            </span>
            <span className="block p-2 text-xs font-semibold leading-tight text-tjc-ink">{assetPresentation(asset, role).title}</span>
          </Link>
        );
      })}
    </div>
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

  if (error) {
    return (
      <div className="px-3 py-5 md:px-5">
        <Link href="/" className="inline-flex min-h-10 items-center gap-2 dam-card px-3 text-sm font-semibold text-tjc-evergreen">
          <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
          Back to library
        </Link>
        <div className="mt-5 rounded-lg border border-[#ead6a8] bg-[#fff8e8] p-6 text-[#74531a]">{error}</div>
      </div>
    );
  }

  if (!data) {
    return <div className="px-3 py-5 md:px-5"><div className="skeleton h-[70dvh] rounded-lg" /></div>;
  }

  const { asset, related } = data;
  const display = assetPresentation(asset, role);
  const provenance = provenanceSummary(asset, role);
  const canSeeOriginal = decideAccess(role, "viewOriginalMetadata", asset).allowed;
  const canOpenResourceSpace = decideAccess(role, "viewResourceSpaceAdminLink", asset).allowed;
  const preview = detailImageUrl(asset, role);
  const passport = assetGovernancePassport(asset);
  const thumbnailStrip = [asset, ...related].slice(0, 5);

  return (
    <div className="dam-shell">
      <Link href="/" className="inline-flex min-h-10 items-center gap-2 dam-card px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px">
        <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
        Back to library
      </Link>
      <section className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,.8fr)]">
        <div className="order-1 min-w-0 xl:order-1">
          <div className="grid min-h-[28rem] place-items-center overflow-hidden rounded-[1.45rem] border border-[#cfd7d1] bg-white p-3 shadow-[0_14px_36px_rgba(25,34,29,.04)]">
            <MediaPreview
              src={preview}
              alt={asset.thumbnailAlt}
              label="Preview unavailable"
              detail="No display derivative is exported for this role. Reuse is still governed by the trust record."
              className="min-h-[20rem] px-4"
              imgClassName="!h-auto max-h-[72dvh] !w-auto max-w-full rounded !object-contain shadow-[0_8px_24px_rgba(32,34,31,.14)]"
            />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5" aria-label="Asset thumbnail strip">
            {thumbnailStrip.map((item, index) => {
              const imageUrl = index === 0 ? preview : collectionImageUrl(item, role);
              return (
                <Link
                  href={index === 0 ? `/assets/${asset.id}` : `/assets/${item.id}`}
                  key={`${item.id}-${index}`}
                  className={cn("grid h-16 min-w-0 place-items-center overflow-hidden rounded-2xl border bg-white transition hover:border-[#9fb8ae]", index === 0 ? "border-[#0f3d2e] shadow-[inset_0_0_0_2px_#e6f0eb]" : "border-[#d6dfd8]")}
                  aria-label={index === 0 ? "Current asset preview" : `Open related asset ${assetPresentation(item, role).title}`}
                >
                  <MediaPreview src={imageUrl} alt={item.thumbnailAlt} imgClassName="h-full w-full object-cover" className="px-1" />
                </Link>
              );
            })}
          </div>
          <section className="mt-4 rounded-lg border border-[#cfd7d1] bg-white p-3" aria-label="Related assets">
            <div className="mb-3">
              <h2 className="dam-section-title">Related assets</h2>
              <p className="mt-1 text-sm text-tjc-muted">Same collection, tags, or TJC terms. Approved assets shown first.</p>
            </div>
            <RelatedStrip assets={related} role={role} />
          </section>
        </div>

        <aside className="order-2 grid min-w-0 gap-3 xl:order-2 xl:sticky xl:top-24 xl:self-start">
          <section className="min-w-0 border-b border-[#d6dfd8] pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-sm font-black text-tjc-evergreen">{asset.collection}</span>
                <h1 className="mt-2 dam-page-title">{display.title}</h1>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-tjc-muted">{provenance.publicLabel}</p>
              </div>
              <AssetActionsMenu asset={asset} resourceSpaceUrl={data.resourceSpaceUrl} canOpenResourceSpace={canOpenResourceSpace} />
            </div>
          </section>

          <StatusBanner tone={display.download.approvedCopy.allowed ? "ok" : "warn"} title={display.download.reuse.label}>
            {display.download.reuse.summary}
          </StatusBanner>
          <AssetTrustPanel asset={asset} role={role} />
          <ImageComparisonPanel
            safePreview={preview}
            alt={asset.thumbnailAlt}
            approvedCopyAllowed={display.download.approvedCopy.allowed}
            originalHidden
          />
          <section className="min-w-0 rounded-lg border border-[#d4ded7] bg-white p-4" aria-label="Governance passport">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-black"><ShieldCheck size={18} strokeWidth={1.8} aria-hidden="true" /> Governance passport</h2>
                <p className="mt-1 text-sm font-semibold leading-snug text-tjc-muted">Decision, evidence, blockers, and portal readiness for this asset.</p>
              </div>
              <div className={cn("rounded-md border px-3 py-2 text-sm font-semibold", passportTone(passport.portalReady ? "ok" : "warn"))}>
                {passport.score}% · {passport.decision}
              </div>
            </div>
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
                <div className="border-l-2 border-[#d09a31] pl-3 text-[#725216]">
                  <strong className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle size={15} strokeWidth={1.8} aria-hidden="true" /> Portal blockers</strong>
                  <div className="mt-2 grid gap-1">
                    {(passport.blockers.length ? passport.blockers : ["None"]).map((item) => <span className="text-xs font-semibold" key={item}>{item}</span>)}
                  </div>
                </div>
                <div className="border-l-2 border-[#9fb6c8] pl-3 text-[#27435b]">
                  <strong className="flex items-center gap-2 text-sm font-semibold"><Info size={15} strokeWidth={1.8} aria-hidden="true" /> Improvement notes</strong>
                  <div className="mt-2 grid gap-1">
                    {(passport.warnings.length ? passport.warnings : ["None"]).map((item) => <span className="text-xs font-semibold" key={item}>{item}</span>)}
                  </div>
                </div>
              </div>
            ) : null}
          </section>
          <DownloadOptionsPanel asset={asset} role={role} />

          <DamTabs tabs={detailTabs} active={activeTab} onChange={setActiveTab} ariaLabel="Asset detail sections" idPrefix="asset-detail" />

          <section id={damTabPanelId("asset-detail", "Use")} role="tabpanel" aria-labelledby={damTabId("asset-detail", "Use")} className="min-w-0 rounded-lg border border-[#d4ded7] bg-white p-4" aria-label="Usage guidance" hidden={activeTab !== "Use"}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><ShieldCheck size={18} strokeWidth={1.8} aria-hidden="true" /> Use guidance</h2>
              <dl className="grid gap-3">
                {display.guidanceFacts.map((fact) => (
                  <div className={factItemClass} key={fact.label}><dt className={factTermClass}>{fact.label}</dt><dd className={factDescClass}>{fact.value}</dd></div>
                ))}
              </dl>
          </section>

          <section id={damTabPanelId("asset-detail", "Source")} role="tabpanel" aria-labelledby={damTabId("asset-detail", "Source")} className="min-w-0 rounded-lg border border-[#d4ded7] bg-white p-4" aria-label="Source and provenance" hidden={activeTab !== "Source"}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><Info size={18} strokeWidth={1.8} aria-hidden="true" /> Source and provenance</h2>
              <dl className="grid gap-3">
                <div className={factItemClass}><dt className={factTermClass}>Source system</dt><dd className={factDescClass}>{asset.sourceSystem || asset.sourcePlatform || "ResourceSpace export"}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Source / photographer</dt><dd className={factDescClass}>{asset.sourceAccount || asset.collection || "Not exported"}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Event / collection</dt><dd className={factDescClass}>{asset.eventName || asset.collection}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Captured / event date</dt><dd className={factDescClass}>{asset.capturedDate || asset.eventDate || "Not exported"}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>ResourceSpace ID</dt><dd className={factDescClass}>{asset.resourceSpaceId || asset.id}</dd></div>
                {canSeeOriginal ? <div className={factItemClass}><dt className={factTermClass}>Original import path</dt><dd className={factDescClass}>{asset.sourcePath || "Source path not exported"}</dd></div> : null}
                {canSeeOriginal ? <div className={factItemClass}><dt className={factTermClass}>Master Drive path</dt><dd className={factDescClass}>{asset.masterDrivePath || "Visible after Shared Drive staging"}</dd></div> : null}
              </dl>
          </section>

          <section id={damTabPanelId("asset-detail", "Review")} role="tabpanel" aria-labelledby={damTabId("asset-detail", "Review")} className="min-w-0 rounded-lg border border-[#d4ded7] bg-white p-4" aria-label="Review status" hidden={activeTab !== "Review"}>
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
          </section>

          <section id={damTabPanelId("asset-detail", "Files")} role="tabpanel" aria-labelledby={damTabId("asset-detail", "Files")} className="min-w-0 rounded-lg border border-[#d4ded7] bg-white p-4" aria-label="File options" hidden={activeTab !== "Files"}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><FileText size={18} strokeWidth={1.8} aria-hidden="true" /> Files</h2>
              <dl className="grid gap-3">
                <div className={factItemClass}><dt className={factTermClass}>Media type</dt><dd className={factDescClass}>{asset.mediaType}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Format</dt><dd className={factDescClass}>{asset.fileExtension?.toUpperCase() || "Not exported"}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Dimensions</dt><dd className={factDescClass}>{asset.imageDimensions || "Not exported"}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>File size</dt><dd className={factDescClass}>{formatBytes(asset.fileSizeBytes)}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Original filename</dt><dd className={factDescClass}>{canSeeOriginal ? asset.originalFilename || "Not exported" : "Hidden for this role"}</dd></div>
                <div className={factItemClass}><dt className={factTermClass}>Checksum</dt><dd className={factDescClass}>{canSeeOriginal ? asset.checksumSha256 || "Not exported" : "Hidden for this role"}</dd></div>
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

          <section id={damTabPanelId("asset-detail", "Related")} role="tabpanel" aria-labelledby={damTabId("asset-detail", "Related")} className="min-w-0 rounded-lg border border-[#d4ded7] bg-white p-4" aria-label="Related assets" hidden={activeTab !== "Related"}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><Layers size={18} strokeWidth={1.8} aria-hidden="true" /> Related</h2>
              <RelatedStrip assets={related} role={role} />
          </section>

          <section className="min-w-0 rounded-lg border border-[#d4ded7] bg-white p-4" aria-label="Tags">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><ImageIcon size={18} strokeWidth={1.8} aria-hidden="true" /> Tags</h2>
            <div className="flex flex-wrap gap-2">
              {(asset.usageTerms || []).map((tag) => <span className="rounded-md bg-[#eef4f0] px-2.5 py-1 text-xs font-semibold text-[#4b5b51]" key={tag}>{tag}</span>)}
              {(asset.tags || []).map((tag) => <span className="rounded-md bg-[#eef4f0] px-2.5 py-1 text-xs font-semibold text-[#4b5b51]" key={tag}>{tag}</span>)}
              {(asset.tjcTerms || []).map((tag) => <span className="rounded-md bg-[#edf3fb] px-2.5 py-1 text-xs font-semibold text-tjc-blue" key={tag}>{tag}</span>)}
            </div>
          </section>

        </aside>
      </section>
    </div>
  );
}
