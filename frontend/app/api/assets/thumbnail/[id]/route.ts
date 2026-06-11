import { NextRequest, NextResponse } from "next/server";
import { decideAccess } from "@/lib/access-decisions";
import { getAssetRecordById } from "@/lib/catalog";
import { createDamRouteSession } from "@/lib/dam-route-session";
import { findFilestoreDerivative } from "@/lib/media-source";
import { readDeliveredImage, readThumbnailDeliveryInput } from "@/lib/media-delivery";
import { normalizeAssetId } from "@/lib/request-validation";

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = normalizeAssetId((await params).id);
  const session = createDamRouteSession(request, request.nextUrl.searchParams.get("role"));
  const role = session.role;
  if (!id) {
    return NextResponse.json({ error: "Malformed asset id." }, { status: 400 });
  }
  const deliveryInput = readThumbnailDeliveryInput(request.nextUrl.searchParams);
  const { asset, source } = await getAssetRecordById(id);
  const envelope = session.sourceEnvelope(source);
  if (!asset) {
    return NextResponse.json({ error: "Asset not found.", ...envelope }, { status: 404 });
  }

  const access = decideAccess(role, deliveryInput.action, asset);
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason || "Preview restricted.", ...envelope }, { status: 403 });
  }

  const filePath = findFilestoreDerivative(id, deliveryInput.variant);

  if (!filePath) {
    return placeholderImage("Preview pending");
  }

  const image = readDeliveredImage(filePath);
  if (!image) {
    return placeholderImage("Preview unavailable");
  }
  return new NextResponse(image.bytes, {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "private, max-age=300"
    }
  });
}
