import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { decideAccess } from "@/lib/access-decisions";
import { assetResourceRef } from "@/lib/asset-refs";
import { getAssetRecordById } from "@/lib/catalog";
import { createDamRouteSession } from "@/lib/dam-route-session";
import { hasApprovedCopyDerivative, readApprovedCopyDelivery, readDownloadGateInput } from "@/lib/media-delivery";
import { canDownloadApprovedCopy } from "@/lib/permissions";
import { normalizeAssetId } from "@/lib/request-validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = normalizeAssetId((await params).id);
  const session = createDamRouteSession(request, request.nextUrl.searchParams.get("role"));
  const role = session.role;
  if (!id) {
    return NextResponse.json({ error: "Malformed asset id." }, { status: 400 });
  }
  const { asset, source } = await getAssetRecordById(id);
  const envelope = session.sourceEnvelope(source);
  const auditSource = envelope.source;

  if (!asset) {
    return NextResponse.json({ error: "Asset not found", ...envelope }, { status: 404 });
  }
  if (!canDownloadApprovedCopy(role, asset)) {
    const resourceSpaceId = assetResourceRef(asset);
    appendAuditEvent({
      type: "denied_download",
      role,
      actor: session.identity.id,
      assetId: asset.id,
      resourceSpaceId,
      status: "denied",
      summary: "Approved copy download denied; original/master remains restricted.",
      details: { source: auditSource.label, sourceDetail: auditSource.detail, assetStatus: asset.status }
    });
    return NextResponse.json(
      {
        error: "Not approved for this role. Source-file access stays restricted.",
        ...envelope
      },
      { status: 403 }
    );
  }

  const delivery = readApprovedCopyDelivery(id, asset.title);
  if (delivery.status !== "ready") {
    return NextResponse.json(
      {
        error: delivery.status === "missing-derivative"
          ? "Approved derivative not available in local filestore."
          : "Approved derivative is indexed but unavailable.",
        ...envelope
      },
      { status: 404 }
    );
  }
  const resourceSpaceId = assetResourceRef(asset);
  appendAuditEvent({
    type: "approved_download",
    role,
    actor: session.identity.id,
    assetId: asset.id,
    resourceSpaceId,
    status: "allowed",
    summary: "Approved copy downloaded.",
    details: { source: auditSource.label, sourceDetail: auditSource.detail, fileName: delivery.fileName }
  });
  return new NextResponse(delivery.image.bytes, {
    headers: {
      "Content-Type": delivery.image.contentType,
      "Content-Disposition": `attachment; filename="${delivery.fileName}"`,
      "Cache-Control": "no-store"
    }
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = normalizeAssetId((await params).id);
  const input = await readDownloadGateInput(request);
  const session = createDamRouteSession(request, input.role);
  const role = session.role;
  if (!id) {
    return NextResponse.json({ allowed: false, error: "Malformed asset id." }, { status: 400 });
  }

  const { asset, source } = await getAssetRecordById(id);
  const envelope = session.sourceEnvelope(source);
  const auditSource = envelope.source;

  if (!asset) {
    return NextResponse.json({ allowed: false, reason: "Asset not found", ...envelope }, { status: 404 });
  }

  const access = decideAccess(role, "downloadApprovedCopy", asset);
  const resourceSpaceId = assetResourceRef(asset);
  session.recordUsage({
    type: "download_gate",
    assetId: asset.id,
    resourceSpaceId,
    route: `/api/download/${asset.id}`,
    metadata: { termsAccepted: input.termsAccepted, variant: input.variant }
  });
  const derivativeAvailable = hasApprovedCopyDerivative(id);

  if (!input.termsAccepted) {
    appendAuditEvent({
      type: "download_gate_checked",
      role,
      actor: session.identity.id,
      assetId: asset.id,
      resourceSpaceId,
      status: "blocked",
      summary: "Download gate blocked because usage terms were not accepted.",
      details: {
        source: auditSource.label,
        assetStatus: asset.status,
        usageChannel: input.usageChannel,
        reason: input.reason
      }
    });
    return NextResponse.json(
      {
        allowed: false,
        requiredAction: "accept-usage-terms",
        reason: "Accept the approved-copy usage terms before download.",
        ...envelope
      },
      { status: 403 }
    );
  }

  if (!access.allowed || !canDownloadApprovedCopy(role, asset)) {
    appendAuditEvent({
      type: "denied_download",
      role,
      actor: session.identity.id,
      assetId: asset.id,
      resourceSpaceId,
      status: "denied",
      summary: "Download gate denied approved copy.",
      details: {
        source: auditSource.label,
        assetStatus: asset.status,
        reasonCodes: access.reasonCodes || [],
        accessReason: access.reason || null,
        usageChannel: input.usageChannel
      }
    });
    return NextResponse.json(
      {
        allowed: false,
        requiredAction: asset.status === "Needs Review" ? "request-approval" : "review-rights-and-permissions",
        reason: access.reason || "This asset is not approved for this role.",
        label: access.label || "Download blocked",
        reasonCodes: access.reasonCodes || [],
        ...envelope
      },
      { status: 403 }
    );
  }

  if (!derivativeAvailable) {
    appendAuditEvent({
      type: "download_gate_checked",
      role,
      actor: session.identity.id,
      assetId: asset.id,
      resourceSpaceId,
      status: "blocked",
      summary: "Download gate blocked because approved derivative is unavailable.",
      details: {
        source: auditSource.label,
        assetStatus: asset.status,
        usageChannel: input.usageChannel
      }
    });
    return NextResponse.json(
      {
        allowed: false,
        requiredAction: "generate-approved-derivative",
        reason: "Approved derivative is not available yet. Source/master access remains restricted.",
        ...envelope
      },
      { status: 404 }
    );
  }

  const audit = appendAuditEvent({
    type: "download_gate_checked",
    role,
    actor: session.identity.id,
    assetId: asset.id,
    resourceSpaceId,
    status: "allowed",
    summary: "Download gate approved an approved-copy URL.",
    details: {
      source: auditSource.label,
      assetStatus: asset.status,
      variant: input.variant,
      usageChannel: input.usageChannel,
      reason: input.reason
    }
  });

  return NextResponse.json({
    allowed: true,
    downloadUrl: `/api/download/${encodeURIComponent(asset.id)}?role=${encodeURIComponent(role)}&variant=${encodeURIComponent(input.variant)}`,
    auditId: audit.id,
    ...envelope,
    message: "Approved copy is available through backend gate. Private originals and S3 paths are not exposed."
  });
}
