#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

failures=0
warnings=0

pass() {
  printf 'PASS: %s\n' "$1"
}

warn() {
  warnings=$((warnings + 1))
  printf 'WARN: %s\n' "$1"
}

fail() {
  failures=$((failures + 1))
  printf 'FAIL: %s\n' "$1"
}

require_file() {
  if [ -f "$1" ]; then
    pass "file exists: $1"
  else
    fail "missing file: $1"
  fi
}

require_dir() {
  if [ -d "$1" ]; then
    pass "directory exists: $1"
  else
    fail "missing directory: $1"
  fi
}

if command -v docker >/dev/null 2>&1; then
  if docker compose config >/dev/null 2>&1; then
    pass "docker compose config valid"
  else
    fail "docker compose config failed"
  fi
else
  fail "docker not installed or not on PATH"
fi

require_file ".env.production.example"
require_file "docs/launch-plan.md"
require_file "docs/large-media-policy.md"
require_file "docs/video-audio-policy.md"
require_file "docs/ai-tagging-policy.md"
require_file "docs/production-runbook.md"
require_file "docs/user-guide.md"
require_file "docs/reviewer-guide.md"
require_file "docs/rights-workflow.md"
require_file "docs/shared-drive-structure.md"
require_file "docs/beta-readiness-command-center.md"
require_file "frontend/lib/beta-readiness-facts.ts"
require_file "scripts/backup.sh"
require_file "scripts/restore-test.sh"
require_file "scripts/video-manifest.sh"
require_file "scripts/portal-sso-smoke.sh"
require_file "scripts/portal-usage-smoke.sh"
require_file "scripts/portal-delivery-smoke.sh"
require_file "scripts/portal-writeback-guard-smoke.sh"
require_file "scripts/portal-beta-rehearsal.sh"
require_file "scripts/portal-hosted-smoke.sh"
require_file "frontend/app/api/beta-feedback/export/route.ts"

if git ls-files | rg -i '\.(jpg|jpeg|png|heic|heif|gif|tif|tiff|mp4|mov|m4v|mp3|wav|m4a|aac|flac)$' | rg -v '^frontend/public/brand/' >/tmp/tjc-launch-media-tracked.txt; then
  fail "media files are tracked by git"
  cat /tmp/tjc-launch-media-tracked.txt
else
  pass "no church media files tracked by git; app brand assets allowed"
fi

if [ -f .env ]; then
  if grep -Eq 'change-me|example\.tjc\.org' .env; then
    warn ".env still contains placeholder values"
  else
    pass ".env does not contain obvious placeholder values"
  fi
else
  warn ".env missing; local runtime may not be configured"
fi

if [ -f docs/screenshots/qa/browser-qa-report.json ]; then
  if node -e '
const fs = require("fs");
const report = JSON.parse(fs.readFileSync("docs/screenshots/qa/browser-qa-report.json", "utf8"));
const failures = [
  ...(report.failures || []),
  ...(report.consoleErrors || []),
  ...(report.networkFailures || [])
];
if (failures.length) {
  console.error(`browser QA failure signals: ${failures.length}`);
  process.exit(1);
}
const widths = new Set(report.viewports || []);
const requiredWidths = [1440, 1280, 1024, 768, 390, 320];
const missingWidths = requiredWidths.filter((width) => !widths.has(width));
if (missingWidths.length) {
  console.error(`browser QA missing required widths: ${missingWidths.join(", ")}`);
  process.exit(1);
}
if ((report.pages || 0) < 16) {
  console.error(`browser QA page coverage too low: ${report.pages || 0}`);
  process.exit(1);
}
const screenshots = new Set(report.screenshots || []);
const requiredScreenshots = [
  "library-desktop.png",
  "library-mobile-320.png",
  "packages-desktop.png",
  "review-desktop.png",
  "admin-desktop.png",
  "guide-mobile-320.png"
];
const missingScreenshots = requiredScreenshots.filter((name) => !screenshots.has(name));
if (missingScreenshots.length) {
  console.error(`browser QA missing proof screenshots: ${missingScreenshots.join(", ")}`);
  process.exit(1);
}
' >/tmp/tjc-browser-qa-check.txt 2>&1; then
    pass "browser QA report has full beta viewport/page coverage"
  else
    fail "browser QA report coverage check failed"
    cat /tmp/tjc-browser-qa-check.txt
  fi
else
  warn "browser QA report missing; run make portal-browser-qa before inviting teammates"
fi

if [ -d .runtime/audit-log ]; then
  if node -e '
