import { NextRequest } from "next/server";
import { normalizeRole, strongestRole } from "@/lib/permissions";
import { trustedSsoHeadersEnabled } from "@/lib/env";
import { normalizePersistedDisplayText } from "@/lib/request-validation";
import type { DamUser, DemoRole } from "@/lib/types";

export type DamSessionAdapter = "route" | "workflow" | "script-test";
export type ClientRoleOverridePolicy = "local-beta" | "download-gate";
export type ClientRoleOverrideSource = "query" | "body" | "script";

export type ClientRoleOverrideDecision = {
  requestedRole: string | null;
  role: string | null;
  source: ClientRoleOverrideSource | null;
  policy: ClientRoleOverridePolicy;
  allowed: boolean;
  ignored: boolean;
  denied: boolean;
  reasonCode: string | null;
};

export type RequestIdentityOptions = {
  explicitRole?: string | null;
  adapter?: DamSessionAdapter;
  overridePolicy?: ClientRoleOverridePolicy;
  overrideSource?: ClientRoleOverrideSource;
};

function requestIsLocalhost(request: NextRequest) {
  return ["localhost", "127.0.0.1", "::1"].includes(request.nextUrl.hostname);
}

function productionRuntime() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

function downloadBodyDemoRolesAllowed() {
  return process.env.DOWNLOAD_GATE_ALLOW_DEMO_ROLES === "1" && !productionRuntime();
}

function downloadQueryDemoRolesAllowed(request: NextRequest) {
  if (productionRuntime()) return false;
  return downloadBodyDemoRolesAllowed() || requestIsLocalhost(request);
}

function normalizeIdentityOptions(explicitRoleOrOptions?: string | null | RequestIdentityOptions): Required<RequestIdentityOptions> {
  if (typeof explicitRoleOrOptions === "object" && explicitRoleOrOptions !== null) {
    return {
      explicitRole: explicitRoleOrOptions.explicitRole ?? null,
      adapter: explicitRoleOrOptions.adapter ?? "route",
      overridePolicy: explicitRoleOrOptions.overridePolicy ?? "local-beta",
      overrideSource: explicitRoleOrOptions.overrideSource ?? "query"
    };
  }
  return {
    explicitRole: explicitRoleOrOptions ?? null,
    adapter: "route",
    overridePolicy: "local-beta",
    overrideSource: "query"
  };
}

export function resolveClientRoleOverride(
  request: NextRequest,
  explicitRoleOrOptions?: string | null | RequestIdentityOptions
): ClientRoleOverrideDecision {
  const options = normalizeIdentityOptions(explicitRoleOrOptions);
  const requestedRole = typeof options.explicitRole === "string" && options.explicitRole.trim()
    ? options.explicitRole
    : null;
  const base: ClientRoleOverrideDecision = {
    requestedRole,
    role: null,
    source: requestedRole ? options.overrideSource : null,
    policy: options.overridePolicy,
    allowed: false,
    ignored: false,
    denied: false,
    reasonCode: null
  };
  if (!requestedRole) return base;
  if (trustedSsoHeadersEnabled()) {
    return { ...base, ignored: true, reasonCode: "trusted-sso-authoritative" };
  }

  if (options.overridePolicy !== "download-gate") {
    return { ...base, role: requestedRole, allowed: true };
  }

  if (productionRuntime()) {
    return { ...base, ignored: true, reasonCode: "production-client-role-ignored" };
  }
  if (options.overrideSource === "query" && downloadQueryDemoRolesAllowed(request)) {
    return { ...base, role: requestedRole, allowed: true };
  }
  if (options.overrideSource === "body" && downloadBodyDemoRolesAllowed()) {
    return { ...base, role: requestedRole, allowed: true };
  }
  return { ...base, denied: true, reasonCode: "client-role-disabled" };
}

function roleFromTrustedValue(value?: string | null): DemoRole | null {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const has = (term: string) => tokens.includes(term);
  const phrase = (terms: string[]) => terms.every(has);
  if (tokens.some((token) => ["not", "no", "non", "deny", "denied", "disabled", "false"].includes(token))) return null;
  if (phrase(["dam", "admin"]) || phrase(["media", "admin"]) || normalized === "admin") return "DAM Admin";
  if (has("reviewer") || has("approver") || has("rights")) return "Reviewer";
  if (has("contributor") || has("uploader") || has("submitter")) return "Contributor";
  if (has("viewer") || has("member") || has("read")) return "Viewer";
  return null;
}

function highestRole(values: string[]) {
  return values.reduce<DemoRole | null>((best, value) => {
    const next = roleFromTrustedValue(value);
    return strongestRole(best, next);
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
        .map(([key, value]) => [key.toLowerCase().trim(), normalizeRole(String(value))] as const)
        .filter(([key]) => Boolean(key))
    );
  } catch {
    return {};
  }
}

function highestTrustedRole(...roles: Array<DemoRole | null>) {
  return roles.reduce<DemoRole | null>((best, next) => strongestRole(best, next), null);
}

function normalizeTrustedIdentityText(value: string | null | undefined, max = 120) {
  return normalizePersistedDisplayText(value, max);
}

function normalizeTrustedEmail(value: string | null | undefined) {
  const email = normalizeTrustedIdentityText(value, 254).toLowerCase();
  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(email) ? email : undefined;
}

function mappedRole(groups: string[]) {
  const map = parseRoleMap();
  return groups.reduce<DemoRole | null>((best, group) => {
    const next = map[group.toLowerCase()];
    return strongestRole(best, next || null);
  }, null);
}

export function requestIdentity(request: NextRequest, explicitRoleOrOptions?: string | null | RequestIdentityOptions): DamUser {
  const override = resolveClientRoleOverride(request, explicitRoleOrOptions);
  const explicitRole = override.role;
  const headers = request.headers;
  const localFallbackRole = normalizeRole(explicitRole);
  if (!trustedSsoHeadersEnabled()) {
    return {
      id: `local-beta:${localFallbackRole}`,
      name: localFallbackRole,
      role: localFallbackRole,
      sourceSystem: "local-beta"
    };
  }

  const email = headers.get("cf-access-authenticated-user-email")
    || headers.get("cf-access-user-email")
    || headers.get("x-auth-request-email")
    || undefined;
  const trustedEmail = normalizeTrustedEmail(email);
  const rawGroups = headers.get("cf-access-groups")
    || headers.get("x-auth-request-groups")
    || headers.get("x-tjc-groups")
    || "";
  const groups = rawGroups.split(/[,|;]/).map((item) => normalizeTrustedIdentityText(item, 80)).filter(Boolean);
  const directRole = roleFromTrustedValue(headers.get("x-tjc-role"));
  const role = highestTrustedRole(directRole, mappedRole(groups), highestRole(groups)) || "Viewer";
  const trustedName = normalizeTrustedIdentityText(headers.get("cf-access-user") || headers.get("x-auth-request-user"), 120);

  return {
    id: trustedEmail ? `sso:${trustedEmail}` : `sso:${role}`,
    name: trustedName || trustedEmail || role,
    email: trustedEmail,
    role,
    team: groups.join(", ") || undefined,
    sourceSystem: "sso"
  };
}
