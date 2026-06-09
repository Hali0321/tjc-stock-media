#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3008}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

http_code() {
  local output="$1"
  shift
  curl -sS -o "$output" -w '%{http_code}' "$@"
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
}

expect_json() {
  local label="$1"
  local script="$2"
  local output="$TMP_DIR/${label//[^a-zA-Z0-9_-]/_}.json"
  shift 2
  local code
  code="$(http_code "$output" "$@")"
  if [ "$code" != "200" ]; then
    echo "FAIL: $label expected 200 got $code"
    cat "$output"
    exit 1
  fi
  node -e "$script" < "$output"
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
}

normal_user_payload_guard='
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const forbiddenKeys = new Set([
  "metadataHealth",
  "zeroResultInsights",
  "operationalInsights",
  "resourceSpaceId",
  "resourceSpaceUrl",
  "resourceSpaceUrls",
  "sourcePath",
  "masterDrivePath",
  "sourceAlbumPath",
  "originalFilename",
  "checksumSha256",
  "fileSizeBytes",
  "pendingReviewWrite",
  "pendingWrites",
  "fieldMappings",
  "integrationReadiness",
  "auditLog",
  "rawTotal",
  "visibleToRole",
  "approvedRaw",
  "approved",
  "portalReady",
  "batchApprovedWithBlockers",
  "needsReview",
  "pendingReview",
  "archiveCandidates",
  "childrenYouth",
  "missingSource",
  "rightsReview",
  "approvedThisMonth"
]);
const forbiddenText = [
  /ResourceSpace/i,
  /Shared Drive/i,
  /pending writes?/i,
  /API mapping/i,
  /launch gate/i,
  /diagnostics?/i,
  /metadata health/i,
  /raw totals?/i,
  /source[- ]of[- ]truth/i,
  /field refs?/i,
  /source path/i,
  /master drive/i,
  /master\/original path/i,
  /master files?/i,
  /original filename/i,
  /checksum/i,
  /raw ResourceSpace/i,
  /ResourceSpace ID/i,
  /\bRS\s+\d+\b/
];
const leaks = [];
function walk(value, path) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${path}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      const nextPath = path ? `${path}.${key}` : key;
      if (forbiddenKeys.has(key)) leaks.push(nextPath);
      walk(child, nextPath);
    }
    return;
  }
  if (typeof value === "string") {
    for (const pattern of forbiddenText) {
      if (pattern.test(value)) leaks.push(`${path}=${JSON.stringify(value).slice(0, 120)}`);
    }
  }
}
walk(data, "");
if (leaks.length) {
  console.error(`FAIL: normal-user payload leaked operational fields/copy: ${leaks.slice(0, 20).join(", ")}`);
  process.exit(1);
}
if (data.source && (data.source.label !== "Media library" || data.source.adapter !== "demo-fallback")) {
  console.error(`FAIL: normal-user source was not redacted: ${JSON.stringify(data.source)}`);
  process.exit(1);
}
'

expect_json_status 403 unsafe-thumbnail-viewer-payload-safe "$normal_user_payload_guard" "$BASE_URL/api/assets/thumbnail/644?variant=detail"
expect_code 200 unsafe-thumbnail-reviewer "$BASE_URL/api/assets/thumbnail/644?variant=detail&role=Reviewer"
expect_code 403 unsafe-download-variant-reviewer "$BASE_URL/api/assets/thumbnail/644?variant=download&role=Reviewer"
expect_code 403 blocked-approved-download-viewer "$BASE_URL/api/download/368?role=Viewer"
expect_code 400 malformed-asset-detail "$BASE_URL/api/assets/%2E%2E644?role=Reviewer"
expect_code 400 malformed-thumbnail "$BASE_URL/api/assets/thumbnail/%2E%2E644?variant=detail&role=Reviewer"
expect_code 400 malformed-download "$BASE_URL/api/download/%2E%2E368?role=Viewer"
expect_json_status 404 missing-thumbnail-viewer-payload-safe "$normal_user_payload_guard" "$BASE_URL/api/assets/thumbnail/999999?variant=detail&role=Viewer"
expect_code 400 unknown-saved-view "$BASE_URL/api/assets/search?role=Viewer&view=../../admin"
expect_code 400 unknown-collection "$BASE_URL/api/assets/search?role=Viewer&collection=../../admin"

expect_code 400 bad-review-action \
  -X POST -H 'Content-Type: application/json' \
  -d '{"role":"Reviewer","id":"644","action":"Made Up"}' \
  "$BASE_URL/api/review"

expect_code 400 malformed-review-asset \
  -X POST -H 'Content-Type: application/json' \
  -d '{"role":"Reviewer","id":"../644","action":"Approve Public"}' \
  "$BASE_URL/api/review"

