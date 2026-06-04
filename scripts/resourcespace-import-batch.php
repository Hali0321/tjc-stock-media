<?php

include_once "/var/www/html/include/boot.php";
include_once "/var/www/html/include/image_processing.php";
include_once "/var/www/html/include/collections_functions.php";

command_line_only();

$source_dir = $argv[1] ?? "/tmp/tjc-import-mvp-2024";
$audit_path = $argv[2] ?? "/tmp/tjc-import-audit.csv";
$batch = $argv[3] ?? "MVP 2024 First Batch";
$collection_name = $argv[4] ?? "MVP 2024 - First Batch";
$run_collection_name = $argv[5] ?? "";
$source_system = $argv[6] ?? "LM Photos / local MVP 2024 batch";
$source_account = $argv[7] ?? "lm.photo@tjc.org";
$source_album = $argv[8] ?? basename($source_dir);
$staging_manifest_path = $argv[9] ?? "";

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
    $photo = ["jpg", "jpeg", "png", "heic", "heif", "gif", "webp", "tif", "tiff", "arw"];
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

function infer_media_type(string $extension): string
{
    $extension = strtolower($extension);
    if (in_array($extension, ["jpg", "jpeg", "png", "heic", "heif", "gif", "webp", "tif", "tiff", "arw"], true)) {
        return "Photo";
    }
    if (in_array($extension, ["mp4", "mov", "m4v", "avi", "mkv"], true)) {
        return "Video";
    }
    if (in_array($extension, ["mp3", "m4a", "wav", "aac", "aiff", "flac"], true)) {
        return "Audio";
    }
    return "Other";
}

function supported_media_extension(string $extension): bool
{
    return in_array(strtolower($extension), [
        "jpg", "jpeg", "png", "heic", "heif", "gif", "webp", "tif", "tiff", "arw",
        "mp4", "mov", "m4v", "avi", "mkv",
        "mp3", "m4a", "wav", "aac", "aiff", "flac",
    ], true);
}

function csv_row($handle, array $row): void
{
    fputcsv($handle, $row);
    fflush($handle);
}

function append_unique_csv_value(string $current, string $value): string
{
    if (trim($value) === "") {
        return $current;
    }
    $parts = array_filter(array_map("trim", explode(";", $current)));
    if (!in_array($value, $parts, true)) {
        $parts[] = $value;
    }
    return implode("; ", $parts);
}

function read_staging_manifest(string $path): array
{
    if (trim($path) === "" || !is_file($path)) {
        return [];
    }

    $rows_by_checksum = [];
    $handle = fopen($path, "r");
    $header = fgetcsv($handle);
    if (!is_array($header)) {
        fclose($handle);
        return [];
    }

    while (($values = fgetcsv($handle)) !== false) {
        $row = [];
        foreach ($header as $index => $column) {
            $row[$column] = $values[$index] ?? "";
        }
        $checksum = trim((string) ($row["checksum_sha256"] ?? ""));
        if ($checksum !== "") {
            $rows_by_checksum[$checksum] = $row;
        }
    }
    fclose($handle);
    return $rows_by_checksum;
}

function read_basic_technical_metadata(string $path, string $extension): array
{
    $metadata = [
        "captured_date" => "",
        "captured_date_source" => "",
        "camera_make" => "",
        "camera_model" => "",
        "image_dimensions" => "",
        "file_format" => strtoupper($extension),
    ];

    $size = @getimagesize($path);
    if (is_array($size) && isset($size[0], $size[1])) {
        $metadata["image_dimensions"] = $size[0] . "x" . $size[1];
    }

    // ResourceSpace installs a strict error handler; malformed EXIF can abort
    // imports. Capture date/device is safer as a later metadata pass.

    return $metadata;
}

