import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import {
  betaFeedbackExportAuditEvent,
  betaFeedbackExportHeaders,
  buildBetaFeedbackExport,
  listBetaFeedback,
  readBetaFeedbackExportFilters
} from "@/lib/beta-feedback";
import { canAdmin } from "@/lib/permissions";
import { requestIdentity } from "@/lib/request-identity";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const identity = requestIdentity(request, request.nextUrl.searchParams.get("role"));
  if (!canAdmin(identity.role)) {
    appendAuditEvent({
      type: "admin_denied",
      role: identity.role,
      actor: identity.id,
      status: "denied",
      summary: "Beta feedback export denied for non-admin role.",
      details: { reason: "role-cannot-admin" }
    });
    return NextResponse.json({ error: "Beta feedback export requires DAM Admin role." }, { status: 403 });
  }

  const filters = readBetaFeedbackExportFilters(request.nextUrl.searchParams);
  const records = await listBetaFeedback();
  const packet = buildBetaFeedbackExport(records, filters);
  appendAuditEvent(betaFeedbackExportAuditEvent(packet, identity.role, identity.id));
  return NextResponse.json(packet, {
    headers: betaFeedbackExportHeaders(packet)
  });
}
