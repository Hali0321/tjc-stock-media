<?php

include "/var/www/html/include/boot.php";
command_line_only();

$out = $argv[1] ?? "/tmp/tjc-mvp-metadata-export.csv";
$fields = [
    "original_filename" => 51,
    "title" => 8,
    "source" => 54,
    "notes" => 25,
    "canonical_asset_id" => "canonical_asset_id",
    "checksum_sha256" => "checksum_sha256",
    "source_system" => "source_system",
    "source_account" => "source_account",
    "source_path" => "source_path",
    "import_batch" => "import_batch",
    "rights_status" => "rights_status",
    "public_safe" => "public_safe",
    "usage_scope" => "usage_scope",
    "visible_content_tags" => "visible_content_tags",
    "tjc_terms" => "tjc_terms",
    "people_visible" => "people_visible",
    "children_visible" => "children_visible",
    "consent_status" => "consent_status",
    "reviewed_by" => "reviewed_by",
    "reviewed_date" => "reviewed_date",
    "approval_notes" => "approval_notes",
];

foreach ($fields as $name => $ref_or_shortname) {
    if (!is_int($ref_or_shortname)) {
        $fields[$name] = (int) ps_value(
            "SELECT ref value FROM resource_type_field WHERE name = ?",
            ["s", $ref_or_shortname],
            0,
            "schema"
        );
    }
}

$handle = fopen($out, "w");
$header = array_merge([
    "resource_id",
    "archive_state",
    "resource_type",
    "file_extension",
    "file_size",
], array_keys($fields));
fputcsv($handle, $header);

$rows = ps_query("SELECT ref, archive, resource_type, file_extension, file_size FROM resource WHERE ref >= 363 AND archive IN (-1,0) ORDER BY ref");
foreach ($rows as $row) {
    $ref = (int) $row["ref"];
    $line = [
        $ref,
        $row["archive"],
        $row["resource_type"],
        $row["file_extension"],
        $row["file_size"],
    ];
    foreach ($fields as $field_ref) {
        $line[] = $field_ref > 0 ? get_data_by_field($ref, $field_ref) : "";
    }
    fputcsv($handle, $line);
}

fclose($handle);
echo "Metadata export written: {$out}\n";
