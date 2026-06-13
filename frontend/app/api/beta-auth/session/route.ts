import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { BETA_SESSION_COOKIE, betaAuthEnabled, verifyBetaSessionCookieValue } from "@/lib/beta-auth";
import { createDamRouteSession } from "@/lib/dam-route-session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  createDamRouteSession(request);
  if (!betaAuthEnabled()) return NextResponse.json({ enabled: false, role: null });
  const cookieStore = await cookies();
  const session = await verifyBetaSessionCookieValue(cookieStore.get(BETA_SESSION_COOKIE)?.value);
  return NextResponse.json({
    enabled: true,
    role: session?.role || null,
    expiresAt: session?.expiresAt || null
  }, { status: session ? 200 : 401 });
}
