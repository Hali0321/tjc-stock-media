"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Download, ExternalLink, FileLock2, ShieldAlert } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { StatusBadge, UsageBadge } from "@/components/StatusBadge";
import { canDownloadApprovedCopy } from "@/lib/permissions";
import type { MediaSourceStatus, StockMediaAsset } from "@/lib/types";

type DetailResponse = {
  asset: StockMediaAsset;
  source: MediaSourceStatus;
  resourceSpaceUrl: string | null;
};

function guidanceFor(asset: StockMediaAsset, canDownload: boolean) {
  const tjcContext = [...(asset.tjcTerms || []), ...(asset.tags || [])].slice(0, 3).join(", ") || asset.collection;
  return {
    bestUsedFor: canDownload
      ? "Church newsletters, slides, local announcements, websites, and ministry reports when the context fits."
      : "Reference only until a reviewer approves public or internal ministry use.",
    avoid:
      asset.peopleRisk === "Possible minors"
        ? "Please avoid public posting, close cropping, or social sharing until children/youth visibility is reviewed."
        : "Please avoid removing important ministry context, changing the meaning of the image, or using it for unrelated promotion.",
    caption: `${asset.title}${tjcContext ? ` - ${tjcContext}` : ""}`,
    credit: asset.sourcePath ? "Keep source attribution available in ResourceSpace/Shared Drive records." : "No separate public credit requirement exported yet.",
    sensitivity:
      asset.status === "Approved Public"
        ? "Approved with current exported review notes. Use respectfully and keep the ministry context intact."
        : "Ask a media coworker if you are unsure. Review state must be resolved before reuse."
  };
}

export function AssetDetailPage({ id }: { id: string }) {
  const { role } = useDemoRole();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState("");

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

  const { asset } = data;
  const canDownload = canDownloadApprovedCopy(role, asset);
  const guidance = guidanceFor(asset, canDownload);

  return (
    <div className="page-shell">
      <Link href="/" className="back-link">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to library
      </Link>
      <section className="detail-layout">
        <div className="detail-preview">
          {asset.preview ? <img src={asset.preview} alt={asset.thumbnailAlt} /> : <div className="detail-preview__empty">Preview unavailable</div>}
        </div>
        <aside className="detail-panel">
          <div className="detail-title">
            <div>
              <p className="eyebrow">{asset.collection}</p>
              <h1>{asset.title}</h1>
            </div>
            <div className="asset-card__chips">
              <StatusBadge status={asset.status} />
              <UsageBadge scope={asset.usageScope} />
            </div>
          </div>

          <div className="safe-answer">
            {canDownload ? <CheckCircle2 size={20} aria-hidden="true" /> : <ShieldAlert size={20} aria-hidden="true" />}
            <div>
              <strong>{canDownload ? "Download approved copy." : "Reviewer approval required."}</strong>
              <span>{asset.usageGuidance}</span>
            </div>
          </div>

          <section className="usage-guidance-panel" aria-label="Usage guidance">
            <h2>Use this asset with care</h2>
            <dl>
              <div><dt>Best used for</dt><dd>{guidance.bestUsedFor}</dd></div>
              <div><dt>Please avoid</dt><dd>{guidance.avoid}</dd></div>
              <div><dt>Caption suggestion</dt><dd>{guidance.caption}</dd></div>
              <div><dt>Credit requirement</dt><dd>{guidance.credit}</dd></div>
              <div><dt>Ministry sensitivity</dt><dd>{guidance.sensitivity}</dd></div>
            </dl>
          </section>

          <div className="download-panel download-panel--approved">
            <div>
              <h2>Approved copy</h2>
              <p>Use this copy for ministry work when the approval label allows.</p>
            </div>
            {canDownload ? (
              <a className="primary-action" href={`/api/download/${asset.id}?role=${encodeURIComponent(role)}`}>
                <Download size={16} aria-hidden="true" />
                Download approved copy
              </a>
            ) : (
              <button type="button" disabled className="primary-action primary-action--disabled">
                <ShieldAlert size={16} aria-hidden="true" />
                Reviewer approval required
              </button>
            )}
          </div>

          <div className="download-panel download-panel--restricted">
            <div>
              <h2>Original/master restricted</h2>
              <p>Admin/designer only. Master files stay in ResourceSpace and Google Shared Drive references.</p>
            </div>
            <span>
              <FileLock2 size={16} aria-hidden="true" />
              Original locked
            </span>
          </div>

          <dl className="meta-list">
            <div><dt>ResourceSpace ID</dt><dd>{asset.resourceSpaceId || asset.id}</dd></div>
            <div><dt>Reviewer</dt><dd>{asset.reviewer || "Not reviewed"}</dd></div>
            <div><dt>Reviewed date</dt><dd>{asset.reviewedDate || "Pending"}</dd></div>
            <div><dt>People/minors risk</dt><dd>{asset.peopleRisk || "Unknown"}</dd></div>
            <div><dt>Source path</dt><dd>{asset.sourcePath || "Not exported"}</dd></div>
            <div><dt>Master Drive path</dt><dd>{asset.masterDrivePath || "Pending Shared Drive staging"}</dd></div>
            <div><dt>Original filename</dt><dd>{asset.originalFilename || "Unknown"}</dd></div>
          </dl>

          <section className="tag-section" aria-label="Tags">
            <h2>Tags</h2>
            <div className="chip-row">
              {(asset.tags || []).map((tag) => <span className="chip chip--static" key={tag}>{tag}</span>)}
              {(asset.tjcTerms || []).map((tag) => <span className="chip chip--static chip--tjc" key={tag}>{tag}</span>)}
            </div>
          </section>

          <section className="notes-panel">
            <h2>Rights notes</h2>
            <p>{asset.rightsNotes || "No reviewer notes exported yet. Ask a media coworker if public use is unclear."}</p>
          </section>

          {data.resourceSpaceUrl ? (
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
