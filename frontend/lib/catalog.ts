import { decideAccess } from "@/lib/access-decisions";
import {
  assetHasRenditionGap,
  assetHasTaxonomyDrift,
  assetIsDuplicateCandidate,
  buildDuplicateGroupCounts,
  assetMetadataHealth,
  assetIsApproved,
  assetIsPortalReady,
  assetNeedsReview,
  assetNeedsSourceReview,
  assetNeedsAiEnrichment,
  assetNeedsStaleApprovalReview,
  countAssetGovernance
} from "@/lib/asset-governance";
import { getActiveMediaSource } from "@/lib/media-source";
import { assetWithRoleImageUrls, collectionImageUrl } from "@/lib/presentation";
import { assetMatchesReviewQueue, missingReviewFields, reviewQueues, reviewRiskFlags, type ReviewQueueId } from "@/lib/workflow-policy";
import type { CatalogCollection, CatalogSort, DemoRole, MetadataHealthSummary, OperationalInsight, SavedViewSummary, SearchResult, StockMediaAsset, ZeroResultInsight } from "@/lib/types";

type SavedViewDefinition = {
  id: string;
  label: string;
  description: string;
  reason: string;
  terms?: string[];
  match: (asset: StockMediaAsset) => boolean;
};

export const catalogSortOptions: CatalogSort[] = ["Approved first", "Recently approved", "Newest", "A-Z"];

function assetHaystack(asset: StockMediaAsset) {
  return [
    asset.title,
    asset.collection,
    asset.status,
    asset.usageScope,
    asset.mediaType,
    asset.peopleRisk,
    asset.eventName,
    asset.eventDate,
    asset.capturedDate,
    asset.importDate,
    asset.sourcePlatform,
    asset.sourceSystem,
    asset.sourceAccount,
    asset.rightsStatus,
    asset.qualityStatus,
    asset.sensitiveContext,
    ...(asset.tags || []),
    ...(asset.tjcTerms || []),
    ...(asset.usageTerms || [])
  ]
    .join(" ")
    .toLowerCase();
}

function includesAny(asset: StockMediaAsset, terms: string[]) {
  const haystack = assetHaystack(asset);
  return terms.some((term) => haystack.includes(term.toLowerCase()));
}

