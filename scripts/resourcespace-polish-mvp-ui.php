<?php

include "/var/www/html/include/boot.php";
command_line_only();

$collection_name = $argv[1] ?? "MVP 2024 - First Batch";
$audit_path = $argv[2] ?? "/tmp/tjc-mvp-ui-polish.csv";
$derivative_name = "JPG derivative for preview/use";

function field_ref_or_zero(string $shortname): int
{
    return (int) ps_value(
        "SELECT ref value FROM resource_type_field WHERE name = ?",
        ["s", $shortname],
        0,
        "schema"
    );
}

function csv_row($handle, array $row): void
{
    fputcsv($handle, $row);
    fflush($handle);
}

$collection = (int) ps_value(
    "SELECT ref value FROM collection WHERE name = ? ORDER BY ref LIMIT 1",
    ["s", $collection_name],
    0
);

if ($collection <= 0) {
    fwrite(STDERR, "FAIL: collection not found: {$collection_name}\n");
    exit(1);
}

$sample_resource = (int) ps_value(
    "SELECT resource value FROM collection_resource WHERE collection = ? ORDER BY resource LIMIT 1",
    ["i", $collection],
    0
);

ps_query(
    "UPDATE collection
        SET public = 1,
            allow_changes = 1,
            home_page_publish = 1,
            home_page_text = ?,
            description = ?,
            bg_img_resource_ref = ?
      WHERE ref = ?",
    [
        "s", "Approved first batch for TJC stock media prototype. Use this collection to demo search, preview, HEIC handling, metadata, and approved downloads.",
        "s", "MVP 2024 first batch imported from lm.photo@tjc.org. Originals preserved; ResourceSpace provides search, tags, review metadata, and user-friendly previews.",
        "i", $sample_resource,
        "i", $collection,
    ]
);

$derivative_status_field = field_ref_or_zero("derivative_status");
$approval_notes_field = field_ref_or_zero("approval_notes");

$handle = fopen($audit_path, "w");
csv_row($handle, [
    "resource_id",
    "alternative_id",
    "main_previews_written",
    "status",
    "error",
]);

$heic_rows = ps_query(
    "SELECT r.ref
       FROM resource r
       JOIN collection_resource cr ON cr.resource = r.ref
      WHERE cr.collection = ?
        AND r.file_extension = ?
      ORDER BY r.ref",
    ["i", $collection, "s", "heic"]
);

$updated = 0;
$failed = 0;
foreach ($heic_rows as $row) {
    $ref = (int) $row["ref"];
    $alt = (int) ps_value(
        "SELECT ref value FROM resource_alt_files WHERE resource = ? AND name = ? ORDER BY ref LIMIT 1",
        ["i", $ref, "s", $derivative_name],
        0
    );
    $written = [];
    $status = "updated";
    $error = "";

    try {
        if ($alt <= 0) {
            $status = "skipped";
            $error = "no derivative alternative file";
        } else {
            foreach (["pre", "thm", "col", "scr"] as $size) {
                $alt_path = get_resource_path($ref, true, $size, false, "jpg", -1, 1, false, "", $alt);
                $main_path = get_resource_path($ref, true, $size, true, "jpg");
                if (!file_exists($alt_path)) {
                    throw new Exception("missing alternative preview: {$size}");
                }
                if (!copy($alt_path, $main_path)) {
                    throw new Exception("copy failed for preview size: {$size}");
                }
                $written[] = $size;
            }

            ps_query(
                "UPDATE resource SET has_image = ?, preview_extension = ?, modified = NOW() WHERE ref = ?",
                ["i", 1, "s", "jpg", "i", $ref]
            );

            if ($derivative_status_field > 0) {
                update_field(
                    $ref,
                    $derivative_status_field,
                    "Original HEIC preserved. JPG derivative promoted to front preview thumbnails on " . date("Y-m-d") . ". Users see JPG preview first; original HEIC remains downloadable as master."
                );
            }

            if ($approval_notes_field > 0) {
                $notes = (string) get_data_by_field($ref, $approval_notes_field);
                $marker = "HEIC front preview";
                if (strpos($notes, $marker) === false) {
                    update_field(
                        $ref,
                        $approval_notes_field,
                        trim($notes . "\n" . $marker . ": JPG derivative is used for ResourceSpace thumbnail/preview; original HEIC remains the master file.")
                    );
                }
            }

            $updated++;
        }
    } catch (Throwable $e) {
        $status = "failed";
        $error = $e->getMessage();
        $failed++;
    }

    csv_row($handle, [$ref, $alt, implode("|", $written), $status, $error]);
}

fclose($handle);

echo "Featured collection: {$collection_name} ({$collection})\n";
echo "Homepage sample resource: {$sample_resource}\n";
echo "HEIC front previews updated: {$updated}\n";
echo "HEIC front preview failures: {$failed}\n";
echo "Audit: {$audit_path}\n";

exit($failed > 0 ? 2 : 0);
