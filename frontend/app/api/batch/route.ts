import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { resolveAssetSelection } from "@/lib/asset-selection";
import {
  batchActionDeniedAuditEvent,
  batchActionForPreview,
  batchActionInputValidationError,
  batchActionPreviewAuditEvent,
  batchActionRoleDeniedError,
  batchActionSelectionValidationError,
  buildBatchActionPreviewPayload,
  readBatchActionInput
} from "@/lib/batch-actions";
import { canReview } from "@/lib/permissions";
import { requestIdentity } from "@/lib/request-identity";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const input = await readBatchActionInput(request);
  const identity = requestIdentity(request, input.role);
  const role = identity.role;

  if (!canReview(role)) {
    appendAuditEvent(batchActionDeniedAuditEvent(input, role, identity.id));
    const denied = batchActionRoleDeniedError();
    return NextResponse.json(denied.body, { status: denied.status });
  }
  const inputError = batchActionInputValidationError(input);
  if (inputError) {
    return NextResponse.json(inputError.body, { status: inputError.status });
  }

  const selection = await resolveAssetSelection(input.requestedIds);
  const selectionError = batchActionSelectionValidationError(selection);
  if (selectionError) {
    return NextResponse.json(selectionError.body, { status: selectionError.status });
  }

  const timestamp = new Date().toISOString();
  const action = batchActionForPreview(input);

  appendAuditEvent(batchActionPreviewAuditEvent(action, selection.assets.length, role, identity.id));

  return NextResponse.json(buildBatchActionPreviewPayload({ action, assets: selection.assets, role, timestamp }));
}
