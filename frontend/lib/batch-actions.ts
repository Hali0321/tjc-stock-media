import { assetResourceRef } from "@/lib/asset-refs";
import { selectedAssetIds, type AssetSelection } from "@/lib/asset-selection";
import { readJsonObject } from "@/lib/request-validation";
import type { AuditEventRecord } from "@/lib/audit-log";
import type { DemoRole, StockMediaAsset } from "@/lib/types";

export type BatchAction = "request-review" | "mark-internal" | "archive";

type BatchActionBody = {
  role?: string;
  action?: string;
  assetIds?: string[];
};
export type BatchActionInput = {
  role?: string;
  requestedAction: string;
  action: BatchAction | null;
  requestedIds: string[];
};
type BatchActionAuditEvent = Omit<AuditEventRecord, "id" | "createdAt" | "actor"> & { actor?: string };
type BatchActionRouteError = {
  body: {
    error: string;
    missingCount?: number;
  };
  status: 400 | 403 | 404;
};

const supportedBatchActions: BatchAction[] = ["request-review", "mark-internal", "archive"];

function normalizeBatchAction(value: unknown): BatchAction | null {
  return supportedBatchActions.includes(value as BatchAction) ? value as BatchAction : null;
}

export async function readBatchActionInput(request: { json(): Promise<unknown> }): Promise<BatchActionInput> {
  const body = await readJsonObject<BatchActionBody>(request);
  const requestedAction = typeof body.action === "string" ? body.action : "";
  return {
    role: typeof body.role === "string" ? body.role : undefined,
    requestedAction,
    action: normalizeBatchAction(requestedAction),
    requestedIds: selectedAssetIds(body.assetIds)
  };
}

export function batchActionRoleDeniedError(): BatchActionRouteError {
  return { body: { error: "Bulk review actions require reviewer access." }, status: 403 };
}

export function batchActionInputValidationError(input: BatchActionInput): BatchActionRouteError | null {
  if (!input.action) {
    return { body: { error: "Unsupported batch action." }, status: 400 };
  }
  if (!input.requestedIds.length) {
    return { body: { error: "Select at least one asset." }, status: 400 };
  }
  return null;
}

export function batchActionSelectionValidationError(selection: AssetSelection): BatchActionRouteError | null {
  if (selection.missingIds.length) {
    return { body: { error: "One or more selected assets were not found.", missingCount: selection.missingIds.length }, status: 404 };
  }
  return null;
}

export function batchActionForPreview(input: BatchActionInput): BatchAction {
  if (!input.action) throw new Error("Batch action missing after validation.");
  return input.action;
}

export function batchActionDeniedAuditEvent(input: BatchActionInput, role: DemoRole, actor: string): BatchActionAuditEvent {
  return {
    type: "batch_action_denied",
    role,
    actor,
    status: "denied",
    summary: "Batch governance action denied for role.",
    details: { action: input.requestedAction || null, assetCount: input.requestedIds.length }
  };
}

export function batchActionPreviewAuditEvent(action: BatchAction, assetCount: number, role: DemoRole, actor: string): BatchActionAuditEvent {
  return {
    type: "batch_action_previewed",
    role,
    actor,
    status: "preview",
    summary: "Batch governance action previewed; no production media-library write performed.",
    details: { action, assetCount }
  };
}

export function buildBatchActionPreviewPayload({
  action,
  assets,
  role,
  timestamp
}: {
  action: BatchAction;
  assets: StockMediaAsset[];
  role: DemoRole;
  timestamp: string;
}) {
  return {
    ok: false,
    mode: "review-preview",
    action,
    count: assets.length,
    auditRecords: assets.map((asset) => ({
      assetId: asset.id,
      resourceSpaceId: assetResourceRef(asset),
      previousStatus: asset.status,
      requestedAction: action,
      reviewerRole: role,
      timestamp
    })),
    message: `Batch action preview ready for ${assets.length} asset${assets.length === 1 ? "" : "s"}: ${action.replace("-", " ")}. Sharing stays paused until each selected item is reviewed and cleared.`
  };
}
