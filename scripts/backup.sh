#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "FAIL: .env missing"
  exit 1
fi

set -a
source .env
set +a

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$ROOT/.runtime/backups/$STAMP"
mkdir -p "$BACKUP_DIR"

if docker compose ps --status running | grep -q 'tjc-resourcespace-db'; then
  docker compose exec -T mariadb mariadb-dump \
    -u"${MYSQL_USER}" "-p${MYSQL_PASSWORD}" "${MYSQL_DATABASE}" > "$BACKUP_DIR/database.sql"
else
  echo "WARN: MariaDB is not running; database dump skipped." > "$BACKUP_DIR/database.sql.SKIPPED"
fi

tar -czf "$BACKUP_DIR/filestore-config.tgz" -C "$ROOT/.runtime" filestore resourcespace-config.php

echo "Backup written: $BACKUP_DIR"

