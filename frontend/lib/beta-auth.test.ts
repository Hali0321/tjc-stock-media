import { afterEach, describe, expect, it, vi } from "vitest";
import {
  betaLoginPathForReturn,
  betaPasswordMatches,
  betaSessionSecretConfigured,
  createBetaSessionCookieValue,
  safeBetaReturnTo,
  verifyBetaSessionCookieValue
} from "@/lib/beta-auth";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

function configureBetaEnv() {
  vi.stubEnv("BETA_AUTH_ENABLED", "true");
  vi.stubEnv("BETA_SESSION_SECRET", "local-test-session-secret");
  vi.stubEnv("BETA_VIEWER_PASSWORD", "viewer-pass");
  vi.stubEnv("BETA_CONTRIBUTOR_PASSWORD", "contributor-pass");
  vi.stubEnv("BETA_REVIEWER_PASSWORD", "reviewer-pass");
  vi.stubEnv("BETA_ADMIN_PASSWORD", "admin-pass");
}

describe("beta auth", () => {
  it("signs persona sessions and rejects tampering", async () => {
    configureBetaEnv();

    const cookieValue = await createBetaSessionCookieValue("Reviewer", 1_000);
    const session = await verifyBetaSessionCookieValue(cookieValue, 2_000);

    expect(session?.role).toBe("Reviewer");
    expect(session?.issuedAt).toBe(1_000);
    expect(session?.expiresAt).toBeGreaterThan(2_000);
    expect(await verifyBetaSessionCookieValue(`${cookieValue}.x`, 2_000)).toBeNull();
    expect(await verifyBetaSessionCookieValue(`${cookieValue.slice(0, -1)}x`, 2_000)).toBeNull();
  });

  it("requires env-backed persona credentials and session signing", () => {
    configureBetaEnv();

    expect(betaSessionSecretConfigured()).toBe(true);
    expect(betaPasswordMatches("Viewer", "viewer-pass")).toBe(true);
    expect(betaPasswordMatches("Viewer", "admin-pass")).toBe(false);
    expect(betaPasswordMatches("DAM Admin", "admin-pass")).toBe(true);
  });

  it("keeps beta return targets app-local and away from auth/api routes", () => {
    expect(betaLoginPathForReturn("/review", "?queue=pending")).toBe("/beta-login?returnTo=%2Freview%3Fqueue%3Dpending");
    expect(safeBetaReturnTo("/assets/368")).toBe("/assets/368");
    expect(safeBetaReturnTo("https://example.com/admin")).toBe("/");
    expect(safeBetaReturnTo("//example.com/admin")).toBe("/");
    expect(safeBetaReturnTo("/api/assets")).toBe("/");
    expect(safeBetaReturnTo("/beta-login?returnTo=/admin")).toBe("/");
  });
});
