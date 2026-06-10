import fs from "node:fs";
import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { decideAccess } from "@/lib/access-decisions";
import { getAssetRecordById } from "@/lib/catalog";
import { findFilestoreDerivative } from "@/lib/media-source";
import { canDownloadApprovedCopy, normalizeRole } from "@/lib/permissions";
import { normalizeAssetId } from "@/lib/request-validation";
import { sourceForRole } from "@/lib/source-redaction";

export const dynamic = "force-dynamic";

type DownloadGateBody = {
  role?: string;
  variant?: string;
  usageChannel?: string;
  reason?: string;
  termsAccepted?: boolean;
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = normalizeAssetId((await params).id);
  const role = normalizeRole(request.nextUrl.searchParams.get("role"));
  if (!id) {
    return NextResponse.json({ error: "Malformed asset id." }, { status: 400 });
  }
  const { asset, source } = await getAssetRecordById(id);
  const safeSource = sourceForRole(role, source);

  if (!asset) {
    return NextResponse.json({ error: "Asset not found", source: safeSource }, { status: 404 });
  }
  if (!canDownloadApprovedCopy(role, asset)) {
    appendAuditEvent({
      type: "denied_download",
      role,
      assetId: asset.id,
      resourceSpaceId: asset.resourceSpaceId || asset.id,
      status: "denied",
      summary: "Approved copy download denied; original/master remains restricted.",
      details: { source: source.label, sourceDetail: source.detail, assetStatus: asset.status }
    });
    return NextResponse.json(
      {
        error: "Not approved for this role. Source-file access stays restricted.",
        source: safeSource
      },
      { status: 403 }
    );
  }

  const filePath = findFilestoreDerivative(id, "download");
  if (!filePath) {
    return NextResponse.json({ error: "Approved derivative not available in local filestore.", source: safeSource }, { status: 404 });
  }

  try {
    const bytes = fs.readFileSync(filePath);
    const safeTitle = asset.title.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "").slice(0, 80) || `asset-${id}`;
    appendAuditEvent({
      type: "approved_download",
      role,
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
    return NextResponse.json({ error: "Approved derivative is indexed but unavailable.", source: safeSource }, { status: 404 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = normalizeAssetId((await params).id);
  const body = (await request.json().catch(() => ({}))) as DownloadGateBody;
  const role = normalizeRole(body.role);
  if (!id) {
    return NextResponse.json({ allowed: false, error: "Malformed asset id." }, { status: 400 });
  }

  const { asset, source } = await getAssetRecordById(id);
  const safeSource = sourceForRole(role, source);

  if (!asset) {
    return NextResponse.json({ allowed: false, reason: "Asset not found", source: safeSource }, { status: 404 });
  }

  const access = decideAccess(role, "downloadApprovedCopy", asset);
  const termsAccepted = body.termsAccepted === true;
  const derivativeAvailable = Boolean(findFilestoreDerivative(id, "download"));

  if (!termsAccepted) {
    appendAuditEvent({
      type: "download_gate_checked",
      role,
      assetId: asset.id,
      resourceSpaceId: asset.resourceSpaceId || asset.id,
      status: "blocked",
      summary: "Download gate blocked because usage terms were not accepted.",
      details: {
        source: source.label,
        assetStatus: asset.status,
        usageChannel: body.usageChannel || null,
        reason: body.reason || null
      }
    });
    return NextResponse.json(
      {
        allowed: false,
        requiredAction: "accept-usage-terms",
        reason: "Accept the approved-copy usage terms before download.",
        source: safeSource,
        live: source.adapter !== "demo-fallback" && source.adapter !== "media-library"
      },
      { status: 403 }
    );
  }

  if (!access.allowed || !canDownloadApprovedCopy(role, asset)) {
    appendAuditEvent({
      type: "denied_download",
      role,
      assetId: asset.id,
      resourceSpaceId: asset.resourceSpaceId || asset.id,
      status: "denied",
      summary: "Download gate denied approved copy.",
      details: {
        source: source.label,
        assetStatus: asset.status,
        reasonCodes: access.reasonCodes || [],
        accessReason: access.reason || null,
        usageChannel: body.usageChannel || null
      }
    });
    return NextResponse.json(
      {
        allowed: false,
        requiredAction: asset.status === "Needs Review" ? "request-approval" : "review-rights-and-permissions",
        reason: access.reason || "This asset is not approved for this role.",
        label: access.label || "Download blocked",
        reasonCodes: access.reasonCodes || [],
        source: safeSource,
        live: source.adapter !== "demo-fallback" && source.adapter !== "media-library"
      },
      { status: 403 }
    );
  }

  if (!derivativeAvailable) {
    appendAuditEvent({
      type: "download_gate_checked",
      role,
      assetId: asset.id,
      resourceSpaceId: asset.resourceSpaceId || asset.id,
      status: "blocked",
      summary: "Download gate blocked because approved derivative is unavailable.",
      details: {
        source: source.label,
        assetStatus: asset.status,
        usageChannel: body.usageChannel || null
      }
    });
    return NextResponse.json(
      {
        allowed: false,
        requiredAction: "generate-approved-derivative",
        reason: "Approved derivative is not available yet. Source/master access remains restricted.",
        source: safeSource,
        live: source.adapter !== "demo-fallback" && source.adapter !== "media-library"
      },
      { status: 404 }
    );
  }

  const audit = appendAuditEvent({
    type: "download_gate_checked",
    role,
    assetId: asset.id,
    resourceSpaceId: asset.resourceSpaceId || asset.id,
    status: "allowed",
    summary: "Download gate approved an approved-copy URL.",
    details: {
      source: source.label,
      assetStatus: asset.status,
      variant: body.variant || "download",
      usageChannel: body.usageChannel || null,
      reason: body.reason || null
    }
  });

  return NextResponse.json({
    allowed: true,
    downloadUrl: `/api/download/${encodeURIComponent(asset.id)}?role=${encodeURIComponent(role)}&variant=${encodeURIComponent(body.variant || "download")}`,
    auditId: audit.id,
    source: safeSource,
    live: source.adapter !== "demo-fallback" && source.adapter !== "media-library",
    message: "Approved copy is available through backend gate. Private originals and S3 paths are not exposed."
  });
}
