#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://tjc-stock-media.vercel.app}"
MARKER="hosted-smoke-$(date -u +%Y%m%dT%H%M%SZ)-$$"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

http_code() {
  local output="$1"
  shift
  curl --max-time 20 -sS -o "$output" -w '%{http_code}' "$@"
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

blocked_asset_id_script='
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const asset = (Array.isArray(data.assets) ? data.assets : []).find((item) => item && item.id && (!item.reuseDecision || item.reuseDecision.downloadable !== true));
if (!asset) {
  console.error("FAIL: no blocked/non-downloadable asset id found in API response");
  process.exit(1);
}
console.log(asset.id);
'

expect_code 200 hosted-root "$BASE_URL/?role=Viewer&taskMode=1"
expect_code 200 hosted-upload "$BASE_URL/upload?role=Contributor&taskMode=1"
expect_code 200 hosted-review "$BASE_URL/review?role=Reviewer&taskMode=1"
expect_code 200 hosted-admin "$BASE_URL/admin?role=DAM%20Admin&taskMode=1"
expect_code 200 hosted-guide "$BASE_URL/guide?role=Viewer&taskMode=1"

expect_json_status 200 hosted-feedback-post '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (data.ok !== true || !data.id || !data.createdAt) {
  console.error(`FAIL: feedback POST did not return ok/id/createdAt: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
' -X POST -H 'Content-Type: application/json' \
  -d "{\"role\":\"Viewer\",\"route\":\"/\",\"task\":\"Hosted smoke feedback loop\",\"severity\":\"medium\",\"expected\":\"Feedback saves for DAM Admin triage.\",\"actual\":\"$MARKER feedback POST reached hosted beta.\",\"browser\":\"portal-hosted-smoke\",\"device\":\"CLI\"}" \
  "$BASE_URL/api/beta-feedback"

expect_json_status 403 hosted-feedback-viewer-denied '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (!/admin/i.test(data.error || "")) {
  console.error(`FAIL: Viewer feedback inbox denial was not explicit: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
' "$BASE_URL/api/beta-feedback?role=Viewer"

expect_json_status 200 hosted-feedback-admin-visible '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (!Array.isArray(data.feedback) || typeof data.count !== "number") {
  console.error(`FAIL: DAM Admin feedback inbox shape invalid: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
' "$BASE_URL/api/beta-feedback?role=DAM%20Admin"

BLOCKED_DOWNLOAD_ID="$(select_json_value hosted-blocked-download-id "$blocked_asset_id_script" \
  "$BASE_URL/api/assets/search?role=Reviewer&view=needs-review&limit=25")"

expect_json_status 403 hosted-viewer-download-blocked '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (data.downloadUrl || data.url || data.signedUrl || data.originalUrl) {
  console.error(`FAIL: blocked Viewer download exposed URL: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
if (!data.error && !data.reason) {
  console.error(`FAIL: blocked Viewer download missing reason/error: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
' "$BASE_URL/api/download/$BLOCKED_DOWNLOAD_ID?role=Viewer"

echo "Hosted portal smoke complete for $BASE_URL."
