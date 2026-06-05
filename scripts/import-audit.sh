#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="${1:-/Users/halim4pro/Desktop/MVP/Stock Media/01_Source Exports/MVP 2024}"
BATCH="${IMPORT_BATCH:-MVP 2024 First Batch}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="$ROOT/.runtime/audits"
MANIFEST="$OUT_DIR/mvp-2024-manifest-$STAMP.csv"
SUMMARY="$OUT_DIR/mvp-2024-summary-$STAMP.md"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "FAIL: source directory not found: $SOURCE_DIR"
  exit 1
fi

mkdir -p "$OUT_DIR"

printf 'canonical_asset_id,original_filename,extension,size_bytes,checksum_sha256,source_path,import_batch\n' > "$MANIFEST"

while IFS= read -r -d '' file; do
  filename="$(basename "$file")"
  extension="${filename##*.}"
  extension="$(printf '%s' "$extension" | tr '[:upper:]' '[:lower:]')"
  size_bytes="$(stat -f%z "$file")"
  checksum="$(shasum -a 256 "$file" | awk '{print $1}')"
  canonical="tjc-${checksum:0:16}"
  python3 - "$canonical" "$filename" "$extension" "$size_bytes" "$checksum" "$file" "$BATCH" <<'PY' >> "$MANIFEST"
import csv, sys
csv.writer(sys.stdout).writerow(sys.argv[1:])
PY
done < <(find "$SOURCE_DIR" -maxdepth 1 -type f -print0 | sort -z)

{
  echo "# Import Audit Summary"
  echo
  echo "- Source: \`$SOURCE_DIR\`"
  echo "- Batch: \`$BATCH\`"
  echo "- Manifest: \`$MANIFEST\`"
  echo "- Generated: $(date)"
  echo
  echo "## Count By Extension"
  echo
  find "$SOURCE_DIR" -maxdepth 1 -type f | sed 's/.*\\.//' | tr '[:upper:]' '[:lower:]' | sort | uniq -c | sort -nr | awk '{print "- " $2 ": " $1}'
  echo
  echo "## Total"
  echo
  echo "- Files: $(find "$SOURCE_DIR" -maxdepth 1 -type f | wc -l | tr -d ' ')"
  echo "- Size: $(du -sh "$SOURCE_DIR" | awk '{print $1}')"
  echo
  echo "## HEIC Check"
  echo
  echo "HEIC files must be verified in ResourceSpace preview generation. If preview fails, keep originals and create derivative JPG copies only."
} > "$SUMMARY"

echo "Manifest written: $MANIFEST"
echo "Summary written: $SUMMARY"

