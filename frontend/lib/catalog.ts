import { decideAccess } from "@/lib/access-decisions";
import { getActiveMediaSource } from "@/lib/media-source";
import { collectionImageUrl } from "@/lib/presentation";
import { assetMatchesReviewQueue, missingReviewFields, reviewQueues, reviewRiskFlags, type ReviewQueueId } from "@/lib/workflow-policy";
import type { CatalogCollection, DemoRole, SavedViewSummary, SearchResult, StockMediaAsset } from "@/lib/types";

type SavedViewDefinition = {
  id: string;
  label: string;
  description: string;
  reason: string;
  terms?: string[];
  match: (asset: StockMediaAsset) => boolean;
};

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
    label: "Approved for church-wide use",
    description: "Public-safe assets cleared by review.",
    reason: "Fastest path for newsletters, websites, slides, and church-wide communication.",
    match: (asset) => asset.status === "Approved Public"
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
    id: "children-youth",
    label: "Children/youth review",
    description: "Assets needing extra care before public use.",
    reason: "Uses minors, children/youth, and sensitive-context metadata.",
    match: (asset) => asset.peopleRisk === "Possible minors" || includesAny(asset, ["children", "youth", "minor"])
  },
  {
    id: "recently-approved",
    label: "Recently approved",
    description: "Newest reviewed public/internal assets.",
    reason: "Uses exported review date where present.",
    match: (asset) => Boolean(asset.reviewedDate) && (asset.status === "Approved Public" || asset.status === "Approved Internal")
  },
  {
    id: "needs-review",
    label: "Needs review",
    description: "Blocked until reviewer approval.",
    reason: "Uses ResourceSpace publish status and people/minors risk.",
    match: (asset) => asset.status === "Needs Review" || asset.status === "Possible Minors"
  },
  {
    id: "archive-only",
    label: "Archive only",
    description: "Traceable, searchable assets not promoted for reuse.",
    reason: "Uses archive status or archive usage scope.",
    match: (asset) => asset.status === "Searchable Archive" || asset.usageScope === "Archive Only"
  }
];

