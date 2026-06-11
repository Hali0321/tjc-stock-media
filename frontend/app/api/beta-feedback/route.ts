import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { betaFeedbackEnabled } from "@/lib/env";
import { createBetaFeedback, listBetaFeedback, normalizeBetaFeedbackSubmission, putBetaFeedbackAttachment, readBetaFeedbackRequestInput, validateFeedbackPayload } from "@/lib/beta-feedback";
import { canAdmin, isKnownRole } from "@/lib/permissions";
import { requestIdentity } from "@/lib/request-identity";
import type { BetaFeedbackSeverity } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const identity = requestIdentity(request, request.nextUrl.searchParams.get("role"));
  if (!canAdmin(identity.role)) {
    appendAuditEvent({
      type: "admin_denied",
      role: identity.role,
      actor: identity.id,
      status: "denied",
      summary: "Beta feedback inbox access denied for non-admin role.",
      details: { reason: "role-cannot-admin" }
    });
    return NextResponse.json({ error: "Beta feedback inbox requires DAM Admin role." }, { status: 403 });
  }
  const feedback = await listBetaFeedback();
  return NextResponse.json({ feedback, count: feedback.length });
}

export async function POST(request: NextRequest) {
  if (!betaFeedbackEnabled()) {
    return NextResponse.json({ error: "Beta feedback capture is disabled." }, { status: 503 });
  }
  const { fields, file } = await readBetaFeedbackRequestInput(request);
  const submission = normalizeBetaFeedbackSubmission(fields, request.headers.get("user-agent"));
  if (!isKnownRole(submission.rawRole)) {
    return NextResponse.json({ error: "Feedback role is invalid.", missing: ["role"] }, { status: 400 });
  }
  const identity = requestIdentity(request, submission.rawRole);
  const role = identity.role;
  const missing = validateFeedbackPayload({ role, route: submission.route, severity: submission.severity, expected: submission.expected, actual: submission.actual });
  if (missing.length) {
    return NextResponse.json({ error: "Feedback is missing required fields.", missing }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const attachmentUrl = await putBetaFeedbackAttachment(id, file).catch(() => "");
  const record = await createBetaFeedback({
    id,
    role,
    route: submission.route,
    task: submission.task,
    severity: submission.severity as BetaFeedbackSeverity,
    expected: submission.expected,
    actual: submission.actual,
    reporterName: submission.reporterName,
    browser: submission.browser,
    device: submission.device,
    viewport: submission.viewport,
    attachmentUrl: attachmentUrl || submission.screenshotUrl,
    actor: identity.id
  });

  appendAuditEvent({
    type: "beta_feedback_submitted",
    role,
    actor: identity.id,
    status: "preview",
    summary: `Beta feedback submitted for ${submission.route}.`,
    details: { feedbackId: record.id, task: record.task, severity: record.severity, storageMode: record.storageMode }
  });

  return NextResponse.json({ ok: true, id: record.id, createdAt: record.createdAt });
}
