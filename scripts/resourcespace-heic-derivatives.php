<?php

include_once "/var/www/html/include/boot.php";
include_once "/var/www/html/include/resource_functions.php";
include_once "/var/www/html/include/image_processing.php";

command_line_only();

$mode = $argv[1] ?? "plan";
$derivative_name = "JPG derivative for preview/use";

function ensure_mvp_field(string $title, string $shortname, int $type = FIELD_TYPE_TEXT_BOX_MULTI_LINE, bool $index = true): int
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

function csv_row($handle, array $row): void
{
    fputcsv($handle, $row);
    fflush($handle);
}

function field_ref(string $shortname): int
{
    return (int) ps_value(
        "SELECT ref value FROM resource_type_field WHERE name = ?",
        ["s", $shortname],
        0,
        "schema"
    );
}

function source_basename_for_resource(int $ref, int $source_path_field, int $original_filename_field): string
{
    $source_path = $source_path_field > 0 ? get_data_by_field($ref, $source_path_field) : "";
    $basename = basename((string) $source_path);
    if ($basename !== "" && $basename !== "." && $basename !== DIRECTORY_SEPARATOR) {
        return $basename;
    }

    return $original_filename_field > 0 ? basename((string) get_data_by_field($ref, $original_filename_field)) : "";
}

function existing_derivative_alt(int $resource, string $name): int
{
    return (int) ps_value(
        "SELECT ref value FROM resource_alt_files WHERE resource = ? AND name = ? ORDER BY ref LIMIT 1",
        ["i", $resource, "s", $name],
        0
    );
}

function resources_needing_derivatives(): array
{
    $all = getenv("DERIVATIVE_ALL_HEIC") === "1";
    $sql = "SELECT ref, file_extension, file_size, has_image FROM resource WHERE ref >= 363 AND file_extension = ?";
    $params = ["s", "heic"];
    if (!$all) {
        $sql .= " AND has_image = 0";
    }
    $sql .= " ORDER BY ref";
    return ps_query($sql, $params);
}

if ($mode === "plan") {
    $out = $argv[2] ?? "/tmp/tjc-heic-derivative-plan.csv";
    $source_path_field = field_ref("source_path");
    $handle = fopen($out, "w");
    csv_row($handle, ["resource_id", "original_filename", "source_basename", "has_image", "existing_alt"]);

    foreach (resources_needing_derivatives() as $row) {
        $ref = (int) $row["ref"];
        $basename = source_basename_for_resource($ref, $source_path_field, 51);
        csv_row($handle, [
            $ref,
            get_data_by_field($ref, 51),
            $basename,
            $row["has_image"],
            existing_derivative_alt($ref, $GLOBALS["derivative_name"]),
        ]);
    }

    fclose($handle);
    echo "HEIC derivative plan written: {$out}\n";
    exit(0);
}

if ($mode === "attach") {
    $derivative_dir = $argv[2] ?? "/tmp/tjc-heic-derivatives";
    $out = $argv[3] ?? "/tmp/tjc-heic-derivative-attach-audit.csv";

    if (!is_dir($derivative_dir)) {
        fwrite(STDERR, "FAIL: derivative directory not found: {$derivative_dir}\n");
        exit(1);
    }

    $derivative_status_field = ensure_mvp_field("Derivative Status", "derivative_status");
    $approval_notes_field = field_ref("approval_notes");

    $handle = fopen($out, "w");
    csv_row($handle, [
        "resource_id",
        "alternative_id",
        "derivative_file",
        "size_bytes",
        "status",
        "error",
    ]);

    $attached = 0;
    $failed = 0;
    foreach (resources_needing_derivatives() as $row) {
        $ref = (int) $row["ref"];
        $jpg = "{$derivative_dir}/{$ref}.jpg";
        $status = "attached";
        $error = "";
        $alt_ref = 0;
        $size = file_exists($jpg) ? filesize($jpg) : 0;

        try {
            if (!file_exists($jpg)) {
                throw new Exception("derivative JPG not found");
            }

            $alt_ref = existing_derivative_alt($ref, $derivative_name);
            if ($alt_ref === 0) {
                $alt_ref = add_alternative_file(
                    $ref,
                    $derivative_name,
                    "Generated metadata-stripped JPG derivative for preview and normal user download. Original HEIC remains preserved as master.",
                    basename($jpg),
                    "jpg",
                    $size,
                    "derivative"
                );
            } else {
                save_alternative_file($ref, $alt_ref, [
                    "description" => "Generated metadata-stripped JPG derivative for preview and normal user download. Original HEIC remains preserved as master.",
                    "file_name" => basename($jpg),
                    "file_extension" => "jpg",
                    "file_size" => $size,
                    "alt_type" => "derivative",
                ]);
            }

            $alt_path = get_resource_path($ref, true, "", true, "jpg", -1, 1, false, "", $alt_ref);
            if (!copy($jpg, $alt_path)) {
                throw new Exception("copy derivative to alternative filestore failed");
            }

            try {
                create_previews($ref, false, "jpg", false, false, $alt_ref, false, false, false);
            } catch (Throwable $preview_error) {
                $error = "alternative preview warning: " . $preview_error->getMessage();
            }

            update_field(
                $ref,
                $derivative_status_field,
                "Original HEIC preserved. Metadata-stripped JPG derivative attached as alternative file {$alt_ref} for preview/use on " . date("Y-m-d") . "."
            );

            if ($approval_notes_field > 0) {
                $notes = (string) get_data_by_field($ref, $approval_notes_field);
                $marker = "HEIC derivative attached";
                if (strpos($notes, $marker) === false) {
                    $notes = trim($notes . "\n" . $marker . ": original HEIC remains master; JPG derivative is available for preview/use.");
                    update_field($ref, $approval_notes_field, $notes);
                }
            }

            $attached++;
        } catch (Throwable $e) {
            $status = "failed";
            $error = $e->getMessage();
            $failed++;
        }

        csv_row($handle, [$ref, $alt_ref, $jpg, $size, $status, $error]);
    }

    fclose($handle);
    echo "HEIC derivatives attached: {$attached}\n";
    echo "HEIC derivative failures: {$failed}\n";
    echo "Audit: {$out}\n";
    exit($failed > 0 ? 2 : 0);
}

fwrite(STDERR, "FAIL: unknown mode: {$mode}\n");
exit(1);
