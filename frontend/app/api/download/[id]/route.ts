import fs from "node:fs";
import { NextRequest, NextResponse } from "next/server";
import { getAssetRecordById } from "@/lib/catalog";
import { findFilestoreDerivative } from "@/lib/media-source";
import { canDownloadApprovedCopy, normalizeRole } from "@/lib/permissions";
import { normalizeAssetId } from "@/lib/request-validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = normalizeAssetId((await params).id);
  const role = normalizeRole(request.nextUrl.searchParams.get("role"));
  if (!id) {
    return NextResponse.json({ error: "Malformed asset id." }, { status: 400 });
  }
  const { asset, source } = await getAssetRecordById(id);

  if (!asset) {
    return NextResponse.json({ error: "Asset not found", source }, { status: 404 });
  }
  if (!canDownloadApprovedCopy(role, asset)) {
    return NextResponse.json(
      {
        error: "Not approved for this role. Original/master files stay restricted.",
        source
      },
      { status: 403 }
    );
  }

  const filePath = findFilestoreDerivative(id, "download");
  if (!filePath) {
    return NextResponse.json({ error: "Approved derivative not available in local filestore.", source }, { status: 404 });
  }

  try {
    const bytes = fs.readFileSync(filePath);
    const safeTitle = asset.title.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "").slice(0, 80) || `asset-${id}`;
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="${safeTitle}-approved-copy.jpg"`,
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return NextResponse.json({ error: "Approved derivative is indexed but unavailable.", source }, { status: 404 });
  }
}
