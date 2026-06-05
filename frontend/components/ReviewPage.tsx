"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Archive, Database, ExternalLink, FileWarning, Info, Lock, ShieldCheck, ShieldX, Users } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { canReview } from "@/lib/permissions";
import { StatusBadge, UsageBadge } from "@/components/StatusBadge";
import { assetPresentation, detailImageUrl, provenanceSummary } from "@/lib/presentation";
import { missingReviewFields, reviewActions, reviewRiskFlags, type ReviewQueueId } from "@/lib/workflow-policy";
import type { MediaSourceStatus, StockMediaAsset } from "@/lib/types";

type QueueSummary = {
  id: ReviewQueueId;
  label: string;
  description: string;
  count: number;
};

type Governance = {
  pendingReview: number;
  childrenYouth: number;
  missingSource: number;
  rightsReview: number;
  approvedThisMonth: number;
  archiveCandidates: number;
  missingRequiredFields: number;
};

type ReviewResponse = {
  assets: StockMediaAsset[];
  allAssets: StockMediaAsset[];
  source: MediaSourceStatus;
  canReview: boolean;
  queues: QueueSummary[];
  governance: Governance;
  resourceSpaceUrls: Record<string, string>;
};

const governanceCards = [
  { key: "pendingReview", label: "Pending review", icon: ShieldCheck },
  { key: "childrenYouth", label: "Children/youth", icon: Users },
  { key: "missingSource", label: "Missing source", icon: FileWarning },
  { key: "rightsReview", label: "Rights review", icon: Lock },
  { key: "approvedThisMonth", label: "Approved this month", icon: ShieldCheck },
  { key: "archiveCandidates", label: "Archive candidates", icon: Archive }
] as const;

function sourceSummary(asset: StockMediaAsset) {
  return provenanceSummary(asset, "Reviewer").publicLabel || asset.collection || "Source pending";
}

