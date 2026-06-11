import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { getAssetRecordById } from "@/lib/catalog";
import { canReview } from "@/lib/permissions";
import { requestIdentity } from "@/lib/request-identity";
import { normalizeAssetIds, readJsonObject } from "@/lib/request-validation";

export const dynamic = "force-dynamic";

const supportedActions = new Set(["request-review", "mark-internal", "archive"]);

export async function POST(request: NextRequest) {
  const body = await readJsonObject<{
    role?: string;
    action?: string;
    assetIds?: string[];
  }>(request);
  const identity = requestIdentity(request, body.role);
  const role = identity.role;
  const assetIds = normalizeAssetIds(body.assetIds);

  if (!canReview(role)) {
    appendAuditEvent({
      type: "batch_action_denied",
      role,
      actor: identity.id,
      status: "denied",
      summary: "Batch governance action denied for role.",
      details: { action: body.action || null, assetCount: assetIds.length }
    });
    return NextResponse.json({ error: "Bulk review actions require reviewer access." }, { status: 403 });
  }
  if (!body.action || !supportedActions.has(body.action)) {
    return NextResponse.json({ error: "Unsupported batch action." }, { status: 400 });
  }
  if (!assetIds.length) {
    return NextResponse.json({ error: "Select at least one asset." }, { status: 400 });
  }

  const records = await Promise.all(assetIds.map((id) => getAssetRecordById(id)));
  const found = records.filter((item) => item.asset).map((item) => item.asset!);
  const missing = assetIds.filter((id) => !found.some((asset) => asset.id === id));
  if (missing.length) {
    return NextResponse.json({ error: "One or more selected assets were not found.", missingCount: missing.length }, { status: 404 });
  }

  const timestamp = new Date().toISOString();

  appendAuditEvent({
    type: "batch_action_previewed",
    role,
    actor: identity.id,
    status: "preview",
    summary: "Batch governance action previewed; no production media-library write performed.",
    details: { action: body.action, assetCount: found.length }
  });

  return NextResponse.json({
    ok: false,
    mode: "review-preview",
    action: body.action,
    count: found.length,
    auditRecords: found.map((asset) => ({
      assetId: asset.id,
      resourceSpaceId: asset.resourceSpaceId || asset.id,
      previousStatus: asset.status,
      requestedAction: body.action,
      reviewerRole: role,
      timestamp
    })),
    message: `Batch action preview ready for ${found.length} asset${found.length === 1 ? "" : "s"}: ${body.action.replace("-", " ")}. Sharing stays paused until each selected item is reviewed and cleared.`
  });
}
