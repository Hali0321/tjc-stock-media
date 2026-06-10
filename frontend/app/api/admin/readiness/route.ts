import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { getDamReadiness } from "@/lib/dam-readiness";
import { normalizeRole } from "@/lib/permissions";
import { requestIdentity } from "@/lib/request-identity";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const identity = requestIdentity(request, request.nextUrl.searchParams.get("role"));
  const role = identity.role;
  if (role !== "DAM Admin") {
    appendAuditEvent({
      type: "admin_readiness_denied",
      role,
      actor: identity.id,
      status: "denied",
      summary: "Governance readiness denied for non-admin role.",
      details: { reason: "role-cannot-admin" }
    });
    return NextResponse.json({ error: "DAM readiness is available to DAM Admin role." }, { status: 403 });
  }

  appendAuditEvent({
    type: "admin_readiness_viewed",
    role,
    actor: identity.id,
    status: "allowed",
    summary: "Governance readiness viewed."
  });
  return NextResponse.json(await getDamReadiness());
}
