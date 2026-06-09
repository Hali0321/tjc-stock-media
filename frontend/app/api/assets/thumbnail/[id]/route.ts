import fs from "node:fs";
import { NextRequest, NextResponse } from "next/server";
import { decideAccess, type AccessAction } from "@/lib/access-decisions";
import { getAssetRecordById } from "@/lib/catalog";
import { findFilestoreDerivative } from "@/lib/media-source";
import { normalizeRole } from "@/lib/permissions";
import { normalizeAssetId } from "@/lib/request-validation";
import { sourceForRole } from "@/lib/source-redaction";

export const dynamic = "force-dynamic";

function placeholderImage(label: string) {
  const safeLabel = label.replace(/[<>&"]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480" role="img" aria-label="${safeLabel}">
  <rect width="640" height="480" fill="#eef1ed"/>
  <path d="M0 480 640 0" stroke="#dfe6df" stroke-width="8"/>
  <rect x="232" y="196" width="176" height="84" rx="8" fill="#f7f8f6" stroke="#d7ddd5"/>
  <path d="M276 252h88l-28-36-22 26-14-16-24 26Z" fill="#8b958d"/>
  <circle cx="286" cy="222" r="10" fill="#8b958d"/>
  <text x="320" y="316" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="22" font-weight="700" fill="#5d675f">${safeLabel}</text>
</svg>`;
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "private, max-age=60"
    }
  });
}

function supportedImageContentType(bytes: Buffer) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (bytes.length >= 6 && ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString("ascii"))) return "image/gif";
  return null;
}

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
  const safeSource = sourceForRole(role, source);
  if (!asset) {
    return NextResponse.json({ error: "Asset not found.", source: safeSource }, { status: 404 });
  }

  const action: AccessAction = variant === "download" ? "downloadApprovedCopy" : variant === "detail" ? "viewDetailPreview" : "viewThumbnail";
  const access = decideAccess(role, action, asset);
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason || "Preview restricted.", source: safeSource }, { status: 403 });
  }

  const filePath = findFilestoreDerivative(id, variant);

  if (!filePath) {
    return placeholderImage("Preview pending");
  }

  try {
    const bytes = fs.readFileSync(filePath);
    const contentType = supportedImageContentType(bytes);
    if (!contentType) {
      return placeholderImage("Preview unavailable");
    }
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300"
      }
    });
  } catch {
    return placeholderImage("Preview unavailable");
  }
}
