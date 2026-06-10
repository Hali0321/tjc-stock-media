import { NextRequest } from "next/server";
import { normalizeRole } from "@/lib/permissions";
import { trustedSsoHeadersEnabled } from "@/lib/env";
import type { DamUser, DemoRole } from "@/lib/types";

const roleRank: DemoRole[] = ["Viewer", "Contributor", "Reviewer", "DAM Admin"];

function roleFromTrustedValue(value?: string | null): DemoRole | null {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const has = (term: string) => tokens.includes(term);
  const phrase = (terms: string[]) => terms.every(has);
  if (phrase(["dam", "admin"]) || phrase(["media", "admin"]) || normalized === "admin") return "DAM Admin";
  if (has("reviewer") || has("approver") || has("rights")) return "Reviewer";
  if (has("contributor") || has("uploader") || has("submitter")) return "Contributor";
  if (has("viewer") || has("member") || has("read")) return "Viewer";
  return null;
}

function highestRole(values: string[]) {
  return values.reduce<DemoRole | null>((best, value) => {
    const next = roleFromTrustedValue(value);
    if (!next) return best;
    if (!best) return next;
    return roleRank.indexOf(next) > roleRank.indexOf(best) ? next : best;
  }, null);
}

function parseRoleMap() {
  const raw = process.env.SSO_ROLE_MAP_JSON;
  if (!raw) return {} as Record<string, DemoRole>;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed)
        .map(([key, value]) => [key.toLowerCase(), normalizeRole(String(value))] as const)
    );
  } catch {
    return {};
  }
}

function mappedRole(groups: string[]) {
  const map = parseRoleMap();
  return groups.reduce<DemoRole | null>((best, group) => {
    const next = map[group.toLowerCase()];
    if (!next) return best;
    if (!best) return next;
    return roleRank.indexOf(next) > roleRank.indexOf(best) ? next : best;
  }, null);
}

export function requestIdentity(request: NextRequest, explicitRole?: string | null): DamUser {
  const headers = request.headers;
  const fallbackRole = normalizeRole(explicitRole);
  if (!trustedSsoHeadersEnabled()) {
    return {
      id: `local-beta:${fallbackRole}`,
      name: fallbackRole,
      role: fallbackRole,
      sourceSystem: "local-beta"
    };
  }

  const email = headers.get("cf-access-authenticated-user-email")
    || headers.get("cf-access-user-email")
    || headers.get("x-auth-request-email")
    || undefined;
  const rawGroups = headers.get("cf-access-groups")
    || headers.get("x-auth-request-groups")
    || headers.get("x-tjc-groups")
    || "";
  const groups = rawGroups.split(/[,|;]/).map((item) => item.trim()).filter(Boolean);
  const directRole = roleFromTrustedValue(headers.get("x-tjc-role"));
  const role = directRole || mappedRole(groups) || highestRole(groups) || fallbackRole;

  return {
    id: email ? `sso:${email.toLowerCase()}` : `sso:${role}`,
    name: headers.get("cf-access-user") || headers.get("x-auth-request-user") || email || role,
    email,
    role,
    team: groups.join(", ") || undefined,
    sourceSystem: "sso"
  };
}
