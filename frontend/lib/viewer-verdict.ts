import { assetDisplayTitle } from "@/lib/presentation";
import { canReview } from "@/lib/permissions";
import { containsOperationalText } from "@/lib/public-text-safety";
import type { DemoRole, StockMediaAsset } from "@/lib/types";

export {
  viewerVerdictForAsset
} from "@/lib/portal-reuse-decision";

export type {
  ViewerVerdict,
  ViewerVerdictLabel,
  ViewerVerdictTone
} from "@/lib/portal-reuse-decision";

export type RequestMailtoKind = "original" | "review" | "coworker";

const unsafeRequestTextPattern = /\.\.\/private|javascript:/i;

function canExposeOpsReference(role: DemoRole) {
  return canReview(role);
}

function safeRequestTitle(asset: StockMediaAsset) {
  const title = assetDisplayTitle(asset).replace(/\s+/g, " ").trim();
  if (!title || unsafeRequestTextPattern.test(title) || containsOperationalText(title)) return "Media asset";
  return title.slice(0, 120);
}

function safeRequestReference(asset: StockMediaAsset, role: DemoRole) {
  const raw = String(canExposeOpsReference(role) ? asset.resourceSpaceId || asset.id : asset.id);
  const cleaned = raw.replace(/[^\w:-]/g, "").slice(0, 80);
  if (!cleaned || unsafeRequestTextPattern.test(cleaned) || containsOperationalText(cleaned)) return String(asset.id).replace(/[^\w:-]/g, "").slice(0, 80) || "media-record";
  return cleaned;
}

function mailto(subject: string, body: string) {
  return `mailto:media@tjc.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function requestReviewMailto(asset: StockMediaAsset, role: DemoRole = "Viewer") {
  return requestAssetMailto(asset, role, "review");
}

export function requestAssetMailto(asset: StockMediaAsset, role: DemoRole, kind: RequestMailtoKind, stateLabel?: string) {
  const title = safeRequestTitle(asset);
  const recordId = safeRequestReference(asset, role);
  const recordLabel = role === "DAM Admin" ? "ResourceSpace ID" : "Reference code";
  const stateLine = stateLabel ? `\nUse state: ${stateLabel}` : "";

  if (kind === "original") {
    const accessLabel = role === "DAM Admin" ? "Original/master access" : "Source-file access";
    return mailto(`Original access request for ${title}`, `${recordLabel}: ${recordId}\nRequest: ${accessLabel}\nReason: `);
  }

  if (kind === "coworker") {
    return mailto("TJC Stock Media asset question", `${recordLabel}: ${recordId}\nAsset: ${title}\nQuestion: `);
  }

  return mailto(`Request DAM review for ${title}`, `${recordLabel}: ${recordId}\nAsset: ${title}${stateLine}\nReason: `);
}
