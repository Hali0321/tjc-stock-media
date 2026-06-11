import { containsPrivateSourceText, containsUnsafePathText, containsUnsafeRouteText, isSafeHttpUrl } from "@/lib/private-source-text";
import { safeCompactText, safeEnumValue, safePathSlugText, safeSlugText } from "@/lib/persisted-record-safety";

const assetIdPattern = /^[A-Za-z0-9_-]{1,120}$/;
const resourceSpaceRefPattern = /^[A-Za-z0-9_-]{1,80}$/;
const collectionDraftAudiences = ["Private draft", "Internal ministry", "Public-approved portal"] as const;
export type CollectionDraftAudience = typeof collectionDraftAudiences[number];

export async function readJsonObject<T extends Record<string, unknown> = Record<string, unknown>>(request: { json(): Promise<unknown> }): Promise<T> {
  const body = await request.json().catch(() => ({}));
  return body && typeof body === "object" && !Array.isArray(body) ? body as T : {} as T;
}

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
  if (containsPrivateSourceText(ref) || containsUnsafePathText(ref)) return "";
  return resourceSpaceRefPattern.test(ref) ? ref : "";
}

export function normalizeSafeRoutePath(value: unknown, fallback = "") {
  const route = typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, 240) : "";
  if (!route.startsWith("/") || containsUnsafeRouteText(route) || containsPrivateSourceText(route)) return fallback;
  return route;
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

export function normalizePersistedDisplayText(value: unknown, max = 100) {
  const text = safeCompactText(value, max);
  if (containsUnsafePathText(text)) return "";
  if (containsPrivateSourceText(text)) return "";
  return text;
}

export function normalizePersistedSlugText(value: unknown, max = 100, options: { rejectUnsafePath?: boolean } = {}) {
  const text = safeCompactText(value, max);
  if (containsPrivateSourceText(text)) return "";
  if (options.rejectUnsafePath && containsUnsafePathText(text)) return "";
  return safeSlugText(text, max);
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