const fs = require("fs");
const path = require("path");
const dir = ".runtime/audit-log";
const events = fs.readdirSync(dir)
  .filter((file) => file.endsWith(".jsonl"))
  .flatMap((file) => fs.readFileSync(path.join(dir, file), "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line)));
const actorEvents = events.filter((event) => typeof event.actor === "string" && event.actor.length > 0);
if (!actorEvents.length) {
  console.error("no actor-backed audit events found");
  process.exit(1);
}
const roles = new Set(actorEvents.map((event) => event.role));
const requiredRoles = ["Viewer", "Reviewer", "DAM Admin"];
const missingRoles = requiredRoles.filter((role) => !roles.has(role));
if (missingRoles.length) {
  console.error(`actor-backed audit missing roles: ${missingRoles.join(", ")}`);
  process.exit(1);
}
const types = new Set(actorEvents.map((event) => event.type));
const requiredTypes = ["denied_download", "review_pending_write_queued", "admin_readiness_viewed"];
const missingTypes = requiredTypes.filter((type) => !types.has(type));
if (missingTypes.length) {
  console.error(`actor-backed audit missing event types: ${missingTypes.join(", ")}`);
  process.exit(1);
}
' >/tmp/tjc-audit-evidence-check.txt 2>&1; then
    pass "actor-backed Viewer/Reviewer/Admin audit rehearsal evidence exists"
  else
    warn "actor-backed beta audit rehearsal incomplete"
    cat /tmp/tjc-audit-evidence-check.txt
  fi
else
  warn ".runtime/audit-log missing; run API smoke before inviting teammates"
fi

if [ -d .runtime/backups ]; then
  latest_backup="$(find .runtime/backups -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort | tail -1 || true)"
  if [ -n "$latest_backup" ]; then
    pass "backup exists: $latest_backup"
    if [ -f "$latest_backup/restore-test-passed.txt" ]; then
      pass "latest backup has restore-test marker"
    else
      warn "latest backup lacks restore-test marker"
    fi
  else
    warn "no backup directories found"
  fi
else
  warn ".runtime/backups missing"
fi

free_kib="$(df -k "$ROOT" | awk 'NR==2 {print $4}')"
free_gib=$((free_kib / 1024 / 1024))
min_free_gib="${MIN_FREE_GIB:-10}"
if [ "$free_gib" -lt "$min_free_gib" ]; then
  warn "local free disk below ${min_free_gib} GiB: ${free_gib} GiB"
else
  pass "local free disk at least ${min_free_gib} GiB: ${free_gib} GiB"
fi

video_zip="/Users/halim4pro/Desktop/MVP/Stock Media/01_Source Exports/Videos/Incoming/Samuel Kuo/Samuel Kuo-3-001.zip"
video_dir="/Users/halim4pro/Desktop/MVP/Stock Media/01_Source Exports/Videos/Incoming/Samuel Kuo/Samuel Kuo"
if [ -f "$video_zip" ] && [ -d "$video_dir" ]; then
  warn "Samuel Kuo ZIP and extracted folder both exist; delete ZIP only after manifest/import audit is verified"
fi

if grep -q 'AI_ENABLED=0' .env.production.example && grep -q 'AI_MONTHLY_CAP_USD=25' .env.production.example; then
  pass "AI default disabled and cost cap documented"
else
  fail "AI guardrails missing from .env.production.example"
fi

if grep -q 'TJC_MAX_BROWSER_UPLOAD_MB=100' .env.production.example; then
  pass "large upload threshold documented"
else
  fail "large upload threshold missing"
fi

if grep -Eq 'update_field\(\$ref, \$fields\["rights_status"\], "(Approved Public|Approved Internal|Needs Review|Searchable Archive|Archive - Not Promoted|Do Not Use|Possible Minors)"\)' scripts/resourcespace-approve-batch.php; then
  fail "approval script writes publish workflow state into rights_status"
else
  pass "approval script keeps rights_status separate from publish_status"
fi

if grep -q 'portal-ready-confirmed' scripts/resourcespace-approve-batch.php && grep -q 'portal-ready-confirmed' scripts/approve-mvp-batch.sh; then
  pass "batch approval requires explicit portal-ready confirmation"
else
  fail "batch approval confirmation guard missing"
fi

if grep -qi 'Beta access role' frontend/components/dam/DamShell.tsx \
  && grep -qi 'Role switch is simulated for QA only' frontend/components/BetaPrototypeTools.tsx \
  && grep -Eqi 'role switch (is )?simulated|beta QA only|QA only' docs/teammate-test-guide.md docs/teammate-beta-invite-pack.md; then
  pass "beta role switch is labeled as simulated QA access"
else
  fail "beta role switch simulated-QA copy missing"
fi

if grep -Eqi 'P0|Critical' docs/teammate-test-guide.md docs/teammate-beta-invite-pack.md docs/beta-readiness-command-center.md \
  && grep -Eqi 'stop (the )?test batch|stop testing' docs/teammate-test-guide.md docs/teammate-beta-invite-pack.md docs/beta-readiness-command-center.md \
  && grep -Eqi 'sensitive, private, unreleased, youth-identifiable, or copyrighted media' docs/teammate-test-guide.md docs/teammate-beta-invite-pack.md docs/beta-readiness-command-center.md; then
  pass "beta stop-test policy and forbidden media categories documented"
else
  fail "beta stop-test policy or forbidden media categories missing"
fi

echo
echo "Launch readiness summary: failures=$failures warnings=$warnings"
if [ "$failures" -gt 0 ]; then
  exit 1
fi
