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

tar -tzf "$latest/filestore-config.tgz" > "$tmp/archive-list.txt"
grep -q '^filestore/' "$tmp/archive-list.txt"
grep -q '^resourcespace-config.php$' "$tmp/archive-list.txt"
tar -xzf "$latest/filestore-config.tgz" -C "$tmp" resourcespace-config.php

if [ -f "$latest/database.sql" ]; then
  test -s "$latest/database.sql"
  echo "Database dump: OK"
else
  echo "WARN: database dump not present in latest backup"
fi

test -f "$tmp/resourcespace-config.php"

date > "$latest/restore-test-passed.txt"
echo "Non-destructive restore test passed for: $latest"
