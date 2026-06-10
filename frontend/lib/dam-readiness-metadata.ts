import { resourceSpaceFieldMap } from "@/lib/resourcespace-field-map";
import { canonicalTags } from "@/lib/taxonomy";
import type { FieldMappingStatus, StockMediaAsset, VocabularyInsight } from "@/lib/types";

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

export function buildFieldMappings(assets: StockMediaAsset[]): FieldMappingStatus[] {
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

export function buildVocabulary(assets: StockMediaAsset[]): VocabularyInsight[] {
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
