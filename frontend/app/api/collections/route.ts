import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { resolveAssetSelection } from "@/lib/asset-selection";
import { buildCollectionDraftPreviewPayload, collectionDraftPublicBlockedAssets, readCollectionDraftInput } from "@/lib/collection-drafts";
import { canUpload } from "@/lib/permissions";
import { requestIdentity } from "@/lib/request-identity";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const input = await readCollectionDraftInput(request);
  const identity = requestIdentity(request, input.role);
  const role = identity.role;

  if (!canUpload(role)) {
    appendAuditEvent({
      type: "collection_draft_denied",
      role,
      actor: identity.id,
      status: "denied",
      summary: "Collection draft denied for role.",
      details: { assetCount: input.requestedIds.length, audience: input.audience }
    });
    return NextResponse.json({ error: "Collection drafts require Contributor, Reviewer, or DAM Admin role." }, { status: 403 });
  }
  if (!input.requestedIds.length) {
    return NextResponse.json({ error: "Select at least one asset for the collection." }, { status: 400 });
  }

  const selection = await resolveAssetSelection(input.requestedIds, role);
  if (selection.missingIds.length) {
    return NextResponse.json({ error: "One or more selected assets were not found.", missingCount: selection.missingIds.length }, { status: 404 });
  }
  if (selection.hiddenAssets.length) {
    return NextResponse.json({ error: "This role cannot add one or more selected assets to a collection draft." }, { status: 403 });
  }

  const portalBlockedAssets = collectionDraftPublicBlockedAssets(input.audience, selection.assets);
  const blockedPublic = portalBlockedAssets.length > 0;

  appendAuditEvent({
    type: "collection_draft_previewed",
    role,
    actor: identity.id,
    status: blockedPublic ? "blocked" : "preview",
    summary: blockedPublic ? "Collection draft previewed with public gate blocked." : "Collection draft previewed.",
    details: {
      title: input.title,
      audience: input.audience,
      assetCount: selection.assets.length,
      blockedPublic,
      blockedAssetIds: portalBlockedAssets.map((asset) => asset.id)
    }
  });

  return NextResponse.json(buildCollectionDraftPreviewPayload(input, selection.assets, portalBlockedAssets));
}
