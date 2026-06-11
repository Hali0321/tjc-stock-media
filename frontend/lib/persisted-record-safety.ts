export function safeIsoTimestamp(value: unknown) {
  const text = String(value || "").replace(/\s+/g, " ").trim().slice(0, 40);
  if (!/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(text)) return "";
  const parsed = Date.parse(text);
  if (Number.isNaN(parsed)) return "";
  const iso = new Date(parsed).toISOString();
  return iso.startsWith(text.slice(0, 10)) ? iso : "";
}
