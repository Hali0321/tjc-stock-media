import crypto from "node:crypto";
import { normalizedResourceSpaceBaseUrl, resourceSpaceApiKey, resourceSpaceApiUser } from "@/lib/env";

const resourceSpaceApiTimeoutMs = 8000;

export type ResourceSpaceApiResult<T = unknown> = {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
};

function normalizeBaseUrl() {
  return normalizedResourceSpaceBaseUrl();
}

function buildQuery(params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    query.set(key, String(value));
  });
  return query.toString();
}

function signedQuery(params: Record<string, string | number | boolean | undefined>) {
  const user = resourceSpaceApiUser();
  const privateKey = resourceSpaceApiKey();
  const query = buildQuery({ user, ...params });
  const sign = crypto.createHash("sha256").update(`${privateKey}${query}`).digest("hex");
  return `${query}&sign=${encodeURIComponent(sign)}`;
}

function normalizeApiResponse<T>(data: unknown): ResourceSpaceApiResult<T> {
  if (data && typeof data === "object" && "error" in data) {
    const errorValue = (data as { error?: unknown }).error;
    return { ok: false, status: 502, error: String(errorValue || "ResourceSpace API error.") };
  }
  return { ok: true, status: 200, data: data as T };
}

function safeApiErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (!message || /\/api\/\?|sign=|user=/i.test(message)) return "ResourceSpace API request failed.";
  return message.slice(0, 240);
}

function timeoutSignal(timeoutMs = resourceSpaceApiTimeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, timer };
}

export async function resourceSpaceApiRequest<T = unknown>(params: Record<string, string | number | boolean | undefined>): Promise<ResourceSpaceApiResult<T>> {
  const baseUrl = normalizeBaseUrl();
  if (!baseUrl || !resourceSpaceApiUser() || !resourceSpaceApiKey()) {
    return { ok: false, status: 409, error: "ResourceSpace API base URL or credentials are not configured." };
  }

  const url = `${baseUrl}/api/?${signedQuery(params)}`;
  const { signal, timer } = timeoutSignal();
  try {
    const response = await fetch(url, { cache: "no-store", signal });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      return { ok: false, status: response.status, error: `ResourceSpace API returned ${response.status}.` };
    }
    return normalizeApiResponse<T>(data);
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: safeApiErrorMessage(error)
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function resourceSpaceApiDiagnostics() {
  const result = await resourceSpaceApiRequest<unknown>({ function: "do_search", search: "", fetchrows: 1 });
  return {
    configured: Boolean(normalizeBaseUrl() && resourceSpaceApiUser() && resourceSpaceApiKey()),
    ok: result.ok,
    status: result.status,
    error: result.error
  };
}

export async function resourceSpaceUpdateField(resourceId: string, field: string | number, value: string) {
  return resourceSpaceApiRequest<boolean | string | number>({
    function: "update_field",
    resource: resourceId,
    field,
    value
  });
}

export async function resourceSpaceGetCollectionResources(collectionId: string | number) {
  return resourceSpaceApiRequest<unknown>({
    function: "get_collection_resources",
    collection: collectionId
  });
}

export function resourceSpaceAssetUrl(id: string) {
  const baseUrl = normalizeBaseUrl();
  return baseUrl ? `${baseUrl}/pages/view.php?ref=${encodeURIComponent(id)}` : "";
}

export function resourceSpaceAdminUrl() {
  return normalizeBaseUrl();
}
