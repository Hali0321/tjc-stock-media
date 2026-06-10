import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { betaFeedbackEnabled } from "@/lib/env";
import { createBetaFeedback, listBetaFeedback, normalizeFeedbackText, putBetaFeedbackAttachment, validateFeedbackPayload } from "@/lib/beta-feedback";
import { normalizeRole, roles } from "@/lib/permissions";
import { requestIdentity } from "@/lib/request-identity";
import type { BetaFeedbackSeverity } from "@/lib/types";

export const dynamic = "force-dynamic";

type FeedbackInput = {
  role?: unknown;
  route?: unknown;
  task?: unknown;
  severity?: unknown;
  expected?: unknown;
  actual?: unknown;
  reporterName?: unknown;
  browser?: unknown;
  device?: unknown;
  viewport?: unknown;
  screenshotLink?: unknown;
};

async function readFeedbackInput(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return { fields: (await request.json().catch(() => ({}))) as FeedbackInput, file: null as File | null };
  }
  const form = await request.formData();
  const fileValue = form.get("attachment");
  return {
    fields: Object.fromEntries(form.entries()) as FeedbackInput,
    file: fileValue instanceof File && fileValue.size > 0 ? fileValue : null
  };
}

export async function GET(request: NextRequest) {
  const identity = requestIdentity(request, request.nextUrl.searchParams.get("role"));
  if (identity.role !== "DAM Admin") {
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
  const { fields, file } = await readFeedbackInput(request);
  const rawRole = normalizeFeedbackText(fields.role, 80);
  if (!roles.includes(rawRole as never)) {
    return NextResponse.json({ error: "Feedback role is invalid.", missing: ["role"] }, { status: 400 });
  }
  const role = normalizeRole(rawRole);
  const route = normalizeFeedbackText(fields.route, 240);
  const severity = normalizeFeedbackText(fields.severity, 20);
  const expected = normalizeFeedbackText(fields.expected, 1200);
  const actual = normalizeFeedbackText(fields.actual, 1200);
  const missing = validateFeedbackPayload({ role, route, severity, expected, actual });
  if (missing.length) {
    return NextResponse.json({ error: "Feedback is missing required fields.", missing }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const attachmentUrl = await putBetaFeedbackAttachment(id, file).catch(() => "");
  const record = await createBetaFeedback({
    id,
    role,
    route,
    task: normalizeFeedbackText(fields.task, 220) || "Free play",
    severity: severity as BetaFeedbackSeverity,
    expected,
    actual,
    reporterName: normalizeFeedbackText(fields.reporterName, 120) || undefined,
    browser: normalizeFeedbackText(fields.browser, 280) || request.headers.get("user-agent") || undefined,
    device: normalizeFeedbackText(fields.device, 180) || undefined,
    viewport: normalizeFeedbackText(fields.viewport, 60) || undefined,
    attachmentUrl: attachmentUrl || normalizeFeedbackText(fields.screenshotLink, 500) || undefined
  });

  appendAuditEvent({
    type: "beta_feedback_submitted",
    role,
    status: "preview",
    summary: `Beta feedback submitted for ${route}.`,
    details: { feedbackId: record.id, task: record.task, severity: record.severity, storageMode: record.storageMode }
  });

  return NextResponse.json({ ok: true, id: record.id, createdAt: record.createdAt });
}
