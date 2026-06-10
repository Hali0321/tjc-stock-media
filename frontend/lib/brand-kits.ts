import { brandKitCollectionId } from "@/lib/env";
import { getMediaSourceSession } from "@/lib/media-source/session";
import { canSeeAsset } from "@/lib/permissions";
import { assetForRolePayload } from "@/lib/source-redaction";
import type { DemoRole, StockMediaAsset } from "@/lib/types";

export type BrandKitSectionConfig = {
  id: string;
  title: string;
  envKey: string;
};

export type BrandKitConfig = {
  id: string;
  title: string;
  owner: string;
  reviewDate?: string;
  collectionEnvKey: string;
  sections: BrandKitSectionConfig[];
};

export type BrandKitSectionMapping = BrandKitSectionConfig & {
  resourceSpaceCollectionId: string;
  configured: boolean;
};

export const brandKitConfigs = {
  "easter-2024": {
    id: "easter-2024",
    title: "Easter at TJC 2024",
    owner: "Brand Team",
    reviewDate: "2025-03-01",
    collectionEnvKey: "BRAND_KIT_EASTER_2024_COLLECTION_ID",
    sections: [
      { id: "logos", title: "Logo usage", envKey: "BRAND_KIT_LOGO_COLLECTION_ID" },
      { id: "social", title: "Social templates", envKey: "BRAND_KIT_SOCIAL_TEMPLATES_COLLECTION_ID" },
      { id: "downloads", title: "Approved downloads", envKey: "BRAND_KIT_EASTER_2024_COLLECTION_ID" }
    ]
  }
} satisfies Record<string, BrandKitConfig>;

export function getBrandKitConfig(id: string) {
  return brandKitConfigs[id as keyof typeof brandKitConfigs] || null;
}

function assetMatchesCollection(asset: StockMediaAsset, collectionId: string) {
  const normalized = collectionId.trim().toLowerCase();
  if (!normalized) return false;
  return [
    asset.collection,
    asset.sourceAlbumPath,
    asset.sourcePath,
    ...(asset.sourceAlbumMemberships || [])
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalized));
}

function buildSectionMappings(config: BrandKitConfig): BrandKitSectionMapping[] {
  return config.sections.map((section) => {
    const resourceSpaceCollectionId = brandKitCollectionId(section.envKey);
    return {
      ...section,
      resourceSpaceCollectionId,
      configured: Boolean(resourceSpaceCollectionId)
    };
  });
}

function buildBrandKitWarnings({
  config,
  collectionId,
  matchedAssetCount,
  sectionMappings
}: {
  config: BrandKitConfig;
  collectionId: string;
  matchedAssetCount: number;
  sectionMappings: BrandKitSectionMapping[];
}) {
  return [
    ...(!collectionId ? [`Missing ${config.collectionEnvKey}`] : []),
    ...(collectionId && !matchedAssetCount ? [`Configured ${config.collectionEnvKey}, but no exported ResourceSpace records matched collection/source membership ${collectionId}.`] : []),
    ...sectionMappings.filter((section) => !section.configured).map((section) => `Missing ${section.envKey}`)
  ];
}

export async function buildBrandKitResponse(config: BrandKitConfig, role: DemoRole) {
  const { assets, ...envelope } = await getMediaSourceSession(role);
  const collectionId = brandKitCollectionId(config.collectionEnvKey);
  const sectionMappings = buildSectionMappings(config);

  const matchedAssets = collectionId
    ? assets
      .filter((asset) => assetMatchesCollection(asset, collectionId))
      .filter((asset) => canSeeAsset(role, asset))
      .slice(0, 36)
      .map((asset) => assetForRolePayload(role, asset))
    : [];

  return {
    kit: {
      id: config.id,
      title: config.title,
      owner: config.owner,
      reviewDate: config.reviewDate,
      resourceSpaceCollectionId: collectionId || null,
      collectionEnvKey: config.collectionEnvKey,
      configured: Boolean(collectionId),
      sections: sectionMappings
    },
    assets: matchedAssets,
    ...envelope,
    warnings: [...new Set(buildBrandKitWarnings({
      config,
      collectionId,
      matchedAssetCount: matchedAssets.length,
      sectionMappings
    }))]
  };
}
