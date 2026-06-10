import { NextRequest, NextResponse } from "next/server";
import { normalizeRole } from "@/lib/permissions";
import { isKnownCollectionId, isKnownSavedViewId, searchAssets } from "@/lib/catalog";
import { roleSourceEnvelope } from "@/lib/media-source/session";
import { normalizeTextField } from "@/lib/request-validation";
import { assetForRolePayload, savedViewsForRolePayload } from "@/lib/source-redaction";
import type { DemoRole, SearchResult } from "@/lib/types";

export const dynamic = "force-dynamic";

function normalizeLimit(value: string | null) {
  const parsed = Number(value || 72);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 1), 120) : 72;
}

function normalizeOffset(value: string | null) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? Math.max(Math.trunc(parsed), 0) : 0;
}

function canSeeOperationalSearch(role: DemoRole) {
  return role === "Reviewer" || role === "DAM Admin";
}

function searchResultForRole(role: DemoRole, result: SearchResult) {
  const envelope = roleSourceEnvelope(role, result.source);
  if (canSeeOperationalSearch(role)) {
    return {
      ...result,
      ...envelope
    };
  }

  return {
    assets: result.assets.map((asset) => assetForRolePayload(role, asset)),
    total: result.total,
    pagination: result.pagination,
    ...envelope,
    counts: {
      currentlyShown: result.counts.currentlyShown,
      totalMatching: result.counts.totalMatching,
      totalRendered: result.counts.totalRendered,
      matching: result.counts.matching,
      rendered: result.counts.rendered
    },
    appliedIntent: result.appliedIntent,
    savedViews: savedViewsForRolePayload(role, result.savedViews),
    collections: result.collections
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
    return NextResponse.json({ error: "Unknown saved view." }, { status: 400 });
  }
  if (collection && !isKnownCollectionId(collection)) {
    return NextResponse.json({ error: "Unknown collection." }, { status: 400 });
  }
  const result = await searchAssets({ role, query, filters, view, collection, sort, limit, offset });
  return NextResponse.json(searchResultForRole(role, result));
}
