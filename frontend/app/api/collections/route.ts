import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { getAssetRecordById } from "@/lib/catalog";
import { assetIsPortalReady, assetNeedsStaleApprovalReview } from "@/lib/asset-governance";
import { canSeeAsset, canUpload } from "@/lib/permissions";
import { requestIdentity } from "@/lib/request-identity";
import { normalizeAssetIds, normalizeCollectionDraftAudience, normalizeCollectionShareSlug, normalizeDateField, normalizeDisplayTextField, readJsonObject } from "@/lib/request-validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await readJsonObject<{
    role?: string;
    assetIds?: string[];
    title?: string;
    audience?: string;
    expiry?: string;
    owner?: string;
  }>(request);
  const identity = requestIdentity(request, body.role);
  const role = identity.role;
  const assetIds = normalizeAssetIds(body.assetIds);
  const audience = normalizeCollectionDraftAudience(body.audience);
  const title = normalizeDisplayTextField(body.title, "Untitled ministry collection", 100);
  const expiry = normalizeDateField(body.expiry);

  if (!canUpload(role)) {
    appendAuditEvent({
      type: "collection_draft_denied",
      role,
      actor: identity.id,
      status: "denied",
      summary: "Collection draft denied for role.",
      details: { assetCount: assetIds.length, audience }
    });
    return NextResponse.json({ error: "Collection drafts require Contributor, Reviewer, or DAM Admin role." }, { status: 403 });
  }
  if (!assetIds.length) {
    return NextResponse.json({ error: "Select at least one asset for the collection." }, { status: 400 });
  }

  const records = await Promise.all(assetIds.map((id) => getAssetRecordById(id)));
  const found = records.filter((item) => item.asset).map((item) => item.asset!);
  const missing = assetIds.filter((id) => !found.some((asset) => asset.id === id));
  if (missing.length) {
    return NextResponse.json({ error: "One or more selected assets were not found.", missingCount: missing.length }, { status: 404 });
  }
  const hidden = found.filter((asset) => !canSeeAsset(role, asset));
  if (hidden.length) {
    return NextResponse.json({ error: "This role cannot add one or more selected assets to a collection draft." }, { status: 403 });
  }

  const portalBlockedAssets = audience === "Public-approved portal"
    ? found.filter((asset) => !assetIsPortalReady(asset) || assetNeedsStaleApprovalReview(asset))
    : [];
  const blockedPublic = portalBlockedAssets.length > 0;

  appendAuditEvent({
    type: "collection_draft_previewed",
    role,
    actor: identity.id,
    status: blockedPublic ? "blocked" : "preview",
    summary: blockedPublic ? "Collection draft previewed with public gate blocked." : "Collection draft previewed.",
    details: {
      title,
      audience,
      assetCount: found.length,
      blockedPublic,
      blockedAssetIds: portalBlockedAssets.map((asset) => asset.id)
    }
  });

  return NextResponse.json({
    ok: false,
    mode: "review-preview",
    title,
    state: blockedPublic ? "private draft - sharing blocked" : audience,
    owner: normalizeDisplayTextField(body.owner, "Ministry media", 80),
    expiry: expiry || null,
    assetCount: found.length,
    sharePath: `/collections/${normalizeCollectionShareSlug(title)}`,
    sharingBlocked: blockedPublic,
    reuseReadiness: {
      ready: found.length - portalBlockedAssets.length,
      blocked: portalBlockedAssets.length,
      blockedReferences: portalBlockedAssets.map((asset) => asset.id)
    },
    message: blockedPublic
      ? `Collection draft preview ready with ${found.length} asset${found.length === 1 ? "" : "s"}. External sharing stays blocked until every item clears approval, source, rights, people, and safe-copy checks.`
      : `Collection draft preview ready with ${found.length} asset${found.length === 1 ? "" : "s"} for ${audience}. Sharing stays paused until each item is reviewed and cleared.`
  });
}
