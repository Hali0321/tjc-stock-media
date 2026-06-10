import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/audit-log";
import { betaFeedbackSeverities, betaFeedbackStatuses, buildBetaFeedbackExport, listBetaFeedback, normalizeFeedbackText } from "@/lib/beta-feedback";
import { roles } from "@/lib/permissions";
import { requestIdentity } from "@/lib/request-identity";
import type { BetaFeedbackSeverity, BetaFeedbackStatus, DemoRole } from "@/lib/types";

export const dynamic = "force-dynamic";

function normalizeStatus(value: string): BetaFeedbackStatus | "all" {
  return betaFeedbackStatuses.includes(value as BetaFeedbackStatus) ? value as BetaFeedbackStatus : "all";
}

function normalizeSeverity(value: string): BetaFeedbackSeverity | "all" {
  return betaFeedbackSeverities.includes(value as BetaFeedbackSeverity) ? value as BetaFeedbackSeverity : "all";
}

function normalizeFeedbackRole(value: string): DemoRole | "all" {
  return roles.includes(value as DemoRole) ? value as DemoRole : "all";
}

export async function GET(request: NextRequest) {
  const identity = requestIdentity(request, request.nextUrl.searchParams.get("role"));
  if (identity.role !== "DAM Admin") {
    appendAuditEvent({
      type: "admin_denied",
      role: identity.role,
      actor: identity.id,
      status: "denied",
      summary: "Beta feedback export denied for non-admin role.",
      details: { reason: "role-cannot-admin" }
    });
    return NextResponse.json({ error: "Beta feedback export requires DAM Admin role." }, { status: 403 });
  }

  const search = request.nextUrl.searchParams;
  const filters = {
    status: normalizeStatus(normalizeFeedbackText(search.get("status"), 40)),
    severity: normalizeSeverity(normalizeFeedbackText(search.get("severity"), 40)),
    role: normalizeFeedbackRole(normalizeFeedbackText(search.get("feedbackRole"), 80)),
    route: normalizeFeedbackText(search.get("route"), 240) || "all"
  };
  const records = await listBetaFeedback();
  const packet = buildBetaFeedbackExport(records, filters);
  appendAuditEvent({
    type: "beta_feedback_triaged",
    role: identity.role,
    actor: identity.id,
    status: "preview",
    summary: "Beta feedback export packet generated.",
    details: {
      exportedRecords: packet.counts.exportedRecords,
      statusFilter: packet.filters.status,
      severityFilter: packet.filters.severity,
      roleFilter: packet.filters.role,
      routeFilter: packet.filters.route
    }
  });
  return NextResponse.json(packet, {
    headers: {
      "Content-Disposition": `attachment; filename="tjc-beta-feedback-${packet.exportedAt.slice(0, 10)}.json"`
    }
  });
}
