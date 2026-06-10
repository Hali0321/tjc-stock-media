"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DamReadinessResult, DemoRole, MediaSourceStatus, SearchResult, StockMediaAsset } from "@/lib/types";

type ApiSourceKind = "resourcespace" | "fallback-fixtures" | "media-library";

export type ApiEnvelope<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  source: MediaSourceStatus | null;
  sourceKind: ApiSourceKind;
  live: boolean;
  refresh: () => void;
};

export type AssetDetailResponse = {
  asset: StockMediaAsset;
  source: MediaSourceStatus;
  sourceKind?: ApiSourceKind;
  live?: boolean;
  related: StockMediaAsset[];
  resourceSpaceUrl?: string;
};

export type ReviewQueueResponse = {
  assets: StockMediaAsset[];
  allAssets: StockMediaAsset[];
  source: MediaSourceStatus;
  sourceKind?: ApiSourceKind;
  live?: boolean;
  governance: Record<string, number>;
  queues: Array<{ id: string; label: string; description: string; count: number }>;
  pendingWrites: Record<string, unknown>;
  resourceSpaceUrls: Record<string, string>;
  canReview: boolean;
};

function sourceKindFor(source?: MediaSourceStatus | null): ApiSourceKind {
  if (!source) return "media-library";
  if (source.adapter === "demo-fallback") return "fallback-fixtures";
  if (source.adapter === "media-library") return "media-library";
  return "resourcespace";
}

function isLiveSource(source?: MediaSourceStatus | null) {
  return Boolean(source && source.adapter !== "demo-fallback" && source.adapter !== "media-library");
}

function useJsonApi<T>(url: string | null, role?: DemoRole): ApiEnvelope<T> {
  const [data, setData] = useState<T | null>(null);
  const [source, setSource] = useState<MediaSourceStatus | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((current) => current + 1), []);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(url, { headers: { Accept: "application/json" } })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error || `Request failed with ${response.status}`);
        }
        return payload as T & { source?: MediaSourceStatus; sourceStatus?: MediaSourceStatus };
      })
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        setSource(payload.sourceStatus || payload.source || null);
      })
      .catch((apiError: Error) => {
        if (cancelled) return;
        setError(apiError.message);
        setData(null);
        setSource(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url, role, version]);

  const sourceKind = useMemo(() => sourceKindFor(source), [source]);

  return {
    data,
    loading,
    error,
    source,
    sourceKind,
    live: isLiveSource(source),
    refresh
  };
}

export function useAssetsSearch({
  role,
  query = "",
  filters = [],
  view,
  collection,
  sort,
  limit = 24,
  offset = 0
}: {
  role: DemoRole;
  query?: string;
  filters?: string[];
  view?: string;
  collection?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  params.set("role", role);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  if (query) params.set("q", query);
  if (view) params.set("view", view);
  if (collection) params.set("collection", collection);
  if (sort) params.set("sort", sort);
  filters.forEach((filter) => params.append("filter", filter));
  return useJsonApi<SearchResult & { sourceStatus?: MediaSourceStatus; sourceKind?: ApiSourceKind; live?: boolean }>(`/api/assets/search?${params.toString()}`, role);
}

export function useAssetDetail(id: string, role: DemoRole) {
  const encoded = encodeURIComponent(id);
  return useJsonApi<AssetDetailResponse>(id ? `/api/assets/${encoded}?role=${encodeURIComponent(role)}` : null, role);
}

export function useReviewQueue(role: DemoRole, queue = "pending") {
  return useJsonApi<ReviewQueueResponse>(`/api/review?role=${encodeURIComponent(role)}&queue=${encodeURIComponent(queue)}`, role);
}

export function useInsights(role: DemoRole) {
  return useAssetsSearch({ role, limit: 12 });
}

export function useAdminReadiness(role: DemoRole) {
  return useJsonApi<DamReadinessResult>(`/api/admin/readiness?role=${encodeURIComponent(role)}`, role);
}
