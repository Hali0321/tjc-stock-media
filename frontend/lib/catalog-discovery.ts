import { assetHaystack, matchesCatalogFilter } from "@/lib/catalog-language";
import { assetIsApproved, assetIsPortalReady } from "@/lib/asset-governance";
import type { SearchResult, StockMediaAsset } from "@/lib/types";

type TermGroup = {
  raw: string;
  terms: string[];
};

const synonymGroups: Array<{ terms: string[]; expansions: string[] }> = [
  { terms: ["hero", "banner", "header"], expansions: ["website", "landscape", "wide", "background"] },
  { terms: ["sermon", "slide", "slides", "presentation"], expansions: ["teaching", "study", "bible", "worship", "stage"] },
  { terms: ["youth", "children", "minor", "minors"], expansions: ["people", "possible minors", "children/youth"] },
  { terms: ["web", "website", "homepage"], expansions: ["hero", "banner", "approved public"] },
  { terms: ["social", "instagram", "facebook"], expansions: ["square", "event", "fellowship", "approved public"] },
  { terms: ["newsletter", "email", "bulletin"], expansions: ["event", "fellowship", "bible", "flower"] },
  { terms: ["safe", "approved", "public"], expansions: ["portal ready", "approved public", "ready to use"] },
  { terms: ["background", "texture", "detail"], expansions: ["no people", "flower", "plant", "water", "stage"] },
  { terms: ["communion", "baptism", "footwashing", "sacrament"], expansions: ["sensitive", "worship", "review"] },
  { terms: ["people", "person", "faces"], expansions: ["adults visible", "people unknown", "possible minors"] }
];

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))];
}

function tokenize(query: string) {
  return unique(query.replace(/[^\w\s/-]+/g, " ").split(/\s+/));
}

export function buildDiscoveryQuery(query: string) {
  const tokens = tokenize(query);
  const groups: TermGroup[] = tokens.map((token) => {
    const matched = synonymGroups.filter((group) => group.terms.includes(token));
    return {
      raw: token,
      terms: unique([token, ...matched.flatMap((group) => group.expansions)])
    };
  });
  return {
    groups,
    expandedTerms: unique(groups.flatMap((group) => group.terms).filter((term) => !tokens.includes(term))).slice(0, 10)
  };
}

export function matchesDiscoveryQuery(asset: StockMediaAsset, query: string) {
  if (!query.trim()) return true;
  const haystack = assetHaystack(asset);
  const discovery = buildDiscoveryQuery(query);
  return discovery.groups.every((group) => group.terms.some((term) => haystack.includes(term)));
}

export function discoveryScore(asset: StockMediaAsset, query: string) {
  if (!query.trim()) return 0;
  const haystack = assetHaystack(asset);
  const title = asset.title.toLowerCase();
  const discovery = buildDiscoveryQuery(query);
  let score = 0;
  for (const group of discovery.groups) {
    if (title.includes(group.raw)) score += 40;
    else if (haystack.includes(group.raw)) score += 20;
    const synonymMatches = group.terms.filter((term) => term !== group.raw && haystack.includes(term)).length;
    score += Math.min(synonymMatches * 6, 18);
  }
  if (assetIsPortalReady(asset)) score += 22;
  else if (assetIsApproved(asset)) score += 10;
  if (asset.tags?.length) score += Math.min(asset.tags.length, 6);
  if (asset.tjcTerms?.length) score += Math.min(asset.tjcTerms.length, 6);
  if (asset.imageUrls?.card || asset.preview || asset.thumbnail) score += 4;
  return score;
}

function countMatching(assets: StockMediaAsset[], filter: string) {
  return assets.filter((asset) => matchesCatalogFilter(asset, filter)).length;
}

function suggestedFilters(assets: StockMediaAsset[]): SearchResult["discovery"]["suggestedFilters"] {
  const candidates: SearchResult["discovery"]["suggestedFilters"] = [
    { label: "Portal ready", filter: "portal ready", count: countMatching(assets, "portal ready"), kind: "policy" },
    { label: "Approved public", filter: "approved public", count: countMatching(assets, "approved public"), kind: "policy" },
    { label: "No people", filter: "no people", count: countMatching(assets, "no people"), kind: "people" },
    { label: "Photos", filter: "photo", count: countMatching(assets, "photo"), kind: "media" },
    { label: "Landscape", filter: "landscape", count: countMatching(assets, "landscape"), kind: "shape" },
    { label: "Needs review", filter: "needs review", count: countMatching(assets, "needs review"), kind: "workflow" },
    { label: "Rendition gaps", filter: "rendition gap", count: countMatching(assets, "rendition gap"), kind: "workflow" }
  ];
  return candidates
    .filter((item) => item.count > 0 && item.count < assets.length)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 5);
}

export function buildCatalogDiscovery({
  query,
  view,
  collection,
  matchedAssets,
  totalVisible
}: {
  query: string;
  view?: string;
  collection?: string;
  matchedAssets: StockMediaAsset[];
  totalVisible: number;
}): SearchResult["discovery"] {
  const discovery = buildDiscoveryQuery(query);
  const mode = collection ? "collection" : view ? "saved-view" : query.trim() ? "smart-query" : "browse";
  const noun = matchedAssets.length === 1 ? "asset" : "assets";
  const summary =
    mode === "smart-query"
      ? `Smart discovery found ${matchedAssets.length.toLocaleString()} ${noun} from ${totalVisible.toLocaleString()} visible records.`
      : mode === "saved-view"
        ? `Saved view contains ${matchedAssets.length.toLocaleString()} ${noun}.`
        : mode === "collection"
          ? `Collection view contains ${matchedAssets.length.toLocaleString()} ${noun}.`
          : `Browsing ${matchedAssets.length.toLocaleString()} visible ${noun}.`;

  return {
    mode,
    summary,
    expandedTerms: discovery.expandedTerms,
    suggestedFilters: suggestedFilters(matchedAssets),
    scoreHint: query.trim()
      ? "Results are ranked by title, metadata, synonym match, portal readiness, and derivative availability."
      : "Default order balances approval state, curation signals, and visual diversity."
  };
}
