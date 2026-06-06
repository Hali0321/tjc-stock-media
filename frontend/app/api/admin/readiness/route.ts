import { NextRequest, NextResponse } from "next/server";
import { getDamReadiness } from "@/lib/dam-readiness";
import { normalizeRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const role = normalizeRole(request.nextUrl.searchParams.get("role"));
  if (role !== "DAM Admin") {
    return NextResponse.json({ error: "DAM readiness is available to DAM Admin role." }, { status: 403 });
  }

  return NextResponse.json(await getDamReadiness());
}
