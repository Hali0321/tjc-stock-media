import crypto from "node:crypto";
import { resourceSpaceApiKey, resourceSpaceApiUser, resourceSpaceBaseUrl } from "@/lib/env";

export type ResourceSpaceApiResult<T = unknown> = {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  url?: string;
};

function normalizeBaseUrl() {
  return resourceSpaceBaseUrl().replace(/\/+$/g, "");
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

export async function resourceSpaceApiRequest<T = unknown>(params: Record<string, string | number | boolean | undefined>): Promise<ResourceSpaceApiResult<T>> {
  if (!resourceSpaceApiUser() || !resourceSpaceApiKey()) {
    return { ok: false, status: 409, error: "ResourceSpace API credentials are not configured." };
  }

  const url = `${normalizeBaseUrl()}/api/?${signedQuery(params)}`;
  try {
    const response = await fetch(url, { cache: "no-store" });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      return { ok: false, status: response.status, error: `ResourceSpace API returned ${response.status}.`, url };
    }
    return { ...normalizeApiResponse<T>(data), url };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: error instanceof Error ? error.message : "ResourceSpace API request failed.",
      url
    };
  }
}

export async function resourceSpaceApiDiagnostics() {
  const result = await resourceSpaceApiRequest<unknown>({ function: "do_search", search: "", fetchrows: 1 });
  return {
    configured: Boolean(resourceSpaceApiUser() && resourceSpaceApiKey()),
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
  return `${normalizeBaseUrl()}/pages/view.php?ref=${encodeURIComponent(id)}`;
}

export function resourceSpaceAdminUrl() {
  return normalizeBaseUrl();
}
