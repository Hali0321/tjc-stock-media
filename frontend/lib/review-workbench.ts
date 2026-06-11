import type { EnterpriseStatus } from "@/lib/enterprise-status";
import { buildDuplicateGroupCounts } from "@/lib/asset-governance";
import { buildReviewEvidenceDecision, reviewDecisionMissingLabels } from "@/lib/review-decision-presenter";
import type { ReviewEvidenceChecklist, StockMediaAsset } from "@/lib/types";
import { missingReviewFields, reviewRiskFlags } from "@/lib/workflow-policy";

export type ReviewDecisionAction = {
  id: string;
  label: string;
  helper: string;
  status: EnterpriseStatus;
  action: "Approve Public" | "Request More Info" | "Do Not Use";
  tone?: "approve" | "restrict";
  icon: "check" | "file" | "alert";
};

export const reviewWorkbenchTabs = ["Details", "Metadata", "Rights & Checks", "Comments", "Activity", "History"];

export const reviewDecisionActions: ReviewDecisionAction[] = [
  {
    id: "approve",
    label: "Approve",
    helper: "Queues a pending ResourceSpace write.",
    status: "Approved",
    action: "Approve Public",
    tone: "approve",
    icon: "check"
  },
  {
    id: "request-changes",
    label: "Request Changes",
    helper: "Send back to uploader for updates.",
    status: "Needs Review",
    action: "Request More Info",
    icon: "file"
  },
  {
    id: "missing-consent",
    label: "Missing Consent",
    helper: "Require release or consent evidence before reuse.",
    status: "Missing Consent",
    action: "Request More Info",
    icon: "alert"
  },
  {
    id: "restrict",
    label: "Restrict",
    helper: "Limit or block usage of this asset.",
    status: "Restricted",
    action: "Do Not Use",
    tone: "restrict",
    icon: "alert"
  }
];

export type PendingReviewDecisionSummary = {
  status: EnterpriseStatus;
  message: string;
  action: string;
};

export type ReviewQueueIntelligence = {
  label: string;
  value: string;
  detail: string;
  tone: "risk" | "sync" | "ready";
};

export type ReviewQueueNextMove = {
  title: string;
  detail: string;
  action: string;
  tone: "risk" | "sync" | "ready";
};

function reviewDateValue(asset: StockMediaAsset) {
  return Date.parse(asset.importDate || asset.capturedDate || asset.reviewedDate || "") || 0;
}

export function reviewWaitingDays(asset?: StockMediaAsset, now = Date.now()) {
  if (!asset) return 0;
  const value = reviewDateValue(asset);
  if (!value) return 0;
  return Math.max(0, Math.floor((now - value) / 86_400_000));
}

function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}