export function ReviewPage() {
  const { role } = useDemoRole();
  const [data, setData] = useState<ReviewResponse | null>(null);
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [activeQueue, setActiveQueue] = useState<ReviewQueueId>("pending");
  const reviewer = canReview(role);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/review?role=${encodeURIComponent(role)}&queue=${encodeURIComponent(activeQueue)}`)
      .then((response) => response.json())
      .then((body: ReviewResponse) => {
        if (!cancelled) {
          setData(body);
          setSelectedId((current) => (body.assets.some((asset) => asset.id === current) ? current : body.assets[0]?.id || ""));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [role, activeQueue]);

  const selectedAsset = useMemo(() => data?.assets.find((asset) => asset.id === selectedId) || data?.assets[0], [data?.assets, selectedId]);

  async function runAction(id: string, action: (typeof reviewActions)[number]) {
    setMessage("");
    const response = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, id, action: action.backend, label: action.label, notes: "Server-routed review action; ResourceSpace remains write target." })
    });
    const body = await response.json();
    setMessage(body.message || body.error || "Review route responded.");
  }

  if (!reviewer) {
    return (
      <div className="page-shell page-shell--workflow">
        <section className="library-top">
          <div>
            <p className="eyebrow">Review</p>
            <h1>Review is available to reviewers</h1>
            <p>Reviewers check source, rights, people/minors, usage scope, duplicates, and archive decisions before reuse.</p>
          </div>
        </section>
        <section className="role-locked-workflow">
          <ShieldCheck size={28} aria-hidden="true" />
          <div>
            <h2>What reviewers check</h2>
            <p>Approval status, source/provenance, people visibility, children/youth risk, rights notes, usage guidance, and download eligibility.</p>
            <span>Use role switch to Reviewer or DAM Admin to inspect the governance workbench.</span>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell review-page-shell">
      <section className="library-top review-top">
        <div>
          <p className="eyebrow">Govern</p>
          <h1>Review workbench</h1>
          <p>Prioritize risk, missing metadata, children/youth, rights issues, duplicates, large media, and archive decisions.</p>
        </div>
        <div className="source-pill">
          <span>Queue</span>
          <strong>{data?.assets.length ?? "-"} selected</strong>
        </div>
      </section>

      {data?.source.readOnly ? (
        <div className="review-mode-banner">
          <Database size={18} aria-hidden="true" />
          <div>
            <strong>Review queue is reading ResourceSpace export.</strong>
            <span>Actions stay server-routed; ResourceSpace API write persistence is pending field mapping.</span>
          </div>
        </div>
      ) : null}

      <section className="governance-summary" aria-label="Governance metrics">
        {governanceCards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="governance-card" key={card.key}>
              <Icon size={16} aria-hidden="true" />
              <strong>{data?.governance[card.key]?.toLocaleString() ?? "-"}</strong>
              <span>{card.label}</span>
            </div>
          );
        })}
      </section>

      <section className="review-queue-tabs" aria-label="Review queues">
        {(data?.queues || []).map((queue) => (
          <button
            key={queue.id}
            type="button"
            className={activeQueue === queue.id ? "review-queue-tab review-queue-tab--active" : "review-queue-tab"}
            onClick={() => setActiveQueue(queue.id)}
            aria-pressed={activeQueue === queue.id}
          >
            <span>{queue.label}</span>
            <strong>{queue.count.toLocaleString()}</strong>
          </button>
        ))}
      </section>

      {message ? <div className="form-message">{message}</div> : null}

      <section className="review-workbench review-workbench--govern">
        <div className="review-list review-list--govern">
          {(data?.assets || []).slice(0, 36).map((asset) => {
            const display = assetPresentation(asset, role);
            const selected = selectedAsset?.id === asset.id;
            const risks = reviewRiskFlags(asset);
            const missing = missingReviewFields(asset);
            return (
              <article className={`review-row ${selected ? "review-row--selected" : ""}`} key={asset.id}>
                <button type="button" className="review-row__select" onClick={() => setSelectedId(asset.id)} aria-label={`Select ${display.title}`}>
                  <span />
                </button>
                <Link href={`/assets/${asset.id}`} className="review-row__media" aria-label={`Open ${display.title}`}>
                  {asset.thumbnail ? <img src={asset.thumbnail} alt={asset.thumbnailAlt} loading="eager" /> : <span>Preview unavailable</span>}
                  <span className="asset-card__type">{asset.mediaType}</span>
                </Link>
                <div className="review-row__actions">
                  <div className="review-row__heading">
                    <div>
                      <h2>{display.title}</h2>
                      <p>{asset.collection} · {sourceSummary(asset)}</p>
                    </div>
                    <a href={`/assets/${asset.id}`} aria-label={`Open ${display.title} detail`}>
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
                  <div className="risk-row risk-row--strong">
                    {risks.slice(0, 5).map((flag) => <span key={flag}>{flag}</span>)}
                  </div>
                  <div className="risk-row">
                    <span>{missing.length ? `Missing: ${missing.join(", ")}` : "Required fields present"}</span>
                    <span>{asset.fileExtension?.toUpperCase() || asset.mediaType}</span>
                    <span>RS {asset.resourceSpaceId || asset.id}</span>
                  </div>
                  <div className="action-grid action-grid--review">
                    {reviewActions.map((action) => (
                      <button key={action.id} type="button" disabled={!reviewer} onClick={() => runAction(asset.id, action)}>
                        {action.backend === "Do Not Use" ? <ShieldX size={15} aria-hidden="true" /> : <ShieldCheck size={15} aria-hidden="true" />}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
          {data && !data.assets.length ? <div className="empty-state">No assets in this queue.</div> : null}
        </div>

        {selectedAsset ? (
          <aside className="review-inspector review-inspector--govern" aria-label="Selected asset review summary">
            <img src={detailImageUrl(selectedAsset)} alt={selectedAsset.thumbnailAlt} />
            <div>
              <p className="eyebrow">Selected asset</p>
              <h2>{assetPresentation(selectedAsset, role).title}</h2>
            </div>
            <div className="asset-card__chips">
              <StatusBadge status={selectedAsset.status} />
              <UsageBadge scope={selectedAsset.usageScope} />
            </div>
            <dl>
              <div><dt>Why review</dt><dd>{reviewRiskFlags(selectedAsset).join(", ")}</dd></div>
              <div><dt>Source/provenance</dt><dd>{sourceSummary(selectedAsset)}</dd></div>
              <div><dt>People/minors</dt><dd>{selectedAsset.peopleRisk || "Unknown"}</dd></div>
              <div><dt>Usage guidance</dt><dd>{selectedAsset.usageGuidance || "Missing"}</dd></div>
              <div><dt>Review notes</dt><dd>{selectedAsset.rightsNotes || "No notes exported yet"}</dd></div>
              <div><dt>Status history</dt><dd>{assetPresentation(selectedAsset, role).reviewFacts.statusHistory.join(" -> ")}</dd></div>
            </dl>
            <div className="review-inspector__actions">
              <Link href={`/assets/${selectedAsset.id}`} className="secondary-action">
                <ExternalLink size={16} aria-hidden="true" />
                Open detail
              </Link>
              {data?.resourceSpaceUrls[selectedAsset.id] ? (
                <a className="secondary-action secondary-action--quiet" href={data.resourceSpaceUrls[selectedAsset.id]} target="_blank" rel="noreferrer">
                  <ExternalLink size={16} aria-hidden="true" />
                  ResourceSpace
                </a>
              ) : null}
            </div>
            <div className="review-inspector__note">
              <Info size={16} aria-hidden="true" />
              <span>Final approval writes remain in ResourceSpace until API write mapping is live.</span>
            </div>
          </aside>
        ) : null}
      </section>
    </div>
  );
}
