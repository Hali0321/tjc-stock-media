import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { resolveAssetSelection } from "@/lib/asset-selection";
import { buildBatchActionPreviewPayload, readBatchActionInput } from "@/lib/batch-actions";
import { canReview } from "@/lib/permissions";
import { requestIdentity } from "@/lib/request-identity";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const input = await readBatchActionInput(request);
  const identity = requestIdentity(request, input.role);
  const role = identity.role;

  if (!canReview(role)) {
    appendAuditEvent({
      type: "batch_action_denied",
      role,
      actor: identity.id,
      status: "denied",
      summary: "Batch governance action denied for role.",
      details: { action: input.requestedAction || null, assetCount: input.requestedIds.length }
    });
    return NextResponse.json({ error: "Bulk review actions require reviewer access." }, { status: 403 });
  }
  if (!input.action) {
    return NextResponse.json({ error: "Unsupported batch action." }, { status: 400 });
  }
  if (!input.requestedIds.length) {
    return NextResponse.json({ error: "Select at least one asset." }, { status: 400 });
  }

  const selection = await resolveAssetSelection(input.requestedIds);
  if (selection.missingIds.length) {
    return NextResponse.json({ error: "One or more selected assets were not found.", missingCount: selection.missingIds.length }, { status: 404 });
  }

  const timestamp = new Date().toISOString();

  appendAuditEvent({
    type: "batch_action_previewed",
    role,
    actor: identity.id,
    status: "preview",
    summary: "Batch governance action previewed; no production media-library write performed.",
    details: { action: input.action, assetCount: selection.assets.length }
  });

  return NextResponse.json(buildBatchActionPreviewPayload({ action: input.action, assets: selection.assets, role, timestamp }));
}
