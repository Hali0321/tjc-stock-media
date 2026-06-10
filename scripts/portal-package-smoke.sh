#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:4868}"
MARKER="package-smoke-$(date -u +%Y%m%dT%H%M%SZ)-$$"
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

package_id="pkg-$MARKER"

expect_json_status 403 package-viewer-list-denied '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (!/Reviewer|DAM Admin/i.test(data.error || "")) {
  console.error(`FAIL: viewer package list denial copy invalid: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
' "$BASE_URL/api/packages?role=Viewer"

expect_json_status 403 package-viewer-save-denied '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (!/Contributor|Reviewer|DAM Admin/i.test(data.error || "")) {
  console.error(`FAIL: viewer package save denial copy invalid: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
' -X POST -H 'Content-Type: application/json' \
  -d "{\"role\":\"Viewer\",\"id\":\"$package_id\",\"title\":\"Viewer should not save\"}" \
  "$BASE_URL/api/packages"

PACKAGE_ID="$package_id" expect_json_status 200 package-contributor-save-sanitized '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const id = process.env.PACKAGE_ID;
if (data.ok !== true || data.storageMode !== "local-json" || data.package?.id !== id) {
  console.error(`FAIL: package save shape invalid: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
if (!data.package.createdBy || data.package.role !== "Contributor") {
  console.error(`FAIL: package save missing actor/role: ${JSON.stringify(data.package).slice(0, 500)}`);
  process.exit(1);
}
const sections = data.package.sections || [];
const refs = sections.flatMap((section) => section.resourceSpaceAssetIds || []);
if (refs.includes("../private") || refs.length !== new Set(refs).size || refs.length > 2) {
  console.error(`FAIL: package refs were not sanitized/deduped: ${JSON.stringify(refs)}`);
  process.exit(1);
}
if (!data.package.governance || typeof data.package.governance.totalRefs !== "number") {
  console.error(`FAIL: package governance missing: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
' -X POST -H 'Content-Type: application/json' \
  -d "{\"role\":\"Contributor\",\"id\":\"$package_id\",\"title\":\"$MARKER ministry toolkit\",\"sections\":[{\"id\":\"hero\",\"title\":\"Hero section\",\"resourceSpaceAssetIds\":[\"367\",\"367\",\"../private\",\"368\"]}]}" \
  "$BASE_URL/api/packages?role=Contributor"

PACKAGE_ID="$package_id" expect_json_status 200 package-reviewer-list-visible '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const id = process.env.PACKAGE_ID;
if (!Array.isArray(data.packages) || data.storageMode !== "local-json") {
  console.error(`FAIL: package list shape invalid: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
const record = data.packages.find((item) => item.id === id);
if (!record || record.storageMode !== "local-json" || !record.governance) {
  console.error(`FAIL: saved package not visible to Reviewer: ${JSON.stringify({ id, count: data.count, record }).slice(0, 500)}`);
  process.exit(1);
}
' "$BASE_URL/api/packages?role=Reviewer"

expect_json_status 200 package-readiness-reports-storage '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const item = (data.integrationReadiness || []).find((entry) => entry.id === "package-draft-storage");
if (!item) {
  console.error("FAIL: admin readiness missing package-draft-storage item");
  process.exit(1);
}
if (!/local-json/i.test(item.detail || "") || !/wider rollout/i.test(item.detail || "")) {
  console.error(`FAIL: package draft readiness detail weak: ${JSON.stringify(item)}`);
  process.exit(1);
}
' "$BASE_URL/api/admin/readiness?role=DAM%20Admin"

echo "Portal package draft smoke complete."
