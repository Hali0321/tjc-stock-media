import {
  assetHasChildrenYouthRisk,
  assetHasRenditionGap,
  assetHasTaxonomyDrift,
  assetIsDuplicateCandidate,
  assetIsPortalReady,
  assetNeedsAiEnrichment,
  assetNeedsReview,
  assetNeedsRightsReview,
  assetNeedsSourceReview,
  assetNeedsStaleApprovalReview,
  buildDuplicateGroupCounts
} from "@/lib/asset-governance";
import { auditLogDiagnostics } from "@/lib/audit-log";
import { getActiveMediaSource } from "@/lib/media-source";
import { hasResourceSpaceApiConfig } from "@/lib/env";
import { pendingReviewWriteDiagnostics } from "@/lib/pending-review-writes";
import { resourceSpaceFieldMap } from "@/lib/resourcespace-field-map";
import { canonicalTags } from "@/lib/taxonomy";
import type { AdminActionItem, DamReadinessItem, DamReadinessResult, FieldMappingStatus, IntegrationReadinessItem, StockMediaAsset, VocabularyInsight } from "@/lib/types";

const fieldDefinitions: Array<{
  key: keyof typeof resourceSpaceFieldMap;
  label: string;
  required: boolean;
}> = [
  { key: "publishStatus", label: "Publish status", required: true },
  { key: "usageScope", label: "Usage scope", required: true },
  { key: "rightsStatus", label: "Rights status", required: true },
  { key: "consentStatus", label: "Consent status", required: true },
  { key: "peopleVisible", label: "People visible", required: true },
  { key: "minorsVisible", label: "Children/youth visible", required: true },
  { key: "reviewer", label: "Reviewer", required: true },
  { key: "reviewedDate", label: "Review date", required: true },
  { key: "sourceSystem", label: "Source system", required: true },
  { key: "sourceAccount", label: "Source / photographer", required: false },
  { key: "sourcePath", label: "Source path", required: true },
  { key: "sourceAlbumMemberships", label: "Album memberships", required: false },
  { key: "visibleTags", label: "Visible tags", required: true },
  { key: "tjcTerms", label: "TJC terms", required: true },
  { key: "checksumSha256", label: "Checksum", required: true },
  { key: "duplicateGroup", label: "Duplicate group", required: false }
];

