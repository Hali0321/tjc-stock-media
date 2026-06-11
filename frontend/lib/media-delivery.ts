import fs from "node:fs";
import type { AccessAction } from "@/lib/access-decisions";
import type { ImageVariant } from "@/lib/images";
import { safeSlugText } from "@/lib/persisted-record-safety";
import { normalizeDisplayTextField, readJsonObject } from "@/lib/request-validation";

export type DeliveredImage = {
  bytes: ArrayBuffer;
  contentType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
};
type DownloadGateBody = {
  role?: unknown;
  variant?: unknown;
  usageChannel?: unknown;
  reason?: unknown;
  termsAccepted?: unknown;
};
export type DownloadGateInput = {
  role?: string;
  variant: "download";
  usageChannel: string | null;
  reason: string | null;
  termsAccepted: boolean;
};
export type ThumbnailDeliveryInput = {
  variant: ImageVariant;
  action: AccessAction;
};

export function supportedImageContentType(bytes: Buffer): DeliveredImage["contentType"] | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (bytes.length >= 6 && ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString("ascii"))) return "image/gif";
  return null;
}

export function readDeliveredImage(filePath: string): DeliveredImage | null {
  try {
    const fileBytes = fs.readFileSync(filePath);
    const contentType = supportedImageContentType(fileBytes);
    if (!contentType) return null;
    const bytes = new ArrayBuffer(fileBytes.byteLength);
    new Uint8Array(bytes).set(fileBytes);
    return { bytes, contentType };
  } catch {
    return null;
  }
}

export function approvedCopyFileName(title: unknown, id: string) {
  const safeTitle = safeSlugText(normalizeDisplayTextField(title, "", 80), 80) || `asset-${id}`;
  return `${safeTitle}-approved-copy.jpg`;
}

function normalizeDownloadVariant(_value: unknown): DownloadGateInput["variant"] {
  return "download";
}

function normalizeThumbnailVariant(value: unknown): ImageVariant {
  if (value === "download") return "download";
  if (value === "detail" || value === "preview") return "detail";
  if (value === "collection") return "collection";
  if (value === "card") return "card";
  return "small";
}

export function readThumbnailDeliveryInput(search: Pick<URLSearchParams, "get">): ThumbnailDeliveryInput {
  const variant = normalizeThumbnailVariant(search.get("variant"));
  return {
    variant,
    action: variant === "download" ? "downloadApprovedCopy" : variant === "detail" ? "viewDetailPreview" : "viewThumbnail"
  };
}

export async function readDownloadGateInput(request: { json(): Promise<unknown> }): Promise<DownloadGateInput> {
  const body = await readJsonObject<DownloadGateBody>(request);
  return {
    role: typeof body.role === "string" ? body.role : undefined,
    variant: normalizeDownloadVariant(body.variant),
    usageChannel: normalizeDisplayTextField(body.usageChannel, "", 80) || null,
    reason: normalizeDisplayTextField(body.reason, "", 240) || null,
    termsAccepted: body.termsAccepted === true
  };
}
