import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { createDamRouteSession } from "@/lib/dam-route-session";
import { getDamReadiness } from "@/lib/dam-readiness";
import { canAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = createDamRouteSession(request, request.nextUrl.searchParams.get("role"));
  const role = session.role;
  if (!canAdmin(role)) {
    appendAuditEvent({
      type: "admin_readiness_denied",
      role,
      actor: session.identity.id,
      status: "denied",
      summary: "Governance readiness denied for non-admin role.",
      details: { reason: "role-cannot-admin" }
    });
    return NextResponse.json({ error: "DAM readiness is available to DAM Admin role." }, { status: 403 });
  }

  appendAuditEvent({
    type: "admin_readiness_viewed",
    role,
    actor: session.identity.id,
    status: "allowed",
    summary: "Governance readiness viewed."
  });
  return NextResponse.json(await getDamReadiness());
}
