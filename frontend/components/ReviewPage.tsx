"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Database, ExternalLink, Lock, ShieldCheck, ShieldX } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { canReview } from "@/lib/permissions";
import { StatusBadge, UsageBadge } from "@/components/StatusBadge";
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
const queueFilters = ["Review needed", "Children/youth", "Rights review", "Missing tags", "Large media"];

export function ReviewPage() {
  const { role } = useDemoRole();
  const [data, setData] = useState<ReviewResponse | null>(null);
  const [message, setMessage] = useState("");
  const reviewer = canReview(role);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/review?role=${encodeURIComponent(role)}`)
      .then((response) => response.json())
      .then((body: ReviewResponse) => {
        if (!cancelled) setData(body);
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

      <div className="review-list">
        {(data?.assets || []).slice(0, 24).map((asset) => (
          <article className="review-row" key={asset.id}>
            <Link href={`/assets/${asset.id}`} className="review-row__media" aria-label={`Open ${asset.title}`}>
              {asset.thumbnail ? <img src={asset.thumbnail} alt={asset.thumbnailAlt} loading="lazy" /> : <span>Preview unavailable</span>}
              <span className="asset-card__type">{asset.mediaType}</span>
            </Link>
            <div className="review-row__actions">
              <div className="review-row__heading">
                <div>
                  <h2>{asset.title}</h2>
                  <p>{asset.collection}</p>
                </div>
                <a href={`/assets/${asset.id}`} aria-label={`Open ${asset.title} detail`}>
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
              <p>{asset.rightsNotes || "Default import state. Human rights review required before use."}</p>
              <div className="risk-row">
                <span>{asset.peopleRisk}</span>
                <span>{asset.fileExtension?.toUpperCase() || asset.mediaType}</span>
                <span>{asset.collection}</span>
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
        ))}
      </div>
    </div>
  );
}
