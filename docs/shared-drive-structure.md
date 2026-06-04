# Google Shared Drive Structure

Shared Drive name:

`TJC Stock Media Library`

Folders:

```text
00_Incoming
01_Photos
02_Videos
03_Audio
04_Approved_Public
05_Approved_Internal
06_Needs_Review
90_Source_Archives
99_Metadata_Exports
```

## Rule

Shared Drive is the master warehouse and organized storage layer. ResourceSpace is the DAM index/search/review layer.

`01_Photos`, `02_Videos`, and `03_Audio` hold selected master originals. `04_Approved_Public` and `05_Approved_Internal` hold curated delivery copies, shortcuts, or exports after ResourceSpace review.

Do not use "approved" as the test for whether a source master exists. The master warehouse can contain selected originals that are still `Needs Review`, `Archive Only`, or `Do Not Use`, because those statuses are part of the audit trail. Approval controls delivery folders, not whether history is preserved.

## MVP Behavior

- Do not move or delete legacy originals.
- Copy selected source originals into Shared Drive staging with original filenames.
- Approved samples can be copied/exported into approved delivery folders.
- Metadata exports go to `99_Metadata_Exports`.

## LM Photos Completion Pattern

Mirror Google Photos album names:

```text
01_Photos/<year>/<source_album>/<original_filename>
```

Examples:

```text
01_Photos/2011/2011/img_7017_14702872790_o.jpg
01_Photos/2021/MVP 2021 - Michelle Lin/DSC01234.jpg
```

If year cannot be derived, use:

```text
01_Photos/Unknown_Date/<source_album>/<original_filename>
```

## Batch 02 Local Staging

The local prototype creates a Shared Drive-style staging mirror under:

```text
.runtime/shared-drive-staging/TJC Stock Media Library/
```

This is an upload-ready mirror, not the final cloud Shared Drive. It exists so every imported ResourceSpace asset can store a planned `master_drive_path` before real Drive upload.

Default staging mode uses hardlinks where macOS allows it. That saves disk space while preserving original file bytes. Scripts still verify SHA-256 after staging.

If local disk cannot hold both ResourceSpace filestore copies and staging copies, use `STAGE_MODE=manifest-only`. In that mode, the manifest still records the intended Shared Drive path and ResourceSpace still stores `master_drive_path`, but the local staging file is not retained.

## Approved Output Rule

Approved delivery folders are curated surfaces:

```text
04_Approved_Public/Batch_02/
05_Approved_Internal/Batch_02/
```

They should contain only reviewer-approved copies, shortcuts, or exports. Users should treat these folders as "safe to use" shelves, not as the complete archive.
