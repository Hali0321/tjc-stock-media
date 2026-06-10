import type { MediaSourceStatus } from "@/lib/types";

export function sourceKind(source: MediaSourceStatus) {
  if (source.adapter === "demo-fallback") return "fallback-fixtures";
  if (source.adapter === "media-library") return "media-library";
  return "resourcespace";
}

export function sourceIsLive(source: MediaSourceStatus) {
  return source.adapter !== "demo-fallback" && source.adapter !== "media-library";
}
