export function safeCompactText(value: unknown, maxLength: number) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function safeSlugText(value: unknown, maxLength: number) {
  return safeCompactText(value, maxLength).replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "");
}

export function safeFileNameText(value: unknown, maxLength: number) {
  return safeCompactText(value, maxLength).replace(/[^a-z0-9._-]+/gi, "-").replace(/^[.-]+|[.-]+$/g, "");
}

export function safeIsoTimestamp(value: unknown) {
  const text = safeCompactText(value, 40);
  if (!/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(text)) return "";
  const parsed = Date.parse(text);
  if (Number.isNaN(parsed)) return "";
  const iso = new Date(parsed).toISOString();
  return iso.startsWith(text.slice(0, 10)) ? iso : "";
}

export function safeNonNegativeInt(value: unknown) {
  return Math.max(0, Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0);
}

export function safeBoolean(value: unknown) {
  return value === true;
}

export function safeEnumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? value as T : fallback;
}
