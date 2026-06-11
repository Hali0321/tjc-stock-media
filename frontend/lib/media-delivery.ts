import fs from "node:fs";
import { safeSlugText } from "@/lib/persisted-record-safety";
import { normalizeDisplayTextField } from "@/lib/request-validation";

export type DeliveredImage = {
  bytes: ArrayBuffer;
  contentType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
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
