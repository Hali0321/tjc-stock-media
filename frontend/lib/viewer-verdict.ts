import { assetDisplayTitle } from "@/lib/presentation";
import type { StockMediaAsset } from "@/lib/types";

export {
  viewerVerdictForAsset
} from "@/lib/portal-reuse-decision";

export type {
  ViewerVerdict,
  ViewerVerdictLabel,
  ViewerVerdictTone
} from "@/lib/portal-reuse-decision";

export function requestReviewMailto(asset: StockMediaAsset) {
  const title = assetDisplayTitle(asset);
  const recordId = asset.resourceSpaceId || asset.id;
  return `mailto:media@tjc.org?subject=${encodeURIComponent(`Request DAM review for ${title}`)}&body=${encodeURIComponent(`Reference code: ${recordId}\nAsset: ${title}\nReason: `)}`;
}