export const savedViewDefinitions: SavedViewDefinition[] = [
  {
    id: "approved-church-wide",
    label: "Portal ready",
    description: "Public-safe assets cleared by portal reuse policy.",
    reason: "Fastest path for newsletters, websites, slides, and church-wide communication.",
    match: assetIsPortalReady
  },
  {
    id: "batch-approved-blockers",
    label: "Needs portal review",
    description: "ResourceSpace-approved assets that still have portal reuse blockers.",
    reason: "Keeps batch approval separate from actual public-safe reuse.",
    match: (asset) => asset.status === "Approved Public" && !assetIsPortalReady(asset)
  },
  {
    id: "internal-ministry",
    label: "Internal ministry use only",
    description: "Useful for teams, recap decks, and internal ministry updates.",
    reason: "Keeps internal assets discoverable without public sharing risk.",
    match: (asset) => asset.status === "Approved Internal" || asset.usageScope === "Internal"
  },
  {
    id: "website-hero",
    label: "Website hero images",
    description: "Wide, quiet, no-people or low-risk images for web headers.",
    reason: "Uses approved status plus available website, landscape, detail, Bible, flower, sanctuary, and no-people metadata.",
    terms: ["website", "hero", "landscape", "sanctuary", "bible", "flower", "plant", "water", "stage"],
    match: (asset) => asset.status === "Approved Public" && (asset.peopleRisk === "No people" || includesAny(asset, ["website", "hero", "landscape", "bible", "flower", "plant", "water", "stage"]))
  },
  {
    id: "sermon-slides",
    label: "Sermon / slide backgrounds",
    description: "Bible, worship, stage, study, and graphic assets for presentation use.",
    reason: "Backed by tags, TJC terms, usage terms, and media type.",
    terms: ["sermon", "slide", "presentation", "worship", "bible", "teaching", "study", "stage", "graphic"],
    match: (asset) => (asset.status === "Approved Public" || asset.status === "Approved Internal") && includesAny(asset, ["sermon", "slide", "presentation", "worship", "bible", "teaching", "study", "stage", "graphic"])
  },
  {
    id: "newsletter",
    label: "Newsletter images",
    description: "Approved photos and details suited for local church updates.",
    reason: "Uses approved assets with newsletter/useful/event/detail tags when present.",
    terms: ["newsletter", "fellowship", "welcome", "flower", "bible", "event", "church life"],
    match: (asset) => asset.status === "Approved Public" && includesAny(asset, ["newsletter", "fellowship", "welcome", "flower", "bible", "event", "church life", "plant"])
  },
  {
    id: "social-media",
    label: "Social media images",
    description: "Approved assets with social, square, event, or detail usefulness.",
    reason: "Shows only approved public assets; derivatives may still be configured by admins.",
    terms: ["social", "square", "event", "fellowship", "flower", "bible", "welcome"],
    match: (asset) => asset.status === "Approved Public" && includesAny(asset, ["social", "square", "event", "fellowship", "flower", "bible", "welcome", "plant"])
  },
	  {
	    id: "no-people",
	    label: "No people",
	    description: "Lower-risk details, textures, and object photos.",
	    reason: "Uses exported people visibility metadata.",
	    match: (asset) => asset.peopleRisk === "No people" && (asset.status === "Approved Public" || asset.status === "Approved Internal")
	  },
  {
    id: "people-unknown",
    label: "People unknown",
    description: "Assets where people/minors visibility is not confirmed.",
    reason: "Keeps public-use decisions honest until reviewers classify people/minors visibility.",
    match: (asset) => !asset.peopleRisk || asset.peopleRisk === "Unknown"
  },
  {
    id: "children-youth-review",
    label: "Children/youth review",
    description: "Assets needing extra care before public use.",
    reason: "Uses minors, children/youth, and sensitive-context metadata.",
    match: (asset) => asset.peopleRisk === "Possible minors" || !asset.peopleRisk || asset.peopleRisk === "Unknown" || includesAny(asset, ["children", "youth", "minor"])
  },
  {
    id: "recently-approved",
    label: "Recently approved",
    description: "Newest reviewed public/internal assets.",
    reason: "Uses exported review date where present.",
    match: (asset) => Boolean(asset.reviewedDate) && assetIsApproved(asset)
  },
  {
    id: "needs-review",
    label: "Needs review",
    description: "Blocked until reviewer approval.",
    reason: "Uses ResourceSpace publish status and people/minors risk.",
    match: assetNeedsReview
  },
  {
    id: "archive-only",
    label: "Archive only",
    description: "Traceable, searchable assets not promoted for reuse.",
    reason: "Uses archive status or archive usage scope.",
    match: (asset) => asset.status === "Searchable Archive" || asset.usageScope === "Archive Only"
  },
  {
    id: "portal-ready",
    label: "Portal ready",
    description: "Public-approved assets with enough metadata and renditions for a share portal.",
    reason: "Combines approval, health score, children/youth risk, and derivative readiness.",
    match: assetIsPortalReady
  },
  {
    id: "ai-enrichment",
    label: "AI enrichment queue",
    description: "Assets that need tags, dimensions, people check, or TJC vocabulary.",
    reason: "Best-in-class DAMs use AI to suggest metadata; humans still approve rights and tags.",
    match: assetNeedsAiEnrichment
  },
  {
    id: "taxonomy-drift",
    label: "Taxonomy drift",
    description: "Generic titles or sparse controlled vocabulary that weaken search.",
    reason: "Finds assets needing normalized terms before teams rely on search.",
    match: assetHasTaxonomyDrift
  },
  {
    id: "stale-approvals",
    label: "Stale approvals",
    description: "Previously approved assets old enough for periodic review.",
    reason: "Keeps permissions and public-use assumptions from going stale.",
    match: (asset) => assetNeedsStaleApprovalReview(asset)
  },
  {
    id: "rendition-gaps",
    label: "Rendition gaps",
    description: "Assets missing downloadable/detail derivatives or dimensions.",
    reason: "Good DAMs expose correct sizes and approved derivatives for each channel.",
    match: assetHasRenditionGap
  },
  {
    id: "duplicate-candidates",
    label: "Duplicate cleanup",
    description: "Potential duplicate groups that need a canonical/source decision.",
    reason: "Best-in-class DAMs keep duplicate records traceable without confusing users.",
    match: (asset) => assetIsDuplicateCandidate(asset)
  }
];

