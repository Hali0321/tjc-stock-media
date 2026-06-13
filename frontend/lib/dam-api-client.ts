import type { MediaSourceStatus } from "@/lib/types";

export const DAM_API_TIMEOUT_MS = 15_000;

export type DamApiPayload = {
  source?: MediaSourceStatus;
  sourceStatus?: MediaSourceStatus;
  error?: string;
};

export class DamApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "DamApiError";
    this.status = status;
  }
}

export function sourceFromPayload(payload: DamApiPayload) {
  return payload.sourceStatus || payload.source || null;
}

function timeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timer };
}

export async function fetchDamJson<T extends DamApiPayload>(url: string, timeoutMs = DAM_API_TIMEOUT_MS): Promise<T> {
  const { controller, timer } = timeoutSignal(timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new DamApiError(payload?.error || `Request failed with ${response.status}`, response.status);
    }
    return payload as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new DamApiError(`Request timed out after ${timeoutMs}ms`, 408);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
