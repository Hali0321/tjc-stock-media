import { describe, expect, it } from "vitest";
import { buildBetaReadiness } from "@/lib/beta-readiness-facts";
import { buildDiscoveryQuery, matchesDiscoveryQuery } from "@/lib/catalog-discovery";
import { fileRequiresAdminIntake, intakeDefaultsToNeedsReview, routeAssetForReview, routeUploadIntakeForReview } from "@/lib/intake-routing";
import { resolvePackageSections } from "@/lib/package-drafts";
import { buildPackageGovernance } from "@/lib/package-governance";
import { buildPortalReuseDecision } from "@/lib/portal-reuse-decision";
import { emptyReviewChecklist } from "@/lib/review-decision-presenter";
import { missingDomainReviewEvidence } from "@/lib/review-evidence";
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
    const matureAsset = asset({
      sourceFolder: "/Shared Drives/private/source-folder",
      importBatch: "MVP Batch 01",
      masterCustodyPathStatus: "verified",
      publishDate: "2026-06-01",
      embargoDate: "2026-07-01",
      expirationDate: "2026-12-31",
      approvalRecheckDate: "2026-09-01",
      rightsExpirationDate: "2026-12-31",
      consentExpirationDate: "2026-12-31",
      withdrawalStatus: "active",
      doctrineSacramentTheme: "Holy Communion",
      hymnNumberOrTitle: "Hymn 469",
      sermonTitle: "Sabbath sermon",
      testimonyTheme: "healing",
      religiousEducationLevel: "RE youth",
      church: "Local church",
      region: "Region",
      publicationTitle: "Newsletter",
      language: "English",
      versionOrEdition: "v1",
      duplicateSimilarityHint: "near duplicate",
      suggestedTags: ["worship-ready"],
      controlledVocabularySource: "review-suggestion"
    });
    const viewer = assetForRolePayload("Viewer", matureAsset);
    const reviewer = assetForRolePayload("Reviewer", matureAsset);
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
    expect(viewer.masterCustodyPathStatus).toBeUndefined();
    expect(viewer.publishDate).toBeUndefined();
    expect(viewer.embargoDate).toBeUndefined();
    expect(viewer.expirationDate).toBeUndefined();
    expect(viewer.approvalRecheckDate).toBeUndefined();
    expect(viewer.rightsExpirationDate).toBeUndefined();
    expect(viewer.consentExpirationDate).toBeUndefined();
    expect(viewer.withdrawalStatus).toBeUndefined();
    expect(viewer.doctrineSacramentTheme).toBeUndefined();
    expect(viewer.hymnNumberOrTitle).toBeUndefined();
    expect(viewer.sermonTitle).toBeUndefined();
    expect(viewer.testimonyTheme).toBeUndefined();
    expect(viewer.religiousEducationLevel).toBeUndefined();
    expect(viewer.church).toBeUndefined();
    expect(viewer.region).toBeUndefined();
    expect(viewer.publicationTitle).toBeUndefined();
    expect(viewer.language).toBeUndefined();
    expect(viewer.versionOrEdition).toBeUndefined();
    expect(viewer.duplicateSimilarityHint).toBeUndefined();
    expect(viewer.sourceFolder).toBeUndefined();
    expect(viewer.importBatch).toBeUndefined();
    expect(viewer.suggestedTags).toBeUndefined();
    expect(viewer.controlledVocabularySource).toBeUndefined();
    expect(viewerSource.label).toBe("Media library");
    expect(reviewer.resourceSpaceId).toBe("1001");
    expect(reviewer.sourcePath).toBeUndefined();
    expect(reviewer.masterCustodyPathStatus).toBe("verified");
    expect(reviewer.doctrineSacramentTheme).toBe("Holy Communion");
    expect(reviewer.duplicateSimilarityHint).toBe("near duplicate");
  });
});

