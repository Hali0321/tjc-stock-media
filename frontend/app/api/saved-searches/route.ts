import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { canContribute } from "@/lib/permissions";
import { hasSavedSearchCriteria, listSavedSearches, readSavedSearchDraftInput, savedSearchForRolePayload, saveSavedSearchDraft } from "@/lib/saved-search-store";
import { requestIdentity } from "@/lib/request-identity";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const identity = requestIdentity(request, request.nextUrl.searchParams.get("role"));
  if (!canContribute(identity.role)) {
    appendAuditEvent({
      type: "saved_search_denied",
      role: identity.role,
      actor: identity.id,
      status: "denied",
      summary: "Saved search list denied for Viewer role.",
      details: { reason: "role-cannot-list-saved-searches" }
    });
    return NextResponse.json({ error: "Saved search list requires Contributor, Reviewer, or DAM Admin role." }, { status: 403 });
  }
  const searches = (await listSavedSearches()).map((record) => savedSearchForRolePayload(identity.role, record));
  appendAuditEvent({
    type: "saved_search_listed",
    role: identity.role,
    actor: identity.id,
    status: "preview",
    summary: "Saved search list viewed.",
    details: { count: searches.length }
  });
  return NextResponse.json({ searches, count: searches.length, storageMode: "local-json" });
}

export async function POST(request: NextRequest) {
  const identity = requestIdentity(request, request.nextUrl.searchParams.get("role"));
  if (!canContribute(identity.role)) {
    appendAuditEvent({
      type: "saved_search_denied",
      role: identity.role,
      actor: identity.id,
      status: "denied",
      summary: "Saved search save denied for Viewer role.",
      details: { reason: "role-cannot-save-search" }
    });
    return NextResponse.json({ error: "Saved search save requires Contributor, Reviewer, or DAM Admin role." }, { status: 403 });
  }

  const draft = await readSavedSearchDraftInput(request);
  if (!hasSavedSearchCriteria(draft)) {
    return NextResponse.json({ error: "Saved search needs a query, saved view, collection, or filter." }, { status: 400 });
  }

  const record = await saveSavedSearchDraft(draft, identity);

  appendAuditEvent({
    type: "saved_search_saved",
    role: identity.role,
    actor: identity.id,
    status: "preview",
    summary: `Saved search created: ${record.title}.`,
    details: {
      savedSearchId: record.id,
      query: record.query || null,
      view: record.view || null,
      collection: record.collection || null,
      filterCount: record.filters.length,
      storageMode: record.storageMode
    }
  });

  return NextResponse.json({ ok: true, search: savedSearchForRolePayload(identity.role, record), storageMode: record.storageMode });
}
