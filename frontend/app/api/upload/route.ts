import { NextRequest, NextResponse } from "next/server";
import { canUpload, normalizeRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const LARGE_MEDIA_LIMIT = 100 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const role = normalizeRole(String(form.get("role") || "Viewer"));
  if (!canUpload(role)) {
    return NextResponse.json({ error: "This role can search approved media but cannot upload." }, { status: 403 });
  }

  const files = form.getAll("files").filter((value): value is File => value instanceof File);
  const largeFiles = files.filter((file) => file.size > LARGE_MEDIA_LIMIT);
  if (largeFiles.length) {
    return NextResponse.json({
      status: "large-media-intake",
      message:
        "This file is larger than the normal web upload limit. Upload it to the approved Shared Drive Incoming folder and notify the DAM admin. It will still be tracked in TJC Stock Media after import.",
      files: largeFiles.map((file) => ({ name: file.name, size: file.size }))
    });
  }

  return NextResponse.json({
    status: "validated",
    defaultReviewState: "Needs Review / Do Not Publish",
    message:
      "Upload intake validated. Current Mac reference uses ResourceSpace metadata export for browsing; ResourceSpace API upload persistence is the next integration step.",
    eventName: String(form.get("eventName") || ""),
    fileCount: files.length
  });
}
