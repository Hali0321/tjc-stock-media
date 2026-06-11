import fs from "node:fs";
import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { decideAccess } from "@/lib/access-decisions";
import { getAssetRecordById } from "@/lib/catalog";
import { createDamRouteSession } from "@/lib/dam-route-session";
import { findFilestoreDerivative } from "@/lib/media-source";
import { canDownloadApprovedCopy } from "@/lib/permissions";
import { safeSlugText } from "@/lib/persisted-record-safety";
import { normalizeAssetId, normalizeDisplayTextField } from "@/lib/request-validation";

export const dynamic = "force-dynamic";

type DownloadGateBody = {
  role?: string;
  variant?: string;
  usageChannel?: string;
  reason?: string;
  termsAccepted?: boolean;
};

function normalizeDownloadVariant(value: unknown) {
  return value === "download" ? "download" : "download";
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = normalizeAssetId((await params).id);
  const session = createDamRouteSession(request, request.nextUrl.searchParams.get("role"));
  const role = session.role;
  if (!id) {
    return NextResponse.json({ error: "Malformed asset id." }, { status: 400 });
  }
  const { asset, source } = await getAssetRecordById(id);
  const envelope = session.sourceEnvelope(source);

  if (!asset) {
    return NextResponse.json({ error: "Asset not found", ...envelope }, { status: 404 });
  }
  if (!canDownloadApprovedCopy(role, asset)) {
    appendAuditEvent({
      type: "denied_download",
      role,
      actor: session.identity.id,
      assetId: asset.id,
      resourceSpaceId: asset.resourceSpaceId || asset.id,
      status: "denied",
      summary: "Approved copy download denied; original/master remains restricted.",
      details: { source: source.label, sourceDetail: source.detail, assetStatus: asset.status }
    });
    return NextResponse.json(
      {
        error: "Not approved for this role. Source-file access stays restricted.",
        ...envelope
      },
      { status: 403 }
    );
  }

  const filePath = findFilestoreDerivative(id, "download");
  if (!filePath) {
    return NextResponse.json({ error: "Approved derivative not available in local filestore.", ...envelope }, { status: 404 });
  }

  try {
    const bytes = fs.readFileSync(filePath);
    const safeTitle = safeSlugText(normalizeDisplayTextField(asset.title, "", 80), 80) || `asset-${id}`;
    appendAuditEvent({
      type: "approved_download",
      role,
      actor: session.identity.id,
      assetId: asset.id,
      resourceSpaceId: asset.resourceSpaceId || asset.id,
      status: "allowed",
      summary: "Approved copy downloaded.",
      details: { source: source.label, sourceDetail: source.detail, fileName: `${safeTitle}-approved-copy.jpg` }
    });
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="${safeTitle}-approved-copy.jpg"`,
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return NextResponse.json({ error: "Approved derivative is indexed but unavailable.", ...envelope }, { status: 404 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = normalizeAssetId((await params).id);
  const body = (await request.json().catch(() => ({}))) as DownloadGateBody;
  const session = createDamRouteSession(request, body.role);
  const role = session.role;
  if (!id) {
    return NextResponse.json({ allowed: false, error: "Malformed asset id." }, { status: 400 });
  }

  const { asset, source } = await getAssetRecordById(id);
  const envelope = session.sourceEnvelope(source);
  const variant = normalizeDownloadVariant(body.variant);
  const usageChannel = normalizeDisplayTextField(body.usageChannel, "", 80) || null;
  const reason = normalizeDisplayTextField(body.reason, "", 240) || null;

  if (!asset) {
    return NextResponse.json({ allowed: false, reason: "Asset not found", ...envelope }, { status: 404 });
  }

  const access = decideAccess(role, "downloadApprovedCopy", asset);
  session.recordUsage({
    type: "download_gate",
    assetId: asset.id,
    resourceSpaceId: asset.resourceSpaceId || asset.id,
    route: `/api/download/${asset.id}`,
    metadata: { termsAccepted: body.termsAccepted === true, variant }
  });
  const termsAccepted = body.termsAccepted === true;
  const derivativeAvailable = Boolean(findFilestoreDerivative(id, "download"));

  if (!termsAccepted) {
    appendAuditEvent({
      type: "download_gate_checked",
      role,
      actor: session.identity.id,
      assetId: asset.id,
      resourceSpaceId: asset.resourceSpaceId || asset.id,
      status: "blocked",
      summary: "Download gate blocked because usage terms were not accepted.",
      details: {
        source: source.label,
        assetStatus: asset.status,
        usageChannel,
        reason
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
      resourceSpaceId: asset.resourceSpaceId || asset.id,
      status: "denied",
      summary: "Download gate denied approved copy.",
      details: {
        source: source.label,
        assetStatus: asset.status,
        reasonCodes: access.reasonCodes || [],
        accessReason: access.reason || null,
        usageChannel
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
      resourceSpaceId: asset.resourceSpaceId || asset.id,
      status: "blocked",
      summary: "Download gate blocked because approved derivative is unavailable.",
      details: {
        source: source.label,
        assetStatus: asset.status,
        usageChannel
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
    resourceSpaceId: asset.resourceSpaceId || asset.id,
    status: "allowed",
    summary: "Download gate approved an approved-copy URL.",
    details: {
      source: source.label,
      assetStatus: asset.status,
      variant,
      usageChannel,
      reason
    }
  });

  return NextResponse.json({
    allowed: true,
    downloadUrl: `/api/download/${encodeURIComponent(asset.id)}?role=${encodeURIComponent(role)}&variant=${encodeURIComponent(variant)}`,
    auditId: audit.id,
    ...envelope,
    message: "Approved copy is available through backend gate. Private originals and S3 paths are not exposed."
  });
}