describe("Phase 1B intake routing primitives", () => {
  it("keeps browser and batch intake non-publishing while routing large media to admin intake", () => {
    const defaults = intakeDefaultsToNeedsReview();
    const reasons = routeUploadIntakeForReview({
      files: [{ name: "choir-service.mp4", size: 42_000_000, type: "video/mp4" }],
      eventName: "Sabbath baptism service",
      ministry: "Choir",
      peopleVisible: "Unknown",
      minorsVisible: "Unknown",
      suggestedTags: "hymn,not-yet-approved",
      intakeNotes: "Hymns of Praise livestream clip from baptism service."
    });

    expect(defaults).toEqual({ status: "Needs Review", usageScope: "Do Not Publish", publishable: false });
    expect(fileRequiresAdminIntake({ name: "choir-service.mp4", size: 42_000_000, type: "video/mp4" })).toBe(true);
    expect(reasons.map((reason) => reason.id)).toEqual(expect.arrayContaining([
      "large-media-admin-intake",
      "doctrine-sacrament-review",
      "music-rights-review",
      "minors-consent-review",
      "source-provenance-review",
      "taxonomy-review"
    ]));
    expect(reasons.every((reason) => reason.nonPublishing)).toBe(true);
  });

  it("routes TJC recognition and AI hints to review without changing final approval truth", () => {
    const risky = asset({
      status: "Needs Review",
      usageScope: "Do Not Publish",
      peopleRisk: "Unknown",
      sourcePath: undefined,
      sourceAccount: undefined,
      checksumSha256: undefined,
      originalFilename: undefined,
      imageUrls: { small: "/small.jpg", card: "/card.jpg", collection: "/collection.jpg", detail: "/detail.jpg" },
      tags: ["uncurated"],
      tjcTerms: ["Testimony"],
      doctrineSacramentTheme: "Holy Communion",
      hymnNumberOrTitle: "Hymn 469",
      aiVisibleTagSuggestions: ["baptism"],
      controlledVocabularySource: "review-suggestion"
    });

    const reasons = routeAssetForReview(risky);

    expect(reasons.map((reason) => reason.id)).toEqual(expect.arrayContaining([
      "doctrine-sacrament-review",
      "music-rights-review",
      "minors-consent-review",
      "source-provenance-review",
      "rendition-readiness-review",
      "taxonomy-review",
      "ai-suggestion-review"
    ]));
    expect(buildPortalReuseDecision(risky, "Viewer").reuse.state).not.toBe("portal-ready");
    expect(reasons.every((reason) => reason.nonPublishing)).toBe(true);
  });
});

describe("Phase 2 TJC domain governance gates", () => {
  const completeChecklist = {
    sourceConfirmed: true,
    rightsConfirmed: true,
    attributionConfirmed: true,
    peopleVisibilityConfirmed: true,
    childrenYouthChecked: true,
    usageScopeSelected: true,
    derivativeAvailable: true,
    sensitiveContextChecked: true,
    creditRequirementChecked: true,
    expirationRereviewSet: true,
    proofLinkAttached: true
  };

  it("blocks public approval for youth/minors until consent and RE/minors review exist", () => {
    const youth = asset({
      sensitivityClass: "youth-sensitive",
      peopleRisk: "Possible minors",
      consentStatus: "Unknown",
      consentReleaseRecordId: undefined,
      domainReviewer: undefined
    });

    expect(missingDomainReviewEvidence(youth, "Approve Public", completeChecklist, "Evidence note with enough detail.")).toEqual(expect.arrayContaining([
      "consentReleaseRecord",
      "domainReviewer:RE/minors"
    ]));

    const cleared = { ...youth, consentReleaseRecordId: "release-1001", domainReviewer: "RE/minors" as const };
    expect(missingDomainReviewEvidence(cleared, "Approve Public", completeChecklist, "Evidence note with enough detail.")).not.toContain("domainReviewer:RE/minors");
  });

  it("blocks sacrament, hymn/music, and testimony public approval without domain evidence", () => {
    const risky = asset({
      sensitivityClass: "sacrament-sensitive",
      doctrineSacramentTheme: "Holy Communion",
      hymnNumberOrTitle: "Hymn 469",
      rightsBasis: "unknown",
      approvedChannels: [],
      requiredNotice: undefined,
      testimonyTheme: "healing",
      domainReviewer: undefined,
      rightsNotes: "Review before sharing."
    });

    const missing = missingDomainReviewEvidence(risky, "Approve Public", completeChecklist, "short");

    expect(missing).toEqual(expect.arrayContaining([
      "domainReviewer:doctrine",
      "musicRightsBasis",
      "musicApprovedChannel",
      "musicRequiredNotice",
      "domainReviewer:music-rights",
      "domainReviewer:pastoral-sensitivity",
      "pastoralSensitivityNote"
    ]));
    expect(buildPortalReuseDecision(risky, "Viewer").reuse.state).not.toBe("portal-ready");
  });

  it("keeps AI and smart suggestions as non-final review debt", () => {
    const suggested = asset({
      aiVisibleTagSuggestions: ["baptism"],
      suggestedTags: ["worship-ready"],
      controlledVocabularySource: "review-suggestion",
      humanAiDecision: undefined
    });

    expect(missingDomainReviewEvidence(suggested, "Approve Public", completeChecklist, "Evidence note with enough detail.")).toContain("humanAiDecision");
    expect(buildPortalReuseDecision(suggested, "Viewer").reuse.state).not.toBe("portal-ready");

    const decided = { ...suggested, humanAiDecision: "edited by reviewer" };
    expect(missingDomainReviewEvidence(decided, "Approve Public", completeChecklist, "Evidence note with enough detail.")).not.toContain("humanAiDecision");
  });

  it("does not add domain blockers to non-public review actions", () => {
    const hymn = asset({
      hymnNumberOrTitle: "Hymn 469",
      rightsBasis: "unknown"
    });

    expect(missingDomainReviewEvidence(hymn, "Request More Info", completeChecklist, "Ask for music-rights proof.")).toEqual([]);
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
