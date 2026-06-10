import { buildReuseDecision } from "@/lib/reuse-policy";
import { createPendingReviewWrite } from "@/lib/pending-review-writes";
import type { DemoRole, ReviewEvidenceChecklist, StockMediaAsset } from "@/lib/types";
import type { ReviewActionBackend } from "@/lib/workflow-policy";

export function normalizeReviewChecklist(value: unknown): ReviewEvidenceChecklist {
  const raw = typeof value === "object" && value ? (value as Partial<Record<keyof ReviewEvidenceChecklist, unknown>>) : {};
  return {
    sourceConfirmed: raw.sourceConfirmed === true,
    rightsConfirmed: raw.rightsConfirmed === true,
    attributionConfirmed: raw.attributionConfirmed === true,
    peopleVisibilityConfirmed: raw.peopleVisibilityConfirmed === true,
    childrenYouthChecked: raw.childrenYouthChecked === true,
    usageScopeSelected: raw.usageScopeSelected === true,
    derivativeAvailable: raw.derivativeAvailable === true,
    sensitiveContextChecked: raw.sensitiveContextChecked === true,
    creditRequirementChecked: raw.creditRequirementChecked === true,
    expirationRereviewSet: raw.expirationRereviewSet === true,
    proofLinkAttached: raw.proofLinkAttached === true
  };
}

export function missingReviewEvidence(action: ReviewActionBackend, checklist: ReviewEvidenceChecklist, note: string) {
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
  return missing;
}

export function queuePendingReviewDecision({
  asset,
  requestedStatus,
  role,
  reviewerName,
  note,
  checklist
}: {
  asset: StockMediaAsset;
  requestedStatus: string;
  role: DemoRole;
  reviewerName?: string;
  note: string;
  checklist: ReviewEvidenceChecklist;
}) {
  const reuse = buildReuseDecision(asset);
  return createPendingReviewWrite({
    asset,
    requestedStatus,
    reviewerRole: role === "DAM Admin" ? "DAM Admin" : "Reviewer",
    reviewerName,
    note,
    checklist,
    blockers: reuse.blockers.map((item) => item.label)
  });
}
