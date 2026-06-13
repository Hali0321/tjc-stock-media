const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const frontendRoot = path.resolve(__dirname, "..");
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(frontendRoot, request.slice(2)), parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require.extensions[".ts"] = function compileTs(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    },
    fileName: filename
  });
  module._compile(output.outputText, filename);
};

const {
  buildPortalReuseDecision
} = require("../lib/portal-reuse-decision.ts");
const {
  presentAssetDetailContext,
  presentReviewContext
} = require("../lib/portal-context-presenters.ts");

function asset(overrides = {}) {
  return {
    id: "asset-1",
    title: "Sabbath worship photo",
    thumbnail: "/thumb.jpg",
    thumbnailAlt: "Sabbath worship",
    imageUrls: {
      small: "/small.jpg",
      card: "/card.jpg",
      collection: "/collection.jpg",
      detail: "/detail.jpg",
      download: "/download.jpg"
    },
    mediaType: "photo",
    collection: "MVP 2024",
    status: "Approved Public",
    usageScope: "Public",
    peopleRisk: "No people",
    sourceSystem: "LM Photos import",
    sourceAccount: "lm.photos@tjc.org",
    sourcePath: "/private/google-takeout/lm.photos@tjc.org/album",
    imageDimensions: "2400 x 1600",
    rightsStatus: "Rights approved",
    consentStatus: "Consent confirmed",
    usageGuidance: "Use approved derivatives for church web and announcements.",
    downloadPolicy: "approved-copy-allowed",
    tags: ["worship"],
    tjcTerms: ["Sabbath"],
    ...overrides
  };
}

function flattened(value) {
  return JSON.stringify(value).toLowerCase();
}

const publicApproved = asset({
  reviewer: "Reviewer",
  reviewedDate: "2026-06-01"
});
const publicDecision = buildPortalReuseDecision(publicApproved, "Viewer");
assert.equal(publicDecision.reuse.state, "portal-ready");
assert.equal(publicDecision.viewerVerdict.canDownload, true);
const publicPresenter = presentAssetDetailContext(publicApproved, "Viewer", { adapter: "resourcespace-api", label: "Live ResourceSpace", detail: "Read-only", readOnly: true });
assert.equal(publicPresenter.approved, true);
assert.match(publicPresenter.canUseSummary, /approved copy/i);
assert.doesNotMatch(flattened(publicPresenter), /lm\.photos@tjc\.org|google-takeout|sourcepath|sourceaccount/);

const missingEvidence = asset({
  id: "asset-missing-evidence",
  peopleRisk: "Unknown",
  rightsStatus: "Unknown",
  consentStatus: "Unknown",
  reviewer: undefined,
  reviewedDate: undefined
});
const missingEvidenceDecision = buildPortalReuseDecision(missingEvidence, "Viewer");
assert.equal(missingEvidenceDecision.viewerVerdict.canDownload, false);
assert.ok(missingEvidenceDecision.reuse.reasonCodes.includes("blocked-rights"));
assert.ok(missingEvidenceDecision.reuse.reasonCodes.includes("blocked-people-minors"));
assert.ok(missingEvidenceDecision.reuse.reasonCodes.includes("blocked-reviewer-date"));

const needsReview = asset({
  id: "asset-needs-review",
  status: "Needs Review",
  usageScope: "Do Not Publish",
  rightsStatus: "Rights approved",
  consentStatus: "Consent confirmed",
  peopleRisk: "No people"
});
const needsReviewDecision = buildPortalReuseDecision(needsReview, "Viewer");
assert.equal(needsReviewDecision.reuse.state, "blocked-needs-review");
assert.equal(presentAssetDetailContext(needsReview, "Viewer").primaryActionLabel, "Request DAM review");

const archiveOnly = asset({
  id: "asset-archive",
  status: "Searchable Archive",
  usageScope: "Archive Only",
  rightsStatus: "Rights approved",
  consentStatus: "Consent confirmed"
});
assert.equal(buildPortalReuseDecision(archiveOnly, "Reviewer").reuse.state, "blocked-archive");
assert.match(presentAssetDetailContext(archiveOnly, "Reviewer").canUseSummary, /reference/i);

const rightsBlocked = asset({
  id: "asset-rights",
  sourceSystem: "Photographer intake",
  sourceAccount: "Media team",
  rightsStatus: "Rights review required",
  consentStatus: "Not confirmed"
});
assert.ok(buildPortalReuseDecision(rightsBlocked, "Reviewer").reuse.reasonCodes.includes("blocked-rights"));

const minorsBlocked = asset({
  id: "asset-minors",
  sourceSystem: "Photographer intake",
  sourceAccount: "Media team",
  rightsStatus: "Rights approved",
  consentStatus: "Consent confirmed",
  peopleRisk: "Possible minors"
});
assert.ok(buildPortalReuseDecision(minorsBlocked, "Reviewer").reuse.reasonCodes.includes("blocked-people-minors"));

const sourceBlocked = asset({
  id: "asset-source",
  sourceSystem: undefined,
  sourceAccount: undefined,
  sourcePath: undefined,
  sourceAlbumPath: undefined,
  sourceAlbumMemberships: [],
  collection: "ResourceSpace export",
  rightsStatus: "Rights approved",
  consentStatus: "Consent confirmed"
});
assert.ok(buildPortalReuseDecision(sourceBlocked, "Reviewer").reuse.reasonCodes.includes("blocked-source"));

const reviewPresenter = presentReviewContext({
  asset: publicApproved,
  role: "Reviewer",
  currentStatus: "Approved",
  nextBestAction: "Complete evidence: Rights",
  approvalReady: true,
  queueLabel: "Reviewer queue"
});
assert.doesNotMatch(flattened(reviewPresenter), /lm\.photos@tjc\.org|google-takeout|sourcepath|sourceaccount/);

console.log("portal-context-presenters tests passed");
