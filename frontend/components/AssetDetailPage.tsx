"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, History, Search } from "lucide-react";
import { MediaPreview } from "@/components/MediaPreview";
import { DamEmptyState as EmptyState, DamPrimaryAction as PrimaryAction } from "@/components/dam/DamWorkspace";
import { DamProtectedPreview as ProtectedPreview, DamRecordMetadataRow as RecordMetadataRow, DamRecordMetadataSection as RecordMetadataSection, DamVerdictPanel as VerdictPanel } from "@/components/dam/DamRecord";
import { AssetActionsMenu } from "@/components/AssetActionsMenu";
import { useDemoRole } from "@/components/RoleProvider";
import { decideAccess } from "@/lib/access-decisions";
import { assetGovernancePassport } from "@/lib/asset-governance";
import { assetPresentation, collectionImageUrl, detailImageUrl, provenanceSummary } from "@/lib/presentation";
import { requestReviewMailto, viewerVerdictForAsset } from "@/lib/viewer-verdict";
import type { DemoRole, MediaSourceStatus, StockMediaAsset } from "@/lib/types";
import { cn } from "@/lib/ui";

type DetailResponse = {
  asset: StockMediaAsset;
  source: MediaSourceStatus;
  related: StockMediaAsset[];
  resourceSpaceUrl?: string | null;
};

function FieldList({ items }: { items: Array<{ label: string; value?: string }> }) {
  return (
    <dl className="grid gap-3">
      {items.map((item) => (
        <RecordMetadataRow label={item.label} value={item.value} key={item.label} />
      ))}
    </dl>
  );
}

