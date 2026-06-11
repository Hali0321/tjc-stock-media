import { containsPrivateSourceText, containsUnsafePathText, isSafeHttpUrl } from "@/lib/private-source-text";
import { safeEnumValue, safePathSlugText } from "@/lib/persisted-record-safety";

const assetIdPattern = /^[A-Za-z0-9_-]{1,120}$/;
const resourceSpaceRefPattern = /^[A-Za-z0-9_-]{1,80}$/;
const checksumLikePattern = /^[a-f0-9]{32,}$/i;
const collectionDraftAudiences = ["Private draft", "Internal ministry", "Public-approved portal"] as const;
export type CollectionDraftAudience = typeof collectionDraftAudiences[number];

export function normalizeAssetId(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  const id = String(value).trim();
  if (containsPrivateSourceText(id)) return "";
  return assetIdPattern.test(id) ? id : "";
}

export function normalizeAssetIds(value: unknown, max = 120) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(normalizeAssetId).filter(Boolean))].slice(0, max);
}

export function normalizeResourceSpaceRef(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  const ref = String(value).trim();
  if (containsPrivateSourceText(ref) || containsUnsafePathText(ref) || checksumLikePattern.test(ref)) return "";
  return resourceSpaceRefPattern.test(ref) ? ref : "";
}

export function normalizeCollectionDraftAudience(value: unknown): CollectionDraftAudience {
  return safeEnumValue(value, collectionDraftAudiences, "Private draft");
}

export function normalizeCollectionShareSlug(value: unknown) {
  return safePathSlugText(value, 64) || "collection-draft";
}

export function normalizeTextField(value: unknown, fallback: string, max = 100) {
  const text = typeof value === "string" ? value.trim() : "";
  return (text || fallback).slice(0, max);
}

export function normalizeDisplayTextField(value: unknown, fallback: string, max = 100) {
  const text = normalizeTextField(value, fallback, max).replace(/\s+/g, " ").trim();
  if (containsUnsafePathText(text)) return fallback.slice(0, max);
  if (containsPrivateSourceText(text)) return fallback.slice(0, max);
  return text;
}

export function normalizeUrlField(value: unknown, fallback = "", max = 500) {
  const text = normalizeTextField(value, fallback, max);
  if (!text) return fallback.slice(0, max);
  return isSafeHttpUrl(text) ? text : fallback.slice(0, max);
}

export function normalizeDateField(value: unknown) {
  const text = normalizeTextField(value, "", 40);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "";
  const [year, month, day] = text.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? text : "";
}
