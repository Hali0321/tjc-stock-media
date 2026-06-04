# ADR 0002: Preserve Original Filenames

## Status

Accepted.

## Context

Google Photos exports contain filenames such as `Copy of MVP Monday - 6.HEIC` or camera-generated names. Renaming files could make Drive browsing friendlier, but it weakens provenance and duplicate tracking.

## Decision

Do not rename source/master files. Preserve original filenames in source exports, local staging, and Shared Drive master paths.

Use ResourceSpace fields for human-friendly meaning:

- `title`
- `source_album`
- `visible_content_tags`
- `tjc_terms`
- `quality_status`
- `publish_status`

Renamed files are allowed only as curated export/delivery copies, not as master originals.

## Consequences

- Checksums and source filenames remain stable.
- Duplicate detection is safer.
- Users search by title/tags/collections instead of filenames.
- Drive folder paths carry album/year context while ResourceSpace carries semantic context.
