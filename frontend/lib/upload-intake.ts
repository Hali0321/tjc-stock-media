import { normalizeDateField, normalizeDisplayTextField, normalizePublicTextField, normalizeUrlField } from "@/lib/request-validation";
import { nonCanonicalUploadTags } from "@/lib/upload-tags";
import { LARGE_MEDIA_BYTES } from "@/lib/workflow-policy";

export type UploadIntakePacket = {
  files: File[];
  sourceLink: string;
  title: string;
  eventName: string;
  eventDate: string;
  ministry: string;
  source: string;
  peopleVisible: string;
  minorsVisible: string;
  usageRights: string;
  approvalSuggestion: string;
  consentRestrictions: string;
  suggestedTags: string;
  intakeNotes: string;
  missingRequired: string[];
  invalidTags: string[];
  largeFiles: File[];
  reviewWarnings: string[];
};

export function normalizeUploadIntake(form: FormData): UploadIntakePacket {
  const files = form.getAll("files").filter((value): value is File => value instanceof File && Boolean(value.name) && value.size > 0);
  const sourceLink = normalizeUrlField(form.get("sourceLink"), "", 500);
  const title = normalizeDisplayTextField(form.get("title"), "", 160);
  const eventName = normalizeDisplayTextField(form.get("eventName"), "", 120);
  const eventDate = normalizeDateField(form.get("eventDate"));
  const ministry = normalizeDisplayTextField(form.get("ministry"), "", 120);
  const source = normalizeDisplayTextField(form.get("source"), "", 160);
  const peopleVisible = normalizePublicTextField(form.get("peopleVisible"), "Unknown", 40);
  const minorsVisible = normalizePublicTextField(form.get("minorsVisible"), "Unknown", 40);
  const usageRights = normalizePublicTextField(form.get("usageRights"), "Unknown - needs review", 80);
  const approvalSuggestion = normalizePublicTextField(form.get("approvalSuggestion"), "Reviewer decides", 80);
  const consentRestrictions = normalizePublicTextField(form.get("notes"), "", 600);
  const suggestedTags = normalizePublicTextField(form.get("tags"), "", 300);
  const intakeNotes = normalizePublicTextField(form.get("intakeNotes"), "", 600);
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
  const reviewWarnings = [
    !source && "Source/photographer missing",
    peopleVisible === "Unknown" && "People visibility unknown",
    minorsVisible === "Unknown" && "Children/youth visibility unknown",
    minorsVisible === "Yes" && "Children/youth visible",
    /unknown|needs review/i.test(usageRights) && "Usage rights unclear",
    /church-wide|public/i.test(approvalSuggestion) && (!/permission confirmed|tjc-owned/i.test(usageRights) || peopleVisible === "Unknown" || minorsVisible !== "No") && "Public approval suggestion conflicts with rights/people fields"
  ].filter((warning): warning is string => Boolean(warning));

  return {
    files,
    sourceLink,
    title,
    eventName,
    eventDate,
    ministry,
    source,
    peopleVisible,
    minorsVisible,
    usageRights,
    approvalSuggestion,
    consentRestrictions,
    suggestedTags,
    intakeNotes,
    missingRequired,
    invalidTags: nonCanonicalUploadTags(suggestedTags),
    largeFiles: files.filter((file) => file.size > LARGE_MEDIA_BYTES),
    reviewWarnings
  };
}

export function uploadIntakeAuditDetails(intake: Pick<UploadIntakePacket, "eventName" | "files" | "sourceLink">) {
  return {
    eventName: intake.eventName,
    fileCount: intake.files.length,
    sourceLinkCaptured: Boolean(intake.sourceLink)
  };
}
