import { buildReuseDecision } from "@/lib/reuse-policy";
import { createPendingReviewWrite } from "@/lib/pending-review-writes";
import { normalizeReviewRoleWithFallback } from "@/lib/permissions";
import type { DemoRole, ReviewEvidenceChecklist, StockMediaAsset } from "@/lib/types";

export {
  buildReviewEvidenceDecision,
  missingReviewEvidence,
  normalizeReviewChecklist,
  requiredReviewEvidence
} from "@/lib/review-evidence";

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
    reviewerRole: normalizeReviewRoleWithFallback(role),
    reviewerName,
    note,
    checklist,
    blockers: reuse.blockers.map((item) => item.label)
  });
}
