import { hasResourceSpaceApiConfig, resourceSpaceWritebackEnabled } from "@/lib/env";
import { getAssetsFromExport } from "@/lib/media-source/exported-metadata";
import { markPendingReviewWriteSyncFailed, markPendingReviewWriteSynced } from "@/lib/pending-review-writes";
import { resourceSpaceFieldMap, resourceSpaceWritebackFieldMapDiagnostics } from "@/lib/resourcespace-field-map";
import { resourceSpaceApiDiagnostics, resourceSpaceApiRequest, resourceSpaceGetCollectionResources, resourceSpaceUpdateField } from "@/lib/resourcespace-client";
import { normalizeResourceSpaceRecord, type ResourceSpaceRecord } from "@/lib/resourcespace-schema";
import type { MediaSourceStatus, StockMediaAsset } from "@/lib/types";
import type { ReviewWriteRecord } from "@/lib/types";

export const resourceSpaceApiStatus: MediaSourceStatus = {
  adapter: "resourcespace-api",
  label: "ResourceSpace API",
  detail: "ResourceSpace API config is present. Server routes may call ResourceSpace without exposing credentials to the browser.",
  readOnly: false
};

export async function getAssetsFromResourceSpaceApi(): Promise<StockMediaAsset[] | null> {
  if (!hasResourceSpaceApiConfig()) return null;

  const result = await resourceSpaceApiRequest<unknown[]>({ function: "do_search", search: "", fetchrows: 1000 });
  if (!result.ok || !Array.isArray(result.data)) return null;
  const records = result.data
    .filter((row): row is ResourceSpaceRecord => Boolean(row && typeof row === "object" && !Array.isArray(row)))
    .map((row) => normalizeResourceSpaceRecord(row));
  return records.length ? records : null;
}

function resourceIdsFromCollectionPayload(payload: unknown): string[] {
  if (!payload) return [];
  const values = Array.isArray(payload)
    ? payload
    : typeof payload === "object"
      ? Object.values(payload as Record<string, unknown>)
      : [];
  return values
    .flatMap((item) => {
      if (typeof item === "string" || typeof item === "number") return [String(item)];
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const id = record.ref || record.resource || record.resource_id || record.id;
        return typeof id === "string" || typeof id === "number" ? [String(id)] : [];
      }
      return [];
    })
    .filter(Boolean);
}

export async function getResourceSpaceCollectionAssets(collectionId: string | number) {
  if (!hasResourceSpaceApiConfig()) {
    return {
      ok: false,
      status: 409,
      assets: [] as StockMediaAsset[],
      message: "ResourceSpace API credentials are not configured; live collection reads are unavailable."
    };
  }

  const resources = await resourceSpaceGetCollectionResources(collectionId);
  if (!resources.ok) {
    return {
      ok: false,
      status: resources.status,
      assets: [] as StockMediaAsset[],
      message: resources.error || "ResourceSpace collection read failed."
    };
  }
  const ids = new Set(resourceIdsFromCollectionPayload(resources.data));
  const exportAssets = await getAssetsFromExport() || [];
  const matched = exportAssets.filter((asset) => ids.has(asset.resourceSpaceId || asset.id));
  return {
    ok: true,
    status: 200,
    assets: matched,
    resourceIds: [...ids],
    message: matched.length
      ? `Loaded ${matched.length.toLocaleString()} ResourceSpace collection asset${matched.length === 1 ? "" : "s"}.`
      : `Collection ${collectionId} returned ${ids.size.toLocaleString()} resource id${ids.size === 1 ? "" : "s"}, but no exported records matched yet.`
  };
}

export async function updateResourceReviewStatus(record: ReviewWriteRecord) {
  if (!hasResourceSpaceApiConfig()) {
    return {
      ok: false,
      status: 409,
      message: "Review decision passed evidence checks and is queued for media-team follow-up. Final library update is not completed from this page."
    };
  }

  if (!resourceSpaceWritebackEnabled()) {
    return {
      ok: false,
      status: 409,
      message: "ResourceSpace writeback is configured but disabled. Decision remains queued for pending sync."
    };
  }

  const fieldMap = resourceSpaceWritebackFieldMapDiagnostics();
  if (!fieldMap.valid) {
    const message = fieldMap.configured
      ? `ResourceSpace writeback field map is incomplete. Missing: ${fieldMap.missing.join(", ") || "none"}. ${fieldMap.error || ""}`.trim()
      : "ResourceSpace writeback requires explicit RESOURCESPACE_FIELD_MAP_JSON review field refs.";
    const failed = markPendingReviewWriteSyncFailed(record.id, message);
    return {
      ok: false,
      status: 409,
      record: failed,
      message
    };
  }

  const diagnostics = await resourceSpaceApiDiagnostics();
  if (!diagnostics.ok) {
    const failed = markPendingReviewWriteSyncFailed(record.id, diagnostics.error || "ResourceSpace API smoke failed before writeback.");
    return {
      ok: false,
      status: diagnostics.status,
      record: failed,
      message: diagnostics.error || "ResourceSpace API smoke failed before writeback."
    };
  }

  const statusField = resourceSpaceFieldMap.approvalStatus;
  const statusResult = await resourceSpaceUpdateField(record.resourceId, statusField, record.requestedStatus);
  if (!statusResult.ok) {
    const failed = markPendingReviewWriteSyncFailed(record.id, statusResult.error || "ResourceSpace status update failed.");
    return {
      ok: false,
      status: statusResult.status,
      record: failed,
      message: statusResult.error || "ResourceSpace status update failed."
    };
  }

  const secondaryResults = await Promise.all([
    resourceSpaceUpdateField(record.resourceId, resourceSpaceFieldMap.reviewedDate, new Date().toISOString().slice(0, 10)),
    resourceSpaceUpdateField(record.resourceId, resourceSpaceFieldMap.reviewer, record.reviewerName || record.reviewerRole),
    resourceSpaceUpdateField(record.resourceId, resourceSpaceFieldMap.notes, record.note)
  ]);
  const secondaryFailure = secondaryResults.find((result) => !result.ok);
  if (secondaryFailure) {
    const message = secondaryFailure.error || "ResourceSpace secondary review field update failed.";
    const failed = markPendingReviewWriteSyncFailed(record.id, message);
    return {
      ok: false,
      status: secondaryFailure.status,
      record: failed,
      message
    };
  }

  const synced = markPendingReviewWriteSynced(record.id);
  return {
    ok: true,
    status: 200,
    record: synced,
    message: "ResourceSpace review fields were updated through the live API."
  };
}
