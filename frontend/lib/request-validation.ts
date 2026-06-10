const assetIdPattern = /^[A-Za-z0-9_-]{1,120}$/;

export function normalizeAssetId(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  const id = String(value).trim();
  return assetIdPattern.test(id) ? id : "";
}

export function normalizeAssetIds(value: unknown, max = 120) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(normalizeAssetId).filter(Boolean))].slice(0, max);
}

export function normalizeTextField(value: unknown, fallback: string, max = 100) {
  const text = typeof value === "string" ? value.trim() : "";
  return (text || fallback).slice(0, max);
}

export function normalizeDisplayTextField(value: unknown, fallback: string, max = 100) {
  const text = normalizeTextField(value, fallback, max).replace(/\s+/g, " ").trim();
  if (text.includes("..") || /[\\/]/.test(text)) return fallback.slice(0, max);
  return text;
}

export function normalizeDateField(value: unknown) {
  const text = normalizeTextField(value, "", 40);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}
