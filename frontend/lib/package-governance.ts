import type { DemoRole, DamPackage, ReuseBlocker, ReuseState, StockMediaAsset } from "@/lib/types";
import type { ResolvedPackageSection } from "@/lib/package-drafts";
import { buildPortalReuseDecision } from "@/lib/portal-reuse-decision";
import { canContribute, canReview } from "@/lib/permissions";
import { packageAssetRef as normalizedPackageAssetRef } from "@/lib/package-refs";
import { assetForRolePayload } from "@/lib/source-redaction";

export type PackageGovernanceAsset = {
  ref: string;
  sectionId: string;
  sectionTitle: string;
  asset: StockMediaAsset;
  reuseState: ReuseState;
  reuseLabel: string;
  canPreview: boolean;
  canDownload: boolean;
  publishReady: boolean;
  shareReady: boolean;
  blockers: ReuseBlocker[];
  reason: string;
};

export type PackageGovernanceSection = {
  id: string;
  title: string;
  totalRefs: number;
  resolvedRefs: number;
  missingRefs: Array<string | number>;
  readinessScore: number;
  readinessStatus: "ready" | "review" | "blocked" | "empty";
  readinessSummary: string;
  portalReadyRefs: number;
  internalOnlyRefs: number;
  reviewRequiredRefs: number;
  blockedRefs: number;
  blockers: string[];
  assets: PackageGovernanceAsset[];
};

export type PackageGovernancePacket = {
  role: DemoRole;
  canPreview: boolean;
  canShare: boolean;
  canPublish: boolean;
  totalRefs: number;
  resolvedRefs: number;
  missingRefs: number;
  readinessScore: number;
  readinessLabel: string;
  readinessStatus: "ready" | "review" | "blocked" | "empty";
  portalReadyRefs: number;
  internalOnlyRefs: number;
  reviewRequiredRefs: number;
  blockedRefs: number;
  reason: string;
  auditMessage: string;
  commandCenter: Array<{
    label: string;
    status: "ready" | "blocked" | "review";
    detail: string;
  }>;
  sections: PackageGovernanceSection[];
};

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function roleCanShareInternal(role: DemoRole) {
  return canContribute(role);
}

function opsView(role: DemoRole) {
  return canReview(role);
}

function assetReason(asset: StockMediaAsset, blockers: ReuseBlocker[]) {
  if (!blockers.length) return asset.usageGuidance || "Portal reuse checks pass.";
  return blockers.map((blocker) => blocker.label).join(", ");
}

function packageGovernanceRef(asset: StockMediaAsset) {
  return normalizedPackageAssetRef(asset) || "media-reference";
}

function classifyAsset(sectionId: string, sectionTitle: string, asset: StockMediaAsset, role: DemoRole): PackageGovernanceAsset {
  const packet = buildPortalReuseDecision(asset, role);
  const ref = packageGovernanceRef(asset);
  const portalReady = packet.reuse.state === "portal-ready";
  const internalReady = packet.reuse.state === "internal-ready";
  const canShare = portalReady || (internalReady && roleCanShareInternal(role));

  return {
    ref,
    sectionId,
    sectionTitle,
    asset: assetForRolePayload(role, asset),
    reuseState: packet.reuse.state,
    reuseLabel: packet.reuse.label,
    canPreview: packet.access.viewDetailPreview.allowed,
    canDownload: packet.access.downloadApprovedCopy.allowed,
    publishReady: portalReady,
    shareReady: canShare,
    blockers: packet.reuse.blockers,
    reason: assetReason(asset, packet.reuse.blockers)
  };
}

function command(label: string, ready: boolean, detail: string, review = false): PackageGovernancePacket["commandCenter"][number] {
  return {
    label,
    status: ready ? "ready" : review ? "review" : "blocked",
    detail
  };
}

function readinessScore(totalRefs: number, portalReadyRefs: number) {
  return totalRefs ? Math.round((portalReadyRefs / totalRefs) * 100) : 0;
}

function readinessStatus({
  totalRefs,
  missingRefs,
  blockedRefs
}: {
  totalRefs: number;
  missingRefs: number;
  blockedRefs: number;
}): PackageGovernancePacket["readinessStatus"] {
  if (!totalRefs) return "empty";
  if (missingRefs) return "blocked";
  if (blockedRefs) return "review";
  return "ready";
}

function readinessLabel(status: PackageGovernancePacket["readinessStatus"], score: number) {
  if (status === "empty") return "Add refs";
  if (status === "blocked") return "Refs missing";
  if (status === "review") return `${score}% publish-ready`;
  return "Ready to publish";
}

function sectionReadinessSummary(section: {
  totalRefs: number;
  missingRefs: Array<string | number>;
  portalReadyRefs: number;
  internalOnlyRefs: number;
  reviewRequiredRefs: number;
}) {
  if (!section.totalRefs) return "No refs selected. Section will stay out of package output.";
  if (section.missingRefs.length) return `${section.missingRefs.length} ref${section.missingRefs.length === 1 ? "" : "s"} no longer resolves.`;
  if (section.reviewRequiredRefs) return `${section.reviewRequiredRefs} ref${section.reviewRequiredRefs === 1 ? "" : "s"} need rights review before publish.`;
  if (section.internalOnlyRefs) return `${section.internalOnlyRefs} internal-only ref${section.internalOnlyRefs === 1 ? "" : "s"} block public publish.`;
  return `${section.portalReadyRefs}/${section.totalRefs} refs are Portal Ready.`;
}