function RelatedMedia({ assets, role }: { assets: StockMediaAsset[]; role: DemoRole }) {
  if (!assets.length) return null;
  const deduped = assets.reduce<StockMediaAsset[]>((items, asset) => {
    const title = assetPresentation(asset, role).title.toLowerCase();
    if (items.some((item) => assetPresentation(item, role).title.toLowerCase() === title)) return items;
    return [...items, asset];
  }, []);
  const visible = (deduped.length ? deduped : assets).slice(0, 4);
  return (
    <section className="grid gap-3" aria-label="Related media">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-black text-tjc-ink">Related media</h2>
          <p className="mt-1 text-sm font-semibold text-tjc-muted">Open each record to confirm its own approval.</p>
        </div>
        {assets.length > visible.length ? <span className="text-xs font-black text-tjc-muted">{assets.length - visible.length} more in package</span> : null}
      </div>
      <div className="related-media-strip grid gap-2">
        {visible.map((asset) => {
          const imageUrl = collectionImageUrl(asset, role);
          const display = assetPresentation(asset, role);
          return (
            <Link href={`/assets/${asset.id}`} className="group grid min-h-24 grid-cols-[6rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[10px] border border-[#e5e7eb] bg-white p-2 transition hover:border-[#cbd5e1] hover:bg-[#fbfcfb]" key={asset.id}>
              <span className="block aspect-[4/3] overflow-hidden rounded-[8px] bg-[#e9efeb]">
                <MediaPreview src={imageUrl} alt={asset.thumbnailAlt} label="Preview protected" detail="Open record for guidance" imgClassName="transition duration-300 group-hover:scale-[1.025]" />
              </span>
              <span className="min-w-0">
                <strong className="line-clamp-2 text-sm font-black leading-tight text-tjc-ink">{display.title}</strong>
                <span className="mt-1 line-clamp-1 text-xs font-semibold text-tjc-muted">{display.cardSubtitle}</span>
                <span className="mt-1 block text-xs font-black text-tjc-evergreen">Open media record</span>
              </span>
              <span className="hidden rounded-md border border-[#d6dfd8] px-2 py-1 text-xs font-black text-tjc-muted sm:inline-flex">Record</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function TagSection({ asset }: { asset: StockMediaAsset }) {
  const tags = Array.from(new Set([...(asset.usageTerms || []), ...(asset.tags || []), ...(asset.tjcTerms || [])])).slice(0, 18);
  if (!tags.length) return null;
  return (
    <section className="grid gap-3 rounded-[12px] border border-[#e5e7eb] bg-white p-4" aria-label="Tags">
      <h2 className="text-xl font-black text-tjc-ink">Tags</h2>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <span className="rounded-md bg-[#eef4f0] px-3 py-1.5 text-xs font-black text-[#415149]" key={`${tag}-${index}`}>{tag}</span>
        ))}
      </div>
    </section>
  );
}

function OpsDetails({
  asset,
  role,
  resourceSpaceUrl
}: {
  asset: StockMediaAsset;
  role: DemoRole;
  resourceSpaceUrl: string | null;
}) {
  const passport = assetGovernancePassport(asset);
  const canOpenResourceSpace = decideAccess(role, "viewResourceSpaceAdminLink", asset).allowed;
  const canSeeOriginal = decideAccess(role, "viewOriginalMetadata", asset).allowed;
  return (
    <section className="grid gap-3" aria-label="Reviewer and admin details">
      <details className="rounded-[12px] border border-[#e5e7eb] bg-white p-4">
        <summary className="cursor-pointer text-sm font-black text-tjc-evergreen">Reviewer/Admin source truth</summary>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <FieldList
            items={[
              { label: "ResourceSpace source", value: asset.sourceSystem || asset.sourcePlatform || "ResourceSpace export" },
              { label: "ResourceSpace ID", value: asset.resourceSpaceId || asset.id },
              { label: "Raw status", value: asset.status },
              { label: "Workflow state", value: asset.workflowState || "Not exported" },
              { label: "Source/original path", value: canSeeOriginal ? asset.sourcePath || asset.masterDrivePath : "Restricted for this role" },
              { label: "Pending write status", value: asset.pendingReviewWrite ? `${asset.pendingReviewWrite.requestedStatus} / ${asset.pendingReviewWrite.syncState}` : "None queued" }
            ]}
          />
          <div className="grid gap-3">
            <div className={cn("rounded-[10px] border p-4", passport.portalReady ? "border-[#b9d8c6] bg-[#eef8f2] text-[#194f34]" : "border-[#e5cf93] bg-[#fff8e8] text-[#71500f]")}>
              <strong className="block text-sm font-black">Launch readiness evidence</strong>
              <span className="mt-2 block text-3xl font-black tabular-nums">{passport.score}%</span>
              <span className="mt-1 block text-sm font-semibold">{passport.decision}</span>
            </div>
            <AssetActionsMenu asset={asset} resourceSpaceUrl={resourceSpaceUrl} canOpenResourceSpace={canOpenResourceSpace} canExposeResourceSpaceId label="Source actions" />
          </div>
        </div>
      </details>
      <details className="rounded-[12px] border border-[#e5e7eb] bg-white p-4">
        <summary className="cursor-pointer text-sm font-black text-tjc-evergreen">Audit and decision history</summary>
        <div className="mt-4 grid gap-2">
          {passport.auditTrail.map((item) => (
            <div className={cn("grid grid-cols-[auto_1fr] gap-3 rounded-[10px] border p-3", item.tone === "ok" ? "border-[#b9d8c6] bg-[#eef8f2] text-[#194f34]" : "border-[#e5cf93] bg-[#fff8e8] text-[#71500f]")} key={`${item.event}-${item.date}`}>
              <History size={16} strokeWidth={1.9} aria-hidden="true" />
              <span>
                <strong className="block text-sm font-black">{item.event}</strong>
                <span className="mt-1 block text-xs font-semibold">{item.actor} / {item.date}</span>
                <span className="mt-1 block text-sm font-semibold leading-snug">{item.detail}</span>
              </span>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}

export function AssetDetailPage({ id }: { id: string }) {
  const { role, ready } = useDemoRole();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setError("");
    fetch(`/api/assets/${id}?role=${encodeURIComponent(role)}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load media record.");
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

  const opsView = role === "Reviewer" || role === "DAM Admin";
  const canOpenResourceSpace = data?.asset ? decideAccess(role, "viewResourceSpaceAdminLink", data.asset).allowed : false;

  const content = useMemo(() => {
    if (!data) return null;
    const { asset } = data;
    const display = assetPresentation(asset, role);
    const verdict = viewerVerdictForAsset(asset, role);
    const provenance = provenanceSummary(asset, role);
    return { asset, display, verdict, provenance, preview: detailImageUrl(asset, role) };
  }, [data, role]);

  if (error) {
    return (
      <div className="dam-shell">
        <PrimaryAction href="/" tone="secondary" icon={ArrowLeft}>Back to Find</PrimaryAction>
        <div className="mt-4">
          <EmptyState title="Media record did not load" description={error} primary={<PrimaryAction href="/" icon={Search}>Find approved media</PrimaryAction>} />
        </div>
      </div>
    );
  }

  if (!content || !data) {
    return (
      <div className="dam-shell">
        <div className="skeleton h-[72dvh] rounded-[14px]" />
      </div>
    );
  }

  const { asset, display, verdict, provenance, preview } = content;
  const requestHref = requestReviewMailto(asset);
  const previewStripItems = [asset, ...data.related].slice(0, 5).map((item, index) => ({
    item,
    index,
    imageUrl: index === 0 ? preview : collectionImageUrl(item, role)
  })).filter((item) => item.imageUrl);

  return (
    <div className="dam-shell grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PrimaryAction href="/" tone="secondary" icon={ArrowLeft}>Back to Find</PrimaryAction>
        <AssetActionsMenu asset={asset} resourceSpaceUrl={data.resourceSpaceUrl ?? null} canOpenResourceSpace={canOpenResourceSpace} canExposeResourceSpaceId={opsView} label={opsView ? "Asset actions" : "Record actions"} />
      </div>

      <section className="asset-record-layout grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,.85fr)] xl:items-start" aria-label="Media record decision">
        <div className="grid gap-4">
          <div className="record-preview-stage overflow-hidden rounded-[14px] border border-[#d7dde2] bg-[#e9efeb]">
            <div className="grid min-h-[18rem] sm:aspect-[16/10]">
              {preview ? (
                <MediaPreview src={preview} alt={asset.thumbnailAlt} label="Preview available" detail={display.cardSubtitle} loading="eager" />
              ) : (
                <ProtectedPreview label="Preview protected" detail={verdict.reason} className="asset-detail-protected-preview h-full rounded-none" />
              )}
            </div>
          </div>
          {previewStripItems.length > 1 ? (
          <div className="hidden grid-cols-2 gap-2 sm:grid sm:grid-cols-5">
            {previewStripItems.map(({ item, index, imageUrl }) => {
              return (
                <Link
                  href={`/assets/${item.id}`}
                  className={cn("block aspect-[4/3] overflow-hidden rounded-[10px] border border-[#d7dde2] bg-[#e9efeb]", index === 0 && "ring-2 ring-[#9cb9ab]")}
                  key={`${item.id}-${index}`}
                  aria-label={index === 0 ? "Current media record" : `Open related media ${assetPresentation(item, role).title}`}
                >
                  <MediaPreview src={imageUrl || undefined} alt={item.thumbnailAlt} label="Preview protected" detail="Open record for guidance" />
                </Link>
              );
            })}
          </div>
          ) : null}
        </div>

        <aside className="record-verdict-rail grid gap-4 xl:sticky xl:top-[calc(var(--app-header-height)+1rem)]">
          <div>
            <h1 className="text-3xl font-black leading-[1.05] text-tjc-ink sm:text-4xl">{display.title}</h1>
            <p className="mt-3 max-w-[64ch] text-base font-semibold leading-relaxed text-tjc-muted">{opsView ? provenance.publicLabel : asset.eventName || asset.collection}</p>
          </div>
          <VerdictPanel
            verdict={verdict}
            requestHref={requestHref}
            onRequestReview={() => {
              window.location.href = requestHref;
            }}
          />
        </aside>
      </section>

      <section className="record-metadata-grid grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,.45fr)]" aria-label="Use guidance">
        <div className="grid gap-4">
          <RecordMetadataSection title="Use guidance" className="scroll-mt-28" >
              <FieldList items={display.guidanceFacts.map((fact) => ({ label: fact.label, value: fact.value }))} />
          </RecordMetadataSection>

          <RecordMetadataSection title="Credit" className="scroll-mt-28">
            <p className="mt-2 text-sm font-semibold leading-relaxed text-tjc-muted">{asset.rightsNotes?.toLowerCase().includes("credit") ? asset.rightsNotes : "Credit not required unless noted by reviewer."}</p>
          </RecordMetadataSection>

          <RecordMetadataSection title="People/youth note">
            <p className="mt-2 text-sm font-semibold leading-relaxed text-tjc-muted">
              {asset.peopleRisk === "Possible minors"
                ? "People or youth may be visible. Review is required before public reuse."
                : asset.peopleRisk && asset.peopleRisk !== "Unknown"
                  ? asset.peopleRisk
                  : "People visibility has not been confirmed. Request review before public reuse."}
            </p>
          </RecordMetadataSection>

          <RelatedMedia assets={data.related} role={role} />
        </div>

        <aside className="grid gap-4">
          <RecordMetadataSection title="Media source">
              <FieldList
                items={[
                  { label: "Event / package", value: asset.eventName || asset.collection },
                  { label: "Credit/source guidance", value: asset.sourceAccount || "Provided by media team" },
                  { label: opsView ? "ResourceSpace ID" : "Reference code", value: opsView ? asset.resourceSpaceId || asset.id : asset.id },
                  { label: "Source file", value: verdict.canDownload ? "Use approved copy. Source-file access stays restricted." : "Restricted until approved access is granted." }
                ]}
              />
          </RecordMetadataSection>
          <TagSection asset={asset} />
        </aside>
      </section>

      {opsView ? <OpsDetails asset={asset} role={role} resourceSpaceUrl={data.resourceSpaceUrl ?? null} /> : null}
    </div>
  );
}
