import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { getDamReadiness } from "@/lib/dam-readiness";
import { normalizeRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const role = normalizeRole(request.nextUrl.searchParams.get("role"));
  if (role !== "DAM Admin") {
    appendAuditEvent({
      type: "admin_readiness_denied",
      role,
      status: "denied",
      summary: "Governance readiness denied for non-admin role.",
      details: { reason: "role-cannot-admin" }
    });
    return NextResponse.json({ error: "DAM readiness is available to DAM Admin role." }, { status: 403 });
  }

  appendAuditEvent({
    type: "admin_readiness_viewed",
    role,
    status: "allowed",
    summary: "Governance readiness viewed."
  });
  return NextResponse.json(await getDamReadiness());
}
