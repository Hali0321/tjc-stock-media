import { buildPortalReuseDecision } from "@/lib/portal-reuse-decision";
import { canContribute } from "@/lib/permissions";
import type { DemoRole, StockMediaAsset } from "@/lib/types";

export type BrandKitGovernance = {
  canPreview: boolean;
  canShare: boolean;
  canDownloadKit: boolean;
  configured: boolean;
  totalAssets: number;
  portalReadyAssets: number;
  internalOnlyAssets: number;
  reviewRequiredAssets: number;
  missingSectionMappings: number;
  blockers: string[];
  summary: string;
  commands: Array<{
    label: string;
    status: "ready" | "blocked" | "review";
    detail: string;
  }>;
};

function command(label: string, ready: boolean, detail: string, review = false): BrandKitGovernance["commands"][number] {
  return {
    label,
    status: ready ? "ready" : review ? "review" : "blocked",
    detail
  };
}

function roleCanShareInternal(role: DemoRole) {
  return canContribute(role);
}

export function buildBrandKitGovernance({
  configured,
  assets,
  role,
  missingSectionMappings,
  warnings
}: {
  configured: boolean;
  assets: StockMediaAsset[];
  role: DemoRole;
  missingSectionMappings: number;
  warnings: string[];
}): BrandKitGovernance {
  const decisions = assets.map((asset) => buildPortalReuseDecision(asset, role));
  const portalReadyAssets = decisions.filter((item) => item.reuse.state === "portal-ready").length;
  const internalOnlyAssets = decisions.filter((item) => item.reuse.state === "internal-ready").length;
  const reviewRequiredAssets = decisions.filter((item) => item.reuse.state !== "portal-ready" && item.reuse.state !== "internal-ready").length;
  const canPreview = configured && assets.length > 0 && decisions.every((item) => item.access.viewDetailPreview.allowed);
  const canShare = canPreview && decisions.every((item) => item.reuse.state === "portal-ready" || (item.reuse.state === "internal-ready" && roleCanShareInternal(role)));
  const canDownloadKit = configured && assets.length > 0 && decisions.every((item) => item.reuse.state === "portal-ready");
  const blockers = [
    ...warnings,
    ...(!configured ? ["Brand kit collection is not configured."] : []),
    ...(configured && !assets.length ? ["Brand kit collection has no role-visible mapped assets."] : []),
    ...(internalOnlyAssets ? [`${internalOnlyAssets} assets are internal-only.`] : []),
    ...(reviewRequiredAssets ? [`${reviewRequiredAssets} assets need review before kit download.`] : [])
  ];
  const summary = canDownloadKit
    ? `${portalReadyAssets} of ${assets.length} assets are Portal Ready for kit download.`
    : `${portalReadyAssets} of ${assets.length} assets are Portal Ready; ${blockers.length} blockers remain.`;

  return {
    canPreview,
    canShare,
    canDownloadKit,
    configured,
    totalAssets: assets.length,
    portalReadyAssets,
    internalOnlyAssets,
    reviewRequiredAssets,
    missingSectionMappings,
    blockers: [...new Set(blockers)],
    summary,
    commands: [
      command("Preview", canPreview, canPreview ? "Mapped assets can render role-safe previews." : "Preview waits for configured collection and visible assets.", configured && assets.length > 0),
      command("Share", canShare, canShare ? "Kit can be shared within current role policy." : "Share waits for Portal Ready or role-allowed internal assets.", configured && assets.length > 0),
      command("Download kit", canDownloadKit, canDownloadKit ? "All mapped assets are Portal Ready. Source records stay canonical." : "ZIP export stays disabled until every mapped asset is Portal Ready.", configured)
    ]
  };
}
