<?php

include_once "/var/www/html/include/boot.php";
include_once "/var/www/html/include/image_processing.php";
include_once "/var/www/html/include/collections_functions.php";

command_line_only();

$source_dir = $argv[1] ?? "/tmp/tjc-import-mvp-2024";
$audit_path = $argv[2] ?? "/tmp/tjc-import-audit.csv";
$batch = $argv[3] ?? "MVP 2024 First Batch";
$collection_name = $argv[4] ?? "MVP 2024 - First Batch";

if (!is_dir($source_dir)) {
    fwrite(STDERR, "FAIL: source directory not found: {$source_dir}\n");
    exit(1);
}

$userref = 1;
$valid_upload_paths[] = $source_dir;

function ensure_mvp_field(string $title, string $shortname, int $type = FIELD_TYPE_TEXT_BOX_SINGLE_LINE, bool $index = true): int
{
    $existing = ps_value("SELECT ref value FROM resource_type_field WHERE name = ?", ["s", $shortname], 0, "schema");
    if ((int)$existing > 0) {
        return (int)$existing;
    }

    $created = create_resource_type_field($title, 0, $type, $shortname, $index);
    if (!is_int($created)) {
        fwrite(STDERR, "FAIL: could not create metadata field {$title}\n");
        exit(1);
    }

    return $created;
}

function infer_resource_type(string $extension): int
{
    $extension = strtolower($extension);
    $photo = ["jpg", "jpeg", "png", "heic", "gif", "webp", "tif", "tiff"];
    $video = ["mp4", "mov", "m4v", "avi", "mkv"];
    $audio = ["mp3", "m4a", "wav", "aac", "aiff", "flac"];

    if (in_array($extension, $photo, true)) {
        return 1;
    }
    if (in_array($extension, $video, true)) {
        return 3;
    }
    if (in_array($extension, $audio, true)) {
        return 4;
    }
    return 2;
}

function csv_row($handle, array $row): void
{
    fputcsv($handle, $row);
    fflush($handle);
}

$fields = [
    "canonical_asset_id" => ensure_mvp_field("Canonical Asset ID", "canonical_asset_id"),
    "checksum_sha256" => ensure_mvp_field("Checksum SHA256", "checksum_sha256"),
    "source_system" => ensure_mvp_field("Source System", "source_system"),
    "source_account" => ensure_mvp_field("Source Account", "source_account"),
    "source_path" => ensure_mvp_field("Source Path", "source_path", FIELD_TYPE_TEXT_BOX_MULTI_LINE),
    "import_batch" => ensure_mvp_field("Import Batch", "import_batch"),
    "rights_status" => ensure_mvp_field("Rights Status", "rights_status"),
    "public_safe" => ensure_mvp_field("Public Safe", "public_safe"),
    "usage_scope" => ensure_mvp_field("Usage Scope", "usage_scope"),
    "visible_content_tags" => ensure_mvp_field("Visible Content Tags", "visible_content_tags", FIELD_TYPE_TEXT_BOX_MULTI_LINE),
    "tjc_terms" => ensure_mvp_field("TJC Terms", "tjc_terms", FIELD_TYPE_TEXT_BOX_MULTI_LINE),
    "people_visible" => ensure_mvp_field("People Visible", "people_visible"),
    "children_visible" => ensure_mvp_field("Children Visible", "children_visible"),
    "consent_status" => ensure_mvp_field("Consent Status", "consent_status"),
    "reviewed_by" => ensure_mvp_field("Reviewed By", "reviewed_by"),
    "reviewed_date" => ensure_mvp_field("Reviewed Date", "reviewed_date", FIELD_TYPE_DATE),
    "approval_notes" => ensure_mvp_field("Approval Notes", "approval_notes", FIELD_TYPE_TEXT_BOX_MULTI_LINE),
    "expiration_or_recheck_date" => ensure_mvp_field("Expiration or Recheck Date", "expiration_or_recheck_date", FIELD_TYPE_DATE),
];

