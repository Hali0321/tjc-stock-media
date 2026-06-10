import { NextRequest, NextResponse } from "next/server";
import { buildBrandKitResponse, getBrandKitConfig } from "@/lib/brand-kits";
import { normalizeRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const kitId = (await params).id;
  const config = getBrandKitConfig(kitId);
  if (!config) {
    return NextResponse.json({ error: "Unknown brand kit." }, { status: 404 });
  }

  const role = normalizeRole(request.nextUrl.searchParams.get("role"));
  return NextResponse.json(await buildBrandKitResponse(config, role));
}