function ratio(count: number, total: number) {
  return total ? Math.round((count / total) * 100) : 0;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]) {
  return values.length ? clampScore(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

function fieldPresent(asset: StockMediaAsset, key: keyof typeof resourceSpaceFieldMap) {
  switch (key) {
    case "publishStatus":
      return Boolean(asset.status);
	    case "usageScope":
	      return Boolean(asset.usageScope);
	    case "rightsStatus":
	      return Boolean(asset.rightsStatus && !/unknown|needs review|review required/i.test(asset.rightsStatus));
	    case "consentStatus":
	      return Boolean(asset.consentStatus && !/unknown|needs review|review required/i.test(asset.consentStatus));
	    case "peopleVisible":
	      return Boolean(asset.peopleRisk && asset.peopleRisk !== "Unknown");
    case "minorsVisible":
      return Boolean(asset.peopleRisk && asset.peopleRisk !== "Unknown");
    case "visibleTags":
      return Boolean(asset.tags?.length);
    case "tjcTerms":
      return Boolean(asset.tjcTerms?.length);
    case "reviewer":
      return Boolean(asset.reviewer);
    case "reviewedDate":
      return Boolean(asset.reviewedDate);
    case "sourceAlbum":
      return Boolean(asset.collection);
    case "sourceAlbumMemberships":
      return Boolean(asset.sourceAlbumMemberships?.length);
    case "checksumSha256":
      return Boolean(asset.checksumSha256);
    case "duplicateGroup":
      return Boolean(asset.duplicateGroup);
    default: {
      const value = asset[key as keyof StockMediaAsset];
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    }
  }
}

function buildFieldMappings(assets: StockMediaAsset[]): FieldMappingStatus[] {
  return fieldDefinitions.map((field) => {
    const present = assets.filter((asset) => fieldPresent(asset, field.key)).length;
    const missing = Math.max(0, assets.length - present);
    return {
      key: field.key,
      label: field.label,
      resourceSpaceField: resourceSpaceFieldMap[field.key],
      required: field.required,
      coverage: ratio(present, assets.length),
      present,
      missing
    };
  });
}

function normalizeTerm(term: string) {
  return term.trim().replace(/\s+/g, " ");
}

function buildVocabulary(assets: StockMediaAsset[]): VocabularyInsight[] {
  const canonical = [...canonicalTags.visibleTags, ...canonicalTags.tjcTerms];
  const canonicalLookup = new Map(canonical.map((term) => [term.toLowerCase(), term]));
  const counts = new Map<string, { label: string; count: number }>();

  assets.forEach((asset) => {
    [...(asset.tags || []), ...(asset.tjcTerms || []), ...(asset.usageTerms || [])].forEach((term) => {
      const label = normalizeTerm(term);
      if (!label) return;
      const key = label.toLowerCase();
      const current = counts.get(key);
      counts.set(key, { label: current?.label || label, count: (current?.count || 0) + 1 });
    });
  });

  const canonicalRows: VocabularyInsight[] = canonical
    .flatMap((term) => {
      const count = counts.get(term.toLowerCase())?.count || 0;
      return count ? [{ term, count, kind: "canonical" as const }] : [];
    });

  const candidateRows: VocabularyInsight[] = [...counts.entries()]
    .filter(([key]) => !canonicalLookup.has(key))
    .map(([, item]) => ({
      term: item.label,
      count: item.count,
      kind: item.count >= 3 ? ("candidate" as const) : ("drift" as const)
    }))
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
    .slice(0, 18);

  return [...canonicalRows, ...candidateRows].slice(0, 28);
}

function buildActionBacklog({
  needsReview,
  rightsReview,
  missingSource,
  childrenYouth,
  peopleUnknown,
  aiEnrichment,
  taxonomyDrift,
  renditionGaps,
  staleApprovals,
  duplicateCandidates
}: {
  needsReview: number;
  rightsReview: number;
  missingSource: number;
  childrenYouth: number;
  peopleUnknown: number;
  aiEnrichment: number;
  taxonomyDrift: number;
  renditionGaps: number;
  staleApprovals: number;
  duplicateCandidates: number;
}): AdminActionItem[] {
  const items: AdminActionItem[] = [
    {
      id: "write-mapping",
      severity: "critical",
      label: "ResourceSpace write mapping",
      count: needsReview,
      owner: "DAM Admin",
      action: "Map publish status, reviewer, date, notes, and audit fields before real approvals persist."
    },
    {
      id: "rights-review",
      severity: rightsReview ? "high" : "low",
      label: "Rights and consent review coverage",
      count: rightsReview,
      owner: "Reviewer",
      action: "Confirm rights status, consent, restrictions, and public-use notes before external reuse.",
      savedViewId: "rights-review"
    },
    {
      id: "missing-source",
      severity: missingSource ? "high" : "low",
      label: "Source traceability",
      count: missingSource,
      owner: "Contributor",
      action: "Attach source system, source account, album/path, or ResourceSpace source fields.",
      savedViewId: "missing-source"
    },
    {
      id: "children-youth",
      severity: childrenYouth ? "high" : "low",
      label: "Children/youth guardrail",
      count: childrenYouth,
      owner: "Reviewer",
      action: "Keep youth/minors media out of public portals until explicit review is recorded.",
      savedViewId: "children-youth-review"
    },
    {
      id: "people-review",
      severity: peopleUnknown ? "high" : "low",
      label: "People/minors unknown",
      count: peopleUnknown,
      owner: "Reviewer",
      action: "Mark people visible, no people, adults visible, or children/youth possible for every reusable asset.",
      savedViewId: "people-unknown"
    },
    {
      id: "renditions",
      severity: renditionGaps ? "medium" : "low",
      label: "Derivative readiness",
      count: renditionGaps,
      owner: "DAM Admin",
      action: "Confirm detail/download derivatives and dimensions so previews are not stretched or misleading.",
      savedViewId: "rendition-gaps"
    },
    {
      id: "metadata",
      severity: aiEnrichment || taxonomyDrift ? "medium" : "low",
      label: "Metadata enrichment",
      count: aiEnrichment + taxonomyDrift,
      owner: "Contributor",
      action: "Normalize useful titles, controlled TJC terms, visible tags, and use-case vocabulary.",
      savedViewId: "ai-enrichment"
    },
    {
      id: "governance-housekeeping",
      severity: staleApprovals || duplicateCandidates ? "medium" : "low",
      label: "Governance housekeeping",
      count: staleApprovals + duplicateCandidates,
      owner: "DAM Admin",
      action: "Review stale approvals and duplicate groups without losing source provenance.",
      savedViewId: "stale-approvals"
    }
  ];
  return items.sort((a, b) => {
    const weight = { critical: 0, high: 1, medium: 2, low: 3 };
    return weight[a.severity] - weight[b.severity] || b.count - a.count;
  });
}

function buildIntegrationReadiness({
  status,
  approvedPublic,
  portalReady,
  auditEvents
}: {
  status: Awaited<ReturnType<typeof getActiveMediaSource>>["status"];
  approvedPublic: number;
  portalReady: number;
  auditEvents: ReturnType<typeof auditLogDiagnostics>;
}): IntegrationReadinessItem[] {
  const pending = pendingReviewWriteDiagnostics();
  const apiConfigured = hasResourceSpaceApiConfig();
  return [
    {
      id: "metadata-source",
      label: "ResourceSpace read bridge",
      ready: status.adapter === "resourcespace-api" || status.adapter === "exported-metadata",
      owner: "ResourceSpace",
      detail: status.detail
    },
    {
      id: "review-writes",
      label: "ResourceSpace write mapping",
      ready: apiConfigured,
      owner: "ResourceSpace",
      detail: apiConfigured
        ? "API credentials are present; field refs still need production write verification before automatic sync."
        : "Review actions queue locally. ResourceSpace API write mapping is not configured yet."
    },
    {
      id: "pending-review-writes",
      label: "Pending review write queue",
      ready: pending.count === 0,
      owner: "DAM Admin",
      detail: `${pending.count.toLocaleString()} pending write${pending.count === 1 ? "" : "s"}. Last attempt: ${pending.lastAttemptAt || "none"}. Last error: ${pending.lastError || "none"}.`
    },
    {
      id: "audit-log",
      label: "Portal audit log",
      ready: auditEvents.count > 0,
      owner: "DAM Admin",
      detail: auditEvents.count
        ? `${auditEvents.count.toLocaleString()} recent audit event${auditEvents.count === 1 ? "" : "s"}. Latest event: ${auditEvents.latestAt || "none"}.`
        : "No local portal audit events recorded yet. Production still needs durable identity-backed audit storage."
    },
    {
      id: "auth",
      label: "Real authentication / SSO",
      ready: false,
      owner: "DAM Admin",
      detail: "Demo role switch is useful for stakeholder review; production needs real identity and permissions."
    },
    {
      id: "master-originals",
      label: "Google Shared Drive master originals",
      ready: false,
      owner: "Google Shared Drive",
      detail: "Master-original model is documented; production needs access, backup, and ownership confirmation."
    },
    {
      id: "approved-copy-delivery",
      label: "Approved copy delivery",
      ready: portalReady > 0,
      owner: "Reviewers",
      detail: portalReady
        ? `${portalReady.toLocaleString()} portal-ready asset${portalReady === 1 ? "" : "s"} can be downloaded as approved copies.`
        : `${approvedPublic.toLocaleString()} ResourceSpace-approved public asset${approvedPublic === 1 ? "" : "s"} still need portal reuse checks before copy delivery.`
    },
    {
      id: "public-portal",
      label: "Public portal gate",
      ready: portalReady > 0,
      owner: "DAM Admin",
      detail: portalReady
        ? `${portalReady.toLocaleString()} asset${portalReady === 1 ? "" : "s"} pass the portal-ready policy.`
        : "No asset passes portal-ready policy until rights, people/minors, and derivative confidence improve."
    }
  ];
}

function readinessItem(item: DamReadinessItem): DamReadinessItem {
  return {
    ...item,
    score: clampScore(item.score),
    tone: item.score >= 80 ? "ok" : item.score >= 55 ? "info" : "warn"
  };
}

export async function getDamReadiness(): Promise<DamReadinessResult> {
  const { assets, status } = await getActiveMediaSource();
  const assetCount = assets.length;
  const duplicateGroupCounts = buildDuplicateGroupCounts(assets);

  const approvedPublic = assets.filter((asset) => asset.status === "Approved Public").length;
  const portalReady = assets.filter(assetIsPortalReady).length;
  const needsReview = assets.filter(assetNeedsReview).length;
  const rightsReview = assets.filter(assetNeedsRightsReview).length;
  const missingSource = assets.filter(assetNeedsSourceReview).length;
  const childrenYouth = assets.filter(assetHasChildrenYouthRisk).length;
  const peopleUnknown = assets.filter((asset) => !asset.peopleRisk || asset.peopleRisk === "Unknown").length;
  const aiEnrichment = assets.filter(assetNeedsAiEnrichment).length;
  const taxonomyDrift = assets.filter(assetHasTaxonomyDrift).length;
  const duplicateCandidates = assets.filter((asset) => assetIsDuplicateCandidate(asset, duplicateGroupCounts)).length;
  const renditionGaps = assets.filter(assetHasRenditionGap).length;
  const staleApprovals = assets.filter((asset) => assetNeedsStaleApprovalReview(asset)).length;
  const auditLog = auditLogDiagnostics();

  const sourceCoverage = 100 - ratio(missingSource, assetCount);
  const rightsCoverage = 100 - ratio(rightsReview, assetCount);
  const peopleCoverage = 100 - ratio(peopleUnknown, assetCount);
  const reviewFlow = 100 - ratio(needsReview, assetCount);
  const taxonomyScore = 100 - ratio(taxonomyDrift, assetCount);
  const enrichmentScore = 100 - ratio(aiEnrichment, assetCount);
  const portalScore = approvedPublic ? ratio(portalReady, approvedPublic) : 0;
  const duplicateScore = 100 - ratio(duplicateCandidates, assetCount);
  const staleScore = 100 - ratio(staleApprovals, assetCount);
  const renditionScore = 100 - ratio(renditionGaps, assetCount);

  const readiness = [
    readinessItem({
      id: "find",
      pillar: "Find",
      label: "Search quality",
      score: average([taxonomyScore, enrichmentScore]),
      detail: "Controlled vocabulary, AI enrichment backlog, and useful titles.",
      action: "Clear taxonomy drift and enrichment queues.",
      savedViewId: "taxonomy-drift",
      tone: "info"
    }),
    readinessItem({
      id: "trust",
      pillar: "Trust",
      label: "Use confidence",
      score: average([sourceCoverage, rightsCoverage, peopleCoverage]),
      detail: "Source, rights, people/minors, consent, and review evidence.",
      action: "Fix missing source, rights review, and unknown people fields.",
      savedViewId: "rights-review",
      tone: "info"
    }),
    readinessItem({
      id: "review",
      pillar: "Review",
      label: "Reviewer workflow",
      score: reviewFlow,
      detail: "Assets should enter Needs Review, then leave with reviewer, date, notes, and status.",
      action: "Work pending review queue and required review fields.",
      savedViewId: "needs-review",
      tone: "info"
    }),
    readinessItem({
      id: "share",
      pillar: "Share",
      label: "Portal readiness",
      score: average([portalScore, renditionScore]),
      detail: "Public portals need approved assets, safe metadata, and approved derivatives.",
      action: "Fix portal-ready blockers and rendition gaps before public sharing.",
      savedViewId: "portal-ready",
      tone: "info"
    }),
    readinessItem({
      id: "govern",
      pillar: "Govern",
      label: "Archive control",
      score: average([duplicateScore, staleScore, taxonomyScore]),
      detail: "Duplicates, stale approvals, taxonomy drift, and source traceability stay visible.",
      action: "Resolve duplicate cleanup, stale approvals, and vocabulary drift.",
      savedViewId: "duplicate-candidates",
      tone: "info"
    })
  ];

  return {
    source: status,
    score: average(readiness.map((item) => item.score)),
    assetCount,
    metrics: {
      approvedPublic,
      portalReady,
      needsReview,
      rightsReview,
      missingSource,
      childrenYouth,
      aiEnrichment,
      taxonomyDrift,
      duplicateCandidates,
      renditionGaps,
      staleApprovals
    },
    readiness,
    fieldMappings: buildFieldMappings(assets),
    vocabulary: buildVocabulary(assets),
    portalPolicy: [
      {
        id: "approval",
        label: "Approved Public only",
        blocked: Math.max(0, assetCount - approvedPublic),
        detail: "Public portals should exclude anything not approved public.",
        savedViewId: "approved-church-wide"
      },
      {
        id: "rights",
        label: "Rights clear",
        blocked: rightsReview,
        detail: "Rights review must be clear before external reuse.",
        savedViewId: "rights-review"
      },
      {
        id: "source",
        label: "Source traceable",
        blocked: missingSource,
        detail: "Source system, album, path, or owner must be traceable.",
        savedViewId: "missing-source"
      },
      {
        id: "children",
        label: "Children/youth guarded",
        blocked: childrenYouth,
        detail: "Children/youth assets require explicit review before public use.",
        savedViewId: "children-youth-review"
      },
      {
        id: "renditions",
        label: "Derivatives ready",
        blocked: renditionGaps,
        detail: "Approved download/detail derivatives must exist for sharing.",
        savedViewId: "rendition-gaps"
      },
      {
        id: "stale",
        label: "Approval current",
        blocked: staleApprovals,
        detail: "Old approvals need periodic recheck.",
        savedViewId: "stale-approvals"
      }
    ],
    actionBacklog: buildActionBacklog({
      needsReview,
      rightsReview,
      missingSource,
      childrenYouth,
      peopleUnknown,
      aiEnrichment,
      taxonomyDrift,
      renditionGaps,
      staleApprovals,
      duplicateCandidates
    }),
    integrationReadiness: buildIntegrationReadiness({ status, approvedPublic, portalReady, auditEvents: auditLog }),
    auditLog
  };
}
