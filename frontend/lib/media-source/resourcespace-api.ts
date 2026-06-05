import { hasResourceSpaceApiConfig } from "@/lib/env";
import type { MediaSourceStatus, StockMediaAsset } from "@/lib/types";

export const resourceSpaceApiStatus: MediaSourceStatus = {
  adapter: "resourcespace-api",
  label: "ResourceSpace API",
  detail: "ResourceSpace API config is present. Server routes may call ResourceSpace without exposing credentials to the browser.",
  readOnly: false
};

export async function getAssetsFromResourceSpaceApi(): Promise<StockMediaAsset[] | null> {
  if (!hasResourceSpaceApiConfig()) return null;

  // TODO: Implement signed ResourceSpace API requests after field refs are confirmed.
  // Until then, keep this adapter non-authoritative instead of inventing a second database.
  return null;
}

export async function updateResourceReviewStatus() {
  if (!hasResourceSpaceApiConfig()) {
    return {
      ok: false,
      status: 409,
      message: "ResourceSpace API write config is not available. Use ResourceSpace admin for final approval."
    };
  }

  return {
    ok: false,
    status: 501,
    message: "ResourceSpace write bridge needs signed API field mapping before status changes can persist."
  };
}
