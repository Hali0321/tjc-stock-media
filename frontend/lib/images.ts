import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "@/lib/env";

export type ImageVariant = "small" | "thumb" | "card" | "collection" | "detail" | "preview" | "download";

const variantSuffixes: Record<ImageVariant, string[]> = {
  small: ["thm_", "col_", "pre_"],
  thumb: ["thm_", "col_", "pre_"],
  card: ["scr_", "pre_", "lpr_", "col_", "thm_"],
  collection: ["scr_", "lpr_", "pre_", "col_", "thm_"],
  detail: ["lpr_", "hpr_", "scr_", "pre_", "col_"],
  preview: ["lpr_", "hpr_", "scr_", "pre_", "col_"],
  download: ["lpr_", "hpr_", "scr_", "pre_"]
};

export function findResourceSpaceImageDerivative(id: string, variant: ImageVariant) {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) return null;
  const filestore = path.join(repoRoot(), ".runtime", "filestore");
  if (!fs.existsSync(filestore)) return null;

  const suffixes = variantSuffixes[variant];
  const candidates = new Array<string | null>(suffixes.length).fill(null);
  const stack = [filestore];
  while (stack.length) {
    const dir = stack.pop();
    if (!dir) break;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (/\.(jpg|jpeg)$/i.test(entry.name)) {
        const rank = suffixes.findIndex((suffix) => entry.name.startsWith(`${id}${suffix}`));
        if (rank === -1) continue;
        candidates[rank] ||= fullPath;
        if (rank === 0) return fullPath;
      }
    }
  }
  return candidates.find(Boolean) || null;
}
