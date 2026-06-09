import { decideAccess } from "@/lib/access-decisions";
import { assetDisplayTitle } from "@/lib/presentation";
import { buildReuseDecision } from "@/lib/reuse-policy";
import type { DemoRole, ReuseBlocker, StockMediaAsset } from "@/lib/types";

export type ViewerVerdictLabel =
  | "Ready to use"
  | "Review required before use"
  | "Source file restricted"
  | "Request access"
  | "Not available yet";

export type ViewerVerdictTone = "ready" | "review" | "restricted" | "request" | "unavailable";

export type ViewerVerdict = {
  label: ViewerVerdictLabel;
  tone: ViewerVerdictTone;
  title: string;
  reason: string;
  primaryAction: string;
  secondaryActions: string[];
  canDownload: boolean;
  downloadHref: string;
  blockers: ReuseBlocker[];
};

function plainReason(blockers: ReuseBlocker[]) {
  if (blockers.some((item) => item.code === "blocked-rights")) return "Rights or permission details need review.";
  if (blockers.some((item) => item.code === "blocked-people-minors")) return "People or youth visibility needs review.";
  if (blockers.some((item) => item.code === "blocked-derivative")) return "An approved copy is missing.";
  if (blockers.some((item) => item.code === "blocked-source")) return "Source information needs confirmation.";
  if (blockers.some((item) => item.code === "blocked-sensitive")) return "Ministry context needs review.";
  if (blockers.some((item) => item.code === "blocked-reviewer-date")) return "Reviewer evidence is incomplete.";
  if (blockers.some((item) => item.code === "blocked-archive")) return "This record is kept for reference only.";
  if (blockers.some((item) => item.code === "blocked-do-not-use")) return "This media is not available for reuse.";
  return "A reviewer must approve reuse before normal download.";
}

export function viewerVerdictForAsset(asset: StockMediaAsset, role: DemoRole): ViewerVerdict {
  const reuse = buildReuseDecision(asset);
  const download = decideAccess(role, "downloadApprovedCopy", asset);
  const canDownload = download.allowed;
  const blockers = reuse.blockers;
  const downloadHref = `/api/download/${asset.id}?role=${encodeURIComponent(role)}`;
  const sourceRestricted = blockers.some((item) => item.code === "blocked-source" || item.code === "blocked-derivative");
  const unavailable = blockers.some((item) => item.code === "blocked-archive" || item.code === "blocked-do-not-use");
  const accessOnly = blockers.some((item) => item.code === "blocked-sensitive");

  if (canDownload) {
    return {
      label: "Ready to use",
      tone: "ready",
      title: "Ready to use",
      reason: asset.usageGuidance || "Approved copy available. Check use guidance before sharing.",
      primaryAction: "Download approved copy",
      secondaryActions: ["Copy credit", "View use guidance"],
      canDownload,
      downloadHref,
      blockers
    };
  }

  if (unavailable) {
    return {
      label: "Not available yet",
      tone: "unavailable",
      title: "Not available yet",
      reason: plainReason(blockers),
      primaryAction: "Request DAM review",
      secondaryActions: ["Ask media team"],
      canDownload,
      downloadHref,
      blockers
    };
  }

  if (sourceRestricted) {
    return {
      label: "Source file restricted",
      tone: "restricted",
      title: "Source file restricted",
      reason: plainReason(blockers),
      primaryAction: "Request DAM review",
      secondaryActions: ["Ask media team", "Request source-file access"],
      canDownload,
      downloadHref,
      blockers
    };
  }

  if (accessOnly) {
    return {
      label: "Request access",
      tone: "request",
      title: "Request access",
      reason: plainReason(blockers),
      primaryAction: "Request DAM review",
      secondaryActions: ["Ask media team"],
      canDownload,
      downloadHref,
      blockers
    };
  }

  return {
    label: "Review required before use",
    tone: "review",
    title: "Review required before use",
    reason: plainReason(blockers),
    primaryAction: "Request DAM review",
    secondaryActions: ["Ask media team", "Request source-file access"],
    canDownload,
    downloadHref,
    blockers
  };
}

export function requestReviewMailto(asset: StockMediaAsset) {
  const title = assetDisplayTitle(asset);
  const recordId = asset.resourceSpaceId || asset.id;
  return `mailto:media@tjc.org?subject=${encodeURIComponent(`Request DAM review for ${title}`)}&body=${encodeURIComponent(`Reference code: ${recordId}\nAsset: ${title}\nReason: `)}`;
}