expect_code 404 missing-review-asset \
  -X POST -H 'Content-Type: application/json' \
  -d '{"role":"Reviewer","id":"999999","action":"Approve Public"}' \
  "$BASE_URL/api/review"

expect_json_status 400 empty-upload-contributor-payload-safe "$normal_user_payload_guard" \
  -X POST -F 'role=Contributor' -F 'eventName=No files test' \
  "$BASE_URL/api/upload"

expect_code 400 noncanonical-upload-tags \
  -X POST \
  -F 'role=Contributor' \
  -F 'title=Noncanonical tag test' \
  -F 'eventName=Noncanonical tag test' \
  -F 'eventDate=2026-06-06' \
  -F 'ministry=Internet Ministry' \
  -F 'source=QA Reviewer' \
  -F 'peopleVisible=No' \
  -F 'minorsVisible=No' \
  -F 'usageRights=TJC-owned / permission confirmed' \
  -F 'approvalSuggestion=Internal ministry' \
  -F 'notes=No consent restrictions; no people visible.' \
  -F 'tags=qa-only' \
  -F 'intakeNotes=QA invalid taxonomy intake.' \
  -F 'sourceLink=https://drive.google.com/example' \
  "$BASE_URL/api/upload"

expect_json_status 400 noncanonical-upload-tags-payload-safe "$normal_user_payload_guard" \
  -X POST \
  -F 'role=Contributor' \
  -F 'title=Noncanonical tag test' \
  -F 'eventName=Noncanonical tag test' \
  -F 'eventDate=2026-06-06' \
  -F 'ministry=Internet Ministry' \
  -F 'source=QA Reviewer' \
  -F 'peopleVisible=No' \
  -F 'minorsVisible=No' \
  -F 'usageRights=TJC-owned / permission confirmed' \
  -F 'approvalSuggestion=Internal ministry' \
  -F 'notes=No consent restrictions; no people visible.' \
  -F 'tags=qa-only' \
  -F 'intakeNotes=QA invalid taxonomy intake.' \
  -F 'sourceLink=https://drive.google.com/example' \
  "$BASE_URL/api/upload"

expect_json source-link-upload-contributor '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (data.status !== "validated" || data.fileCount !== 0 || !data.sourceLink) {
  console.error("FAIL: source-link intake was not accepted without local files");
  process.exit(1);
}
const text = JSON.stringify(data);
if (/ResourceSpace|Shared Drive|pending writes?|API mapping|launch gate|diagnostics?|metadata health|raw totals?|source[- ]of[- ]truth|field refs?|source path|master drive|master\/original path|master files?|original filename|checksum|raw ResourceSpace|ResourceSpace ID|\bRS\s+\d+\b/i.test(text)) {
  console.error("FAIL: contributor upload response leaked operational copy");
  process.exit(1);
}
' -X POST \
  -F 'role=Contributor' \
  -F 'title=Source link test' \
  -F 'eventName=Source link test' \
  -F 'eventDate=2026-06-06' \
  -F 'ministry=Internet Ministry' \
  -F 'source=QA Reviewer' \
  -F 'peopleVisible=No' \
  -F 'minorsVisible=No' \
  -F 'usageRights=TJC-owned / permission confirmed' \
  -F 'approvalSuggestion=Internal ministry' \
  -F 'notes=No consent restrictions; no people visible.' \
  -F 'tags=Bible, worship' \
  -F 'intakeNotes=QA no-file intake with source link only.' \
  -F 'sourceLink=https://drive.google.com/example' \
  "$BASE_URL/api/upload"

expect_code 403 batch-viewer \
  -X POST -H 'Content-Type: application/json' \
  -d '{"role":"Viewer","action":"request-review","assetIds":["644"]}' \
  "$BASE_URL/api/batch"

expect_code 400 batch-malformed-asset \
  -X POST -H 'Content-Type: application/json' \
  -d '{"role":"Reviewer","action":"request-review","assetIds":["../644"]}' \
  "$BASE_URL/api/batch"

expect_code 404 batch-missing-asset \
  -X POST -H 'Content-Type: application/json' \
  -d '{"role":"Reviewer","action":"request-review","assetIds":["999999"]}' \
  "$BASE_URL/api/batch"

expect_json batch-preview-reviewer '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (data.ok !== false || data.count !== 1 || !/write mapping/.test(data.message || "")) {
  console.error("FAIL: batch preview did not stay read-only/honest");
  process.exit(1);
}
' -X POST -H 'Content-Type: application/json' \
  -d '{"role":"Reviewer","action":"request-review","assetIds":["644"]}' \
  "$BASE_URL/api/batch"

expect_code 403 collection-viewer \
  -X POST -H 'Content-Type: application/json' \
  -d '{"role":"Viewer","assetIds":["368"],"title":"Viewer collection"}' \
  "$BASE_URL/api/collections"

