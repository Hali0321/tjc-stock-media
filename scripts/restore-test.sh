#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUPS="$ROOT/.runtime/backups"

latest="$(find "$BACKUPS" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort | tail -1 || true)"
if [ -z "$latest" ]; then
  echo "FAIL: no backup found under $BACKUPS"
  exit 1
fi

tmp="$(mktemp -d /tmp/tjc-rs-restore-test-XXXXXX)"
trap 'rm -rf "$tmp"' EXIT

tar -tzf "$latest/filestore-config.tgz" >/dev/null
tar -xzf "$latest/filestore-config.tgz" -C "$tmp"

if [ -f "$latest/database.sql" ]; then
  test -s "$latest/database.sql"
  echo "Database dump: OK"
else
  echo "WARN: database dump not present in latest backup"
fi

test -d "$tmp/filestore"
test -f "$tmp/resourcespace-config.php"

echo "Non-destructive restore test passed for: $latest"