const collectionDefinitions = [
  {
    id: "sabbath",
    name: "Sabbath",
    description: "Worship, Sabbath service, and church life",
    searchQuery: "worship Sabbath service church life Bible fellowship",
    terms: ["sabbath", "worship", "bible", "scripture", "church", "service", "sermon", "fellowship"]
  },
  {
    id: "teaching-study",
    name: "Teaching & Study",
    description: "Bible study, sermon, and teaching visuals",
    searchQuery: "Bible teaching study sermon slides",
    terms: ["teaching", "study", "bible", "scripture", "lesson", "sermon", "slide"]
  },
  {
    id: "seasonal-details",
    name: "Seasonal Details",
    description: "Flowers, decorations, and visual textures",
    searchQuery: "flowers seasonal plant decoration",
    terms: ["seasonal", "flower", "flowers", "plant", "detail", "decoration"]
  },
  {
    id: "welcome-team",
    name: "Welcome Team",
    description: "Hospitality and gathering details",
    searchQuery: "welcome fellowship church hospitality",
    terms: ["welcome", "fellowship", "church", "people", "hospitality"]
  },
  {
    id: "fellowship",
    name: "Fellowship",
    description: "Church Life and ministry gatherings",
    searchQuery: "fellowship church life gathering",
    terms: ["fellowship", "church life", "gathering", "people"]
  },
  {
    id: "web-slides",
    name: "Web & Slides",
    description: "Graphics, slide backgrounds, and web-ready assets",
    searchQuery: "graphic slide website hero",
    terms: ["graphic", "graphics", "slide", "website", "stage", "hero"]
  }
];

const viewAliases = new Map([
  ["portal-ready", "approved-church-wide"],
  ["children-youth", "children-youth-review"]
]);

const intentDefinitions = [
  { view: "website-hero", confidence: "exact" as const, terms: ["website hero"] },
  { view: "website-hero", confidence: "synonym" as const, terms: ["hero", "banner", "header"] },
  { view: "portal-ready", confidence: "exact" as const, terms: ["public safe", "safe for web"] },
  { view: "no-people", confidence: "exact" as const, terms: ["no people"] },
  { view: "children-youth-review", confidence: "synonym" as const, terms: ["children", "youth", "minors", "minor"] },
  { view: "needs-review", confidence: "exact" as const, terms: ["needs review", "review"] },
  { view: "internal-ministry", confidence: "exact" as const, terms: ["internal"] },
  { view: "archive-only", confidence: "exact" as const, terms: ["archive"] }
];

export function normalizeSavedViewId(view?: string) {
  if (!view) return undefined;
  return viewAliases.get(view) || view;
}

export function isKnownSavedViewId(view?: string) {
  const normalized = normalizeSavedViewId(view);
  return Boolean(normalized && savedViewDefinitions.some((item) => item.id === normalized));
}

export function isKnownCollectionId(collection?: string) {
  return Boolean(collection && collectionDefinitions.some((item) => item.id === collection));
}

function matchSearchIntent(query: string) {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalized) return undefined;
  for (const intent of intentDefinitions) {
    if (intent.terms.some((term) => normalized === term)) {
      return { rawQuery: query, matchedView: intent.view, confidence: intent.confidence };
    }
  }
  return { rawQuery: query, confidence: "none" as const };
}