expect_code 400 collection-malformed-asset \
  -X POST -H 'Content-Type: application/json' \
  -d '{"role":"Contributor","assetIds":["../368"],"title":"Bad collection"}' \
  "$BASE_URL/api/collections"

expect_code 403 collection-hidden-asset-contributor \
  -X POST -H 'Content-Type: application/json' \
  -d '{"role":"Contributor","assetIds":["644"],"title":"Unsafe collection"}' \
  "$BASE_URL/api/collections"

expect_code 404 collection-missing-asset \
  -X POST -H 'Content-Type: application/json' \
  -d '{"role":"Contributor","assetIds":["999999"],"title":"Missing collection"}' \
  "$BASE_URL/api/collections"

expect_json collection-preview-contributor '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (data.ok !== false || data.assetCount !== 1 || !/Sharing stays paused/.test(data.message || "")) {
  console.error("FAIL: collection draft preview did not stay read-only/honest");
  process.exit(1);
}
const text = JSON.stringify(data);
if (/ResourceSpace|Shared Drive|pending writes?|API mapping|launch gate|diagnostics?|metadata health|raw totals?|source[- ]of[- ]truth|field refs?|source path|master drive|master\/original path|master files?|original filename|checksum|raw ResourceSpace|ResourceSpace ID|\bRS\s+\d+\b|Persistence/i.test(text)) {
  console.error("FAIL: contributor collection response leaked operational copy");
  process.exit(1);
}
' -X POST -H 'Content-Type: application/json' \
  -d '{"role":"Contributor","assetIds":["368"],"title":"Approved collection","audience":"Internal ministry"}' \
  "$BASE_URL/api/collections"

expect_json public-portal-collection-gate '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (data.ok !== false || data.blockedPublic !== true || !data.portalReadiness?.blockedAssetIds?.includes("368")) {
  console.error("FAIL: public portal draft did not block non-portal-ready approved asset");
  process.exit(1);
}
' -X POST -H 'Content-Type: application/json' \
  -d '{"role":"Contributor","assetIds":["368"],"title":"Public candidate","audience":"Public-approved portal"}' \
  "$BASE_URL/api/collections"

expect_json reviewer-admin-links-blocked '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const count = Object.keys(data.resourceSpaceUrls || {}).length;
if (count !== 0) {
  console.error(`FAIL: Reviewer received ${count} ResourceSpace admin URLs`);
  process.exit(1);
}
' "$BASE_URL/api/review?role=Reviewer&queue=pending"

expect_json dam-admin-links-visible '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const count = Object.keys(data.resourceSpaceUrls || {}).length;
if (count < 1) {
  console.error("FAIL: DAM Admin did not receive ResourceSpace admin URLs");
  process.exit(1);
}
' "$BASE_URL/api/review?role=DAM%20Admin&queue=pending"

expect_code 403 admin-readiness-viewer "$BASE_URL/api/admin/readiness?role=Viewer"

expect_json admin-readiness-dam-admin '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (!Array.isArray(data.readiness) || !Array.isArray(data.fieldMappings) || !Array.isArray(data.vocabulary)) {
  console.error("FAIL: DAM readiness did not return readiness, field mappings, and vocabulary");
  process.exit(1);
}
' "$BASE_URL/api/admin/readiness?role=DAM%20Admin"

expect_json canonical-duplicate-groups-not-queue '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const duplicateQueue = data.queues.find((queue) => queue.id === "duplicate-candidates");
if (!duplicateQueue) {
  console.error("FAIL: duplicate queue missing");
  process.exit(1);
}
if (duplicateQueue.count > 999) {
  console.error(`FAIL: canonical duplicate groups inflated review queue: ${duplicateQueue.count}`);
  process.exit(1);
}
' "$BASE_URL/api/review?role=Reviewer&queue=duplicate-candidates"

expect_json limit-clamped '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (data.assets.length !== 1 || data.counts.rendered !== 1) {
  console.error(`FAIL: negative limit was not clamped to 1: ${data.assets.length}/${data.counts.rendered}`);
  process.exit(1);
}
' "$BASE_URL/api/assets/search?role=Viewer&limit=-1"

expect_json paginated-search-range '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (data.assets.length !== 5 || data.pagination?.rangeStart !== 6 || data.pagination?.rangeEnd !== 10 || data.pagination?.previousOffset !== 0 || data.pagination?.nextOffset !== 10) {
  console.error(`FAIL: pagination range/offset incorrect: ${JSON.stringify(data.pagination)}`);
  process.exit(1);
}
' "$BASE_URL/api/assets/search?role=Viewer&limit=5&offset=5"

