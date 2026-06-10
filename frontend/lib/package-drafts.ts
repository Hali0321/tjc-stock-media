import type { DamPackage, DamPackageSection, StockMediaAsset } from "@/lib/types";

export type PackageAssetStatus = string;

export type ResolvedPackageSection = DamPackageSection & {
  assets: StockMediaAsset[];
  missingResourceSpaceAssetIds: Array<string | number>;
};

export type PackagePublishReadiness = {
  canPublish: boolean;
  totalRefs: number;
  blockedRefs: number;
  missingRefs: number;
  reason: string;
};

export const defaultPackageSections: DamPackageSection[] = [
  { id: "cover", title: "Cover", resourceSpaceAssetIds: [] },
  { id: "hero-assets", title: "01. Hero Assets", resourceSpaceAssetIds: [] },
  { id: "social-media", title: "02. Social Media", resourceSpaceAssetIds: [] },
  { id: "documents", title: "03. Documents", resourceSpaceAssetIds: [] }
];

export function packageResourceRef(asset: StockMediaAsset): string {
  return String(asset.resourceSpaceId || asset.id);
}

export function createPackageDraft(title = "ResourceSpace Toolkit Draft"): DamPackage {
  return {
    id: "portal-local-draft",
    title,
    status: "draft",
    sections: defaultPackageSections.map((section) => ({ ...section, resourceSpaceAssetIds: [] }))
  };
}

export function packageHasRefs(draft: DamPackage) {
  return draft.sections.some((section) => section.resourceSpaceAssetIds.length > 0);
}

export function updatePackageTitle(draft: DamPackage, title: string): DamPackage {
  return {
    ...draft,
    title
  };
}

function sectionWithRefs(section: DamPackageSection, refs: Array<string | number>): DamPackageSection {
  return {
    ...section,
    resourceSpaceAssetIds: [...new Set(refs.map((ref) => String(ref)))]
  };
}

export function seedPackageDraft(draft: DamPackage, assets: StockMediaAsset[], statusOf: (asset: StockMediaAsset) => PackageAssetStatus): DamPackage {
  if (packageHasRefs(draft)) return draft;
  const approvedAssets = assets.filter((asset) => statusOf(asset) === "Approved");
  if (!approvedAssets.length) return draft;

  return {
    ...draft,
    sections: draft.sections.map((section) => {
      if (section.id === "cover") return sectionWithRefs(section, approvedAssets.slice(0, 1).map(packageResourceRef));
      if (section.id === "hero-assets") return sectionWithRefs(section, approvedAssets.filter((asset) => asset.mediaType === "photo").slice(0, 5).map(packageResourceRef));
      if (section.id === "social-media") return sectionWithRefs(section, approvedAssets.slice(5, 10).map(packageResourceRef));
      if (section.id === "documents") {
        return sectionWithRefs(
          section,
          approvedAssets
            .filter((asset) => asset.mediaType === "document" || asset.mediaType === "graphic")
            .slice(0, 5)
            .map(packageResourceRef)
        );
      }
      return section;
    })
  };
}

function buildAssetLookup(assets: StockMediaAsset[]) {
  const lookup = new Map<string, StockMediaAsset>();
  assets.forEach((asset) => {
    lookup.set(asset.id, asset);
    if (asset.resourceSpaceId) lookup.set(String(asset.resourceSpaceId), asset);
  });
  return lookup;
}

export function resolvePackageSections(draft: DamPackage, assets: StockMediaAsset[]): ResolvedPackageSection[] {
  const lookup = buildAssetLookup(assets);
  return draft.sections.map((section) => {
    const resolved = section.resourceSpaceAssetIds.map((id) => lookup.get(String(id))).filter((asset): asset is StockMediaAsset => Boolean(asset));
    const missing = section.resourceSpaceAssetIds.filter((id) => !lookup.has(String(id)));
    return {
      ...section,
      assets: resolved,
      missingResourceSpaceAssetIds: missing
    };
  });
}

export function addPackageAssetRef(draft: DamPackage, sectionId: string, asset: StockMediaAsset): DamPackage {
  const ref = packageResourceRef(asset);
  return {
    ...draft,
    sections: draft.sections.map((section) => (
      section.id === sectionId
        ? sectionWithRefs(section, [...section.resourceSpaceAssetIds, ref])
        : section
    ))
  };
}

export function removePackageAssetRef(draft: DamPackage, sectionId: string, asset: StockMediaAsset): DamPackage {
  const ref = packageResourceRef(asset);
  return {
    ...draft,
    sections: draft.sections.map((section) => (
      section.id === sectionId
        ? sectionWithRefs(section, section.resourceSpaceAssetIds.filter((id) => String(id) !== ref))
        : section
    ))
  };
}

export function availableAssetsForSection({
  draft,
  sectionId,
  assets,
  approvedOnly,
  statusOf
}: {
  draft: DamPackage;
  sectionId: string;
  assets: StockMediaAsset[];
  approvedOnly: boolean;
  statusOf: (asset: StockMediaAsset) => PackageAssetStatus;
}) {
  const activeRefs = new Set(draft.sections.find((section) => section.id === sectionId)?.resourceSpaceAssetIds.map((id) => String(id)) || []);
  return assets
    .filter((asset) => !activeRefs.has(packageResourceRef(asset)))
    .filter((asset) => !approvedOnly || statusOf(asset) === "Approved")
    .slice(0, 6);
}

export function packagePublishReadiness(draft: DamPackage, resolvedSections: ResolvedPackageSection[], statusOf: (asset: StockMediaAsset) => PackageAssetStatus): PackagePublishReadiness {
  const allAssets = resolvedSections.flatMap((section) => section.assets);
  const totalRefs = draft.sections.reduce((sum, section) => sum + section.resourceSpaceAssetIds.length, 0);
  const missingRefs = resolvedSections.reduce((sum, section) => sum + section.missingResourceSpaceAssetIds.length, 0);
  const blockedRefs = allAssets.filter((asset) => statusOf(asset) !== "Approved").length;

  if (!totalRefs) {
    return { canPublish: false, totalRefs, blockedRefs, missingRefs, reason: "Publish blocked until this package has ResourceSpace refs." };
  }
  if (missingRefs) {
    return { canPublish: false, totalRefs, blockedRefs, missingRefs, reason: "Publish blocked because some ResourceSpace refs no longer resolve." };
  }
  if (blockedRefs) {
    return { canPublish: false, totalRefs, blockedRefs, missingRefs, reason: "Publish blocked until all refs are approved." };
  }
  return { canPublish: true, totalRefs, blockedRefs, missingRefs, reason: "All refs pass current approval check." };
}