function matchesQuery(asset: StockMediaAsset, query: string) {
  if (!query.trim()) return true;
  const haystack = assetHaystack(asset);
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

function rawQueryCount(assets: StockMediaAsset[], query: string) {
  return assets.filter((asset) => matchesQuery(asset, query)).length;
}

function matchesFilters(asset: StockMediaAsset, filters: string[]) {
  return filters.every((filter) => {
    const value = filter.toLowerCase();
    const dimensions = asset.imageDimensions?.match(/(\d+)\D+(\d+)/);
    const width = Number(dimensions?.[1] || 0);
    const height = Number(dimensions?.[2] || 0);
    if (value === "approved public" || value === "church-wide use") return asset.status === "Approved Public";
    if (value === "approved internal" || value === "internal ministry") return asset.status === "Approved Internal";
    if (value === "needs review") return asset.status === "Needs Review" || asset.status === "Possible Minors";
    if (value === "archive only") return asset.status === "Searchable Archive" || asset.usageScope === "Archive Only";
    if (["photo", "video", "audio", "graphic", "document"].includes(value)) return asset.mediaType === value;
    if (value === "no people") return asset.peopleRisk === "No people";
    if (value === "adults only") return asset.peopleRisk === "Adults visible";
    if (value === "people unknown") return !asset.peopleRisk || asset.peopleRisk === "Unknown";
    if (value === "possible minors" || value === "children/youth") return asset.peopleRisk === "Possible minors";
    if (value === "missing source") return assetNeedsSourceReview(asset);
    if (value === "rights review") return reviewRiskFlags(asset).includes("Rights unclear");
    if (value === "portal ready") return assetIsPortalReady(asset);
    if (value === "ai enrichment") return assetNeedsAiEnrichment(asset);
    if (value === "taxonomy drift") return assetHasTaxonomyDrift(asset);
    if (value === "duplicate candidate") return assetIsDuplicateCandidate(asset);
    if (value === "stale approval") return assetNeedsStaleApprovalReview(asset);
    if (value === "rendition gap") return assetHasRenditionGap(asset);
    if (value === "landscape") return width > height || assetHaystack(asset).includes("landscape");
    if (value === "portrait") return height > width || assetHaystack(asset).includes("portrait");
    if (value === "square") return Boolean(width && height && Math.abs(width - height) < Math.max(width, height) * 0.08) || assetHaystack(asset).includes("square");
    if (value === "lm photos") return /lm photos/i.test(`${asset.sourceSystem || ""} ${asset.sourceAccount || ""}`);
    if (value === "resourcespace") return Boolean(asset.resourceSpaceId);
    if (value === "photographer") return Boolean(asset.sourceAccount);
    return assetHaystack(asset).includes(value);
  });
}

function statusWeight(asset: StockMediaAsset) {
  if (asset.status === "Approved Public") return 0;
  if (asset.status === "Approved Internal") return 1;
  if (asset.status === "Needs Review") return 2;
  if (asset.status === "Possible Minors") return 3;
  if (asset.status === "Searchable Archive") return 4;
  return 5;
}

function normalizeSort(sort?: string): CatalogSort {
  return catalogSortOptions.includes(sort as CatalogSort) ? (sort as CatalogSort) : "Approved first";
}

function sortCatalogAssets(assets: StockMediaAsset[], sort?: string) {
  const normalized = normalizeSort(sort);
  const sorted = [...assets];
  if (normalized === "A-Z") {
    return sorted.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, {
        numeric: true,
        sensitivity: "base"
      })
    );
  }
  if (normalized === "Newest") {
    return sorted.sort((a, b) => (b.capturedDate || b.importDate || b.id || "").localeCompare(a.capturedDate || a.importDate || a.id || "", undefined, { numeric: true }));
  }
  if (normalized === "Recently approved") {
    return sorted.sort((a, b) => (b.reviewedDate || "").localeCompare(a.reviewedDate || ""));
  }
  sorted.sort((a, b) => statusWeight(a) - statusWeight(b) || curatedWeight(b) - curatedWeight(a) || a.title.localeCompare(b.title));
  return diversifyAssets(sorted);
}

