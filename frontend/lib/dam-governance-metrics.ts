import {
  assetHasChildrenYouthRisk,
  assetHasHymnMusicRisk,
  assetHasRenditionGap,
  assetHasSensitiveContext,
  assetHasTestimonyRisk,
  assetIsDuplicateCandidate,
  assetIsPortalReady,
  assetNeedsRightsReview,
  assetNeedsSourceReview,
  assetNeedsStaleApprovalReview,
  buildDuplicateGroupCounts
} from "@/lib/asset-governance";
import type { AuditEventRecord } from "@/lib/audit-log";
import type { StockMediaAsset } from "@/lib/types";

export type GovernanceMetricStatus = "available" | "unavailable" | "stale";

export type GovernanceMetric = {
  id: string;
  label: string;
  count: number | null;
  status: GovernanceMetricStatus;
  detail: string;
  action: string;
};

export type GovernanceMetricsInput = {
  assets: StockMediaAsset[];
  auditEvents?: AuditEventRecord[];
  usageAnalytics?: {
    enabled: boolean;
    totalEvents: number;
    storageMode: string;
    topSearches?: Array<{ label: string; value: number }>;
  };
  packageDiagnostics?: {
    count: number;
    blockedRefs: number;
    productionReadySharing?: boolean;
  };
};

function hasDoctrineSacramentRisk(asset: StockMediaAsset) {
  return Boolean(asset.doctrineSacramentTheme || asset.sensitivityClass === "sacrament-sensitive");
}

function hasMissingNotice(asset: StockMediaAsset) {
  return assetHasHymnMusicRisk(asset) && !asset.requiredNotice;
}

function hasWithdrawalOrTakedown(asset: StockMediaAsset) {
  return Boolean(asset.withdrawalStatus && asset.withdrawalStatus !== "active");
}

function metric(id: string, label: string, count: number, detail: string, action: string): GovernanceMetric {
  return { id, label, count, status: "available", detail, action };
}

function unavailableMetric(id: string, label: string, detail: string, action: string): GovernanceMetric {
  return { id, label, count: null, status: "unavailable", detail, action };
}

export function auditCoverageMetrics(events: AuditEventRecord[] = []): GovernanceMetric[] {
  const countType = (types: string[]) => events.filter((event) => types.includes(event.type)).length;
  return [
    metric(
      "audit-approved-downloads",
      "Approved-copy downloads",
      countType(["approved_download"]),
      "Approved-copy download audit events recorded by the portal.",
      "Keep approved-copy downloads behind ticketed POST/GET gate and audit."
    ),
    metric(
      "audit-blocked-downloads",
      "Blocked downloads",
      countType(["denied_download", "download_gate_checked"]),
      "Denied or blocked download attempts recorded by the portal.",
      "Review blocked-download patterns without exposing source files."
    ),
    metric(
      "audit-package-decisions",
      "Package decisions",
      countType(["package_export_blocked", "package_export_approved", "package_share_decision", "package_draft_saved"]),
      "Package draft/export/share accountability events.",
      "Use package audit as accountability evidence, not permission truth."
    ),
    metric(
      "audit-review-throughput",
      "Review actions",
      countType(["review_pending_write_queued", "resourcespace_write_succeeded", "resourcespace_write_failed"]),
      "Review actions and ResourceSpace write attempts visible in portal audit.",
      "Confirm live ResourceSpace writeback by re-read before treating decisions as final."
    )
  ];
}

export function usageHealthMetrics(usage?: GovernanceMetricsInput["usageAnalytics"]): GovernanceMetric[] {
  if (!usage?.enabled) {
    return [
      unavailableMetric(
        "usage-analytics",
        "Usage analytics",
        "Usage analytics is disabled or unavailable; search and zero-result trends must not be reported as zero-success.",
        "Enable durable usage logging before reporting top searches, zero-result searches, or trend metrics."
      )
    ];
  }
  return [
    metric(
      "usage-events",
      "Usage events",
      usage.totalEvents,
      `Usage analytics is enabled with ${usage.storageMode}.`,
      usage.totalEvents ? "Review real usage trends." : "Wait for real events before drawing conclusions."
    ),
    usage.topSearches?.length
      ? metric("usage-top-searches", "Top searches", usage.topSearches.length, "Top search terms are available from recorded usage events.", "Review searches for vocabulary gaps.")
      : unavailableMetric("usage-zero-results", "Zero-result searches", "Zero-result search tracking is not modeled separately yet.", "Add durable zero-result logging before reporting zero-result rates.")
  ];
}

