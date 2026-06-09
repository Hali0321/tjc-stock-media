import { NextRequest, NextResponse } from "next/server";
import { normalizeRole } from "@/lib/permissions";
import { isKnownCollectionId, isKnownSavedViewId, searchAssets } from "@/lib/catalog";
import { normalizeTextField } from "@/lib/request-validation";
import type { DemoRole, MediaSourceStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

function normalizeLimit(value: string | null) {
  const parsed = Number(value || 72);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 1), 120) : 72;
}

function normalizeOffset(value: string | null) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? Math.max(Math.trunc(parsed), 0) : 0;
}

function sourceForRole(role: DemoRole, source: MediaSourceStatus): MediaSourceStatus {
  if (role !== "Viewer") return source;
  return {
    adapter: "demo-fallback",
    label: "Media library",
    detail: "Operational source diagnostics are available to reviewers.",
    readOnly: true
  };
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const role = normalizeRole(params.get("role"));
  const query = normalizeTextField(params.get("q"), "", 200);
  const filters = params
    .getAll("filter")
    .flatMap((value) => value.split("|"))
    .map((value) => normalizeTextField(value, "", 80))
    .filter(Boolean)
    .slice(0, 40);
  const view = normalizeTextField(params.get("view"), "", 80) || undefined;
  const collection = normalizeTextField(params.get("collection"), "", 80) || undefined;
  const sort = normalizeTextField(params.get("sort"), "", 40) || undefined;
  const limit = normalizeLimit(params.get("limit"));
  const offset = normalizeOffset(params.get("offset"));
  if (view && !isKnownSavedViewId(view)) {
    return NextResponse.json({ error: "Unknown saved view.", view }, { status: 400 });
  }
  if (collection && !isKnownCollectionId(collection)) {
    return NextResponse.json({ error: "Unknown collection.", collection }, { status: 400 });
  }
  const result = await searchAssets({ role, query, filters, view, collection, sort, limit, offset });
  return NextResponse.json({
    ...result,
    source: sourceForRole(role, result.source)
  });
}
