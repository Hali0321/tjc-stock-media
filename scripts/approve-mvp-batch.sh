#!/usr/bin/env bash
set -euo pipefail

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR=".runtime/audits"
mkdir -p "$OUT_DIR"

BATCH="${1:-MVP 2024 First Batch}"
REVIEWER="${2:-ResourceSpace admin}"
REVIEW_DATE="${3:-$(date +%F)}"
MIN_REF="${4:-363}"
RIGHTS_STATUS="${5:-Permission Confirmed}"
AUDIT="/tmp/tjc-mvp-approval-audit-$STAMP.csv"
DEST="$OUT_DIR/approval-audit-$STAMP.csv"

docker compose cp scripts/resourcespace-approve-batch.php resourcespace:/tmp/resourcespace-approve-batch.php
docker compose exec -T resourcespace php /tmp/resourcespace-approve-batch.php "$BATCH" "$REVIEWER" "$REVIEW_DATE" "$AUDIT" "$MIN_REF" "$RIGHTS_STATUS"
docker compose cp "resourcespace:$AUDIT" "$DEST"

echo "Approval audit: $DEST"
