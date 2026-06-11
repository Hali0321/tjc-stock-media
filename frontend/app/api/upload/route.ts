import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { canUpload } from "@/lib/permissions";
import { requestIdentity } from "@/lib/request-identity";
import { readFormData } from "@/lib/request-validation";
import { normalizeUploadIntake, uploadIntakeAuditDetails } from "@/lib/upload-intake";
import { uploadDefaultState } from "@/lib/workflow-policy";

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
  if (intake.missingRequired.length) {
    return NextResponse.json({ error: "Intake is missing required review context.", missingRequired: intake.missingRequired }, { status: 400 });
  }
  if (intake.invalidTags.length) {
    return NextResponse.json(
      {
        error: "Suggested tags must use the current media-library taxonomy.",
        invalidTags: intake.invalidTags,
        guidance: "Add new wording to intake notes for reviewer consideration."
      },
      { status: 400 }
    );
  }
  if (!intake.files.length && !intake.sourceLink) {
    return NextResponse.json({ error: "Add at least one file or existing media link before submitting intake." }, { status: 400 });
  }

  if (intake.largeFiles.length) {
    appendAuditEvent({
      type: "upload_submitted",
      role,
      actor: identity.id,
      status: "blocked",
      summary: "Large-media intake routed away from browser upload.",
      details: { ...uploadIntakeAuditDetails(intake), largeFileCount: intake.largeFiles.length }
    });
    return NextResponse.json({
      status: "large-media-intake",
      message: uploadDefaultState.largeMediaMessage,
      defaultReviewState: uploadDefaultState.status,
      fileCount: intake.files.length,
      largeFileCount: intake.largeFiles.length,
      sourceLinkCaptured: Boolean(intake.sourceLink)
    });
  }

  appendAuditEvent({
    type: "upload_submitted",
    role,
    actor: identity.id,
    status: "preview",
    summary: "Intake validated for DAM review; no media-library write performed.",
    details: { ...uploadIntakeAuditDetails(intake), reviewWarnings: intake.reviewWarnings }
  });

  return NextResponse.json({
    status: "validated",
    defaultReviewState: uploadDefaultState.status,
    message:
      "Upload intake validated. New media remains Needs Review / Do Not Publish until a reviewer clears the record.",
    eventName: intake.eventName,
    fileCount: intake.files.length,
    sourceLinkCaptured: Boolean(intake.sourceLink),
    reviewWarnings: intake.reviewWarnings
  });
}
