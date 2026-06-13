import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { resolveAssetSelection } from "@/lib/asset-selection";
import {
  buildCollectionDraftPreviewPayload,
  collectionDraftDeniedAuditEvent,
  collectionDraftInputValidationError,
  collectionDraftPreviewAuditEvent,
  collectionDraftPublicBlockedAssets,
  collectionDraftRoleDeniedError,
  collectionDraftSelectionValidationError,
  readCollectionDraftInput
} from "@/lib/collection-drafts";
import { canUpload } from "@/lib/permissions";
import { requestIdentity } from "@/lib/request-identity";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const input = await readCollectionDraftInput(request);
  const identity = requestIdentity(request, input.role);
  const role = identity.role;

  if (!canUpload(role)) {
    appendAuditEvent(collectionDraftDeniedAuditEvent(input, role, identity.id));
    const denied = collectionDraftRoleDeniedError();
    return NextResponse.json(denied.body, { status: denied.status });
  }
  const inputError = collectionDraftInputValidationError(input);
  if (inputError) {
    return NextResponse.json(inputError.body, { status: inputError.status });
  }

  const selection = await resolveAssetSelection(input.requestedIds, role);
  const selectionError = collectionDraftSelectionValidationError(selection);
  if (selectionError) {
    return NextResponse.json(selectionError.body, { status: selectionError.status });
  }

  const portalBlockedAssets = collectionDraftPublicBlockedAssets(input.audience, selection.assets);

  appendAuditEvent(collectionDraftPreviewAuditEvent(input, selection.assets, portalBlockedAssets, role, identity.id));

  return NextResponse.json(buildCollectionDraftPreviewPayload(input, selection.assets, portalBlockedAssets));
}