$fields = [
    "canonical_asset_id" => ensure_mvp_field("Canonical Asset ID", "canonical_asset_id"),
    "checksum_sha256" => ensure_mvp_field("Checksum SHA256", "checksum_sha256"),
    "source_platform" => ensure_mvp_field("Source Platform", "source_platform"),
    "source_system" => ensure_mvp_field("Source System", "source_system"),
    "source_account" => ensure_mvp_field("Source Account", "source_account"),
    "source_album" => ensure_mvp_field("Source Album", "source_album"),
    "source_album_path" => ensure_mvp_field("Source Album Path", "source_album_path", FIELD_TYPE_TEXT_BOX_MULTI_LINE),
    "source_album_memberships" => ensure_mvp_field("Source Album Memberships", "source_album_memberships", FIELD_TYPE_TEXT_BOX_MULTI_LINE),
    "source_path" => ensure_mvp_field("Source Path", "source_path", FIELD_TYPE_TEXT_BOX_MULTI_LINE),
    "source_paths_all" => ensure_mvp_field("Source Paths All", "source_paths_all", FIELD_TYPE_TEXT_BOX_MULTI_LINE),
    "original_filename" => ensure_mvp_field("Original Filename", "original_filename"),
    "original_extension" => ensure_mvp_field("Original Extension", "original_extension"),
    "original_file_size_bytes" => ensure_mvp_field("Original File Size Bytes", "original_file_size_bytes"),
    "import_batch" => ensure_mvp_field("Import Batch", "import_batch"),
    "import_manifest_row_id" => ensure_mvp_field("Import Manifest Row ID", "import_manifest_row_id"),
    "resourcespace_ref" => ensure_mvp_field("ResourceSpace Ref", "resourcespace_ref"),
    "quality_status" => ensure_mvp_field("Quality Status", "quality_status"),
    "technical_quality" => ensure_mvp_field("Technical Quality", "technical_quality"),
    "rights_status" => ensure_mvp_field("Rights Status", "rights_status"),
    "publish_status" => ensure_mvp_field("Publish Status", "publish_status"),
    "workflow_state" => ensure_mvp_field("Workflow State", "workflow_state"),
    "public_safe" => ensure_mvp_field("Public Safe", "public_safe"),
    "usage_scope" => ensure_mvp_field("Usage Scope", "usage_scope"),
    "media_type" => ensure_mvp_field("Media Type", "media_type"),
    "event_or_topic" => ensure_mvp_field("Event or Topic", "event_or_topic"),
    "ministry_area" => ensure_mvp_field("Ministry Area", "ministry_area"),
    "season" => ensure_mvp_field("Season", "season"),
    "location_context" => ensure_mvp_field("Location Context", "location_context"),
    "emotional_tone" => ensure_mvp_field("Emotional Tone", "emotional_tone"),
    "hero_candidate" => ensure_mvp_field("Hero Candidate", "hero_candidate"),
    "reusability_score" => ensure_mvp_field("Reusability Score", "reusability_score"),
    "visible_content_tags" => ensure_mvp_field("Visible Content Tags", "visible_content_tags", FIELD_TYPE_TEXT_BOX_MULTI_LINE),
    "tjc_terms" => ensure_mvp_field("TJC Terms", "tjc_terms", FIELD_TYPE_TEXT_BOX_MULTI_LINE),
    "brand_terms" => ensure_mvp_field("Brand Terms", "brand_terms", FIELD_TYPE_TEXT_BOX_MULTI_LINE),
    "usage_terms" => ensure_mvp_field("Usage Terms", "usage_terms", FIELD_TYPE_TEXT_BOX_MULTI_LINE),
    "human_title_final" => ensure_mvp_field("Human Title Final", "human_title_final", FIELD_TYPE_TEXT_BOX_MULTI_LINE),
    "human_tags_final" => ensure_mvp_field("Human Tags Final", "human_tags_final", FIELD_TYPE_TEXT_BOX_MULTI_LINE),
    "people_visible" => ensure_mvp_field("People Visible", "people_visible"),
    "children_visible" => ensure_mvp_field("Children Visible", "children_visible"),
    "minors_visible" => ensure_mvp_field("Minors Visible", "minors_visible"),
    "sensitive_context" => ensure_mvp_field("Sensitive Context", "sensitive_context"),
    "consent_status" => ensure_mvp_field("Consent Status", "consent_status"),
    "reviewed_by" => ensure_mvp_field("Reviewed By", "reviewed_by"),
    "reviewed_date" => ensure_mvp_field("Reviewed Date", "reviewed_date", FIELD_TYPE_DATE),
    "approval_notes" => ensure_mvp_field("Approval Notes", "approval_notes", FIELD_TYPE_TEXT_BOX_MULTI_LINE),
    "expiration_or_recheck_date" => ensure_mvp_field("Expiration or Recheck Date", "expiration_or_recheck_date", FIELD_TYPE_DATE),
    "master_drive_path" => ensure_mvp_field("Master Drive Path", "master_drive_path", FIELD_TYPE_TEXT_BOX_MULTI_LINE),
    "master_drive_paths_all" => ensure_mvp_field("Master Drive Paths All", "master_drive_paths_all", FIELD_TYPE_TEXT_BOX_MULTI_LINE),
    "duplicate_group" => ensure_mvp_field("Duplicate Group", "duplicate_group"),
    "duplicate_role" => ensure_mvp_field("Duplicate Role", "duplicate_role"),
    "captured_date" => ensure_mvp_field("Captured Date", "captured_date"),
    "captured_date_source" => ensure_mvp_field("Captured Date Source", "captured_date_source"),
    "camera_make" => ensure_mvp_field("Camera Make", "camera_make"),
    "camera_model" => ensure_mvp_field("Camera Model", "camera_model"),
    "image_dimensions" => ensure_mvp_field("Image Dimensions", "image_dimensions"),
    "file_format" => ensure_mvp_field("File Format", "file_format"),
    "original_format" => ensure_mvp_field("Original Format", "original_format"),
    "preview_format" => ensure_mvp_field("Preview Format", "preview_format"),
    "conversion_needed" => ensure_mvp_field("Conversion Needed", "conversion_needed"),
    "conversion_status" => ensure_mvp_field("Conversion Status", "conversion_status"),
    "derivative_path" => ensure_mvp_field("Derivative Path", "derivative_path", FIELD_TYPE_TEXT_BOX_MULTI_LINE),
    "original_preserved" => ensure_mvp_field("Original Preserved", "original_preserved"),
    "ai_provider" => ensure_mvp_field("AI Provider", "ai_provider"),
    "ai_model" => ensure_mvp_field("AI Model", "ai_model"),
    "ai_prompt_version" => ensure_mvp_field("AI Prompt Version", "ai_prompt_version"),
    "ai_run_id" => ensure_mvp_field("AI Run ID", "ai_run_id"),
    "ai_cost_estimate" => ensure_mvp_field("AI Cost Estimate", "ai_cost_estimate"),
    "ai_title_suggestion" => ensure_mvp_field("AI Title Suggestion", "ai_title_suggestion", FIELD_TYPE_TEXT_BOX_MULTI_LINE),
    "ai_visible_tag_suggestions" => ensure_mvp_field("AI Visible Tag Suggestions", "ai_visible_tag_suggestions", FIELD_TYPE_TEXT_BOX_MULTI_LINE),
    "ai_tjc_term_suggestions" => ensure_mvp_field("AI TJC Term Suggestions", "ai_tjc_term_suggestions", FIELD_TYPE_TEXT_BOX_MULTI_LINE),
    "ai_quality_suggestion" => ensure_mvp_field("AI Quality Suggestion", "ai_quality_suggestion"),
    "ai_people_or_minor_flag" => ensure_mvp_field("AI People or Minor Flag", "ai_people_or_minor_flag"),
    "human_ai_decision" => ensure_mvp_field("Human AI Decision", "human_ai_decision"),
];

