"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, FileText, History, Image as ImageIcon, Info, Layers, ShieldCheck } from "lucide-react";
import { AssetTrustPanel } from "@/components/AssetTrustPanel";
import { DownloadOptionsPanel } from "@/components/DownloadOptionsPanel";
import { useDemoRole } from "@/components/RoleProvider";
import { decideAccess } from "@/lib/access-decisions";
import { assetPresentation, collectionImageUrl, detailImageUrl, provenanceSummary } from "@/lib/presentation";
import type { DemoRole, MediaSourceStatus, StockMediaAsset } from "@/lib/types";

type DetailResponse = {
  asset: StockMediaAsset;
  source: MediaSourceStatus;
  related: StockMediaAsset[];
  resourceSpaceUrl: string | null;
};

const detailTabs = ["Use", "Source", "Review", "Files", "Related"] as const;
type DetailTab = (typeof detailTabs)[number];

function formatBytes(value?: number) {
  if (!value) return "Not exported";
  if (value > 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (value > 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(value / 1024)).toLocaleString()} KB`;
}

function RelatedStrip({ assets, role }: { assets: StockMediaAsset[]; role: DemoRole }) {
  if (!assets.length) return <div className="related-empty">No related approved assets found in this local export.</div>;
  return (
    <div className="related-strip">
      {assets.slice(0, 6).map((asset) => (
        <Link href={`/assets/${asset.id}`} key={asset.id} className="related-card">
          <img src={collectionImageUrl(asset)} alt={asset.thumbnailAlt} loading="lazy" />
          <span>{assetPresentation(asset, role).title}</span>
        </Link>
      ))}
    </div>
  );
}

export function AssetDetailPage({ id }: { id: string }) {
  const { role } = useDemoRole();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<DetailTab>("Use");

  useEffect(() => {
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
  }, [id, role]);

  if (error) {
    return (
      <div className="page-shell">
        <Link href="/" className="back-link">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to library
        </Link>
        <div className="empty-state">{error}</div>
      </div>
    );
  }

  if (!data) {
    return <div className="page-shell"><div className="empty-state">Loading asset...</div></div>;
  }

  const { asset, related } = data;
  const display = assetPresentation(asset, role);
  const provenance = provenanceSummary(asset, role);
  const canSeeOriginal = decideAccess(role, "viewOriginalMetadata", asset).allowed;
  const canOpenResourceSpace = decideAccess(role, "viewResourceSpaceAdminLink", asset).allowed;
  const preview = detailImageUrl(asset);

  return (
    <div className="page-shell detail-page-shell">
      <Link href="/" className="back-link">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to library
      </Link>
      <section className="detail-layout detail-layout--trust-record">
        <div className="detail-main">
          <div className="detail-preview detail-preview--large">
            {preview ? <img src={preview} alt={asset.thumbnailAlt} /> : <div className="detail-preview__empty">Preview unavailable</div>}
          </div>
          <section className="detail-related-panel" aria-label="Related assets">
            <div className="panel-heading">
              <div>
                <h2>Related assets</h2>
                <p>Same collection, tags, or TJC terms. Approved assets shown first.</p>
              </div>
            </div>
            <RelatedStrip assets={related} role={role} />
          </section>
        </div>

        <aside className="detail-panel detail-panel--trust">
          <div className="detail-title">
            <div>
              <p className="eyebrow">{asset.collection}</p>
              <h1>{display.title}</h1>
              <p>{provenance.publicLabel}</p>
            </div>
          </div>

          <AssetTrustPanel asset={asset} role={role} />
          <DownloadOptionsPanel asset={asset} role={role} />

          <nav className="detail-tabs" aria-label="Asset detail sections">
            {detailTabs.map((tab) => (
              <button key={tab} type="button" className={activeTab === tab ? "detail-tabs__active" : ""} onClick={() => setActiveTab(tab)} aria-pressed={activeTab === tab}>
                {tab}
              </button>
            ))}
          </nav>

          {activeTab === "Use" ? (
            <section className="detail-tab-panel" aria-label="Usage guidance">
              <h2><ShieldCheck size={18} aria-hidden="true" /> Use guidance</h2>
              <dl>
                {display.guidanceFacts.map((fact) => (
                  <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>
                ))}
              </dl>
            </section>
          ) : null}

          {activeTab === "Source" ? (
            <section className="detail-tab-panel" aria-label="Source and provenance">
              <h2><Info size={18} aria-hidden="true" /> Source and provenance</h2>
              <dl>
                <div><dt>Source system</dt><dd>{asset.sourceSystem || asset.sourcePlatform || "ResourceSpace export"}</dd></div>
                <div><dt>Source / photographer</dt><dd>{asset.sourceAccount || asset.collection || "Not exported"}</dd></div>
                <div><dt>Event / collection</dt><dd>{asset.eventName || asset.collection}</dd></div>
                <div><dt>Captured / event date</dt><dd>{asset.capturedDate || asset.eventDate || "Not exported"}</dd></div>
                <div><dt>ResourceSpace ID</dt><dd>{asset.resourceSpaceId || asset.id}</dd></div>
                {canSeeOriginal ? <div><dt>Original import path</dt><dd>{asset.sourcePath || "Source path not exported"}</dd></div> : null}
                {canSeeOriginal ? <div><dt>Master Drive path</dt><dd>{asset.masterDrivePath || "Visible after Shared Drive staging"}</dd></div> : null}
              </dl>
            </section>
          ) : null}

          {activeTab === "Review" ? (
            <section className="detail-tab-panel" aria-label="Review status">
              <h2><History size={18} aria-hidden="true" /> Review record</h2>
              <dl>
                <div><dt>Reviewer</dt><dd>{asset.reviewer || "Not reviewed"}</dd></div>
                <div><dt>Review date</dt><dd>{asset.reviewedDate || "Pending"}</dd></div>
                <div><dt>Rights status</dt><dd>{asset.rightsStatus || "Unknown"}</dd></div>
                <div><dt>Consent</dt><dd>{asset.consentStatus || "Unknown"}</dd></div>
                <div><dt>Risk flags</dt><dd>{display.reviewFacts.riskFlags.join(", ")}</dd></div>
                <div><dt>Missing fields</dt><dd>{display.reviewFacts.missingFields.length ? display.reviewFacts.missingFields.join(", ") : "None for current export"}</dd></div>
              </dl>
              <p>{asset.rightsNotes || "No reviewer notes exported yet. Ask a media coworker if public use is unclear."}</p>
            </section>
          ) : null}

          {activeTab === "Files" ? (
            <section className="detail-tab-panel" aria-label="File options">
              <h2><FileText size={18} aria-hidden="true" /> Files</h2>
              <dl>
                <div><dt>Media type</dt><dd>{asset.mediaType}</dd></div>
                <div><dt>Format</dt><dd>{asset.fileExtension?.toUpperCase() || "Not exported"}</dd></div>
                <div><dt>Dimensions</dt><dd>{asset.imageDimensions || "Not exported"}</dd></div>
                <div><dt>File size</dt><dd>{formatBytes(asset.fileSizeBytes)}</dd></div>
                <div><dt>Original filename</dt><dd>{canSeeOriginal ? asset.originalFilename || "Not exported" : "Hidden for this role"}</dd></div>
                <div><dt>Checksum</dt><dd>{canSeeOriginal ? asset.checksumSha256 || "Not exported" : "Hidden for this role"}</dd></div>
              </dl>
            </section>
          ) : null}

          {activeTab === "Related" ? (
            <section className="detail-tab-panel" aria-label="Related assets">
              <h2><Layers size={18} aria-hidden="true" /> Related</h2>
              <RelatedStrip assets={related} role={role} />
            </section>
          ) : null}

          <section className="tag-section" aria-label="Tags">
            <h2><ImageIcon size={18} aria-hidden="true" /> Tags</h2>
            <div className="chip-row">
              {(asset.usageTerms || []).map((tag) => <span className="chip chip--static" key={tag}>{tag}</span>)}
              {(asset.tags || []).map((tag) => <span className="chip chip--static" key={tag}>{tag}</span>)}
              {(asset.tjcTerms || []).map((tag) => <span className="chip chip--static chip--tjc" key={tag}>{tag}</span>)}
            </div>
          </section>

          {data.resourceSpaceUrl && canOpenResourceSpace ? (
            <a className="secondary-action" href={data.resourceSpaceUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={16} aria-hidden="true" />
              Open in ResourceSpace
            </a>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
