import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "@/lib/env";
import type { AuditEventSummary, BetaReadinessFact, BetaReadinessResult, IntegrationReadinessItem } from "@/lib/types";

function fact(item: BetaReadinessFact): BetaReadinessFact {
  return item;
}

function integrationFact(integrations: IntegrationReadinessItem[], id: string, options?: { label?: string; warnWhenReady?: boolean }) {
  const item = integrations.find((candidate) => candidate.id === id);
  const ready = Boolean(item?.ready);
  return fact({
    id,
    label: options?.label || item?.label || id,
    ready,
    state: ready ? (options?.warnWhenReady ? "warn" : "pass") : item?.state === "Not configured" || item?.state === "Blocked" ? "block" : "warn",
    detail: item?.detail || "Readiness fact not reported.",
    source: "integration"
  });
}

function safeRead(file: string) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function browserQaFact(): BetaReadinessFact {
  const file = path.join(repoRoot(), "docs", "screenshots", "qa", "browser-qa-report.json");
  try {
    const parsed = JSON.parse(safeRead(file)) as {
      checkedAt?: string;
      pages?: number;
      viewports?: number[];
      failures?: unknown[];
      warnings?: unknown[];
      consoleErrors?: unknown[];
      networkFailures?: unknown[];
    };
    const failures = [
      ...(Array.isArray(parsed.failures) ? parsed.failures : []),
      ...(Array.isArray(parsed.consoleErrors) ? parsed.consoleErrors : []),
      ...(Array.isArray(parsed.networkFailures) ? parsed.networkFailures : [])
    ];
    const warnings = Array.isArray(parsed.warnings) ? parsed.warnings : [];
    const clean = failures.length === 0;
    return fact({
      id: "browser-qa",
      label: "Viewer and Reviewer browser QA",
      ready: clean,
      state: clean ? (warnings.length ? "warn" : "pass") : "block",
      detail: clean
        ? `Last QA ${parsed.checkedAt || "unknown"} covered ${parsed.pages || 0} pages across ${(parsed.viewports || []).join(", ") || "unknown"} px. Warnings: ${warnings.length}.`
        : `Browser QA report has ${failures.length} failure signal${failures.length === 1 ? "" : "s"}.`,
      source: "qa-report"
    });
  } catch {
    return fact({
      id: "browser-qa",
      label: "Viewer and Reviewer browser QA",
      ready: false,
      state: "warn",
      detail: "No readable browser QA report found at docs/screenshots/qa/browser-qa-report.json.",
      source: "qa-report"
    });
  }
}

function privateUrlFact(): BetaReadinessFact {
  const url = process.env.PRIVATE_BETA_URL || process.env.NEXT_PUBLIC_PORTAL_URL || process.env.VERCEL_URL || "";
  const ready = Boolean(url && !/localhost|127\.0\.0\.1|example\.tjc\.org/i.test(url));
  return fact({
    id: "private-beta-url",
    label: "Private beta URL",
    ready,
    state: ready ? "pass" : "warn",
    detail: ready
      ? "Private beta URL is configured. Confirm invite-only access before sharing."
      : "No non-local private beta URL is configured. Use localhost for rehearsal only.",
    source: "environment"
  });
}

function envFact(): BetaReadinessFact {
  const file = path.join(repoRoot(), ".env");
  const contents = safeRead(file);
  if (!contents) {
    return fact({
      id: "env-file",
      label: "Runtime env file",
      ready: false,
      state: "warn",
      detail: ".env is missing. Local rehearsal may still work through defaults, but invite flow needs explicit runtime config.",
      source: "environment"
    });
  }
  const placeholder = /change-me|example\.tjc\.org/i.test(contents);
  return fact({
    id: "env-file",
    label: "Runtime env file",
    ready: !placeholder,
    state: placeholder ? "warn" : "pass",
    detail: placeholder ? ".env still contains placeholder values." : ".env exists and does not contain obvious placeholder values.",
    source: "environment"
  });
}

function allowlistFact(): BetaReadinessFact {
  const script = safeRead(path.join(repoRoot(), "scripts", "launch-readiness.sh"));
  const ready = /frontend\/public\/brand\//.test(script);
  return fact({
    id: "brand-asset-allowlist",
    label: "Brand PNG allowlist",
    ready,
    state: ready ? "pass" : "block",
    detail: ready
      ? "Launch readiness allows tracked app brand assets while still blocking church media files."
      : "Launch readiness does not show the app-brand media allowlist.",
    source: "launch-readiness"
  });
}

function seedDataFact(assetCount: number, portalReady: number): BetaReadinessFact {
  const ready = assetCount > 0;
  return fact({
    id: "seed-data",
    label: "Seed catalog data",
    ready,
    state: ready ? (portalReady > 0 ? "pass" : "warn") : "block",
    detail: ready
      ? `${assetCount.toLocaleString()} assets loaded; ${portalReady.toLocaleString()} portal-ready asset${portalReady === 1 ? "" : "s"}.`
      : "No media records are loaded.",
    source: "catalog"
  });
}

export function buildBetaReadiness({
  integrations,
  assetCount,
  portalReady,
  auditRecent
}: {
  integrations: IntegrationReadinessItem[];
  assetCount: number;
  portalReady: number;
  auditRecent: AuditEventSummary[];
}): BetaReadinessResult {
  const facts = [
    integrationFact(integrations, "auth", { label: "SSO / role identity", warnWhenReady: true }),
    integrationFact(integrations, "review-writes", { label: "ResourceSpace review writeback" }),
    integrationFact(integrations, "approved-copy-delivery", { label: "Approved copy derivatives" }),
    privateUrlFact(),
    seedDataFact(assetCount, portalReady),
    envFact(),
    allowlistFact(),
    browserQaFact(),
    fact({
      id: "audit-evidence",
      label: "Audit evidence",
      ready: auditRecent.length > 0,
      state: auditRecent.length > 0 ? "pass" : "warn",
      detail: auditRecent.length
        ? `${auditRecent.length.toLocaleString()} recent audit event${auditRecent.length === 1 ? "" : "s"} available for beta rehearsal.`
        : "No recent audit events are visible yet.",
      source: "catalog"
    })
  ];
  const score = Math.round((facts.filter((item) => item.ready).length / facts.length) * 100);
  return {
    ready: facts.every((item) => item.ready || item.state === "warn") && facts.some((item) => item.id === "browser-qa" && item.ready),
    score,
    generatedAt: new Date().toISOString(),
    facts
  };
}
