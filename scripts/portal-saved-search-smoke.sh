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

SEARCH_ID="$search_id" expect_json_status 200 saved-search-reviewer-list-visible '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const id = process.env.SEARCH_ID;
if (!Array.isArray(data.searches) || data.storageMode !== "local-json") {
  console.error(`FAIL: saved search list shape invalid: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
const record = data.searches.find((item) => item.id === id);
if (!record || record.storageMode !== "local-json" || record.query !== "Bible") {
  console.error(`FAIL: saved search not visible to Reviewer: ${JSON.stringify({ id, count: data.count, record }).slice(0, 500)}`);
  process.exit(1);
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
