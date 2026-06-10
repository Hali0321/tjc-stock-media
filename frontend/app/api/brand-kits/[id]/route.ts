import { NextRequest, NextResponse } from "next/server";
import { buildBrandKitResponse, getBrandKitConfig } from "@/lib/brand-kits";
import { normalizeRole } from "@/lib/permissions";
import { requestIdentity } from "@/lib/request-identity";
import { recordUsageEvent } from "@/lib/usage-analytics";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const kitId = (await params).id;
  const config = getBrandKitConfig(kitId);
  if (!config) {
    return NextResponse.json({ error: "Unknown brand kit." }, { status: 404 });
  }

  const identity = requestIdentity(request, request.nextUrl.searchParams.get("role"));
  const role = identity.role;
  const response = await buildBrandKitResponse(config, role);
  recordUsageEvent({
    type: "brand_kit_view",
    role,
    actor: identity.id,
    route: `/api/brand-kits/${kitId}`,
    metadata: { configured: response.kit.configured, assets: response.assets.length }
  });
  return NextResponse.json(response);
}
