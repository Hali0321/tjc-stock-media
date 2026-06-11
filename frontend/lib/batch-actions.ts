import { assetResourceRef } from "@/lib/asset-refs";
import { selectedAssetIds } from "@/lib/asset-selection";
import { readJsonObject } from "@/lib/request-validation";
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