function ensure_collection(int $userref, string $name): int
{
    $collection = (int) ps_value(
        "SELECT ref value FROM collection WHERE name = ? AND user = ? ORDER BY ref LIMIT 1",
        ["s", $name, "i", $userref],
        0
    );
    if ($collection === 0) {
        $collection = create_collection($userref, $name, 1);
    }
    return $collection;
}

$collection = ensure_collection($userref, $collection_name);
$run_collection = trim($run_collection_name) !== "" ? ensure_collection($userref, $run_collection_name) : 0;
$staging_rows_by_checksum = read_staging_manifest($staging_manifest_path);

$checksum_to_resource = [];
$existing_resources = ps_query("SELECT ref FROM resource WHERE archive IN (-2,-1,0,1,2,3) ORDER BY ref");
foreach ($existing_resources as $existing) {
    $existing_ref = (int) $existing["ref"];
    $existing_checksum = trim((string) get_data_by_field($existing_ref, $fields["checksum_sha256"]));
    if ($existing_checksum !== "" && !isset($checksum_to_resource[$existing_checksum])) {
        $checksum_to_resource[$existing_checksum] = $existing_ref;
    }
}

$audit = fopen($audit_path, "w");
csv_row($audit, [
    "canonical_asset_id",
    "resource_id",
    "original_filename",
    "source_album",
    "source_path",
    "master_drive_path",
    "extension",
    "size_bytes",
    "checksum_sha256",
    "resource_type",
    "archive_state",
    "collection_id",
    "run_collection_id",
    "status",
    "error",
]);