function curatedWeight(asset: StockMediaAsset) {
  const terms = assetHaystack(asset);
  let score = 0;
  if (asset.tags?.length || asset.tjcTerms?.length) score += 8;
  if (terms.includes("bible")) score += 28;
  if (terms.includes("worship")) score += 18;
  if (terms.includes("fellowship")) score += 16;
  if (terms.includes("flower")) score += 14;
  if (terms.includes("plant")) score += 12;
  if (terms.includes("fountain")) score += 12;
  if (terms.includes("water")) score += 8;
  if (terms.includes("stage")) score += 8;
  return score;
}

function diversityKey(asset: StockMediaAsset) {
  const haystack = assetHaystack(asset);
  if (haystack.includes("bible") || haystack.includes("scripture")) return "bible";
  if (haystack.includes("flower") || haystack.includes("plant") || haystack.includes("seasonal")) return "details";
  if (haystack.includes("fellowship") || haystack.includes("welcome")) return "fellowship";
  if (haystack.includes("graphic") || haystack.includes("slide") || haystack.includes("stage")) return "graphics";
  if (haystack.includes("water") || haystack.includes("fountain")) return "water";
  return asset.collection || asset.mediaType;
}

function diversifyAssets(assets: StockMediaAsset[]) {
  const buckets = new Map<string, StockMediaAsset[]>();
  assets.forEach((asset) => {
    const key = diversityKey(asset);
    buckets.set(key, [...(buckets.get(key) || []), asset]);
  });
  const keys = [...buckets.keys()].sort((a, b) => (buckets.get(b)?.length || 0) - (buckets.get(a)?.length || 0));
  const diversified: StockMediaAsset[] = [];
  let cursor = 0;
  while (diversified.length < assets.length && keys.length) {
    const key = keys[cursor % keys.length];
    const bucket = buckets.get(key);
    const next = bucket?.shift();
    if (next) diversified.push(next);
    if (!bucket?.length) keys.splice(cursor % keys.length, 1);
    else cursor += 1;
  }
  return diversified;
}

function buildSavedViews(assets: StockMediaAsset[]): SavedViewSummary[] {
  return savedViewDefinitions.map((view) => ({
    id: view.id,
    label: view.label,
    description: view.description,
    reason: view.reason,
    count: assets.filter(view.match).length
  }));
}

function dateRangeFor(assets: StockMediaAsset[]) {
  const dates = assets
    .flatMap((asset) => [asset.eventDate, asset.capturedDate, asset.reviewedDate, asset.importDate])
    .filter(Boolean)
    .sort() as string[];
  if (!dates.length) return "Date not available";
  const first = dates[0]?.slice(0, 4);
  const last = dates.at(-1)?.slice(0, 4);
  return first && last && first !== last ? `${first}-${last}` : first || "Recently updated";
}

function approvalSummary(assets: StockMediaAsset[]) {
  const approved = assets.filter(assetIsApproved).length;
  const internal = assets.filter((asset) => asset.status === "Approved Internal").length;
  const review = assets.filter(assetNeedsReview).length;
  if (!assets.length) return "0 approved / 0 review";
  if (review) return `${approved} approved / ${review} review`;
  if (internal) return `${approved} approved / ${internal} internal`;
  return `${approved} approved assets`;
}

function buildCollections(assets: StockMediaAsset[], role: DemoRole): CatalogCollection[] {
  const approvedOrInternal = assets.filter(assetIsApproved);
  return collectionDefinitions.map((definition) => {
    const matching = approvedOrInternal.filter((asset) => includesAny(asset, definition.terms));
    const warning = matching.some((asset) => asset.peopleRisk === "Possible minors")
      ? "Contains children/youth review items"
      : matching.some((asset) => asset.peopleRisk === "Adults visible")
        ? "People visible in some assets"
        : undefined;
    return {
      id: definition.id,
      name: definition.name,
	      description: definition.description,
	      count: matching.length,
	      countLabel: `${matching.length.toLocaleString()} asset${matching.length === 1 ? "" : "s"}`,
	      dateRange: dateRangeFor(matching),
	      ministry: matching.find((asset) => asset.sourceAccount)?.sourceAccount || matching.find((asset) => asset.eventName)?.eventName || "Source not available",
      approvalSummary: approvalSummary(matching),
      peopleWarning: warning,
      searchQuery: definition.searchQuery,
      viewId: definition.id,
      images: matching
        .slice(0, 5)
        .map((asset) => ({ src: collectionImageUrl(asset, role), alt: asset.thumbnailAlt }))
        .filter((image): image is { src: string; alt: string } => Boolean(image.src))
    };
  });
}

