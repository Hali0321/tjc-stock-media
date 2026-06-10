import { NextRequest, NextResponse } from "next/server";
import { brandKitCollectionId } from "@/lib/env";
import { getActiveMediaSource } from "@/lib/media-source";
import { canSeeAsset, normalizeRole } from "@/lib/permissions";
import { assetForRolePayload, sourceForRole } from "@/lib/source-redaction";
import { sourceIsLive, sourceKind } from "@/lib/source-status";
import type { StockMediaAsset } from "@/lib/types";

export const dynamic = "force-dynamic";

const brandKitConfigs = {
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
} as const;

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const kitId = (await params).id;
  const config = brandKitConfigs[kitId as keyof typeof brandKitConfigs];
  if (!config) {
    return NextResponse.json({ error: "Unknown brand kit." }, { status: 404 });
  }

  const role = normalizeRole(request.nextUrl.searchParams.get("role"));
  const { assets, status } = await getActiveMediaSource();
  const source = sourceForRole(role, status);
  const collectionId = brandKitCollectionId(config.collectionEnvKey);
  const sectionMappings = config.sections.map((section) => ({
    ...section,
    resourceSpaceCollectionId: brandKitCollectionId(section.envKey),
    configured: Boolean(brandKitCollectionId(section.envKey))
  }));

  const matchedAssets = collectionId
    ? assets
      .filter((asset) => assetMatchesCollection(asset, collectionId))
      .filter((asset) => canSeeAsset(role, asset))
      .slice(0, 36)
      .map((asset) => assetForRolePayload(role, asset))
    : [];

  const warnings = [
    ...(!collectionId ? [`Missing ${config.collectionEnvKey}`] : []),
    ...(collectionId && !matchedAssets.length ? [`Configured ${config.collectionEnvKey}, but no exported ResourceSpace records matched collection/source membership ${collectionId}.`] : []),
    ...sectionMappings.filter((section) => !section.configured).map((section) => `Missing ${section.envKey}`)
  ];

  return NextResponse.json({
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
    source,
    sourceKind: sourceKind(source),
    live: sourceIsLive(source),
    warnings: [...new Set(warnings)]
  });
}
