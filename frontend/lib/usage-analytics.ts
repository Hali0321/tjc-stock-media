import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { repoRoot, usageAnalyticsDbPath, usageAnalyticsEnabled } from "@/lib/env";
import type { DemoRole } from "@/lib/types";

export type UsageEventType =
  | "search"
  | "asset_view"
  | "download_gate"
  | "review_action"
  | "brand_kit_view"
  | "package_action";

export type UsageEventInput = {
  type: UsageEventType;
  role: DemoRole;
  actor?: string;
  assetId?: string;
  resourceSpaceId?: string;
  route?: string;
  query?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

type UsageMetricRow = {
  label: string;
  value: number;
};

let db: DatabaseSync | null = null;

function dbFile() {
  return usageAnalyticsDbPath() || path.join(repoRoot(), ".runtime", "analytics", "portal-usage.sqlite");
}

function database() {
  if (db) return db;
  const file = dbFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  db = new DatabaseSync(file);
  db.exec(`
    CREATE TABLE IF NOT EXISTS usage_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      type TEXT NOT NULL,
      role TEXT NOT NULL,
      actor TEXT,
      asset_id TEXT,
      resource_space_id TEXT,
      route TEXT,
      query TEXT,
      metadata_json TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_usage_events_type_created ON usage_events(type, created_at);
    CREATE INDEX IF NOT EXISTS idx_usage_events_asset ON usage_events(asset_id, resource_space_id);
  `);
  return db;
}

export function recordUsageEvent(event: UsageEventInput) {
  if (!usageAnalyticsEnabled()) return { recorded: false, reason: "usage-analytics-disabled" };
  try {
    const stmt = database().prepare(`
      INSERT INTO usage_events (created_at, type, role, actor, asset_id, resource_space_id, route, query, metadata_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      new Date().toISOString(),
      event.type,
      event.role,
      event.actor || event.role,
      event.assetId || null,
      event.resourceSpaceId || null,
      event.route || null,
      event.query || null,
      event.metadata ? JSON.stringify(event.metadata) : null
    );
    return { recorded: true };
  } catch (error) {
    return { recorded: false, reason: error instanceof Error ? error.message : "usage-analytics-failed" };
  }
}

function metricRows(type: UsageEventType, column: "query" | "asset_id", limit = 5): UsageMetricRow[] {
  if (!usageAnalyticsEnabled()) return [];
  try {
    const rows = database()
      .prepare(`
        SELECT ${column} AS label, COUNT(*) AS value
        FROM usage_events
        WHERE type = ? AND ${column} IS NOT NULL AND ${column} <> ''
        GROUP BY ${column}
        ORDER BY value DESC, label ASC
        LIMIT ?
      `)
      .all(type, limit) as Array<{ label?: string; value?: number }>;
    return rows
      .filter((row): row is { label: string; value: number } => Boolean(row.label))
      .map((row) => ({ label: row.label, value: Number(row.value || 0) }));
  } catch {
    return [];
  }
}

export function usageAnalyticsDiagnostics() {
  if (!usageAnalyticsEnabled()) {
    return {
      enabled: false,
      dbPath: dbFile(),
      totalEvents: 0,
      topSearches: [] as UsageMetricRow[],
      topAssets: [] as UsageMetricRow[]
    };
  }
  try {
    const total = database().prepare("SELECT COUNT(*) AS count FROM usage_events").get() as { count?: number };
    return {
      enabled: true,
      dbPath: dbFile(),
      totalEvents: Number(total.count || 0),
      topSearches: metricRows("search", "query"),
      topAssets: metricRows("asset_view", "asset_id")
    };
  } catch {
    return {
      enabled: true,
      dbPath: dbFile(),
      totalEvents: 0,
      topSearches: [] as UsageMetricRow[],
      topAssets: [] as UsageMetricRow[]
    };
  }
}
