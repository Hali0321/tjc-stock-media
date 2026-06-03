#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="${1:-/Users/halim4pro/Desktop/MVP/ResourceSpace/MVP 2024}"
BATCH="${IMPORT_BATCH:-MVP 2024 First Batch}"
COLLECTION="${IMPORT_COLLECTION:-MVP 2024 - First Batch}"
STAMP="$(date +%Y%m%d-%H%M%S)"
CONTAINER_DIR="/tmp/tjc-import-mvp-2024"
CONTAINER_AUDIT="/tmp/tjc-import-audit-$STAMP.csv"
OUT_DIR="$ROOT/.runtime/audits"

cd "$ROOT"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "FAIL: source directory not found: $SOURCE_DIR"
  exit 1
fi

mkdir -p "$OUT_DIR"

docker compose ps --status running --services | grep -qx resourcespace || {
  echo "FAIL: ResourceSpace is not running. Run: make up"
  exit 1
}

echo "Preparing container import folder: $CONTAINER_DIR"
docker compose exec -T resourcespace rm -rf "$CONTAINER_DIR"
docker compose exec -T resourcespace mkdir -p "$CONTAINER_DIR"
docker compose cp "$SOURCE_DIR/." "resourcespace:$CONTAINER_DIR"
docker compose cp scripts/resourcespace-import-batch.php resourcespace:/tmp/resourcespace-import-batch.php

echo "Importing batch into ResourceSpace collection: $COLLECTION"
docker compose exec -T resourcespace php /tmp/resourcespace-import-batch.php "$CONTAINER_DIR" "$CONTAINER_AUDIT" "$BATCH" "$COLLECTION"

HOST_AUDIT="$OUT_DIR/resourcespace-import-audit-$STAMP.csv"
docker compose cp "resourcespace:$CONTAINER_AUDIT" "$HOST_AUDIT"
echo "ResourceSpace import audit copied: $HOST_AUDIT"
