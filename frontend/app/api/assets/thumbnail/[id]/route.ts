import fs from "node:fs";
import { NextRequest, NextResponse } from "next/server";
import { decideAccess, type AccessAction } from "@/lib/access-decisions";
import { getAssetRecordById } from "@/lib/catalog";
import { findFilestoreDerivative } from "@/lib/media-source";
import { normalizeRole } from "@/lib/permissions";
import { normalizeAssetId } from "@/lib/request-validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = normalizeAssetId((await params).id);
  const role = normalizeRole(request.nextUrl.searchParams.get("role"));
  if (!id) {
    return NextResponse.json({ error: "Malformed asset id." }, { status: 400 });
  }
  const variantParam = request.nextUrl.searchParams.get("variant");
  const variant =
    variantParam === "download"
      ? "download"
      : variantParam === "detail" || variantParam === "preview"
        ? "detail"
        : variantParam === "collection"
          ? "collection"
          : variantParam === "card"
            ? "card"
            : "small";
  const { asset, source } = await getAssetRecordById(id);
  if (!asset) {
    return NextResponse.json({ error: "Asset not found.", source }, { status: 404 });
  }

  const action: AccessAction = variant === "download" ? "downloadApprovedCopy" : variant === "detail" ? "viewDetailPreview" : "viewThumbnail";
  const access = decideAccess(role, action, asset);
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason || "Preview restricted.", source }, { status: 403 });
  }

  const filePath = findFilestoreDerivative(id, variant);

  if (!filePath) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Cache-Control": "no-store"
      }
    });
  }

  try {
    const bytes = fs.readFileSync(filePath);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=300"
      }
    });
  } catch {
    return NextResponse.json({ error: "Derivative file is indexed but unavailable.", source }, { status: 404 });
  }
}
