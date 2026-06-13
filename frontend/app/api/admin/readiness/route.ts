import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { createDamRouteSession } from "@/lib/dam-route-session";
import {
  damReadinessDeniedAuditEvent,
  damReadinessDeniedError,
  damReadinessViewedAuditEvent,
  getDamReadiness
} from "@/lib/dam-readiness";
import { canAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = createDamRouteSession(request, request.nextUrl.searchParams.get("role"));
  const role = session.role;
  if (!canAdmin(role)) {
    const error = damReadinessDeniedError();
    appendAuditEvent(damReadinessDeniedAuditEvent(session));
    return NextResponse.json(error.body, { status: error.status });
  }

  appendAuditEvent(damReadinessViewedAuditEvent(session));
  return NextResponse.json(await getDamReadiness());
}
