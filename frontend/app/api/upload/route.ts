import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { canUpload } from "@/lib/permissions";
import { requestIdentity } from "@/lib/request-identity";
import { readFormData } from "@/lib/request-validation";
import {
  buildUploadIntakeResponse,
  normalizeUploadIntake,
  uploadIntakeAuditDetails,
  uploadIntakeAuditStatus,
  uploadIntakeAuditSummary,
  uploadIntakeValidationError
} from "@/lib/upload-intake";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const form = await readFormData(request);
  const identity = requestIdentity(request, String(form.get("role") || "Viewer"));
  const role = identity.role;
  if (!canUpload(role)) {
    appendAuditEvent({
      type: "upload_denied",
      role,
      actor: identity.id,
      status: "denied",
      summary: "Upload intake denied for role.",
      details: { reason: "role-cannot-submit" }
    });
    return NextResponse.json({ error: "This role can search approved media but cannot upload." }, { status: 403 });
  }

  const intake = normalizeUploadIntake(form);
  const validationError = uploadIntakeValidationError(intake);
  if (validationError) {
    return NextResponse.json(validationError.body, { status: validationError.status });
  }

  appendAuditEvent({
    type: "upload_submitted",
    role,
    actor: identity.id,
    status: uploadIntakeAuditStatus(intake),
    summary: uploadIntakeAuditSummary(intake),
    details: uploadIntakeAuditDetails(intake)
  });

  return NextResponse.json(buildUploadIntakeResponse(intake));
}
