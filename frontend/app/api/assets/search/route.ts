import { NextRequest, NextResponse } from "next/server";
import { normalizeRole } from "@/lib/permissions";
import { searchAssets } from "@/lib/catalog";
import { normalizeTextField } from "@/lib/request-validation";

export const dynamic = "force-dynamic";

function normalizeLimit(value: string | null) {
  const parsed = Number(value || 72);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 1), 120) : 72;
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
  const result = await searchAssets({ role, query, filters, view, collection, sort, limit });
  return NextResponse.json(result);
}
