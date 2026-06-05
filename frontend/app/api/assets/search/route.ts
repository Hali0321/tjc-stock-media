import { NextRequest, NextResponse } from "next/server";
import { normalizeRole } from "@/lib/permissions";
import { searchAssets } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const role = normalizeRole(params.get("role"));
  const query = params.get("q") || "";
  const filters = params.getAll("filter").flatMap((value) => value.split("|")).filter(Boolean);
  const view = params.get("view") || undefined;
  const limit = Number(params.get("limit") || 72);
  const result = await searchAssets({ role, query, filters, view, limit });
  return NextResponse.json(result);
}
