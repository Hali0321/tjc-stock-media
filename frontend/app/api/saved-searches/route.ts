import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { canContribute } from "@/lib/permissions";
import {
  buildSavedSearchListResponse,
  buildSavedSearchSaveResponse,
  listSavedSearches,
  readSavedSearchDraftInput,
  savedSearchCriteriaError,
  savedSearchListDeniedAuditEvent,
  savedSearchListDeniedError,
  savedSearchListForRolePayload,
  savedSearchListViewedAuditEvent,
  savedSearchSaveDeniedAuditEvent,
  savedSearchSaveDeniedError,
  savedSearchSavedAuditEvent,
  saveSavedSearchDraft
} from "@/lib/saved-search-store";
import { requestIdentity } from "@/lib/request-identity";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const identity = requestIdentity(request, request.nextUrl.searchParams.get("role"));
  if (!canContribute(identity.role)) {
    appendAuditEvent(savedSearchListDeniedAuditEvent(identity.role, identity.id));
    const denied = savedSearchListDeniedError();
    return NextResponse.json(denied.body, { status: denied.status });
  }
  const searches = savedSearchListForRolePayload(identity.role, await listSavedSearches());
  appendAuditEvent(savedSearchListViewedAuditEvent(searches, identity.role, identity.id));
  return NextResponse.json(buildSavedSearchListResponse(searches));
}

export async function POST(request: NextRequest) {
  const identity = requestIdentity(request, request.nextUrl.searchParams.get("role"));
  if (!canContribute(identity.role)) {
    appendAuditEvent(savedSearchSaveDeniedAuditEvent(identity.role, identity.id));
    const denied = savedSearchSaveDeniedError();
    return NextResponse.json(denied.body, { status: denied.status });
  }

  const draft = await readSavedSearchDraftInput(request);
  const criteriaError = savedSearchCriteriaError(draft);
  if (criteriaError) {
    return NextResponse.json(criteriaError.body, { status: criteriaError.status });
  }

  const record = await saveSavedSearchDraft(draft, identity);

  appendAuditEvent(savedSearchSavedAuditEvent(record, identity.role, identity.id));

  return NextResponse.json(buildSavedSearchSaveResponse(identity.role, record));
}
