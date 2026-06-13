import { getActiveMediaSource } from "@/lib/media-source";
import { mediaSourceIsLive, mediaSourceKind, type MediaSourceKind } from "@/lib/media-source/truth";
import { sourceForRole } from "@/lib/source-redaction";
import type { DemoRole, MediaSourceStatus, StockMediaAsset } from "@/lib/types";

export type MediaSourceEnvelope = {
  source: MediaSourceStatus;
  sourceStatus: MediaSourceStatus;
  sourceKind: MediaSourceKind;
  live: boolean;
};

export type MediaSourceSession = MediaSourceEnvelope & {
  assets: StockMediaAsset[];
  rawSource: MediaSourceStatus;
};

export function sourceEnvelope(source: MediaSourceStatus): MediaSourceEnvelope {
  const sourceKind = mediaSourceKind(source);
  const live = mediaSourceIsLive(source);
  const normalizedSource = { ...source, sourceKind, live };
  return {
    source: normalizedSource,
    sourceStatus: normalizedSource,
    sourceKind,
    live
  };
}

export function roleSourceEnvelope(role: DemoRole, source: MediaSourceStatus): MediaSourceEnvelope {
  return sourceEnvelope(sourceForRole(role, source));
}

export async function getMediaSourceSession(role: DemoRole): Promise<MediaSourceSession> {
  const { assets, status } = await getActiveMediaSource();
  return {
    assets,
    rawSource: status,
    ...roleSourceEnvelope(role, status)
  };
}
