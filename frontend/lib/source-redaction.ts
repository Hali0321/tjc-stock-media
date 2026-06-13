import type { DemoRole, MediaSourceStatus } from "@/lib/types";

export function sourceForRole(role: DemoRole, source: MediaSourceStatus): MediaSourceStatus {
  if (role !== "Viewer") return source;
  return {
    adapter: "demo-fallback",
    label: "Media library",
    detail: "Operational source diagnostics are available to reviewers.",
    readOnly: true
  };
}
