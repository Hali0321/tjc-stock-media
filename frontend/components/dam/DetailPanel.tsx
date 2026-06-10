"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, FileLock2, History, LockKeyhole, ShieldCheck } from "lucide-react";
import { MediaPreview } from "@/components/MediaPreview";
import { assetPresentation, collectionImageUrl } from "@/lib/presentation";
import { viewerVerdictForAsset } from "@/lib/viewer-verdict";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import type { ReactNode } from "react";

export function DamDetailPanel({
  preview,
  decision
}: {
  preview: ReactNode;
  decision: ReactNode;
}) {
  return (
    <section className="dam-detail-panel-v2" aria-label="Media record decision">
      <div className="dam-detail-preview-column">{preview}</div>
      <aside className="dam-detail-decision-column">{decision}</aside>
    </section>
  );
}

export function DamPreviewWorkbench({
  title,
  subtitle,
  status,
  facts,
  children
}: {
  title: string;
  subtitle: string;
  status: string;
  facts: Array<{ label: string; value?: ReactNode }>;
  children: ReactNode;
}) {
  return (
    <section className="dam-preview-workbench" aria-label="Protected media preview">
      <div className="dam-preview-toolbar">
        <div className="min-w-0">
          <span>{status}</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="dam-preview-canvas">{children}</div>
      <dl className="dam-preview-fact-strip">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value || "Not provided"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function DamMetadataGrid({
  title,
  items
}: {
  title: string;
  items: Array<{ label: string; value?: ReactNode }>;
}) {
  return (
    <section className="dam-metadata-grid-v2" aria-label={title}>
      <h2>{title}</h2>
      <dl>
        {items.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value || "Not provided"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function DamRelatedMediaStrip({
  assets,
  role
}: {
  assets: StockMediaAsset[];
  role: DemoRole;
}) {
  if (!assets.length) return null;
  const visible = assets.slice(0, 5);
  return (
    <section className="dam-related-strip-v2" aria-label="Related media">
      <div className="dam-related-strip-heading">
        <div>
          <h2>Related records</h2>
          <p>Open each record before reuse; package context does not approve the item.</p>
        </div>
        <span>{assets.length.toLocaleString()} in package</span>
      </div>
      <div className="dam-related-record-list">
        {visible.map((asset) => {
          const display = assetPresentation(asset, role);
          const verdict = viewerVerdictForAsset(asset, role);
          return (
            <Link href={`/assets/${asset.id}`} className="dam-related-record-row" key={asset.id}>
              <span className="dam-related-record-thumb">
                <MediaPreview src={collectionImageUrl(asset, role)} alt={asset.thumbnailAlt} label="Preview protected" detail="Open record for guidance" />
              </span>
              <span className="dam-related-record-main">
                <strong>{display.title}</strong>
                <small>{display.cardSubtitle}</small>
              </span>
              <span className={`dam-related-record-verdict is-${verdict.tone}`}>
                {verdict.label}
              </span>
              <span className="dam-related-record-action">
                Open record
                <ArrowRight size={14} strokeWidth={1.9} aria-hidden="true" />
              </span>
            </Link>
          );
        })}
        {assets.length > visible.length ? (
          <span className="dam-related-record-more">{(assets.length - visible.length).toLocaleString()} more related records available from the package.</span>
        ) : null}
      </div>
    </section>
  );
}

export function DamSourceRestrictionCard({ detail }: { detail: string }) {
  return (
    <section className="dam-source-restriction-card" aria-label="Source file restriction">
      <FileLock2 size={18} strokeWidth={1.9} aria-hidden="true" />
      <p>{detail}</p>
    </section>
  );
}

export function DamDecisionLedger({
  allowed,
  blocked,
  approver,
  expires,
  attribution,
  replacement
}: {
  allowed: string[];
  blocked: string[];
  approver?: ReactNode;
  expires?: ReactNode;
  attribution?: ReactNode;
  replacement?: ReactNode;
}) {
  const facts = [
    { label: "Approved by", value: approver || "Reviewer pending" },
    { label: "Review date", value: expires || "Review pending" },
    { label: "Attribution", value: attribution || "Not required unless noted" },
    { label: "Replacement", value: replacement || "None linked" }
  ];
  return (
    <section className="dam-decision-ledger" aria-label="Usage verdict details">
      <div className="dam-channel-matrix">
        <div className="is-allowed">
          <h3>
            <CheckCircle2 size={15} strokeWidth={2} aria-hidden="true" />
            Allowed channels
          </h3>
          <ul>
            {allowed.length ? allowed.map((item) => <li key={item}>{item}</li>) : <li>Reviewer must confirm use channel.</li>}
          </ul>
        </div>
        <div className="is-blocked">
          <h3>
            <CircleAlert size={15} strokeWidth={2} aria-hidden="true" />
            Blocked until review
          </h3>
          <ul>
            {blocked.length ? blocked.map((item) => <li key={item}>{item}</li>) : <li>No blocked channel exported.</li>}
          </ul>
        </div>
      </div>
      <dl>
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function DamSourceTruthCard({
  role,
  resourceSpace,
  drive,
  derivative
}: {
  role: DemoRole;
  resourceSpace: ReactNode;
  drive: ReactNode;
  derivative: ReactNode;
}) {
  const admin = role === "DAM Admin";
  return (
    <section className="dam-source-truth-card" aria-label="Source of truth">
      <header>
        <LockKeyhole size={17} strokeWidth={1.9} aria-hidden="true" />
        <div>
          <h2>Source of truth</h2>
          <p>{admin ? "Operational source details are visible for DAM Admin." : "Viewer-safe source state. Originals remain managed by Media Team."}</p>
        </div>
      </header>
      <dl>
        <div>
          <dt>Metadata / review</dt>
          <dd>{resourceSpace}</dd>
        </div>
        <div>
          <dt>Master original</dt>
          <dd>{drive}</dd>
        </div>
        <div>
          <dt>Portal delivery</dt>
          <dd>{derivative}</dd>
        </div>
      </dl>
    </section>
  );
}

export function DamWorkflowPanel({
  state,
  reviewer,
  nextAction,
  blockers
}: {
  state?: ReactNode;
  reviewer?: ReactNode;
  nextAction: ReactNode;
  blockers: string[];
}) {
  return (
    <section className="dam-workflow-panel" aria-label="Workflow state">
      <header>
        <ShieldCheck size={17} strokeWidth={1.9} aria-hidden="true" />
        <div>
          <h2>Workflow</h2>
          <p>Approval remains tied to evidence, source, rights, and derivative readiness.</p>
        </div>
      </header>
      <dl>
        <div>
          <dt>Current state</dt>
          <dd>{state || "Review pending"}</dd>
        </div>
        <div>
          <dt>Assigned reviewer</dt>
          <dd>{reviewer || "Media Team"}</dd>
        </div>
        <div>
          <dt>Next safe action</dt>
          <dd>{nextAction}</dd>
        </div>
      </dl>
      <div className="dam-workflow-blockers">
        <strong>{blockers.length ? "Blocked reasons" : "Decision evidence"}</strong>
        <ul>
          {(blockers.length ? blockers : ["No active blockers exported. Keep visible verdict with downloaded media."]).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function DamVersionHistoryPanel({
  current,
  previous,
  replacement,
  changes
}: {
  current: ReactNode;
  previous?: ReactNode;
  replacement?: ReactNode;
  changes: string[];
}) {
  return (
    <section className="dam-version-history-panel" aria-label="Version and history">
      <header>
        <History size={17} strokeWidth={1.9} aria-hidden="true" />
        <div>
          <h2>Version and history</h2>
          <p>Use current approved copy. Older or replaced records must send users forward.</p>
        </div>
      </header>
      <dl>
        <div>
          <dt>Current approved version</dt>
          <dd>{current}</dd>
        </div>
        <div>
          <dt>Previous versions</dt>
          <dd>{previous || "No previous version exported"}</dd>
        </div>
        <div>
          <dt>Replacement asset</dt>
          <dd>{replacement || "No replacement linked"}</dd>
        </div>
      </dl>
      <ul>
        {changes.map((change) => <li key={change}>{change}</li>)}
      </ul>
    </section>
  );
}

export function DamBlockedActionNote({
  action,
  reason,
  nextStep
}: {
  action: string;
  reason: string;
  nextStep: string;
}) {
  return (
    <section className="dam-blocked-action-note" aria-label={`${action} blocked`}>
      <CircleAlert size={16} strokeWidth={2} aria-hidden="true" />
      <p>
        <strong>{action} blocked:</strong> {reason} <span>{nextStep}</span>
      </p>
    </section>
  );
}
