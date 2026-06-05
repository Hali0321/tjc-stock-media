# LM Photos Completion Run

## Goal

Turn the remaining `lm.photo@tjc.org` Google Photos album ZIPs into a controlled ResourceSpace library and Shared Drive staging set.

Batch succeeds when a TJC user can find a useful approved photo without knowing filename, album, or source path, and every asset remains traceable back to its source album/export.

North Star:

```text
TJC can repeatedly turn Google Photos albums into a searchable, rights-aware,
human-reviewed ResourceSpace library where approved assets are findable without
filenames and unsafe/unreviewed assets cannot be mistaken for publishable media.
```

## Source

- ZIP folder: `/Users/halim4pro/Desktop/MVP/Stock Media/01_Source Exports/lm-photo`
- Observed ZIPs: 31
- Observed compressed size: about 8.3 GB
- Observed contents: about 3,963 files
- Formats observed: JPG, HEIC, PNG, JPEG, TIF, ARW

## Operating Model

- Process one ZIP album at a time.
- Extract into runtime temp space.
- Generate manifest and checksums.
- Stage all selected master originals with original filenames.
- Import/index into ResourceSpace.
- Preserve album membership as collections and metadata.
- Treat album collections as provenance and grouping, not as the main taxonomy or access-control model.
- Delete a ZIP only after that album has passed verification.
- Delete temp extraction after verification.
- Process `Open Album` last because it is the largest ZIP.

## Folder Rules

Shared Drive staging path:

```text
01_Photos/<year>/<source_album>/<original_filename>
```

Examples:

```text
01_Photos/2011/2011/img_7017_14702872790_o.jpg
01_Photos/2021/MVP 2021 - Michelle Lin/DSC01234.jpg
```

If year cannot be derived from album name, file metadata, or explicit source context, stage under:

```text
01_Photos/Unknown_Date/<source_album>/<original_filename>
```

## Status Rules

Defaults:

```text
publish_status = Needs Review
usage_scope = Do Not Publish
rights_status = Unknown
quality_status = Unreviewed
```

Final status rules:

- Approved Public requires usefulness, acceptable technical quality, no minors, no sensitive context, confirmed/acceptable rights, and human reviewer/date.
- Children/minors visible: `Needs Review`.
- Safe but low-use/noisy: `Archive - Not Promoted`.
- Rights/safety issue: `Do Not Use` or `Needs Review`.

## Duplicate Rules

- Exact duplicate means same SHA-256 checksum.
- Keep one canonical ResourceSpace asset.
- Add every source album membership to the canonical asset.
- Preserve every source path in `source_paths_all`.
- Do not delete source files because they are duplicate.

## Metadata Minimum

Every imported or duplicate-linked asset needs:

- source album
- original filename
- checksum
- batch ID
- source path
- source album memberships
- quality status
- publish status
- usage scope

Approved assets also need:

- final title
- 3-5 visible tags
- 1-3 TJC terms
- reviewer
- reviewed date
- approval notes

## Verification

Pass conditions:

- 100% ZIP files inventoried.
- 100% processed source files counted by album.
- 100% processed source files have SHA-256 checksums.
- Import count plus duplicate-linked count plus failed/skipped count equals source count.
- No ZIP is deleted before its album verification passes.
- Collections preserve album membership; fields preserve source/master path and review status.
- 10 search checks return useful approved results.
- Metadata export includes required operational fields.
- Backup and restore-test pass.

## Selection Rule After First Safety Pass

Oldest-first is good for archive discipline, but the next useful run should be mixed:

- 70% older albums to test historical metadata weakness.
- 20% likely high-reuse albums to prove stakeholder value.
- 10% messy/problem albums to expose duplicates, dates, people/minor flags, and format issues early.
