import { canonicalTags } from "@/lib/taxonomy";

export const uploadTagSuggestions = uniqueTags([...canonicalTags.visibleTags, ...canonicalTags.tjcTerms]);

export function parseUploadTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function uniqueTags(tags: string[]) {
  const seen = new Set<string>();
  return tags.filter((tag) => {
    const key = tag.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function canonicalizeUploadTags(tags: string[], suggestions = uploadTagSuggestions) {
  const lookup = new Map(uniqueTags(suggestions).map((suggestion) => [suggestion.toLowerCase(), suggestion]));
  const accepted = tags.map((tag) => lookup.get(tag.toLowerCase())).filter((tag): tag is string => Boolean(tag));
  const rejected = tags.filter((tag) => !lookup.has(tag.toLowerCase()));
  return {
    accepted: uniqueTags(accepted),
    rejected: uniqueTags(rejected)
  };
}

export function nonCanonicalUploadTags(value: string, suggestions = uploadTagSuggestions) {
  return canonicalizeUploadTags(parseUploadTags(value), suggestions).rejected;
}

export function serializeUploadTags(tags: string[]) {
  return uniqueTags(tags).join(", ");
}
