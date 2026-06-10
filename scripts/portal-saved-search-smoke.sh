#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:4868}"
MARKER="saved-search-smoke-$(date -u +%Y%m%dT%H%M%SZ)-$$"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

http_code() {
  local output="$1"
  shift
  curl --max-time 15 -sS -o "$output" -w '%{http_code}' "$@"
}

expect_json_status() {
  local expected="$1"
  local label="$2"
  local script="$3"
  local output="$TMP_DIR/${label//[^a-zA-Z0-9_-]/_}.json"
  shift 3
  local code
  code="$(http_code "$output" "$@")"
  if [ "$code" != "$expected" ]; then
    echo "FAIL: $label expected $expected got $code"
    cat "$output"
    exit 1
  fi
  node -e "$script" < "$output"
  echo "PASS: $label"
}

search_id="search-$MARKER"
stale_search_id="stale-search-$MARKER"
local_runtime_probe=0
case "$BASE_URL" in
  http://localhost:*|http://127.0.0.1:*) local_runtime_probe=1 ;;
esac

expect_json_status 403 saved-search-viewer-list-denied '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (!/Contributor|Reviewer|DAM Admin/i.test(data.error || "")) {
  console.error(`FAIL: viewer saved search list denial copy invalid: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
' "$BASE_URL/api/saved-searches?role=Viewer"

expect_json_status 403 saved-search-viewer-save-denied '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (!/Contributor|Reviewer|DAM Admin/i.test(data.error || "")) {
  console.error(`FAIL: viewer saved search save denial copy invalid: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
' -X POST -H 'Content-Type: application/json' \
  -d "{\"id\":\"$search_id\",\"title\":\"Viewer should not save\",\"query\":\"Bible\"}" \
  "$BASE_URL/api/saved-searches?role=Viewer"

expect_json_status 400 saved-search-empty-blocked '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (!/query|saved view|collection|filter/i.test(data.error || "")) {
  console.error(`FAIL: empty saved search was not rejected clearly: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
' -X POST -H 'Content-Type: application/json' \
  -d '{"title":"Empty search"}' \
  "$BASE_URL/api/saved-searches?role=Contributor"

SEARCH_ID="$search_id" expect_json_status 200 saved-search-contributor-save-sanitized '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const id = process.env.SEARCH_ID;
if (data.ok !== true || data.storageMode !== "local-json" || data.search?.id !== id) {
  console.error(`FAIL: saved search save shape invalid: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
if (!data.search.createdBy || data.search.role !== "Contributor") {
  console.error(`FAIL: saved search missing actor/role: ${JSON.stringify(data.search).slice(0, 500)}`);
  process.exit(1);
}
if (data.search.view || data.search.filters.includes("../private") || data.search.filters.length !== new Set(data.search.filters).size) {
  console.error(`FAIL: saved search fields were not sanitized/deduped: ${JSON.stringify(data.search).slice(0, 500)}`);
  process.exit(1);
}
' -X POST -H 'Content-Type: application/json' \
  -d "{\"id\":\"$search_id\",\"title\":\"$MARKER Bible search\",\"query\":\"Bible\",\"view\":\"../private\",\"filters\":[\"portal ready\",\"portal ready\",\"../private\"],\"sort\":\"A-Z\"}" \
  "$BASE_URL/api/saved-searches?role=Contributor"

if [ "$local_runtime_probe" = "1" ]; then
  STALE_SEARCH_ID="$stale_search_id" node <<'NODE'
const fs = require("fs");
const path = require("path");
const filePath = path.join(process.cwd(), "data", "runtime", "saved-searches.json");
fs.mkdirSync(path.dirname(filePath), { recursive: true });
const existing = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : [];
const filler = Array.from({ length: 260 }, (_, index) => ({
  id: `${process.env.STALE_SEARCH_ID}-filler-${index}`,
  title: `Oversized local-json filler ${index}`,
  query: "Bible",
  filters: ["portal ready"],
  sort: "Newest",
  createdAt: `2000-01-01T00:${String(index % 60).padStart(2, "0")}:00.000Z`,
  updatedAt: `2000-01-01T00:${String(index % 60).padStart(2, "0")}:00.000Z`,
  createdBy: "saved-search-smoke:filler",
  role: "Reviewer",
  storageMode: "local-json"
}));
existing.unshift({
  id: process.env.STALE_SEARCH_ID,
  title: "Stale unsafe saved search",
  query: "Bible",
  view: "../private",
  collection: "../source",
  filters: ["portal ready", "../private", "portal ready"],
  sort: "unsafe-sort",
  createdAt: "not-a-date",
  updatedAt: "2030-01-01T00:00:00.000Z",
  createdBy: "",
  role: "Viewer",
  storageMode: "local-json"
}, ...filler);
fs.writeFileSync(filePath, `${JSON.stringify(existing, null, 2)}\n`);
NODE
fi

stale_search_probe_id=""
if [ "$local_runtime_probe" = "1" ]; then
  stale_search_probe_id="$stale_search_id"
fi

SEARCH_ID="$search_id" STALE_SEARCH_ID="$stale_search_probe_id" expect_json_status 200 saved-search-reviewer-list-visible '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const id = process.env.SEARCH_ID;
const staleId = process.env.STALE_SEARCH_ID;
if (!Array.isArray(data.searches) || data.storageMode !== "local-json") {
  console.error(`FAIL: saved search list shape invalid: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
if (data.count > 250 || data.searches.length > 250) {
  console.error(`FAIL: saved search local-json list was not capped: ${JSON.stringify({ count: data.count, length: data.searches.length })}`);
  process.exit(1);
}
const record = data.searches.find((item) => item.id === id);
if (!record || record.storageMode !== "local-json" || record.query !== "Bible") {
  console.error(`FAIL: saved search not visible to Reviewer: ${JSON.stringify({ id, count: data.count, record }).slice(0, 500)}`);
  process.exit(1);
}
if (staleId) {
  const stale = data.searches.find((item) => item.id === staleId);
  if (!stale || stale.view || stale.collection || stale.filters.includes("../private") || stale.filters.length !== new Set(stale.filters).size || stale.sort !== "Approved first" || stale.role === "Viewer") {
    console.error(`FAIL: persisted unsafe saved search was not normalized: ${JSON.stringify(stale).slice(0, 500)}`);
    process.exit(1);
  }
}
' "$BASE_URL/api/saved-searches?role=Reviewer"

expect_json_status 200 saved-search-readiness-reports-storage '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const item = (data.integrationReadiness || []).find((entry) => entry.id === "saved-search-storage");
if (!item) {
  console.error("FAIL: admin readiness missing saved-search-storage item");
  process.exit(1);
}
if (!/local-json/i.test(item.detail || "") || !/wider rollout/i.test(item.detail || "")) {
  console.error(`FAIL: saved search readiness detail weak: ${JSON.stringify(item)}`);
  process.exit(1);
}
' "$BASE_URL/api/admin/readiness?role=DAM%20Admin"

echo "Portal saved search smoke complete."
