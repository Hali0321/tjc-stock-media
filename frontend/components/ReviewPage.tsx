"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Database, ExternalLink, Lock, ShieldCheck, ShieldX } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { canReview } from "@/lib/permissions";
import { StatusBadge, UsageBadge } from "@/components/StatusBadge";
import { normalizeAssetTitle } from "@/lib/display";
import type { MediaSourceStatus, StockMediaAsset } from "@/lib/types";

type ReviewResponse = {
  assets: StockMediaAsset[];
  source: MediaSourceStatus;
  canReview: boolean;
};

const actions = [
  { label: "Approve for church-wide use", backend: "Approve Public" },
  { label: "Approve for internal ministry use", backend: "Approve Internal" },
  { label: "Archive only", backend: "Searchable Archive" },
  { label: "Do not publish externally", backend: "Do Not Use" }
] as const;
const queueFilters = ["Pending Review", "Possible Children/Youth", "Missing Source", "Needs Usage Guidance", "Internal Only", "Do Not Publish"];

function sourceSummary(asset: StockMediaAsset) {
  if (!asset.sourcePath) return "Source pending";
  const parts = asset.sourcePath.split("/").filter(Boolean);
  const filename = parts.at(-1) || asset.sourcePath;
  const folder = parts.at(-2);
  return folder ? `${folder} · ${filename}` : filename;
}

export function ReviewPage() {
  const { role } = useDemoRole();
  const [data, setData] = useState<ReviewResponse | null>(null);
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const reviewer = canReview(role);
  const selectedAsset = data?.assets.find((asset) => asset.id === selectedId) || data?.assets[0];

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/review?role=${encodeURIComponent(role)}`)
      .then((response) => response.json())
      .then((body: ReviewResponse) => {
        if (!cancelled) {
          setData(body);
          setSelectedId((current) => current || body.assets[0]?.id || "");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [role]);

  async function runAction(id: string, action: (typeof actions)[number]) {
    setMessage("");
    const response = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, id, action: action.backend, label: action.label, notes: "Mac reference demo action through server route." })
    });
    const body = await response.json();
    setMessage(body.message || body.error || "Review route responded.");
  }

  return (
    <div className="page-shell">
      <section className="library-top">
        <div>
          <p className="eyebrow">Reviewer queue</p>
          <h1>Review assets safely</h1>
          <p>Few people approve. Many people can submit.</p>
        </div>
        <div className="source-pill">
          <span>Queue</span>
          <strong>{data?.assets.length ?? "-"} visible</strong>
        </div>
      </section>

      {!reviewer ? (
        <div className="empty-state">Reviewer controls are unavailable for this role. Switch to Reviewer or DAM Admin for approval demo.</div>
      ) : null}

      {reviewer && data?.source.readOnly ? (
        <div className="review-mode-banner">
          <Database size={18} aria-hidden="true" />
          <div>
            <strong>Review queue is reading ResourceSpace export.</strong>
            <span>Actions are routed server-side, but final approval writes stay in ResourceSpace until API field mapping is configured.</span>
          </div>
        </div>
      ) : null}

      {reviewer ? (
        <section className="review-demo-path" aria-label="Stakeholder demo path">
          <strong>Demo path</strong>
          <span>Open a review-needed asset to show blocked download, then return here for approval actions.</span>
          {data?.assets[0] ? <a href={`/assets/${data.assets[0].id}`}>Open first review-needed asset</a> : null}
        </section>
      ) : null}

      {reviewer ? (
        <section className="review-filter-bar" aria-label="Review filters">
          {queueFilters.map((filter, index) => (
            <button className={index === 0 ? "review-filter-bar__active" : ""} key={filter} type="button">
              {filter}
            </button>
          ))}
        </section>
      ) : null}

      {message ? <div className="form-message">{message}</div> : null}

      <section className="review-workbench">
        <div className="review-list">
          {(data?.assets || []).slice(0, 24).map((asset) => {
            const displayTitle = normalizeAssetTitle(asset.title, asset.originalFilename, asset);
            const selected = selectedAsset?.id === asset.id;
            return (
              <article className={`review-row ${selected ? "review-row--selected" : ""}`} key={asset.id}>
                <button type="button" className="review-row__select" onClick={() => setSelectedId(asset.id)} aria-label={`Select ${displayTitle}`}>
                  <span />
                </button>
                <Link href={`/assets/${asset.id}`} className="review-row__media" aria-label={`Open ${displayTitle}`}>
                  {asset.thumbnail ? <img src={asset.thumbnail} alt={asset.thumbnailAlt} loading="eager" /> : <span>Preview unavailable</span>}
                  <span className="asset-card__type">{asset.mediaType}</span>
                </Link>
                <div className="review-row__actions">
                  <div className="review-row__heading">
                    <div>
                      <h2>{displayTitle}</h2>
                      <p>{asset.collection} · {sourceSummary(asset)}</p>
                    </div>
                    <a href={`/assets/${asset.id}`} aria-label={`Open ${displayTitle} detail`}>
                      <ExternalLink size={16} aria-hidden="true" />
                    </a>
                  </div>
                  <div className="asset-card__chips">
                    <StatusBadge status={asset.status} />
                    <UsageBadge scope={asset.usageScope} />
                    <span className="download-state">
                      <Lock size={14} aria-hidden="true" />
                      blocked
                    </span>
                  </div>
                  <p>{asset.rightsNotes || "Review needed before reuse."}</p>
                  <div className="risk-row">
                    <span>{asset.peopleRisk}</span>
                    <span>{asset.fileExtension?.toUpperCase() || asset.mediaType}</span>
                    <span>{asset.status === "Needs Review" ? "Reviewer required" : asset.status}</span>
                    <span>RS {asset.resourceSpaceId || asset.id}</span>
                  </div>
                  <div className="action-grid">
                    {actions.map((action) => (
                      <button key={action.backend} type="button" disabled={!reviewer} onClick={() => runAction(asset.id, action)}>
                        {action.backend === "Do Not Use" ? <ShieldX size={15} aria-hidden="true" /> : <ShieldCheck size={15} aria-hidden="true" />}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {selectedAsset ? (
          <aside className="review-inspector" aria-label="Selected asset review summary">
            <img src={selectedAsset.thumbnail} alt={selectedAsset.thumbnailAlt} />
            <div>
              <p className="eyebrow">Selected asset</p>
              <h2>{normalizeAssetTitle(selectedAsset.title, selectedAsset.originalFilename, selectedAsset)}</h2>
            </div>
            <div className="asset-card__chips">
              <StatusBadge status={selectedAsset.status} />
              <UsageBadge scope={selectedAsset.usageScope} />
            </div>
            <dl>
              <div><dt>Why review</dt><dd>{selectedAsset.rightsNotes || "Human rights review required before reuse."}</dd></div>
              <div><dt>Source</dt><dd>{sourceSummary(selectedAsset)}</dd></div>
              <div><dt>People/minors</dt><dd>{selectedAsset.peopleRisk || "Unknown"}</dd></div>
              <div><dt>ResourceSpace</dt><dd>{selectedAsset.resourceSpaceId || selectedAsset.id}</dd></div>
            </dl>
            <Link href={`/assets/${selectedAsset.id}`} className="secondary-action">
              <ExternalLink size={16} aria-hidden="true" />
              Open detail
            </Link>
          </aside>
        ) : null}
      </section>
    </div>
  );
}