$files = [];
$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($source_dir, FilesystemIterator::SKIP_DOTS)
);
foreach ($iterator as $fileinfo) {
    if ($fileinfo->isFile()) {
        $extension = strtolower(pathinfo($fileinfo->getFilename(), PATHINFO_EXTENSION));
        if (supported_media_extension($extension)) {
            $files[] = $fileinfo->getPathname();
        }
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
    $manifest_row = $staging_rows_by_checksum[$sha256] ?? [];
    $manifest_source_album = trim((string) ($manifest_row["source_album"] ?? $source_album));
    $manifest_source_album_path = trim((string) ($manifest_row["source_album_path"] ?? $source_dir));
    $manifest_relative_path = trim((string) ($manifest_row["relative_path"] ?? $filename));
    $source_path_for_metadata = $manifest_source_album_path !== ""
        ? rtrim($manifest_source_album_path, "/") . "/" . $manifest_relative_path
        : $path;
    $master_drive_path = trim((string) ($manifest_row["master_drive_path"] ?? ""));
    $import_manifest_row_id = trim((string) ($manifest_row["import_manifest_row_id"] ?? ""));
    $technical_metadata = read_basic_technical_metadata($path, $extension);
    $resource_type = infer_resource_type($extension);
    $media_type = infer_media_type($extension);
    $ref = 0;
    $status = "imported";
    $error = "";

    try {
        if (isset($checksum_to_resource[$sha256])) {
            $ref = $checksum_to_resource[$sha256];
            $status = "exact_duplicate_linked";

            add_resource_to_collection($ref, $collection, false, "", "", true);
            if ($run_collection > 0) {
                add_resource_to_collection($ref, $run_collection, false, "", "", true);
            }

            update_field($ref, $fields["source_album_memberships"], append_unique_csv_value((string) get_data_by_field($ref, $fields["source_album_memberships"]), $manifest_source_album));
            update_field($ref, $fields["source_paths_all"], append_unique_csv_value((string) get_data_by_field($ref, $fields["source_paths_all"]), $source_path_for_metadata));
            update_field($ref, $fields["master_drive_paths_all"], append_unique_csv_value((string) get_data_by_field($ref, $fields["master_drive_paths_all"]), $master_drive_path));
            update_field($ref, $fields["duplicate_group"], $canonical);
            $existing_role = trim((string) get_data_by_field($ref, $fields["duplicate_role"]));
            update_field($ref, $fields["duplicate_role"], $existing_role === "" ? "canonical" : $existing_role);
            update_field($ref, $fields["resourcespace_ref"], (string) $ref);

            csv_row($audit, [
                $canonical,
                $ref,
                $filename,
                $manifest_source_album,
                $source_path_for_metadata,
                $master_drive_path,
                $extension,
                $size,
                $sha256,
                $resource_type,
                "existing",
                $collection,
                $run_collection,
                $status,
                $error,
            ]);
            continue;
        }

        $ref = create_resource($resource_type, -1, $userref, "TJC stock media batch import", $extension, false);
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
        update_field($ref, 54, $source_path_for_metadata);
        update_field($ref, 25, "Imported for TJC stock media DAM prototype. Default state: Needs Review / Do Not Publish.");

        update_field($ref, $fields["canonical_asset_id"], $canonical);
        update_field($ref, $fields["checksum_sha256"], $sha256);
        update_field($ref, $fields["source_platform"], "Google Photos");
        update_field($ref, $fields["source_system"], $source_system);
        update_field($ref, $fields["source_account"], $source_account);
        update_field($ref, $fields["source_album"], $manifest_source_album);
        update_field($ref, $fields["source_album_path"], $manifest_source_album_path);
        update_field($ref, $fields["source_album_memberships"], $manifest_source_album);
        update_field($ref, $fields["source_path"], $source_path_for_metadata);
        update_field($ref, $fields["source_paths_all"], $source_path_for_metadata);
        update_field($ref, $fields["original_filename"], $filename);
        update_field($ref, $fields["original_extension"], $extension);
        update_field($ref, $fields["original_file_size_bytes"], (string) $size);
        update_field($ref, $fields["import_batch"], $batch);
        update_field($ref, $fields["import_manifest_row_id"], $import_manifest_row_id);
        update_field($ref, $fields["resourcespace_ref"], (string) $ref);
        update_field($ref, $fields["quality_status"], "Unreviewed");
        update_field($ref, $fields["technical_quality"], "Unreviewed");
        update_field($ref, $fields["rights_status"], "Unknown");
        update_field($ref, $fields["publish_status"], "Needs Review");
        update_field($ref, $fields["workflow_state"], "Intake");
        update_field($ref, $fields["public_safe"], "Unknown");
        update_field($ref, $fields["usage_scope"], "Do Not Publish");
        update_field($ref, $fields["media_type"], $media_type);
        update_field($ref, $fields["people_visible"], "Unknown");
        update_field($ref, $fields["children_visible"], "Unknown");
        update_field($ref, $fields["minors_visible"], "Unknown");
        update_field($ref, $fields["sensitive_context"], "Unknown");
        update_field($ref, $fields["consent_status"], "Unknown");
        update_field($ref, $fields["approval_notes"], "Default import state. Human rights review required before use.");
        update_field($ref, $fields["master_drive_path"], $master_drive_path);
        update_field($ref, $fields["master_drive_paths_all"], $master_drive_path);
        update_field($ref, $fields["duplicate_group"], $canonical);
        update_field($ref, $fields["duplicate_role"], "canonical");
        update_field($ref, $fields["captured_date"], $technical_metadata["captured_date"]);
        update_field($ref, $fields["captured_date_source"], $technical_metadata["captured_date_source"]);
        update_field($ref, $fields["camera_make"], $technical_metadata["camera_make"]);
        update_field($ref, $fields["camera_model"], $technical_metadata["camera_model"]);
        update_field($ref, $fields["image_dimensions"], $technical_metadata["image_dimensions"]);
        update_field($ref, $fields["file_format"], $technical_metadata["file_format"]);
        update_field($ref, $fields["original_format"], strtoupper($extension));
        update_field($ref, $fields["preview_format"], "ResourceSpace generated preview when supported");
        update_field($ref, $fields["conversion_needed"], in_array($extension, ["heic", "heif", "arw"], true) ? "Unknown - verify preview" : "No");
        update_field($ref, $fields["conversion_status"], "Not evaluated");
        update_field($ref, $fields["original_preserved"], "Yes");

        add_resource_to_collection($ref, $collection, false, "", "", true);
        if ($run_collection > 0) {
            add_resource_to_collection($ref, $run_collection, false, "", "", true);
        }
        $checksum_to_resource[$sha256] = $ref;
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
        $manifest_source_album,
        $source_path_for_metadata,
        $master_drive_path,
        $extension,
        $size,
        $sha256,
        $resource_type,
        -1,
        $collection,
        $run_collection,
        $status,
        $error,
    ]);
}

fclose($audit);

echo "Collection: {$collection_name} ({$collection})\n";
if ($run_collection > 0) {
    echo "Run collection: {$run_collection_name} ({$run_collection})\n";
}
echo "Imported: {$imported}\n";
echo "Failed: {$failed}\n";
echo "Audit: {$audit_path}\n";

exit($failed > 0 ? 2 : 0);