expect_json reviewer-approved-rights-unknown-stays-review '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if ((data.counts?.rightsReview || 0) < 1 || (data.metadataHealth?.needsRights || 0) < 1) {
  console.error("FAIL: approved assets with unknown rights/consent were treated as fully clear");
  process.exit(1);
}
' "$BASE_URL/api/assets/search?role=Reviewer&view=approved-church-wide&limit=5"

expect_json viewer-search-redacts-operational-diagnostics '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const forbiddenTopLevel = ["metadataHealth", "zeroResultInsights", "operationalInsights"];
const leakedTopLevel = forbiddenTopLevel.filter((key) => key in data);
if (leakedTopLevel.length) {
  console.error(`FAIL: Viewer search leaked ${leakedTopLevel.join(", ")}`);
  process.exit(1);
}
const forbiddenCounts = [
  "rawTotal",
  "visibleToRole",
  "approvedRaw",
  "approved",
  "portalReady",
  "batchApprovedWithBlockers",
  "needsReview",
  "pendingReview",
  "archive",
  "archiveCandidates",
  "blocked",
  "childrenYouth",
  "missingSource",
  "rightsReview",
  "approvedThisMonth"
];
const leakedCounts = forbiddenCounts.filter((key) => data.counts && key in data.counts);
if (leakedCounts.length) {
  console.error(`FAIL: Viewer search leaked ${leakedCounts.map((key) => `counts.${key}`).join(", ")}`);
  process.exit(1);
}
if (!data.source || data.source.label !== "Media library" || data.source.adapter !== "demo-fallback") {
  console.error("FAIL: Viewer search source was not redacted");
  process.exit(1);
}
' "$BASE_URL/api/assets/search?role=Viewer&limit=1"

expect_json viewer-search-payload-safe "$normal_user_payload_guard" "$BASE_URL/api/assets/search?role=Viewer&limit=1"
expect_json contributor-search-payload-safe "$normal_user_payload_guard" "$BASE_URL/api/assets/search?role=Contributor&limit=1"
expect_json viewer-asset-payload-safe "$normal_user_payload_guard" "$BASE_URL/api/assets/367?role=Viewer"
expect_json contributor-asset-payload-safe "$normal_user_payload_guard" "$BASE_URL/api/assets/367?role=Contributor"
expect_json_status 403 viewer-denied-download-payload-safe "$normal_user_payload_guard" "$BASE_URL/api/download/368?role=Viewer"
expect_json_status 403 contributor-denied-download-payload-safe "$normal_user_payload_guard" "$BASE_URL/api/download/368?role=Contributor"

expect_json rights-status-not-publish-status '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (data.asset?.rightsStatus === data.asset?.status || /Approved Public|Approved Internal|Needs Review/.test(data.asset?.rightsStatus || "")) {
  console.error("FAIL: publish status leaked into rights status display");
  process.exit(1);
}
' "$BASE_URL/api/assets/368?role=Viewer"

expect_json role-scoped-search-images '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const first = data.assets[0];
if (!first?.imageUrls?.card?.includes("role=Reviewer") || !first?.preview?.includes("role=Reviewer")) {
  console.error("FAIL: search response image URLs are not role scoped");
  process.exit(1);
}
' "$BASE_URL/api/assets/search?role=Reviewer&view=needs-review&limit=5"

expect_json viewer-payload-hides-original-metadata '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const asset = data.asset;
const leaked = ["sourcePath", "masterDrivePath", "sourceAlbumPath", "originalFilename", "checksumSha256", "fileSizeBytes"].filter((key) => asset && key in asset);
if (leaked.length) {
  console.error(`FAIL: Viewer asset payload leaked restricted metadata: ${leaked.join(", ")}`);
  process.exit(1);
}
' "$BASE_URL/api/assets/367?role=Viewer"

expect_json reviewer-payload-keeps-original-metadata '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (!data.asset?.sourcePath || !data.asset?.originalFilename || !data.asset?.checksumSha256) {
  console.error("FAIL: Reviewer asset payload lost audit/source metadata");
  process.exit(1);
}
' "$BASE_URL/api/assets/367?role=Reviewer"

expect_json people-unknown-saved-view '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
if (data.total < 2000 || !data.assets.every((asset) => asset.peopleRisk === "Unknown")) {
  console.error("FAIL: people-unknown saved view is not backed by people/minors metadata");
  process.exit(1);
}
' "$BASE_URL/api/assets/search?role=Reviewer&view=people-unknown&limit=10"

expect_json az-sort-applies-before-limit '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const titles = data.assets.map((asset) => asset.title);
const sorted = [...titles].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
if (JSON.stringify(titles) !== JSON.stringify(sorted)) {
  console.error(`FAIL: A-Z sort did not apply before limit: ${titles.join(" | ")}`);
  process.exit(1);
}
' "$BASE_URL/api/assets/search?role=Viewer&sort=A-Z&limit=20"

echo "Portal API smoke complete."
