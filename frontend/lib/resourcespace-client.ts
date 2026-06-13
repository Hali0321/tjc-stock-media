import crypto from "node:crypto";
import { normalizedResourceSpaceBaseUrl, resourceSpaceApiKey, resourceSpaceApiUser } from "@/lib/env";

const resourceSpaceApiTimeoutMs = 8000;
const defaultSearchPageSize = 500;
const defaultSearchMaxPages = 10000;

export type ResourceSpaceApiResult<T = unknown> = {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
};

export type ResourceSpacePagedResult<T = unknown> = ResourceSpaceApiResult<T[]> & {
  complete: boolean;
  pages: number;
  records: number;
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

function parseApiResponseText(text: string): ResourceSpaceApiResult<unknown> | { parsed: unknown } {
  if (!text) return { parsed: null };
  try {
    return { parsed: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, status: 502, error: "ResourceSpace API returned invalid JSON." };
  }
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
    const parsed = parseApiResponseText(text);
    if ("ok" in parsed) return parsed as ResourceSpaceApiResult<T>;
    if (!response.ok) {
      return { ok: false, status: response.status, error: `ResourceSpace API returned ${response.status}.` };
    }
    return normalizeApiResponse<T>(parsed.parsed);
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

function resourceSpaceSearchPageSize() {
  const configured = Number(process.env.RESOURCESPACE_API_PAGE_SIZE || "");
  if (!Number.isFinite(configured)) return defaultSearchPageSize;
  return Math.max(1, Math.min(1000, Math.trunc(configured)));
}

function resourceSpaceSearchMaxPages() {
  const configured = Number(process.env.RESOURCESPACE_API_MAX_PAGES || "");
  if (!Number.isFinite(configured)) return defaultSearchMaxPages;
  return Math.max(1, Math.min(defaultSearchMaxPages, Math.trunc(configured)));
}

export async function resourceSpaceSearchAll<T = unknown>(params: Record<string, string | number | boolean | undefined>): Promise<ResourceSpacePagedResult<T>> {
  const pageSize = resourceSpaceSearchPageSize();
  const maxPages = resourceSpaceSearchMaxPages();
  const records: T[] = [];
  for (let page = 0; page < maxPages; page += 1) {
    const offset = page * pageSize;
    const result = await resourceSpaceApiRequest<unknown[]>({
      ...params,
      fetchrows: pageSize,
      offset
    });
    if (!result.ok) {
      return {
        ok: false,
        status: result.status,
        error: result.error || `ResourceSpace API page ${page + 1} failed.`,
        complete: false,
        pages: page + 1,
        records: records.length,
        data: records
      };
    }
    if (!Array.isArray(result.data)) {
      return {
        ok: false,
        status: 502,
        error: "ResourceSpace API search page returned a non-array payload.",
        complete: false,
        pages: page + 1,
        records: records.length,
        data: records
      };
    }
    const pageRows = result.data as T[];
    records.push(...pageRows);
    if (pageRows.length === 0 || pageRows.length < pageSize) {
      return {
        ok: true,
        status: 200,
        complete: true,
        pages: page + 1,
        records: records.length,
        data: records
      };
    }
  }
  return {
    ok: false,
    status: 508,
    error: `ResourceSpace API pagination exceeded ${maxPages} pages without completion.`,
    complete: false,
    pages: maxPages,
    records: records.length,
    data: records
  };
}

export async function resourceSpaceGetResourceData(resourceId: string | number) {
  return resourceSpaceApiRequest<Record<string, unknown>>({
    function: "get_resource_data",
    resource: resourceId
  });
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
