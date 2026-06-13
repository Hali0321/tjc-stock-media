import { clearDerivativeIndex, findDerivativeEntry } from "@/lib/derivative-index";

export type ImageVariant = "small" | "thumb" | "card" | "collection" | "detail" | "preview" | "download";

export function clearDerivativeFileIndex() {
  clearDerivativeIndex();
}

export function findResourceSpaceImageDerivative(id: string, variant: ImageVariant) {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) return null;
  return findDerivativeEntry(id, variant)?.filePath || null;
}