function collectionMatches(asset: StockMediaAsset, collectionId?: string) {
  if (!collectionId) return true;
  const definition = collectionDefinitions.find((item) => item.id === collectionId);
  if (!definition) return false;
  return assetIsApproved(asset) && includesAny(asset, definition.terms);
}

function buildMetadataHealth(assets: StockMediaAsset[]): MetadataHealthSummary {
  const health = assets.map(assetMetadataHealth);
  const averageScore = health.length ? Math.round(health.reduce((sum, item) => sum + item.score, 0) / health.length) : 0;
  return {
    averageScore,
    complete: health.filter((item) => item.state === "Complete").length,
    needsSource: health.filter((item) => item.missing.includes("source")).length,
    needsPeople: health.filter((item) => item.missing.includes("people")).length,
    needsRights: health.filter((item) => item.missing.includes("rights")).length,
    needsUsage: health.filter((item) => item.missing.includes("usage")).length,
    reviewPending: health.filter((item) => item.missing.includes("review")).length
  };
}

function buildZeroResultInsights(assets: StockMediaAsset[]): ZeroResultInsight[] {
  const probes = [
    {
      query: "website hero",
      savedViewId: "website-hero",
      recommendation: "Map hero language to the Website hero saved view instead of plain keyword search."
    },
    {
      query: "no people",
      savedViewId: "no-people",
      recommendation: "Require people-risk metadata during intake; otherwise no-people assets cannot be trusted."
    },
    {
      query: "children",
      savedViewId: "children-youth-review",
      recommendation: "Route children/youth terms to the reviewer queue and block public download until approval."
    },
    {
      query: "needs review",
      savedViewId: "needs-review",
      recommendation: "Use review-state fields instead of free text for operational searches."
    },
    {
      query: "public safe",
      savedViewId: "portal-ready",
      recommendation: "Translate public-safe intent to Portal Ready, not raw ResourceSpace approval."
    }
  ];

  return probes
    .map((probe) => {
      const savedView = savedViewDefinitions.find((view) => view.id === probe.savedViewId);
      return {
        query: probe.query,
        rawCount: rawQueryCount(assets, probe.query),
        savedViewCount: savedView ? assets.filter(savedView.match).length : 0,
        savedViewId: probe.savedViewId,
        recommendation: probe.recommendation
      };
    })
    .filter((item) => item.savedViewCount > 0 && (item.rawCount === 0 || item.rawCount < item.savedViewCount));
}