export function buildPackageGovernance(draft: DamPackage, resolvedSections: ResolvedPackageSection[], role: DemoRole): PackageGovernancePacket {
  const canSeeOpsCopy = opsView(role);
  const sections = resolvedSections.map((section): PackageGovernanceSection => {
    const assets = section.assets.map((asset) => classifyAsset(section.id, section.title, asset, role));
    const portalReadyRefs = assets.filter((item) => item.reuseState === "portal-ready").length;
    const internalOnlyRefs = assets.filter((item) => item.reuseState === "internal-ready").length;
    const reviewRequiredRefs = assets.filter((item) => item.reuseState !== "portal-ready" && item.reuseState !== "internal-ready").length;
    const blockedRefs = section.missingResourceSpaceAssetIds.length + internalOnlyRefs + reviewRequiredRefs;
    const blockers = uniqueStrings([
      ...section.missingResourceSpaceAssetIds.map((ref) => canSeeOpsCopy ? `Missing ResourceSpace ref ${ref}` : `Missing media reference ${ref}`),
      ...assets.flatMap((item) => item.publishReady ? [] : [`${item.ref}: ${item.reason}`])
    ]);
    const sectionScore = readinessScore(section.resourceSpaceAssetIds.length, portalReadyRefs);
    const sectionStatus = readinessStatus({
      totalRefs: section.resourceSpaceAssetIds.length,
      missingRefs: section.missingResourceSpaceAssetIds.length,
      blockedRefs
    });

    return {
      id: section.id,
      title: section.title,
      totalRefs: section.resourceSpaceAssetIds.length,
      resolvedRefs: section.assets.length,
      missingRefs: section.missingResourceSpaceAssetIds,
      readinessScore: sectionScore,
      readinessStatus: sectionStatus,
      readinessSummary: sectionReadinessSummary({
        totalRefs: section.resourceSpaceAssetIds.length,
        missingRefs: section.missingResourceSpaceAssetIds,
        portalReadyRefs,
        internalOnlyRefs,
        reviewRequiredRefs
      }),
      portalReadyRefs,
      internalOnlyRefs,
      reviewRequiredRefs,
      blockedRefs,
      blockers,
      assets
    };
  });

  const totalRefs = draft.sections.reduce((sum, section) => sum + section.resourceSpaceAssetIds.length, 0);
  const allAssets = sections.flatMap((section) => section.assets);
  const resolvedRefs = allAssets.length;
  const missingRefs = sections.reduce((sum, section) => sum + section.missingRefs.length, 0);
  const portalReadyRefs = allAssets.filter((item) => item.reuseState === "portal-ready").length;
  const internalOnlyRefs = allAssets.filter((item) => item.reuseState === "internal-ready").length;
  const reviewRequiredRefs = allAssets.filter((item) => item.reuseState !== "portal-ready" && item.reuseState !== "internal-ready").length;
  const blockedRefs = missingRefs + internalOnlyRefs + reviewRequiredRefs;
  const hasRefs = totalRefs > 0;
  const refNoun = canSeeOpsCopy ? "refs" : "references";
  const canPreview = hasRefs && missingRefs === 0 && allAssets.every((item) => item.canPreview);
  const canShare = canPreview && allAssets.every((item) => item.shareReady);
  const canPublish = hasRefs && missingRefs === 0 && allAssets.every((item) => item.publishReady);
  const packageScore = readinessScore(totalRefs, portalReadyRefs);
  const packageStatus = readinessStatus({ totalRefs, missingRefs, blockedRefs });
  const reason = !hasRefs
    ? `Package needs media ${refNoun} before preview, share, or publish.`
    : missingRefs
      ? `Package has media ${refNoun} that no longer resolve.`
      : internalOnlyRefs
        ? "Publish blocked because some refs are Internal ready only."
        : reviewRequiredRefs
          ? "Publish blocked until every ref is Portal Ready."
          : "Every ref is Portal Ready for package publishing.";

  return {
    role,
    canPreview,
    canShare,
    canPublish,
    totalRefs,
    resolvedRefs,
    missingRefs,
    readinessScore: packageScore,
    readinessLabel: readinessLabel(packageStatus, packageScore),
    readinessStatus: packageStatus,
    portalReadyRefs,
    internalOnlyRefs,
    reviewRequiredRefs,
    blockedRefs,
    reason,
    auditMessage: `Package governance: ${portalReadyRefs}/${totalRefs} Portal Ready, ${internalOnlyRefs} internal-only, ${reviewRequiredRefs} review-required, ${missingRefs} missing.`,
    commandCenter: [
      command("Preview package", canPreview, canPreview ? `All ${refNoun} can render a role-safe preview.` : `Preview waits for resolvable ${refNoun} and role-safe previews.`, !canPreview && hasRefs),
      command("Prepare share packet", canShare, canShare ? "Share stays policy-scoped; no public link is created here." : `Share waits for Portal Ready ${refNoun} or internal-ready ${refNoun} allowed for this role.`, !canShare && hasRefs),
      command("Queue publish review", canPublish, canPublish ? (canSeeOpsCopy ? "All refs are Portal Ready; ResourceSpace originals stay canonical." : "All references are Portal Ready; original files stay protected.") : reason, !canPublish && hasRefs)
    ],
    sections
  };
}
