import type { ReviewActionBackend } from "@/lib/workflow-policy";
import { safeBoolean } from "@/lib/persisted-record-safety";
import type { ReviewEvidenceChecklist, StockMediaAsset } from "@/lib/types";

export const reviewChecklistItems: Array<{ field: keyof ReviewEvidenceChecklist; label: string; missingLabel: string; hint: string }> = [
  { field: "sourceConfirmed", label: "Source evidence", missingLabel: "Source evidence missing", hint: "Custody/source record checked" },
  { field: "rightsConfirmed", label: "Owner/license evidence", missingLabel: "Owner/license evidence missing", hint: "Rights status supports requested use" },
  { field: "attributionConfirmed", label: "Attribution evidence", missingLabel: "Attribution evidence missing", hint: "Credit requirement reviewed" },
  { field: "peopleVisibilityConfirmed", label: "People/minors status", missingLabel: "People/minors status unresolved", hint: "People/minors visibility reviewed" },
  { field: "childrenYouthChecked", label: "Children/youth review", missingLabel: "Children/youth review required", hint: "Youth/minor risk explicitly checked" },
  { field: "usageScopeSelected", label: "Usage scope", missingLabel: "Usage scope missing", hint: "Internal/public scope selected" },
  { field: "derivativeAvailable", label: "Approved derivative", missingLabel: "Approved derivative missing", hint: "Approved copy/rendition can be delivered" },
  { field: "sensitiveContextChecked", label: "Sensitive context review", missingLabel: "Sensitive context review required", hint: "Worship/sacrament/context reviewed" },
  { field: "creditRequirementChecked", label: "Credit requirement evidence", missingLabel: "Credit requirement evidence missing", hint: "Credit/attribution requirement recorded" },
  { field: "expirationRereviewSet", label: "Expiration/re-review decision", missingLabel: "Expiration or re-review decision missing", hint: "Future review requirement considered" },
  { field: "proofLinkAttached", label: "Proof link or note", missingLabel: "Proof link or note missing", hint: "Evidence/proof link or note attached" }
];

export const emptyReviewChecklist: ReviewEvidenceChecklist = {
  sourceConfirmed: false,
  rightsConfirmed: false,
  attributionConfirmed: false,
  peopleVisibilityConfirmed: false,
  childrenYouthChecked: false,
  usageScopeSelected: false,
  derivativeAvailable: false,
  sensitiveContextChecked: false,
  creditRequirementChecked: false,
  expirationRereviewSet: false,
  proofLinkAttached: false
};

export const reviewChecklistLabelByField = Object.fromEntries(
  reviewChecklistItems.map((item) => [item.field, item.label])
) as Record<keyof ReviewEvidenceChecklist, string>;

export function normalizeReviewChecklist(value: unknown): ReviewEvidenceChecklist {
  const raw = typeof value === "object" && value ? (value as Partial<Record<keyof ReviewEvidenceChecklist, unknown>>) : {};
  return {
    sourceConfirmed: safeBoolean(raw.sourceConfirmed),
    rightsConfirmed: safeBoolean(raw.rightsConfirmed),
    attributionConfirmed: safeBoolean(raw.attributionConfirmed),
    peopleVisibilityConfirmed: safeBoolean(raw.peopleVisibilityConfirmed),
    childrenYouthChecked: safeBoolean(raw.childrenYouthChecked),
    usageScopeSelected: safeBoolean(raw.usageScopeSelected),
    derivativeAvailable: safeBoolean(raw.derivativeAvailable),
    sensitiveContextChecked: safeBoolean(raw.sensitiveContextChecked),
    creditRequirementChecked: safeBoolean(raw.creditRequirementChecked),
    expirationRereviewSet: safeBoolean(raw.expirationRereviewSet),
    proofLinkAttached: safeBoolean(raw.proofLinkAttached)
  };
}

export function requiredReviewEvidence(action: ReviewActionBackend): Array<keyof ReviewEvidenceChecklist> {
  const required: Array<keyof ReviewEvidenceChecklist> = [
    "sourceConfirmed",
    "rightsConfirmed",
    "peopleVisibilityConfirmed",
    "childrenYouthChecked",
    "usageScopeSelected"
  ];
  if (action === "Approve Public") {
    required.push(
      "derivativeAvailable",
      "sensitiveContextChecked",
      "creditRequirementChecked",
      "attributionConfirmed",
      "expirationRereviewSet",
      "proofLinkAttached"
    );
  }
  return required;
}

export function missingReviewEvidence(action: ReviewActionBackend, checklist: ReviewEvidenceChecklist, note: string) {
  const missing = requiredReviewEvidence(action).filter((field) => !checklist[field]).map((field) => String(field));
  if (note.trim().length <= 10) missing.push("reviewNote");
  return missing;
}

export function initialReviewChecklistForAsset(asset?: StockMediaAsset): ReviewEvidenceChecklist {
  if (!asset) return emptyReviewChecklist;
  return {
    ...emptyReviewChecklist,
    sourceConfirmed: Boolean(asset.resourceSpaceId || asset.sourceSystem || asset.sourcePlatform),
    usageScopeSelected: Boolean(asset.usageScope && asset.usageScope !== "Do Not Publish"),
    peopleVisibilityConfirmed: Boolean(asset.peopleRisk && asset.peopleRisk !== "Unknown"),
    childrenYouthChecked: Boolean(asset.peopleRisk && asset.peopleRisk !== "Unknown")
  };
}

export function reviewEvidenceCompletion(checklist: ReviewEvidenceChecklist, note: string) {
  const rows = [
    ...reviewChecklistItems.map((item) => ({ id: item.field, label: item.label, missingLabel: item.missingLabel, complete: checklist[item.field] })),
    { id: "reviewNote", label: "Review note", missingLabel: "Review note missing", complete: note.trim().length > 10 }
  ];
  return {
    rows,
    completed: rows.filter((item) => item.complete).length,
    total: rows.length,
    missingLabels: rows.filter((item) => !item.complete).map((item) => item.missingLabel)
  };
}

export function reviewDecisionMissingLabels(action: ReviewActionBackend, checklist: ReviewEvidenceChecklist, note: string) {
  return missingReviewEvidence(action, checklist, note).map((field) => {
    if (field === "reviewNote") return "Review note missing";
    return reviewChecklistItems.find((item) => item.field === field)?.missingLabel || reviewChecklistLabelByField[field as keyof ReviewEvidenceChecklist] || field;
  });
}

export function reviewDecisionDisabledReason(action: ReviewActionBackend, checklist: ReviewEvidenceChecklist, note: string) {
  const missing = reviewDecisionMissingLabels(action, checklist, note);
  if (!missing.length) return "";
  return `Missing: ${missing.slice(0, 4).join(", ")}${missing.length > 4 ? "..." : ""}`;
}

export function buildReviewEvidenceDecision(action: ReviewActionBackend, checklist: ReviewEvidenceChecklist, note: string) {
  const normalized = normalizeReviewChecklist(checklist);
  const missingFields = missingReviewEvidence(action, normalized, note);
  const missingLabels = reviewDecisionMissingLabels(action, normalized, note);
  return {
    action,
    checklist: normalized,
    requiredFields: requiredReviewEvidence(action),
    missingFields,
    missingLabels,
    completion: reviewEvidenceCompletion(normalized, note),
    disabledReason: reviewDecisionDisabledReason(action, normalized, note),
    ready: missingFields.length === 0
  };
}