export function buildGovernanceMetrics({
  assets,
  auditEvents = [],
  usageAnalytics,
  packageDiagnostics
}: GovernanceMetricsInput): GovernanceMetric[] {
  const duplicateCounts = buildDuplicateGroupCounts(assets);
  const rawApprovedBlocked = assets.filter((asset) => asset.status === "Approved Public" && !assetIsPortalReady(asset)).length;
  const doctrineSacrament = assets.filter(hasDoctrineSacramentRisk).length;
  const testimonyPastoral = assets.filter(assetHasTestimonyRisk).length;
  const hymnMusic = assets.filter(assetHasHymnMusicRisk).length;
  const missingNotice = assets.filter(hasMissingNotice).length;
  const withdrawalTakedown = assets.filter(hasWithdrawalOrTakedown).length;

  return [
    metric("raw-approved-blocked", "Raw Approved Public blocked", rawApprovedBlocked, "Approved Public assets still blocked by portal-ready policy.", "Clear mature DAM blockers before reuse."),
    metric("rights-review-backlog", "Rights review backlog", assets.filter(assetNeedsRightsReview).length, "Assets missing rights, consent, or public-use confidence.", "Resolve rights basis and usage scope in ResourceSpace."),
    metric("minors-consent-backlog", "Minors/consent backlog", assets.filter(assetHasChildrenYouthRisk).length, "Youth/minors-sensitive assets need consent and RE/minors review.", "Attach consent/release evidence or keep out of public reuse."),
    metric("doctrine-sacrament-backlog", "Doctrine/sacrament backlog", doctrineSacrament, "Doctrine or sacrament-sensitive records need domain review.", "Route to doctrine reviewer before public/channel reuse."),
    metric("testimony-pastoral-backlog", "Testimony/pastoral backlog", testimonyPastoral, "Testimony or pastoral-sensitive records need careful review.", "Route to pastoral sensitivity review."),
    metric("hymn-music-backlog", "Hymn/music backlog", hymnMusic, "Hymn/music records need rights basis, channels, notice, and music-rights review.", "Resolve music-rights evidence."),
    metric("required-notice-gaps", "Required notice gaps", missingNotice, "Hymn/music/publication records missing required notice.", "Add required notice before channel reuse."),
    metric("stale-lifecycle", "Stale or expired lifecycle", assets.filter(assetNeedsStaleApprovalReview).length, "Stale, expired, embargoed, or recheck-due records stay visible.", "Send stale lifecycle records back to review."),
    metric("withdrawal-takedown", "Withdrawal/takedown records", withdrawalTakedown, "Withdrawn, expired, embargoed, or takedown-requested records block reuse.", "Keep visible to reviewers/admins without normal download."),
    metric("missing-derivatives", "Missing approved derivatives", assets.filter(assetHasRenditionGap).length, "Assets missing approved-copy/detail derivative evidence.", "Generate or map governed derivatives before reuse."),
    metric("missing-source", "Missing source/provenance", assets.filter(assetNeedsSourceReview).length, "Assets missing source/provenance evidence.", "Restore source, custody, checksum, or ResourceSpace field mapping."),
    metric("duplicate-candidates", "Duplicate/canonical candidates", assets.filter((asset) => assetIsDuplicateCandidate(asset, duplicateCounts)).length, "Duplicate hints remain reviewer/admin workflow, not auto-delete.", "Canonicalize without deleting source appearances."),
    metric("sensitive-context", "Sensitive-context blockers", assets.filter(assetHasSensitiveContext).length, "Sensitive TJC contexts must stay review-visible.", "Route to matching domain reviewer."),
    packageDiagnostics
      ? metric("package-blockers", "Package/share blockers", packageDiagnostics.blockedRefs, "Package/share readiness is based on item-level policy checks.", "Clear every blocked item before export/share.")
      : unavailableMetric("package-blockers", "Package/share blockers", "Package diagnostics are unavailable.", "Use package readiness storage before reporting package blockers."),
    packageDiagnostics?.productionReadySharing === true
      ? metric("package-durable-sharing", "Durable package sharing", packageDiagnostics.count, "Package sharing storage is reported available.", "Verify retention, audit, expiry, and revocation.")
      : unavailableMetric("package-durable-sharing", "Durable package sharing", packageDiagnostics
        ? "Package draft storage is local/readiness only; production sharing is not configured."
        : "Package sharing diagnostics are unavailable.",
      "Configure durable storage before enabling live share links."),
    ...auditCoverageMetrics(auditEvents),
    ...usageHealthMetrics(usageAnalytics)
  ];
}
