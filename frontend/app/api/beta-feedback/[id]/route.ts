import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import {
  betaFeedbackPatchValidationError,
  betaFeedbackTriagedAuditEvent,
  buildBetaFeedbackPatchResponse,
  patchBetaFeedback,
  readBetaFeedbackPatchInput
} from "@/lib/beta-feedback";
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
  const validationError = betaFeedbackPatchValidationError(input);
  if (validationError) {
    return NextResponse.json(validationError.body, { status: validationError.status });
  }

  const record = await patchBetaFeedback(id, input.patch);
  if (!record) return NextResponse.json({ error: "Feedback record not found." }, { status: 404 });

  appendAuditEvent(betaFeedbackTriagedAuditEvent(record, identity.role, identity.id));

  return NextResponse.json(buildBetaFeedbackPatchResponse(record));
}
