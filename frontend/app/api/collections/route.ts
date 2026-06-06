import { NextRequest, NextResponse } from "next/server";
import { getAssetRecordById } from "@/lib/catalog";
import { assetIsPortalReady, assetNeedsStaleApprovalReview } from "@/lib/asset-governance";
import { canSeeAsset, canUpload, normalizeRole } from "@/lib/permissions";
import { normalizeAssetIds, normalizeTextField } from "@/lib/request-validation";

export const dynamic = "force-dynamic";

const allowedAudiences = new Set(["Private draft", "Internal ministry", "Public-approved portal"]);

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "collection-draft";
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    role?: string;
    assetIds?: string[];
    title?: string;
    audience?: string;
    expiry?: string;
    owner?: string;
  };
  const role = normalizeRole(body.role);
  const assetIds = normalizeAssetIds(body.assetIds);
  const audience = allowedAudiences.has(body.audience || "") ? body.audience! : "Private draft";
  const title = normalizeTextField(body.title, "Untitled ministry collection", 100);

  if (!canUpload(role)) {
    return NextResponse.json({ error: "Collection drafts require Contributor, Reviewer, or DAM Admin role." }, { status: 403 });
  }
  if (!assetIds.length) {
    return NextResponse.json({ error: "Select at least one asset for the collection." }, { status: 400 });
  }

  const records = await Promise.all(assetIds.map((id) => getAssetRecordById(id)));
  const found = records.filter((item) => item.asset).map((item) => item.asset!);
  const missing = assetIds.filter((id) => !found.some((asset) => asset.id === id));
  if (missing.length) {
    return NextResponse.json({ error: "One or more selected assets were not found.", missing }, { status: 404 });
  }
  const hidden = found.filter((asset) => !canSeeAsset(role, asset));
  if (hidden.length) {
    return NextResponse.json({ error: "This role cannot add one or more selected assets to a collection draft." }, { status: 403 });
  }

  const portalBlockedAssets = audience === "Public-approved portal"
    ? found.filter((asset) => !assetIsPortalReady(asset) || assetNeedsStaleApprovalReview(asset))
    : [];
  const blockedPublic = portalBlockedAssets.length > 0;

  return NextResponse.json({
    ok: false,
    mode: "server-route-contract",
    title,
    state: blockedPublic ? "private draft - public gate blocked" : audience,
    owner: normalizeTextField(body.owner, "Ministry media", 80),
    expiry: body.expiry || null,
    assetCount: found.length,
    sharePath: `/collections/${slugify(title)}`,
    blockedPublic,
    portalReadiness: {
      ready: found.length - portalBlockedAssets.length,
      blocked: portalBlockedAssets.length,
      blockedAssetIds: portalBlockedAssets.map((asset) => asset.id)
    },
    message: blockedPublic
      ? `Collection draft preview ready with ${found.length} asset${found.length === 1 ? "" : "s"}. Public portal blocked until every asset is portal-ready with current approval, source, rights, people, and derivatives.`
      : `Collection draft preview ready with ${found.length} asset${found.length === 1 ? "" : "s"} for ${audience}. Persistence/share links need ResourceSpace portal mapping.`
  });
}
