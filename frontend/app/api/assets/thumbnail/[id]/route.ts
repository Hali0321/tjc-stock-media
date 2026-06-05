import fs from "node:fs";
import { NextRequest, NextResponse } from "next/server";
import { findFilestoreDerivative } from "@/lib/media-source";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const variantParam = request.nextUrl.searchParams.get("variant");
  const variant = variantParam === "download" ? "download" : variantParam === "preview" ? "preview" : "thumb";
  const filePath = findFilestoreDerivative(id, variant);

  if (!filePath) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Cache-Control": "no-store"
      }
    });
  }

  const bytes = fs.readFileSync(filePath);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=300"
    }
  });
}
