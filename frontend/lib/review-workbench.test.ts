import { describe, expect, it } from "vitest";
import { buildBetaReadiness } from "@/lib/beta-readiness-facts";
import { buildDiscoveryQuery, matchesDiscoveryQuery } from "@/lib/catalog-discovery";
import { resolvePackageSections } from "@/lib/package-drafts";
import { buildPackageGovernance } from "@/lib/package-governance";
import { buildPortalReuseDecision } from "@/lib/portal-reuse-decision";
import { emptyReviewChecklist } from "@/lib/review-decision-presenter";
import {
  buildReviewDecisionLanes,
  buildReviewDecisionRequirements,
  buildReviewQueueMetrics,
  buildReviewSignals,
  missingReviewActionEvidence,
  reviewNextCheckLabel
} from "@/lib/review-workbench";
import { assetForRolePayload, sourceForRole } from "@/lib/source-redaction";
import type { DamPackage, IntegrationReadinessItem, StockMediaAsset } from "@/lib/types";

function asset(overrides: Partial<StockMediaAsset> = {}): StockMediaAsset {
  return {
    id: "asset-1",
    title: "Bible teaching background",
    thumbnail: "/thumb.jpg",
    thumbnailAlt: "Bible on table",
    imageUrls: {
      small: "/small.jpg",
      card: "/card.jpg",
      collection: "/collection.jpg",
      detail: "/detail.jpg",
      download: "/download.jpg"
    },
    mediaType: "photo",
    collection: "Sabbath",
    status: "Approved Public",
    usageScope: "Public",
    peopleRisk: "No people",
    sourceSystem: "ResourceSpace export",
    sourcePlatform: "Shared Drive",
    sourceAccount: "media-team@example.org",
    sourcePath: "/private/source.jpg",
    masterDrivePath: "/Shared Drives/TJC Stock Media/approved/source.jpg",
    originalFilename: "source.jpg",
    checksumSha256: "abc123abc123abc123abc123abc123ab",
    imageDimensions: "2400x1600",
    rightsStatus: "Rights approved",
    consentStatus: "Consent confirmed",
    usageGuidance: "Use for sermon slides and website backgrounds.",
    downloadPolicy: "approved-copy-allowed",
    resourceSpaceId: "1001",
    reviewer: "Reviewer One",
    reviewedDate: "2026-06-01",
    tags: ["bible", "teaching"],
    tjcTerms: ["sermon slides"],
    ...overrides
  };
}

describe("review workbench model", () => {
  it("builds review metrics and evidence signals outside UI", () => {
    const ready = asset();
    const risky = asset({
      id: "asset-2",
      status: "Needs Review",
      usageScope: "Do Not Publish",
      peopleRisk: "Unknown",
      rightsStatus: "Unknown",
      consentStatus: "Needs review",
      usageGuidance: "Review before sharing",
      imageUrls: { small: "/s.jpg", card: "/c.jpg", collection: "/g.jpg", detail: "/d.jpg" },
      reviewer: undefined,
      reviewedDate: undefined
    });

    const metrics = buildReviewQueueMetrics([ready, risky]);
    const signals = buildReviewSignals([ready, risky]);

    expect(metrics.find((item) => item.label === "Needs review")?.value).toBe("2");
    expect(metrics.find((item) => item.label === "Rights unclear")?.tone).toBe("warning");
    expect(signals.find((item) => item.label === "People/minors status unresolved")?.count).toBe(1);
    expect(reviewNextCheckLabel(risky)).toBe("Check people/minors");
    expect(buildReviewDecisionLanes(risky).some((lane) => lane.label === "Rights" && lane.blocked)).toBe(true);
  });

  it("keeps approval locked until checklist and note evidence pass", () => {
    const requirements = buildReviewDecisionRequirements(emptyReviewChecklist, "short");
    const missing = missingReviewActionEvidence("Approve Public", emptyReviewChecklist, "short");

    expect(requirements.completed).toBe(0);
    expect(requirements.total).toBe(12);
    expect(requirements.missingLabels).toContain("Review note missing");
    expect(missing).toContain("proofLinkAttached");
    expect(missing).toContain("reviewNote");
  });
});

describe("trust and redaction decisions", () => {
  it("separates portal-ready assets from blocked rights states", () => {
    expect(buildPortalReuseDecision(asset(), "Viewer").reuse.state).toBe("portal-ready");

    const blocked = buildPortalReuseDecision(asset({
      rightsStatus: "Unknown",
      consentStatus: "Missing",
      rightsNotes: undefined
    }), "Viewer");

    expect(blocked.reuse.state).toBe("blocked-rights");
    expect(blocked.access.downloadApprovedCopy.allowed).toBe(false);
    expect(blocked.viewerVerdict.reason).toMatch(/Rights or permission/i);
  });

  it("redacts source custody and ResourceSpace internals from Viewer payloads", () => {
    const viewer = assetForRolePayload("Viewer", asset());
    const reviewer = assetForRolePayload("Reviewer", asset());
    const viewerSource = sourceForRole("Viewer", {
      adapter: "resourcespace-api",
      label: "ResourceSpace",
      detail: "Live ResourceSpace export",
      readOnly: true
    });

    expect(viewer.resourceSpaceId).toBeUndefined();
    expect(viewer.sourcePath).toBeUndefined();
    expect(viewer.checksumSha256).toBeUndefined();
    expect(viewer.imageUrls?.download).toBeUndefined();
    expect(viewerSource.label).toBe("Media library");
    expect(reviewer.resourceSpaceId).toBe("1001");
    expect(reviewer.sourcePath).toBeUndefined();
  });
});

describe("package governance and discovery", () => {
  it("blocks package publish when refs are unresolved or not portal ready", () => {
    const draft: DamPackage = {
      id: "pkg-1",
      title: "Sermon Pack",
      status: "draft",
      sections: [{ id: "hero", title: "Hero", resourceSpaceAssetIds: ["1001", "missing"] }]
    };
    const sections = resolvePackageSections(draft, [asset()]);
    const governance = buildPackageGovernance(draft, sections, "DAM Admin");

    expect(governance.canPreview).toBe(false);
    expect(governance.canPublish).toBe(false);
    expect(governance.missingRefs).toBe(1);
    expect(governance.auditMessage).toContain("missing");
  });

  it("expands ministry tag queries without exposing source details", () => {
    const discovery = buildDiscoveryQuery("sermon slides");

    expect(discovery.expandedTerms).toEqual(expect.arrayContaining(["bible", "worship"]));
    expect(matchesDiscoveryQuery(asset(), "sermon slides")).toBe(true);
  });
});

describe("launch readiness facts", () => {
  it("keeps launch readiness blocked when ResourceSpace writeback is not configured", () => {
    const integrations: IntegrationReadinessItem[] = [
      { id: "auth", label: "Auth", ready: true, detail: "Configured", owner: "Identity Provider", state: "Operational" },
      { id: "review-writes", label: "Review writes", ready: false, detail: "Not configured", owner: "ResourceSpace", state: "Not configured" },
      { id: "approved-copy-delivery", label: "Approved copies", ready: true, detail: "Configured", owner: "Amazon S3", state: "Operational" }
    ];

    const readiness = buildBetaReadiness({ integrations, assetCount: 1, portalReady: 1, auditRecent: [] });
    const writeback = readiness.facts.find((item) => item.id === "review-writes");

    expect(writeback?.ready).toBe(false);
    expect(writeback?.state).toBe("block");
    expect(readiness.ready).toBe(false);
  });
});
