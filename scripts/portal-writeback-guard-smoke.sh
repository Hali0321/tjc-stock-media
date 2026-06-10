#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:4868}"
MARKER="writeback-guard-$(date -u +%Y%m%dT%H%M%SZ)-$$"
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

review_asset_id_script='
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const asset = (Array.isArray(data.assets) ? data.assets : []).find((item) => item && item.id);
if (!asset) {
  console.error("FAIL: no review asset id found");
  process.exit(1);
}
console.log(asset.id);
'

REVIEW_ASSET_ID="$(select_json_value review-writeback-guard-asset-id "$review_asset_id_script" \
  "$BASE_URL/api/review?role=Reviewer&queue=pending")"

expect_json_status 200 writeback-readiness-not-live '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const item = (data.integrationReadiness || []).find((entry) => entry.id === "review-writes");
if (!item) {
  console.error("FAIL: admin readiness missing review-writes integration");
  process.exit(1);
}
if (item.ready === true || /Operational/i.test(item.state || "")) {
  console.error(`FAIL: no-live writeback guard expected non-operational review-writes state: ${JSON.stringify(item)}`);
  process.exit(1);
}
if (!/pending-sync|disabled|not configured|field refs|field map|credentials|writeback/i.test(`${item.detail || ""} ${item.state || ""}`)) {
  console.error(`FAIL: review-writes readiness detail does not explain blocked writeback: ${JSON.stringify(item)}`);
  process.exit(1);
}
' "$BASE_URL/api/admin/readiness?role=DAM%20Admin"

expect_json_status 400 writeback-incomplete-evidence-blocked '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const text = JSON.stringify(data);
if (!Array.isArray(data.missingEvidence) || !data.missingEvidence.includes("reviewNote")) {
  console.error(`FAIL: missing review evidence did not report reviewNote: ${text}`);
  process.exit(1);
}
if (/updated through the live API|resourcespace-live-writeback|synced_to_resourcespace/i.test(text)) {
  console.error(`FAIL: incomplete evidence claimed ResourceSpace writeback: ${text}`);
  process.exit(1);
}
' -X POST -H 'Content-Type: application/json' \
  -d "{\"role\":\"Reviewer\",\"id\":\"$REVIEW_ASSET_ID\",\"action\":\"Approve Public\",\"notes\":\"short\",\"checklist\":{\"sourceConfirmed\":true}}" \
  "$BASE_URL/api/review"

expect_json_status 202 writeback-complete-evidence-queues-only '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const text = JSON.stringify(data);
if (data.ok !== true || !data.pendingWriteId || !data.auditRecord) {
  console.error(`FAIL: queued review response missing pending write/audit proof: ${text}`);
  process.exit(1);
}
if (data.mode === "resourcespace-live-writeback" || data.sync?.ok !== false || /updated through the live API|synced_to_resourcespace/i.test(text)) {
  console.error(`FAIL: no-live writeback guard saw a fake live ResourceSpace success: ${text}`);
  process.exit(1);
}
if (!["queued", "ready_to_sync", "sync_failed"].includes(data.syncState)) {
  console.error(`FAIL: queued review response had unexpected sync state: ${data.syncState}`);
  process.exit(1);
}
if (!data.auditRecord.actor || data.auditRecord.reviewerRole !== "Reviewer") {
  console.error(`FAIL: queued review audit proof missing actor/reviewer role: ${JSON.stringify(data.auditRecord)}`);
  process.exit(1);
}
' -X POST -H 'Content-Type: application/json' \
  -d "{\"role\":\"Reviewer\",\"id\":\"$REVIEW_ASSET_ID\",\"action\":\"Request More Info\",\"notes\":\"$MARKER complete evidence should queue without live ResourceSpace writeback.\",\"checklist\":{\"sourceConfirmed\":true,\"rightsConfirmed\":true,\"peopleVisibilityConfirmed\":true,\"childrenYouthChecked\":true,\"usageScopeSelected\":true},\"reviewerName\":\"Writeback Guard Smoke\"}" \
  "$BASE_URL/api/review"

expect_json_status 200 writeback-pending-queue-visible '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const item = (data.integrationReadiness || []).find((entry) => entry.id === "pending-review-writes");
if (!item) {
  console.error("FAIL: admin readiness missing pending-review-writes integration");
  process.exit(1);
}
if (!/pending review write/i.test(item.label || "") || !/pending writes?/i.test(item.detail || "")) {
  console.error(`FAIL: pending write readiness row is weak: ${JSON.stringify(item)}`);
  process.exit(1);
}
' "$BASE_URL/api/admin/readiness?role=DAM%20Admin"

echo "Portal ResourceSpace writeback guard smoke complete."
