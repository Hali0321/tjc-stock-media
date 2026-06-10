import type { NextRequest } from "next/server";
import { sourceEnvelope, roleSourceEnvelope } from "@/lib/media-source/session";
import { requestIdentity } from "@/lib/request-identity";
import { assetForRolePayload, savedViewsForRolePayload } from "@/lib/source-redaction";
import { recordUsageEvent, type UsageEventInput } from "@/lib/usage-analytics";
import type { MediaSourceStatus, SavedViewSummary, StockMediaAsset } from "@/lib/types";

type RouteUsageInput = Omit<UsageEventInput, "role" | "actor"> & {
  actor?: string;
};

export function createDamRouteSession(request: NextRequest, explicitRole?: string | null) {
  const identity = requestIdentity(request, explicitRole);
  const role = identity.role;

  return {
    identity,
    role,
    sourceEnvelope(source: MediaSourceStatus) {
      return roleSourceEnvelope(role, source);
    },
    rawSourceEnvelope(source: MediaSourceStatus) {
      return sourceEnvelope(source);
    },
    assetPayload(asset: StockMediaAsset) {
      return assetForRolePayload(role, asset);
    },
    assetsPayload(assets: StockMediaAsset[]) {
      return assets.map((asset) => assetForRolePayload(role, asset));
    },
    savedViewsPayload(views: SavedViewSummary[]) {
      return savedViewsForRolePayload(role, views);
    },
    recordUsage(event: RouteUsageInput) {
      return recordUsageEvent({
        ...event,
        role,
        actor: event.actor || identity.id
      });
    }
  };
}
