import fs from "node:fs";
import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { getAssetRecordById } from "@/lib/catalog";
import { findFilestoreDerivative } from "@/lib/media-source";
import { canDownloadApprovedCopy, normalizeRole } from "@/lib/permissions";
import { normalizeAssetId } from "@/lib/request-validation";
import type { DemoRole, MediaSourceStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

function sourceForRole(role: DemoRole, source: MediaSourceStatus): MediaSourceStatus {
  if (role !== "Viewer") return source;
  return {
    adapter: "demo-fallback",
    label: "Media library",
    detail: "Operational source diagnostics are available to reviewers.",
    readOnly: true
  };
}

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
        error: "Not approved for this role. Original/master files stay restricted.",
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
