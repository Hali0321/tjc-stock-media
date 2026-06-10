#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:4868}"
USAGE_ANALYTICS_DB_PATH="${USAGE_ANALYTICS_DB_PATH:-$(pwd)/.runtime/analytics/portal-usage.sqlite}"
MARKER="usage-smoke-$(date -u +%Y%m%dT%H%M%SZ)-$$"
export USAGE_ANALYTICS_DB_PATH MARKER

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

http_code() {
  local output="$1"
  shift
  curl --max-time 15 -sS -o "$output" -w '%{http_code}' "$@"
}

expect_code() {
  local expected="$1"
  local label="$2"
  shift 2
  local output="$TMP_DIR/${label//[^a-zA-Z0-9_-]/_}"
  local code
  code="$(http_code "$output" "$@")"
  if [ "$code" != "$expected" ]; then
    echo "FAIL: $label expected $expected got $code"
    cat "$output"
    exit 1
  fi
  echo "PASS: $label"
}

expect_any_code() {
  local allowed="$1"
  local label="$2"
  shift 2
  local output="$TMP_DIR/${label//[^a-zA-Z0-9_-]/_}"
  local code
  code="$(http_code "$output" "$@")"
  case " $allowed " in
    *" $code "*) echo "PASS: $label ($code)" ;;
    *)
      echo "FAIL: $label expected one of [$allowed] got $code"
      cat "$output"
      exit 1
      ;;
  esac
}

select_json_value() {
  local label="$1"
  local script="$2"
  local output="$TMP_DIR/${label//[^a-zA-Z0-9_-]/_}.json"
  shift 2
  local code
  code="$(http_code "$output" "$@")"
  if [ "$code" != "200" ]; then
    echo "FAIL: $label expected 200 got $code" >&2
    cat "$output" >&2
    return 1
  fi
  local value
  if ! value="$(node -e "$script" < "$output")"; then
    cat "$output" >&2
    return 1
  fi
  if [ -z "$value" ]; then
    echo "FAIL: $label returned an empty value" >&2
    cat "$output" >&2
    return 1
  fi
  echo "PASS: selected $label=$value" >&2
  printf '%s\n' "$value"
}

first_asset_id_script='
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const asset = (Array.isArray(data.assets) ? data.assets : []).find((item) => item && item.id);
if (!asset) {
  console.error("FAIL: no asset id found in API response");
  process.exit(1);
}
console.log(asset.id);
'

blocked_asset_id_script='
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const asset = (Array.isArray(data.assets) ? data.assets : []).find((item) => item && item.id && (!item.reuseDecision || item.reuseDecision.downloadable !== true));
if (!asset) {
  console.error("FAIL: no blocked/non-downloadable asset id found in API response");
  process.exit(1);
}
console.log(asset.id);
'

ASSET_VIEW_ID="$(select_json_value usage-asset-view-id "$first_asset_id_script" \
  "$BASE_URL/api/assets/search?role=Reviewer&q=Bible&limit=5")"

if ! BLOCKED_DOWNLOAD_ID="$(select_json_value usage-blocked-download-id "$blocked_asset_id_script" \
  "$BASE_URL/api/assets/search?role=Reviewer&view=needs-review&limit=25")"; then
  BLOCKED_DOWNLOAD_ID="$(select_json_value usage-blocked-download-fallback-id "$blocked_asset_id_script" \
    "$BASE_URL/api/assets/search?role=Reviewer&limit=50")"
fi

REVIEW_ASSET_ID="$(select_json_value usage-review-asset-id "$first_asset_id_script" \
  "$BASE_URL/api/review?role=Reviewer&queue=pending")"

node <<'NODE'
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const file = process.env.USAGE_ANALYTICS_DB_PATH;
if (!file) process.exit(0);
fs.mkdirSync(path.dirname(file), { recursive: true });
const db = new DatabaseSync(file);
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
`);
db.close();
NODE

expect_code 200 usage-search \
  "$BASE_URL/api/assets/search?role=Reviewer&q=$MARKER&limit=1"

expect_code 200 usage-asset-view \
  "$BASE_URL/api/assets/$ASSET_VIEW_ID?role=Reviewer"

expect_any_code "403 404" usage-download-gate \
  -X POST -H 'Content-Type: application/json' \
  -d "{\"role\":\"Reviewer\",\"termsAccepted\":true,\"usageChannel\":\"Usage smoke\",\"reason\":\"$MARKER\"}" \
  "$BASE_URL/api/download/$BLOCKED_DOWNLOAD_ID"

expect_any_code "200 202" usage-review-action \
  -X POST -H 'Content-Type: application/json' \
  -d "{\"role\":\"Reviewer\",\"id\":\"$REVIEW_ASSET_ID\",\"action\":\"Request More Info\",\"notes\":\"Usage smoke review action $MARKER\",\"checklist\":{\"sourceConfirmed\":true,\"rightsConfirmed\":true,\"peopleVisibilityConfirmed\":true,\"childrenYouthChecked\":true,\"usageScopeSelected\":true},\"reviewerName\":\"Usage Smoke Reviewer\"}" \
  "$BASE_URL/api/review"

expect_code 200 usage-brand-kit \
  "$BASE_URL/api/brand-kits/mvp-2024?role=Reviewer"

node <<'NODE'
const { DatabaseSync } = require("node:sqlite");
const file = process.env.USAGE_ANALYTICS_DB_PATH;
const marker = process.env.MARKER;
const db = new DatabaseSync(file, { readOnly: true });
const rows = db.prepare(`
  SELECT type, role, actor, asset_id AS assetId, route, query, metadata_json AS metadataJson
  FROM usage_events
  WHERE created_at >= datetime('now', '-15 minutes')
  ORDER BY id DESC
  LIMIT 200
`).all();
db.close();

const types = new Set(rows.map((row) => row.type));
const requiredTypes = ["search", "asset_view", "download_gate", "review_action", "brand_kit_view"];
const missingTypes = requiredTypes.filter((type) => !types.has(type));
if (missingTypes.length) {
  console.error(`FAIL: usage analytics missing event types: ${missingTypes.join(", ")}`);
  process.exit(1);
}
const search = rows.find((row) => row.type === "search" && row.query === marker);
if (!search) {
  console.error(`FAIL: usage analytics missing search marker ${marker}`);
  process.exit(1);
}
const badActor = rows
  .filter((row) => requiredTypes.includes(row.type))
  .find((row) => typeof row.actor !== "string" || !row.actor.length);
if (badActor) {
  console.error(`FAIL: usage analytics event missing actor: ${JSON.stringify(badActor)}`);
  process.exit(1);
}
console.log(`PASS: usage analytics recorded ${requiredTypes.join(", ")} at ${file}`);
NODE

echo "Portal usage analytics smoke complete."
