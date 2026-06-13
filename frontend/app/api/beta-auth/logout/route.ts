import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { BETA_SESSION_COOKIE } from "@/lib/beta-auth";
import { createDamRouteSession } from "@/lib/dam-route-session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = createDamRouteSession(request);
  appendAuditEvent({
    type: "beta_auth_logout",
    role: session.role,
    actor: session.identity.id,
    status: "allowed",
    summary: "Internal beta persona logged out.",
    details: { persona: session.role }
  });
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: BETA_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return response;
}