function verbForCount(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

function reviewQueueFacts(
  assets: StockMediaAsset[],
  pendingById: Record<string, PendingReviewDecisionSummary> = {}
) {
  const duplicateCounts = buildDuplicateGroupCounts(assets);
  const flagged = assets.map((asset) => ({ asset, flags: reviewRiskFlags(asset, duplicateCounts), missing: missingReviewFields(asset) }));
  const highRisk = flagged.filter(({ flags }) => flags.some((flag) => /children|youth|minor|rights|source|sensitive|stale/i.test(flag))).length;
  const likelyReady = flagged.filter(({ missing }) => missing.length <= 1).length;
  const pendingSync = assets.filter((asset) => pendingById[asset.id] || asset.pendingReviewWrite).length;
  const oldestDays = Math.max(0, ...assets.map((asset) => reviewWaitingDays(asset)));

  return { highRisk, likelyReady, pendingSync, oldestDays };
}

export function buildReviewQueueIntelligence(
  assets: StockMediaAsset[],
  pendingById: Record<string, PendingReviewDecisionSummary> = {}
): ReviewQueueIntelligence[] {
  const { highRisk, likelyReady, pendingSync, oldestDays } = reviewQueueFacts(assets, pendingById);

  return [
    {
      label: "Risk focus",
      value: highRisk.toLocaleString(),
      detail: highRisk ? `${countLabel(highRisk, "record")} ${verbForCount(highRisk, "needs", "need")} rights, source, people/youth, sensitive, or stale approval attention.` : "No elevated queue flags in this view.",
      tone: highRisk ? "risk" : "ready"
    },
    {
      label: "Likely ready",
      value: likelyReady.toLocaleString(),
      detail: likelyReady ? `${countLabel(likelyReady, "record")} ${verbForCount(likelyReady, "has", "have")} one or fewer exported metadata gaps; reviewer note may be last step.` : "Every record still has multiple exported evidence gaps.",
      tone: likelyReady ? "ready" : "risk"
    },
    {
      label: "Pending sync",
      value: pendingSync.toLocaleString(),
      detail: pendingSync ? "Portal decision exists; ResourceSpace remains unchanged until sync succeeds or media team completes follow-up." : "No queued ResourceSpace writeback visible in this queue.",
      tone: pendingSync ? "sync" : "ready"
    },
    {
      label: "Oldest record age",
      value: oldestDays ? `${oldestDays}d` : "-",
      detail: oldestDays ? `Oldest visible record is ${oldestDays} day${oldestDays === 1 ? "" : "s"} old from exported dates.` : "No import/capture date exported for age math.",
      tone: oldestDays > 30 ? "risk" : "sync"
    }
  ];
}

export function buildReviewQueueNextMove(
  assets: StockMediaAsset[],
  pendingById: Record<string, PendingReviewDecisionSummary> = {}
): ReviewQueueNextMove {
  const { highRisk, likelyReady, pendingSync, oldestDays } = reviewQueueFacts(assets, pendingById);

  if (!assets.length) {
    return {
      title: "Queue clear",
      detail: "No reviewable records are visible in this queue. Check another queue before inviting testers to rely on this path.",
      action: "Check queue tabs",
      tone: "ready"
    };
  }

  if (pendingSync) {
    return {
      title: "Resolve pending sync first",
      detail: `${countLabel(pendingSync, "portal decision")} ${verbForCount(pendingSync, "is", "are")} waiting on ResourceSpace sync or media-team follow-up.`,
      action: "Review sync notes",
      tone: "sync"
    };
  }

  if (highRisk) {
    return {
      title: "Triage risk records first",
      detail: `${countLabel(highRisk, "record")} ${verbForCount(highRisk, "carries", "carry")} rights, source, people/youth, sensitive, or stale approval signals.`,
      action: "Open risk evidence",
      tone: "risk"
    };
  }

  if (oldestDays > 30) {
    return {
      title: "Triage oldest record",
      detail: `Oldest visible record is ${oldestDays} days old from exported dates. Sort oldest first, then request evidence or queue a decision.`,
      action: "Sort oldest first",
      tone: "risk"
    };
  }

  if (likelyReady) {
    return {
      title: "Finish likely-ready records",
      detail: `${countLabel(likelyReady, "record")} ${verbForCount(likelyReady, "has", "have")} one or fewer exported metadata gaps. Reviewer note may be final blocker.`,
      action: "Complete evidence",
      tone: "ready"
    };
  }

  return {
    title: "Request evidence before approval",
    detail: "Every record in this queue has multiple exported evidence gaps. Use Request Changes or source verification before public approval.",
    action: "Request evidence",
    tone: "risk"
  };
}

export function reviewMetadataCompleteness(asset?: StockMediaAsset) {
  if (!asset) return { completed: 0, total: 8, percent: 0, label: "No asset selected" };
  const rows = [
    asset.sourceSystem || asset.sourcePlatform || asset.sourceAccount,
    asset.rightsStatus,
    asset.consentStatus,
    asset.peopleRisk && asset.peopleRisk !== "Unknown" ? asset.peopleRisk : "",
    asset.usageScope && asset.usageScope !== "Do Not Publish" ? asset.usageScope : "",
    asset.imageDimensions,
    asset.tags?.length || asset.tjcTerms?.length ? "taxonomy" : "",
    asset.imageUrls?.download || asset.downloadPolicy !== "not-downloadable" ? "derivative" : ""
  ];
  const completed = rows.filter(Boolean).length;
  const percent = Math.round((completed / rows.length) * 100);
  return { completed, total: rows.length, percent, label: `${completed}/${rows.length} fields` };
}

export function buildSelectedReviewGuidance({
  asset,
  checklist,
  comment,
  pending
}: {
  asset?: StockMediaAsset;
  checklist: ReviewEvidenceChecklist;
  comment: string;
  pending?: PendingReviewDecisionSummary;
}) {
  if (!asset) {
    return {
      riskFlags: [] as string[],
      missingFields: [] as string[],
      approveMissingLabels: [] as string[],
      nextBestAction: "Select a review record.",
      blockedExplanation: "Approval waits for selected asset evidence.",
      syncHonesty: "No ResourceSpace writeback has been attempted.",
      syncTone: "sync" as const,
      approvalReady: false
    };
  }

  const approveDecision = buildReviewEvidenceDecision("Approve Public", checklist, comment);
  const requestInfoDecision = buildReviewEvidenceDecision("Request More Info", checklist, comment);
  const riskFlags = reviewRiskFlags(asset);
  const missingFields = missingReviewFields(asset);
  const approveMissingLabels = reviewDecisionMissingLabels("Approve Public", checklist, comment);
  const firstMissing = approveMissingLabels[0] || missingFields[0];
  const nextBestAction = pending
    ? "Check pending ResourceSpace sync before making another decision."
    : approveDecision.ready
      ? "Queue approval only if public scope, consent, people/youth, and proof notes match real evidence."
      : requestInfoDecision.ready && approveMissingLabels.length > 3
        ? "Request changes or source verification; public approval still lacks full evidence."
        : firstMissing
          ? `Complete evidence: ${firstMissing}.`
          : "Review evidence and choose safest workflow action.";

  return {
    riskFlags,
    missingFields,
    approveMissingLabels,
    nextBestAction,
    blockedExplanation: approveDecision.ready
      ? "Public approval is unblocked in portal UI, but ResourceSpace remains final approval truth."
      : `Public approval blocked by ${approveMissingLabels.slice(0, 5).join(", ")}${approveMissingLabels.length > 5 ? "..." : ""}.`,
    syncHonesty: pending
      ? pending.message
      : asset.pendingReviewWrite
        ? `Existing pending write ${asset.pendingReviewWrite.id} is ${asset.pendingReviewWrite.syncState}. ResourceSpace may not reflect this portal state yet.`
        : "No pending ResourceSpace writeback. Any decision will queue/sync through current backend review flow.",
    syncTone: pending || asset.pendingReviewWrite ? "sync" as const : "ready" as const,
    approvalReady: approveDecision.ready
  };
}
