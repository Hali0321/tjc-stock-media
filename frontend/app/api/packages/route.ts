import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { getMediaSourceSession } from "@/lib/media-source/session";
import { buildPackageGovernance } from "@/lib/package-governance";
import { resolvePackageSections } from "@/lib/package-drafts";
import { listStoredPackageDrafts, sanitizePackageDraft, savePackageDraft } from "@/lib/package-store";
import { canContribute, canReview } from "@/lib/permissions";
import { requestIdentity } from "@/lib/request-identity";
import { readJsonObject } from "@/lib/request-validation";

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

  const body = await readJsonObject(request);
  const draft = sanitizePackageDraft((body as { draft?: unknown }).draft || body);
  const { assets } = await getMediaSourceSession(identity.role);
  const sections = resolvePackageSections(draft, assets);
  const governance = buildPackageGovernance(draft, sections, identity.role);
  const now = new Date().toISOString();
  const id = draft.id === "portal-local-draft" ? `pkg-${now.replace(/[:.]/g, "-")}` : draft.id;
  const record = await savePackageDraft({
    id,
    title: draft.title,
    status: draft.status,
    sections: draft.sections,
    createdAt: now,
    updatedAt: now,
    createdBy: identity.id,
    role: identity.role,
    governance: {
      canPreview: governance.canPreview,
      canShare: governance.canShare,
      canPublish: governance.canPublish,
      totalRefs: governance.totalRefs,
      portalReadyRefs: governance.portalReadyRefs,
      blockedRefs: governance.blockedRefs,
      missingRefs: governance.missingRefs,
      reason: governance.reason
    }
  });

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

  return NextResponse.json({ ok: true, package: record, governance, storageMode: record.storageMode });
}
