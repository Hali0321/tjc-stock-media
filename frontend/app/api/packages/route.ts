import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { getMediaSourceSession } from "@/lib/media-source/session";
import { buildPackageGovernance } from "@/lib/package-governance";
import { resolvePackageSections } from "@/lib/package-drafts";
import { listStoredPackageDrafts, packageDraftForRolePayload, readPackageDraftInput, savePackageDraftSubmission } from "@/lib/package-store";
import { canContribute, canReview } from "@/lib/permissions";
import { requestIdentity } from "@/lib/request-identity";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const identity = requestIdentity(request, request.nextUrl.searchParams.get("role"));
  if (!canReview(identity.role)) {
    appendAuditEvent({
      type: "package_draft_denied",
      role: identity.role,
      actor: identity.id,
      status: "denied",
      summary: "Package draft list denied for non-review role.",
      details: { reason: "role-cannot-list-packages" }
    });
    return NextResponse.json({ error: "Package draft list requires Reviewer or DAM Admin role." }, { status: 403 });
  }
  const packages = await listStoredPackageDrafts();
  appendAuditEvent({
    type: "package_draft_listed",
    role: identity.role,
    actor: identity.id,
    status: "preview",
    summary: "Package draft list viewed.",
    details: { count: packages.length }
  });
  return NextResponse.json({ packages, count: packages.length, storageMode: "local-json" });
}

export async function POST(request: NextRequest) {
  const identity = requestIdentity(request, request.nextUrl.searchParams.get("role"));
  if (!canContribute(identity.role)) {
    appendAuditEvent({
      type: "package_draft_denied",
      role: identity.role,
      actor: identity.id,
      status: "denied",
      summary: "Package draft save denied for Viewer role.",
      details: { reason: "role-cannot-save-package" }
    });
    return NextResponse.json({ error: "Package draft save requires Contributor, Reviewer, or DAM Admin role." }, { status: 403 });
  }

  const draft = await readPackageDraftInput(request);
  const { assets } = await getMediaSourceSession(identity.role);
  const sections = resolvePackageSections(draft, assets);
  const governance = buildPackageGovernance(draft, sections, identity.role);
  const record = await savePackageDraftSubmission(draft, identity, governance);

  appendAuditEvent({
    type: "package_draft_saved",
    role: identity.role,
    actor: identity.id,
    packageId: record.id,
    status: governance.canPublish ? "queued" : "preview",
    summary: `Package draft saved: ${record.title}.`,
    details: {
      totalRefs: governance.totalRefs,
      portalReadyRefs: governance.portalReadyRefs,
      blockedRefs: governance.blockedRefs,
      storageMode: record.storageMode
    }
  });

  return NextResponse.json({ ok: true, package: packageDraftForRolePayload(identity.role, record), governance, storageMode: record.storageMode });
}