function buildOperationalInsights(assets: StockMediaAsset[]): OperationalInsight[] {
  const portalReady = assets.filter(assetIsPortalReady).length;
  const peopleUnknown = assets.filter((asset) => !asset.peopleRisk || asset.peopleRisk === "Unknown").length;
  const aiEnrichment = assets.filter(assetNeedsAiEnrichment).length;
  const taxonomyDrift = assets.filter(assetHasTaxonomyDrift).length;
  const renditionGaps = assets.filter(assetHasRenditionGap).length;
  const staleApprovals = assets.filter((asset) => assetNeedsStaleApprovalReview(asset)).length;
  const duplicateGroupCounts = buildDuplicateGroupCounts(assets);
  const duplicateCandidates = assets.filter((asset) => assetIsDuplicateCandidate(asset, duplicateGroupCounts)).length;

  return [
    {
      id: "portal-ready",
      label: "Portal ready",
      value: portalReady,
      detail: "Approved Public assets with strong metadata, no children/youth warning, and required preview/download fields.",
      tone: portalReady ? "ok" : "warn",
      savedViewId: "portal-ready"
    },
    {
      id: "people-unknown",
      label: "People unknown",
      value: peopleUnknown,
	      detail: "People/minors visibility is not confirmed. Reviewer should verify before public use.",
	      tone: peopleUnknown ? "warn" : "ok",
	      savedViewId: "people-unknown"
	    },
    {
      id: "ai-enrichment",
      label: "Needs enrichment",
      value: aiEnrichment,
      detail: "Missing useful tags, TJC terms, dimensions, usage guidance, or people visibility metadata.",
      tone: aiEnrichment ? "info" : "ok",
      savedViewId: "ai-enrichment"
    },
    {
      id: "taxonomy-drift",
      label: "Taxonomy drift",
      value: taxonomyDrift,
      detail: "Generic titles or sparse tags that make discovery weaker.",
      tone: taxonomyDrift ? "info" : "ok",
      savedViewId: "taxonomy-drift"
    },
    {
      id: "rendition-gaps",
      label: "Rendition gaps",
      value: renditionGaps,
      detail: "Missing derivative URL or image dimension metadata needed for confident reuse.",
      tone: renditionGaps ? "warn" : "ok",
      savedViewId: "rendition-gaps"
    },
    {
      id: "duplicate-candidates",
      label: "Duplicate cleanup",
      value: duplicateCandidates,
      detail: "Potential duplicates need canonical/derivative decisions.",
      tone: duplicateCandidates ? "info" : "ok",
      savedViewId: "duplicate-candidates"
    },
    {
      id: "stale-approval",
      label: "Stale approval",
      value: staleApprovals,
      detail: "Approved assets reviewed more than 180 days ago.",
      tone: staleApprovals ? "info" : "ok",
      savedViewId: "stale-approvals"
    }
  ];
}

export async function searchAssets({
  role,
  query,
  filters,
  view,
  collection,
  sort,
  limit = 72
}: {
  role: DemoRole;
  query: string;
  filters: string[];
  view?: string;
  collection?: string;
  sort?: string;
  limit?: number;
}): Promise<SearchResult> {
  const { assets, status } = await getActiveMediaSource();
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.trunc(limit), 1), 120) : 72;
  const roleVisible = assets.filter((asset) => decideAccess(role, "viewAsset", asset).allowed);
  const intent = !view && !collection ? matchSearchIntent(query) : undefined;
  const selectedViewId = normalizeSavedViewId(view) || intent?.matchedView;
  const selectedView = savedViewDefinitions.find((item) => item.id === selectedViewId);
  const selectedCollection = collectionDefinitions.find((item) => item.id === collection);
  const effectiveQuery = intent?.matchedView ? "" : query;
  const visible = roleVisible
    .filter((asset) => (selectedView ? selectedView.match(asset) : true))
    .filter((asset) => collectionMatches(asset, collection))
    .filter((asset) => matchesQuery(asset, effectiveQuery))
    .filter((asset) => matchesFilters(asset, filters));
  const sorted = sortCatalogAssets(visible, sort);

  const counts = countAssetGovernance(roleVisible);
  const rendered = sorted.slice(0, safeLimit).length;

  return {
    assets: sorted.slice(0, safeLimit).map((asset) => assetWithRoleImageUrls(asset, role)),
    total: sorted.length,
    source: status,
    counts: {
      ...counts,
      rawTotal: assets.length,
      matching: sorted.length,
      rendered,
      currentlyShown: rendered,
      totalMatching: sorted.length,
      totalRendered: rendered
    },
    metadataHealth: buildMetadataHealth(roleVisible),
    appliedIntent:
      intent || selectedCollection
        ? {
            rawQuery: query,
            matchedView: selectedViewId,
            matchedCollection: selectedCollection?.id,
            confidence: intent?.confidence || (selectedCollection ? "exact" : "none")
          }
        : undefined,
    zeroResultInsights: buildZeroResultInsights(roleVisible),
    operationalInsights: buildOperationalInsights(roleVisible),
    savedViews: buildSavedViews(roleVisible),
    collections: buildCollections(roleVisible, role)
  };
}