$collection = (int) ps_value(
    "SELECT ref value FROM collection WHERE name = ? AND user = ? ORDER BY ref LIMIT 1",
    ["s", $collection_name, "i", $userref],
    0
);
if ($collection === 0) {
    $collection = create_collection($userref, $collection_name, 1);
}

$audit = fopen($audit_path, "w");
csv_row($audit, [
    "canonical_asset_id",
    "resource_id",
    "original_filename",
    "extension",
    "size_bytes",
    "checksum_sha256",
    "resource_type",
    "archive_state",
    "collection_id",
    "status",
    "error",
]);

$files = [];
$iterator = new DirectoryIterator($source_dir);
foreach ($iterator as $fileinfo) {
    if ($fileinfo->isFile()) {
        $files[] = $fileinfo->getPathname();
    }
}
sort($files, SORT_NATURAL | SORT_FLAG_CASE);

$imported = 0;
$failed = 0;
foreach ($files as $path) {
    $filename = basename($path);
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $sha256 = hash_file("sha256", $path);
    $canonical = "tjc-" . substr($sha256, 0, 16);
    $size = filesize($path);
    $resource_type = infer_resource_type($extension);
    $ref = 0;
    $status = "imported";
    $error = "";

    try {
        $ref = create_resource($resource_type, -1, $userref, "TJC MVP batch import", $extension, false);
        if (!is_int($ref)) {
            throw new Exception("create_resource failed");
        }

        $resource_path = get_resource_path($ref, true, "", true, $extension);
        if (!copy($path, $resource_path)) {
            throw new Exception("copy to ResourceSpace filestore failed");
        }
        $file_size = filesize($resource_path);
        $md5 = md5_file($resource_path);
        ps_query(
            "UPDATE resource SET file_size=?, file_extension=?, preview_extension='jpg', file_modified=NOW(), no_file=0, file_checksum=?, integrity_fail=0, has_image=? WHERE ref=?",
            ["i", $file_size, "s", $extension, "s", $md5, "i", RESOURCE_PREVIEWS_NONE, "i", $ref]
        );

        try {
            create_previews($ref, false, $extension);
        } catch (Throwable $preview_error) {
            $error = "preview warning: " . $preview_error->getMessage();
        }

        update_field($ref, 8, pathinfo($filename, PATHINFO_FILENAME));
        update_field($ref, 51, $filename);
        update_field($ref, 54, $path);
        update_field($ref, 25, "Imported for TJC stock media DAM prototype. Default state: Needs Review / Do Not Publish.");

        update_field($ref, $fields["canonical_asset_id"], $canonical);
        update_field($ref, $fields["checksum_sha256"], $sha256);
        update_field($ref, $fields["source_system"], "LM Photos / local MVP 2024 batch");
        update_field($ref, $fields["source_account"], "lm.photo@tjc.org");
        update_field($ref, $fields["source_path"], $path);
        update_field($ref, $fields["import_batch"], $batch);
        update_field($ref, $fields["rights_status"], "Needs Review");
        update_field($ref, $fields["public_safe"], "Unknown");
        update_field($ref, $fields["usage_scope"], "Do Not Publish");
        update_field($ref, $fields["people_visible"], "Unknown");
        update_field($ref, $fields["children_visible"], "Unknown");
        update_field($ref, $fields["consent_status"], "Unknown");
        update_field($ref, $fields["approval_notes"], "Default import state. Human rights review required before use.");

        add_resource_to_collection($ref, $collection, false, "", "", true);
        $imported++;
    } catch (Throwable $e) {
        $status = "failed";
        $error = $e->getMessage();
        $failed++;
    }

    csv_row($audit, [
        $canonical,
        $ref,
        $filename,
        $extension,
        $size,
        $sha256,
        $resource_type,
        -1,
        $collection,
        $status,
        $error,
    ]);
}

fclose($audit);

echo "Collection: {$collection_name} ({$collection})\n";
echo "Imported: {$imported}\n";
echo "Failed: {$failed}\n";
echo "Audit: {$audit_path}\n";

exit($failed > 0 ? 2 : 0);
