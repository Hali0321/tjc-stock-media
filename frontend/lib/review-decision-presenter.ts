import type { ReviewActionBackend } from "@/lib/workflow-policy";
import type { ReviewEvidenceChecklist, StockMediaAsset } from "@/lib/types";

export const reviewChecklistItems: Array<{ field: keyof ReviewEvidenceChecklist; label: string; hint: string }> = [
  { field: "sourceConfirmed", label: "Source confirmed", hint: "Custody/source record checked" },
  { field: "rightsConfirmed", label: "Owner/license confirmed", hint: "Rights status supports requested use" },
  { field: "attributionConfirmed", label: "Attribution confirmed", hint: "Credit requirement reviewed" },
  { field: "peopleVisibilityConfirmed", label: "People visibility confirmed", hint: "People/minors visibility reviewed" },
  { field: "childrenYouthChecked", label: "Children/youth checked", hint: "Youth/minor risk explicitly checked" },
  { field: "usageScopeSelected", label: "Usage scope selected", hint: "Internal/public scope selected" },
  { field: "derivativeAvailable", label: "Derivative available", hint: "Approved copy/rendition can be delivered" },
  { field: "sensitiveContextChecked", label: "Sensitive context checked", hint: "Worship/sacrament/context reviewed" },
  { field: "creditRequirementChecked", label: "Credit requirement checked", hint: "Credit/attribution requirement recorded" },
  { field: "expirationRereviewSet", label: "Expiration/re-review set", hint: "Future review requirement considered" },
  { field: "proofLinkAttached", label: "Proof link attached", hint: "Evidence/proof link or note attached" }
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
    ...reviewChecklistItems.map((item) => ({ id: item.field, label: item.label, complete: checklist[item.field] })),
    { id: "reviewNote", label: "Review note added", complete: note.trim().length > 10 }
  ];
  return {
    rows,
    completed: rows.filter((item) => item.complete).length,
    total: rows.length,
    missingLabels: rows.filter((item) => !item.complete).map((item) => item.label)
  };
}

export function reviewDecisionMissingLabels(action: ReviewActionBackend, checklist: ReviewEvidenceChecklist, note: string) {
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
  const missing = required.filter((field) => !checklist[field]).map((field) => String(field));
  if (note.trim().length <= 10) missing.push("reviewNote");
  return missing.map((field) => {
    if (field === "reviewNote") return "Review note added";
    return reviewChecklistLabelByField[field as keyof ReviewEvidenceChecklist] || field;
  });
}

export function reviewDecisionDisabledReason(action: ReviewActionBackend, checklist: ReviewEvidenceChecklist, note: string) {
  const missing = reviewDecisionMissingLabels(action, checklist, note);
  if (!missing.length) return "";
  return `Missing: ${missing.slice(0, 4).join(", ")}${missing.length > 4 ? "..." : ""}`;
}
