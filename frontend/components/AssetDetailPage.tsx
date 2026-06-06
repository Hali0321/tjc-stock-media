"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, ExternalLink, FileText, History, Image as ImageIcon, Info, Layers, ShieldCheck } from "lucide-react";
import { AssetTrustPanel } from "@/components/AssetTrustPanel";
import { DamTabs, damTabId, damTabPanelId } from "@/components/DamTabs";
import { DownloadOptionsPanel } from "@/components/DownloadOptionsPanel";
import { MediaPreview } from "@/components/MediaPreview";
import { useDemoRole } from "@/components/RoleProvider";
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
  if (!assets.length) return <div className="rounded-md border border-tjc-line bg-white p-4 text-sm text-tjc-muted">No related approved assets found in this local export.</div>;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {assets.slice(0, 6).map((asset) => {
        const imageUrl = collectionImageUrl(asset, role);
        return (
          <Link href={`/assets/${asset.id}`} key={asset.id} className="group overflow-hidden rounded-md border border-tjc-line bg-white transition hover:border-[#9fb8ae] active:translate-y-px">
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
        <Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen">
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

  return (
    <div className="dam-shell">
      <Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-tjc-line bg-white px-3 text-sm font-semibold text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px">
        <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
        Back to library
      </Link>
      <section className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(390px,.85fr)]">
        <div className="order-2 min-w-0 xl:order-1">
          <div className="grid min-h-[22rem] place-items-center overflow-hidden rounded-md border border-tjc-line bg-[#eef1ed] p-2 shadow-[0_1px_0_rgba(32,34,31,.05)]">
            <MediaPreview
              src={preview}
              alt={asset.thumbnailAlt}
              label="Preview unavailable"
              detail="No display derivative is exported for this role. Reuse is still governed by the trust record."
              className="min-h-[18rem] px-4"
              imgClassName="!h-auto max-h-[72dvh] !w-auto max-w-full rounded !object-contain shadow-[0_8px_24px_rgba(32,34,31,.14)]"
            />
          </div>
          <section className="mt-4 rounded-md border border-tjc-line bg-white p-3" aria-label="Related assets">
            <div className="mb-3">
              <h2 className="dam-section-title">Related assets</h2>
              <p className="mt-1 text-sm text-tjc-muted">Same collection, tags, or TJC terms. Approved assets shown first.</p>
            </div>
            <RelatedStrip assets={related} role={role} />
          </section>
        </div>

        <aside className="order-1 grid min-w-0 gap-3 xl:order-2 xl:sticky xl:top-24 xl:self-start">
          <section className="min-w-0 rounded-md border border-tjc-line bg-white p-3">
            <span className="text-sm font-semibold text-tjc-evergreen">{asset.collection}</span>
            <h1 className="mt-2 dam-page-title">{display.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-tjc-muted">{provenance.publicLabel}</p>
          </section>

          <AssetTrustPanel asset={asset} role={role} />
          <section className="min-w-0 rounded-md border border-tjc-line bg-white p-3" aria-label="Governance passport">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold"><ShieldCheck size={18} strokeWidth={1.8} aria-hidden="true" /> Governance passport</h2>
                <p className="mt-1 text-sm leading-snug text-tjc-muted">Decision, evidence, blockers, and portal readiness for this asset.</p>
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
                <div className="rounded-md border border-[#ead6a8] bg-[#fff8e8] p-3 text-[#725216]">
                  <strong className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle size={15} strokeWidth={1.8} aria-hidden="true" /> Portal blockers</strong>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(passport.blockers.length ? passport.blockers : ["None"]).map((item) => <span className="rounded-md bg-white/65 px-2 py-1 text-xs font-semibold" key={item}>{item}</span>)}
                  </div>
                </div>
                <div className={cn("rounded-md border p-3", passportTone(passport.warnings.length ? "info" : "ok"))}>
                  <strong className="flex items-center gap-2 text-sm font-semibold"><Info size={15} strokeWidth={1.8} aria-hidden="true" /> Improvement notes</strong>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(passport.warnings.length ? passport.warnings : ["None"]).map((item) => <span className="rounded-md bg-white/65 px-2 py-1 text-xs font-semibold" key={item}>{item}</span>)}
                  </div>
                </div>
              </div>
            ) : null}
          </section>
          <DownloadOptionsPanel asset={asset} role={role} />

          <DamTabs tabs={detailTabs} active={activeTab} onChange={setActiveTab} ariaLabel="Asset detail sections" idPrefix="asset-detail" />

          {activeTab === "Use" ? (
            <section id={damTabPanelId("asset-detail", "Use")} role="tabpanel" aria-labelledby={damTabId("asset-detail", "Use")} className="min-w-0 rounded-md border border-tjc-line bg-white p-3" aria-label="Usage guidance">
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><ShieldCheck size={18} strokeWidth={1.8} aria-hidden="true" /> Use guidance</h2>
              <dl className="grid gap-3">
                {display.guidanceFacts.map((fact) => (
                  <div className={factItemClass} key={fact.label}><dt className={factTermClass}>{fact.label}</dt><dd className={factDescClass}>{fact.value}</dd></div>
                ))}
              </dl>
            </section>
          ) : null}

          {activeTab === "Source" ? (
            <section id={damTabPanelId("asset-detail", "Source")} role="tabpanel" aria-labelledby={damTabId("asset-detail", "Source")} className="min-w-0 rounded-md border border-tjc-line bg-white p-3" aria-label="Source and provenance">
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
          ) : null}

          {activeTab === "Review" ? (
            <section id={damTabPanelId("asset-detail", "Review")} role="tabpanel" aria-labelledby={damTabId("asset-detail", "Review")} className="min-w-0 rounded-md border border-tjc-line bg-white p-3" aria-label="Review status">
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
          ) : null}

          {activeTab === "Files" ? (
            <section id={damTabPanelId("asset-detail", "Files")} role="tabpanel" aria-labelledby={damTabId("asset-detail", "Files")} className="min-w-0 rounded-md border border-tjc-line bg-white p-3" aria-label="File options">
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
          ) : null}

          {activeTab === "Related" ? (
            <section id={damTabPanelId("asset-detail", "Related")} role="tabpanel" aria-labelledby={damTabId("asset-detail", "Related")} className="min-w-0 rounded-md border border-tjc-line bg-white p-3" aria-label="Related assets">
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><Layers size={18} strokeWidth={1.8} aria-hidden="true" /> Related</h2>
              <RelatedStrip assets={related} role={role} />
            </section>
          ) : null}

          <section className="min-w-0 rounded-md border border-tjc-line bg-white p-3" aria-label="Tags">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><ImageIcon size={18} strokeWidth={1.8} aria-hidden="true" /> Tags</h2>
            <div className="flex flex-wrap gap-2">
              {(asset.usageTerms || []).map((tag) => <span className="rounded-md bg-[#eef4f0] px-2.5 py-1 text-xs font-semibold text-[#4b5b51]" key={tag}>{tag}</span>)}
              {(asset.tags || []).map((tag) => <span className="rounded-md bg-[#eef4f0] px-2.5 py-1 text-xs font-semibold text-[#4b5b51]" key={tag}>{tag}</span>)}
              {(asset.tjcTerms || []).map((tag) => <span className="rounded-md bg-[#edf3fb] px-2.5 py-1 text-xs font-semibold text-tjc-blue" key={tag}>{tag}</span>)}
            </div>
          </section>

          {data.resourceSpaceUrl && canOpenResourceSpace ? (
            <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-tjc-blue px-4 text-sm font-semibold text-white transition hover:bg-[#163e5d] active:translate-y-px" href={data.resourceSpaceUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={16} strokeWidth={1.8} aria-hidden="true" />
              Open in ResourceSpace
            </a>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
