import { normalizeResourceSpaceRecord, type ResourceSpaceRecord } from "@/lib/resourcespace-schema";
import type { StockMediaAsset } from "@/lib/types";

export function mapMetadataRowToAsset(row: ResourceSpaceRecord): StockMediaAsset {
  return normalizeResourceSpaceRecord(row);
}
