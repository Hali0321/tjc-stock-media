import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { patchBetaFeedback, readBetaFeedbackPatchInput } from "@/lib/beta-feedback";
import { canAdmin } from "@/lib/permissions";
import { requestIdentity } from "@/lib/request-identity";
import { normalizeFeedbackId } from "@/lib/request-validation";

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

  const id = normalizeFeedbackId((await params).id);
  const input = await readBetaFeedbackPatchInput(request);
  if (input.invalidField === "status") {
    return NextResponse.json({ error: "Feedback status is invalid." }, { status: 400 });
  }
  if (input.invalidField === "severity") {
    return NextResponse.json({ error: "Feedback severity is invalid." }, { status: 400 });
  }

  const record = await patchBetaFeedback(id, input.patch);
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
