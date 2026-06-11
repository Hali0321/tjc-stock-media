import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { normalizeFeedbackSeverity, normalizeFeedbackStatus, normalizeFeedbackText, patchBetaFeedback } from "@/lib/beta-feedback";
import { canAdmin } from "@/lib/permissions";
import { requestIdentity } from "@/lib/request-identity";
import type { BetaFeedbackSeverity, BetaFeedbackStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const identity = requestIdentity(request, request.nextUrl.searchParams.get("role"));
  if (!canAdmin(identity.role)) {
    appendAuditEvent({
      type: "admin_denied",
      role: identity.role,
      actor: identity.id,
      status: "denied",
      summary: "Beta feedback update denied for non-admin role.",
      details: { reason: "role-cannot-admin" }
    });
    return NextResponse.json({ error: "Beta feedback updates require DAM Admin role." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { status?: string; severity?: string; notes?: string };
  const status = normalizeFeedbackText(body.status, 40);
  const severity = normalizeFeedbackText(body.severity, 40);
  const normalizedStatus = status ? normalizeFeedbackStatus(status) : "";
  const normalizedSeverity = severity ? normalizeFeedbackSeverity(severity) : "";
  if (status && normalizedStatus !== status) {
    return NextResponse.json({ error: "Feedback status is invalid." }, { status: 400 });
  }
  if (severity && normalizedSeverity !== severity) {
    return NextResponse.json({ error: "Feedback severity is invalid." }, { status: 400 });
  }

  const record = await patchBetaFeedback(id, {
    status: normalizedStatus ? normalizedStatus as BetaFeedbackStatus : undefined,
    severity: normalizedSeverity ? normalizedSeverity as BetaFeedbackSeverity : undefined,
    notes: body.notes
  });
  if (!record) return NextResponse.json({ error: "Feedback record not found." }, { status: 404 });

  appendAuditEvent({
    type: "beta_feedback_triaged",
    role: identity.role,
    actor: identity.id,
    status: "preview",
    summary: `Beta feedback ${record.id} updated to ${record.status}.`,
    details: { feedbackId: record.id, severity: record.severity, status: record.status }
  });

  return NextResponse.json({ ok: true, feedback: record });
}
