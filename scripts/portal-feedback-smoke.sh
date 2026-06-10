#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:4868}"
MARKER="feedback-smoke-$(date -u +%Y%m%dT%H%M%SZ)-$$"
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

select_json_status() {
  local expected="$1"
  local label="$2"
  local script="$3"
  local output="$TMP_DIR/${label//[^a-zA-Z0-9_-]/_}.json"
  shift 3
  local code
  code="$(http_code "$output" "$@")"
  if [ "$code" != "$expected" ]; then
    echo "FAIL: $label expected $expected got $code" >&2
    cat "$output" >&2
    return 1
  fi
  node -e "$script" < "$output"
}

feedback_id="$(select_json_status 200 feedback-submit '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (data.ok !== true || !data.id || !data.createdAt) {
  console.error(`FAIL: feedback submit shape invalid: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
console.log(data.id);
' -X POST -H 'Content-Type: application/json' \
  -d "{\"role\":\"Viewer\",\"route\":\"/\",\"task\":\"Feedback smoke\",\"severity\":\"medium\",\"expected\":\"Feedback should save and appear in DAM Admin inbox.\",\"actual\":\"$MARKER submitted through smoke.\",\"browser\":\"portal-feedback-smoke\",\"device\":\"CLI\"}" \
  "$BASE_URL/api/beta-feedback")"
echo "PASS: feedback-submit"

expect_json_status 400 feedback-submit-invalid-severity '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (!Array.isArray(data.missing) || !data.missing.includes("severity")) {
  console.error(`FAIL: invalid feedback severity did not report missing severity: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
' -X POST -H 'Content-Type: application/json' \
  -d "{\"role\":\"Viewer\",\"route\":\"/\",\"task\":\"Feedback smoke invalid\",\"severity\":\"urgent\",\"expected\":\"Invalid severity should be rejected.\",\"actual\":\"$MARKER invalid severity.\"}" \
  "$BASE_URL/api/beta-feedback"

expect_json_status 403 feedback-viewer-inbox-denied '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (!/DAM Admin/i.test(data.error || "")) {
  console.error(`FAIL: viewer denial copy invalid: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
' "$BASE_URL/api/beta-feedback?role=Viewer"

FEEDBACK_ID="$feedback_id" expect_json_status 200 feedback-admin-list-visible '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const id = process.env.FEEDBACK_ID;
if (!Array.isArray(data.feedback) || typeof data.count !== "number") {
  console.error(`FAIL: feedback inbox shape invalid: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
const record = data.feedback.find((item) => item.id === id);
if (!record || record.status !== "new" || !["local-json", "vercel-kv"].includes(record.storageMode)) {
  console.error(`FAIL: submitted feedback not listed with storage mode: ${JSON.stringify({ id, count: data.count, record }).slice(0, 500)}`);
  process.exit(1);
}
if (!record.actor) {
  console.error(`FAIL: submitted feedback missing actor identity: ${JSON.stringify(record).slice(0, 500)}`);
  process.exit(1);
}
' "$BASE_URL/api/beta-feedback?role=DAM%20Admin"

expect_json_status 403 feedback-viewer-patch-denied '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (!/DAM Admin/i.test(data.error || "")) {
  console.error(`FAIL: viewer patch denial copy invalid: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
' -X PATCH -H 'Content-Type: application/json' \
  -d '{"role":"Viewer","status":"fixed"}' \
  "$BASE_URL/api/beta-feedback/$feedback_id?role=Viewer"

expect_json_status 400 feedback-admin-patch-invalid-status '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (!/status is invalid/i.test(data.error || "")) {
  console.error(`FAIL: invalid patch status was not rejected: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
' -X PATCH -H 'Content-Type: application/json' \
  -d '{"role":"DAM Admin","status":"done"}' \
  "$BASE_URL/api/beta-feedback/$feedback_id?role=DAM%20Admin"

FEEDBACK_ID="$feedback_id" expect_json_status 200 feedback-admin-patch '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const id = process.env.FEEDBACK_ID;
if (data.ok !== true || data.feedback?.id !== id || data.feedback?.status !== "agent-ready" || data.feedback?.severity !== "high") {
  console.error(`FAIL: feedback patch did not persist triage fields: ${JSON.stringify(data).slice(0, 500)}`);
  process.exit(1);
}
if (!/smoke triage note/i.test(data.feedback.notes || "")) {
  console.error(`FAIL: feedback patch did not persist notes: ${JSON.stringify(data.feedback).slice(0, 500)}`);
  process.exit(1);
}
' -X PATCH -H 'Content-Type: application/json' \
  -d '{"role":"DAM Admin","status":"agent-ready","severity":"high","notes":"Smoke triage note for agent-ready feedback."}' \
  "$BASE_URL/api/beta-feedback/$feedback_id?role=DAM%20Admin"

FEEDBACK_ID="$feedback_id" expect_json_status 200 feedback-admin-list-patched '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const id = process.env.FEEDBACK_ID;
const record = (data.feedback || []).find((item) => item.id === id);
if (!record || record.status !== "agent-ready" || record.severity !== "high") {
  console.error(`FAIL: patched feedback not visible in inbox: ${JSON.stringify({ id, record }).slice(0, 500)}`);
  process.exit(1);
}
' "$BASE_URL/api/beta-feedback?role=DAM%20Admin"

expect_json_status 200 feedback-readiness-reports-storage '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const item = (data.integrationReadiness || []).find((entry) => entry.id === "beta-feedback-storage");
if (!item) {
  console.error("FAIL: admin readiness missing beta-feedback-storage item");
  process.exit(1);
}
if (!/feedback/i.test(item.label || "") || !/Records:/i.test(item.detail || "")) {
  console.error(`FAIL: beta feedback readiness detail weak: ${JSON.stringify(item)}`);
  process.exit(1);
}
' "$BASE_URL/api/admin/readiness?role=DAM%20Admin"

echo "Portal beta feedback smoke complete."
