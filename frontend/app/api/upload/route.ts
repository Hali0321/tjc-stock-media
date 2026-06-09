import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { canUpload, normalizeRole } from "@/lib/permissions";
import { normalizeTextField } from "@/lib/request-validation";
import { nonCanonicalUploadTags } from "@/lib/upload-tags";
import { LARGE_MEDIA_BYTES, uploadDefaultState } from "@/lib/workflow-policy";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const role = normalizeRole(String(form.get("role") || "Viewer"));
  if (!canUpload(role)) {
    appendAuditEvent({
      type: "upload_denied",
      role,
      status: "denied",
      summary: "Upload intake denied for role.",
      details: { reason: "role-cannot-submit" }
    });
    return NextResponse.json({ error: "This role can search approved media but cannot upload." }, { status: 403 });
  }

  const files = form.getAll("files").filter((value): value is File => value instanceof File && Boolean(value.name) && value.size > 0);
  const sourceLink = normalizeTextField(form.get("sourceLink"), "", 500);
  const title = normalizeTextField(form.get("title"), "", 160);
  const eventName = normalizeTextField(form.get("eventName"), "", 120);
  const eventDate = normalizeTextField(form.get("eventDate"), "", 40);
  const ministry = normalizeTextField(form.get("ministry"), "", 120);
  const source = normalizeTextField(form.get("source"), "", 160);
  const peopleVisible = normalizeTextField(form.get("peopleVisible"), "Unknown", 40);
  const minorsVisible = normalizeTextField(form.get("minorsVisible"), "Unknown", 40);
  const usageRights = normalizeTextField(form.get("usageRights"), "Unknown - needs review", 80);
  const approvalSuggestion = normalizeTextField(form.get("approvalSuggestion"), "Reviewer decides", 80);
  const consentRestrictions = normalizeTextField(form.get("notes"), "", 600);
  const suggestedTags = normalizeTextField(form.get("tags"), "", 300);
  const intakeNotes = normalizeTextField(form.get("intakeNotes"), "", 600);
  const missingRequired = [
    !title && "title",
    !eventName && "event name",
    !eventDate && "event date",
    !ministry && "ministry/team",
    !source && "source/photographer",
    peopleVisible === "Unknown" && "people visible",
    minorsVisible === "Unknown" && "children/youth visible",
    /unknown|needs review/i.test(usageRights) && "usage rights",
    !consentRestrictions && "consent/restrictions",
    !approvalSuggestion && "suggested approval direction",
    !suggestedTags && "suggested tags",
    !intakeNotes && "intake notes"
  ].filter((item): item is string => Boolean(item));
  if (missingRequired.length) {
    return NextResponse.json({ error: "Intake is missing required review context.", missingRequired }, { status: 400 });
  }
  const invalidTags = nonCanonicalUploadTags(suggestedTags);
  if (invalidTags.length) {
    return NextResponse.json(
      {
        error: "Suggested tags must use the current media-library taxonomy.",
        invalidTags,
        guidance: "Add new wording to intake notes for reviewer consideration."
      },
      { status: 400 }
    );
  }
  if (!files.length && !sourceLink) {
    return NextResponse.json({ error: "Add at least one file or existing media link before submitting intake." }, { status: 400 });
  }

  const largeFiles = files.filter((file) => file.size > LARGE_MEDIA_BYTES);
  if (largeFiles.length) {
    appendAuditEvent({
      type: "upload_submitted",
      role,
      status: "blocked",
      summary: "Large-media intake routed away from browser upload.",
      details: { eventName, fileCount: files.length, largeFileCount: largeFiles.length, sourceLink: sourceLink || null }
    });
    return NextResponse.json({
      status: "large-media-intake",
      message: uploadDefaultState.largeMediaMessage,
      defaultReviewState: uploadDefaultState.status,
      fileCount: files.length,
      largeFileCount: largeFiles.length,
      sourceLinkCaptured: Boolean(sourceLink)
    });
  }

  const reviewWarnings = [
    !source && "Source/photographer missing",
    peopleVisible === "Unknown" && "People visibility unknown",
    minorsVisible === "Unknown" && "Children/youth visibility unknown",
    minorsVisible === "Yes" && "Children/youth visible",
    /unknown|needs review/i.test(usageRights) && "Usage rights unclear",
    /church-wide|public/i.test(approvalSuggestion) && (!/permission confirmed|tjc-owned/i.test(usageRights) || peopleVisible === "Unknown" || minorsVisible !== "No") && "Public approval suggestion conflicts with rights/people fields"
  ].filter((warning): warning is string => Boolean(warning));

  appendAuditEvent({
    type: "upload_submitted",
    role,
    status: "preview",
    summary: "Intake validated for DAM review; no ResourceSpace write performed.",
    details: { eventName, fileCount: files.length, sourceLink: sourceLink || null, reviewWarnings }
  });

  return NextResponse.json({
    status: "validated",
    defaultReviewState: uploadDefaultState.status,
    message:
      "Upload intake validated. New media remains Needs Review / Do Not Publish until a reviewer clears the record.",
    eventName,
    fileCount: files.length,
    sourceLinkCaptured: Boolean(sourceLink),
    reviewWarnings
  });
}