const collectionDefinitions = [
  {
    id: "sabbath",
    name: "Sabbath",
    description: "Worship, Sabbath Service, and church life",
    searchQuery: "worship Sabbath Service church life Bible fellowship",
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

function matchesQuery(asset: StockMediaAsset, query: string) {
  if (!query.trim()) return true;
  const haystack = assetHaystack(asset);
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

function matchesFilters(asset: StockMediaAsset, filters: string[]) {
  return filters.every((filter) => {
    const value = filter.toLowerCase();
    if (value === "approved public" || value === "church-wide use") return asset.status === "Approved Public";
    if (value === "approved internal" || value === "internal ministry") return asset.status === "Approved Internal";
    if (value === "needs review") return asset.status === "Needs Review" || asset.status === "Possible Minors";
    if (value === "archive only") return asset.status === "Searchable Archive" || asset.usageScope === "Archive Only";
    if (["photo", "video", "audio", "graphic", "document"].includes(value)) return asset.mediaType === value;
    if (value === "no people") return asset.peopleRisk === "No people";
    if (value === "adults only") return asset.peopleRisk === "Adults visible";
    if (value === "possible minors" || value === "children/youth") return asset.peopleRisk === "Possible minors";
    if (value === "missing source") return !asset.sourcePath && !asset.sourceAccount && !asset.sourceSystem;
    if (value === "rights review") return reviewRiskFlags(asset).includes("Rights unclear");
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

function countApprovedThisMonth(assets: StockMediaAsset[]) {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return assets.filter((asset) => asset.reviewedDate?.startsWith(prefix) && (asset.status === "Approved Public" || asset.status === "Approved Internal")).length;
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
  if (!dates.length) return "Recently updated";
  const first = dates[0]?.slice(0, 4);
  const last = dates.at(-1)?.slice(0, 4);
  return first && last && first !== last ? `${first}-${last}` : first || "Recently updated";
}

function approvalSummary(assets: StockMediaAsset[]) {
  const approved = assets.filter((asset) => asset.status === "Approved Public" || asset.status === "Approved Internal").length;
  const internal = assets.filter((asset) => asset.status === "Approved Internal").length;
  const review = assets.filter((asset) => asset.status === "Needs Review" || asset.status === "Possible Minors").length;
  if (!assets.length) return "Browse collection";
  if (review) return `${approved} approved / ${review} review`;
  if (internal) return `${approved} approved / ${internal} internal`;
  return `${approved} approved assets`;
}

function buildCollections(assets: StockMediaAsset[]): CatalogCollection[] {
  const approvedOrInternal = assets.filter((asset) => asset.status === "Approved Public" || asset.status === "Approved Internal");
  return collectionDefinitions.map((definition) => {
    const matching = approvedOrInternal.filter((asset) => includesAny(asset, definition.terms));
    const representative = matching.length ? matching : approvedOrInternal.slice(0, 5);
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
      countLabel: matching.length ? `${matching.length.toLocaleString()} assets` : "Curated set",
      dateRange: dateRangeFor(matching),
      ministry: matching.find((asset) => asset.sourceAccount)?.sourceAccount || matching.find((asset) => asset.eventName)?.eventName || "Ministry media",
      approvalSummary: approvalSummary(matching),
      peopleWarning: warning,
      searchQuery: definition.searchQuery,
      images: representative
        .slice(0, 5)
        .map((asset) => ({ src: collectionImageUrl(asset), alt: asset.thumbnailAlt }))
        .filter((image) => Boolean(image.src))
    };
  });
}

export async function searchAssets({
  role,
  query,
  filters,
  view,
  limit = 72
}: {
  role: DemoRole;
  query: string;
  filters: string[];
  view?: string;
  limit?: number;
}): Promise<SearchResult> {
  const { assets, status } = await getActiveMediaSource();
  const roleVisible = assets.filter((asset) => decideAccess(role, "viewAsset", asset).allowed);
  const selectedView = savedViewDefinitions.find((item) => item.id === view);
  const visible = roleVisible
    .filter((asset) => (selectedView ? selectedView.match(asset) : true))
    .filter((asset) => matchesQuery(asset, query))
    .filter((asset) => matchesFilters(asset, filters))
    .sort((a, b) => statusWeight(a) - statusWeight(b) || curatedWeight(b) - curatedWeight(a) || a.title.localeCompare(b.title));
  const diversified = diversifyAssets(visible);

  return {
    assets: diversified.slice(0, limit),
    total: diversified.length,
    source: status,
    counts: {
      approved: roleVisible.filter((asset) => asset.status === "Approved Public" || asset.status === "Approved Internal").length,
      needsReview: roleVisible.filter((asset) => asset.status === "Needs Review" || asset.status === "Possible Minors").length,
      archive: roleVisible.filter((asset) => asset.status === "Searchable Archive").length,
      blocked: roleVisible.filter((asset) => asset.status === "Do Not Use").length,
      childrenYouth: roleVisible.filter((asset) => asset.peopleRisk === "Possible minors").length,
      missingSource: roleVisible.filter((asset) => !asset.sourcePath && !asset.sourceAccount && !asset.sourceSystem).length,
      rightsReview: roleVisible.filter((asset) => reviewRiskFlags(asset).includes("Rights unclear")).length,
      approvedThisMonth: countApprovedThisMonth(roleVisible)
    },
    savedViews: buildSavedViews(roleVisible),
    collections: buildCollections(roleVisible)
  };
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
    .filter((item) => item.status === "Approved Public" || item.status === "Approved Internal")
    .filter((item) => item.collection === asset.collection || includesAny(item, [...(asset.tags || []), ...(asset.tjcTerms || [])].slice(0, 4)))
    .sort((a, b) => statusWeight(a) - statusWeight(b) || curatedWeight(b) - curatedWeight(a))
    .slice(0, 8);
}

export async function getReviewQueue(role: DemoRole, queueId: ReviewQueueId = "pending") {
  const { assets, status } = await getActiveMediaSource();
  const canReview = decideAccess(role, "viewReviewQueue").allowed;
  const reviewable = canReview
    ? assets
        .filter((asset) => reviewQueues.some((queue) => assetMatchesReviewQueue(asset, queue.id)))
        .sort((a, b) => reviewRiskFlags(b).length - reviewRiskFlags(a).length || statusWeight(a) - statusWeight(b) || a.title.localeCompare(b.title))
    : [];
  const selected = reviewable.filter((asset) => assetMatchesReviewQueue(asset, queueId));
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return {
    assets: selected.slice(0, 80),
    allAssets: reviewable.slice(0, 120),
    source: status,
    governance: {
      pendingReview: reviewable.filter((asset) => assetMatchesReviewQueue(asset, "pending")).length,
      childrenYouth: reviewable.filter((asset) => assetMatchesReviewQueue(asset, "children-youth")).length,
      missingSource: reviewable.filter((asset) => assetMatchesReviewQueue(asset, "missing-source")).length,
      rightsReview: reviewable.filter((asset) => assetMatchesReviewQueue(asset, "rights-review")).length,
      approvedThisMonth: assets.filter((asset) => asset.reviewedDate?.startsWith(monthPrefix) && (asset.status === "Approved Public" || asset.status === "Approved Internal")).length,
      archiveCandidates: reviewable.filter((asset) => assetMatchesReviewQueue(asset, "archive-candidates")).length,
      missingRequiredFields: reviewable.filter((asset) => missingReviewFields(asset).length > 0).length
    },
    queues: reviewQueues.map((queue) => ({
      id: queue.id,
      label: queue.label,
      description: queue.description,
      count: reviewable.filter((asset) => assetMatchesReviewQueue(asset, queue.id)).length
    }))
  };
}
