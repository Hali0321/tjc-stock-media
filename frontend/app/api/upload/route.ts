import { NextRequest, NextResponse } from "next/server";
import { canUpload, normalizeRole } from "@/lib/permissions";
import { LARGE_MEDIA_BYTES, uploadDefaultState } from "@/lib/workflow-policy";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const role = normalizeRole(String(form.get("role") || "Viewer"));
  if (!canUpload(role)) {
    return NextResponse.json({ error: "This role can search approved media but cannot upload." }, { status: 403 });
  }

  const files = form.getAll("files").filter((value): value is File => value instanceof File && Boolean(value.name) && value.size > 0);
  const largeFiles = files.filter((file) => file.size > LARGE_MEDIA_BYTES);
  if (largeFiles.length) {
    return NextResponse.json({
      status: "large-media-intake",
      message: uploadDefaultState.largeMediaMessage,
      files: largeFiles.map((file) => ({ name: file.name, size: file.size }))
    });
  }

  return NextResponse.json({
    status: "validated",
    defaultReviewState: uploadDefaultState.status,
    message:
      "Upload intake validated. Current Mac reference uses ResourceSpace metadata export for browsing; ResourceSpace API upload persistence is the next integration step.",
    eventName: String(form.get("eventName") || ""),
    fileCount: files.length
  });
}