export async function getAssetRecordById(id: string) {
  const { assets, status } = await getActiveMediaSource();
  return { asset: assets.find((item) => item.id === id) || null, source: status };
}

export async function getAssetById(id: string) {
  const { assets, status } = await getActiveMediaSource();
  return { asset: assets.find((item) => item.id === id) || null, source: status, related: getRelatedAssets(assets, id) };
}

export function getRelatedAssets(assets: StockMediaAsset[], id: string) {
  const asset = assets.find((item) => item.id === id);
  if (!asset) return [];
  return assets
    .filter((item) => item.id !== id)
    .filter(assetIsApproved)
    .filter((item) => item.collection === asset.collection || includesAny(item, [...(asset.tags || []), ...(asset.tjcTerms || [])].slice(0, 4)))
    .sort((a, b) => statusWeight(a) - statusWeight(b) || curatedWeight(b) - curatedWeight(a))
    .slice(0, 8);
}

export async function getReviewQueue(role: DemoRole, queueId: ReviewQueueId = "pending") {
  const { assets, status } = await getActiveMediaSource();
  const canReview = decideAccess(role, "viewReviewQueue").allowed;
  const duplicateGroupCounts = buildDuplicateGroupCounts(assets);
  const reviewable = canReview
    ? assets
        .filter((asset) => reviewQueues.some((queue) => assetMatchesReviewQueue(asset, queue.id, duplicateGroupCounts)))
        .sort((a, b) => reviewRiskFlags(b, duplicateGroupCounts).length - reviewRiskFlags(a, duplicateGroupCounts).length || statusWeight(a) - statusWeight(b) || a.title.localeCompare(b.title))
    : [];
  const selected = reviewable.filter((asset) => assetMatchesReviewQueue(asset, queueId, duplicateGroupCounts));
  const reviewCounts = countAssetGovernance(reviewable);
  const allCounts = countAssetGovernance(assets);
  return {
    assets: selected.slice(0, 80).map((asset) => assetWithRoleImageUrls(asset, role)),
    allAssets: reviewable.slice(0, 120).map((asset) => assetWithRoleImageUrls(asset, role)),
    source: status,
    governance: {
      pendingReview: reviewable.filter((asset) => assetMatchesReviewQueue(asset, "pending", duplicateGroupCounts)).length,
      childrenYouth: reviewCounts.childrenYouth,
      missingSource: reviewCounts.missingSource,
      rightsReview: reviewCounts.rightsReview,
      approvedThisMonth: allCounts.approvedThisMonth,
      archiveCandidates: reviewable.filter((asset) => assetMatchesReviewQueue(asset, "archive-candidates", duplicateGroupCounts)).length,
      duplicateCandidates: reviewable.filter((asset) => assetMatchesReviewQueue(asset, "duplicate-candidates", duplicateGroupCounts)).length,
      aiEnrichment: reviewable.filter((asset) => assetMatchesReviewQueue(asset, "ai-enrichment", duplicateGroupCounts)).length,
      taxonomyDrift: reviewable.filter((asset) => assetMatchesReviewQueue(asset, "taxonomy-drift", duplicateGroupCounts)).length,
      renditionGaps: reviewable.filter(assetHasRenditionGap).length,
      staleApprovals: reviewable.filter((asset) => assetMatchesReviewQueue(asset, "stale-approvals", duplicateGroupCounts)).length,
      missingRequiredFields: reviewable.filter((asset) => missingReviewFields(asset).length > 0).length
    },
    queues: reviewQueues.map((queue) => ({
      id: queue.id,
      label: queue.label,
      description: queue.description,
      count: reviewable.filter((asset) => assetMatchesReviewQueue(asset, queue.id, duplicateGroupCounts)).length
    }))
  };
}
