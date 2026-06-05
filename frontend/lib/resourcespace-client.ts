import { resourceSpaceBaseUrl } from "@/lib/env";

export function resourceSpaceAssetUrl(id: string) {
  return `${resourceSpaceBaseUrl()}/pages/view.php?ref=${encodeURIComponent(id)}`;
}

export function resourceSpaceAdminUrl() {
  return resourceSpaceBaseUrl();
}
