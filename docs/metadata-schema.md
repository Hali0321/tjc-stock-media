# Metadata Schema

## Source / Provenance

| Field | Purpose |
|---|---|
| `canonical_asset_id` | Stable ID for the same asset across manifest, ResourceSpace, and exports. |
| `source_system` | Google Photos, Google Drive, IA DME folder, local copy, etc. |
| `source_account` | Source account, such as `lm.photo@tjc.org`. |
| `source_path` | Original path or source link. |
| `original_filename` | Filename before import. |
| `checksum_sha256` | Proves whether two copies are the same file. |
| `import_batch` | Batch name, such as `MVP 2024 First Batch`. |
| `import_date` | Date imported or audited. |

## Description / Search

| Field | Purpose |
|---|---|
| `media_type` | Photo, video, audio, graphic, document. |
| `event_name` | Church event or album context when known. |
| `event_date` | Event date when known. |
| `visible_content_tags` | Generic visual tags, such as Bible, plant, fountain. |
| `TJC_terms` | Church-context tags, such as baptism, fellowship, worship. |
| `people_visible` | Yes, no, unknown. |
| `children_visible` | Yes, no, unknown. |
| `location` | City/church/location when known. |

## Rights / Review

| Field | Purpose |
|---|---|
| `rights_status` | Needs Review, Approved Public, Approved Internal, Restricted, Do Not Use. |
| `public_safe` | Yes, no, unknown. |
| `usage_scope` | Do Not Publish, Internal Only, Public, Limited. |
| `consent_status` | Confirmed, not confirmed, not applicable, unknown. |
| `reviewed_by` | Rights reviewer name/account. |
| `reviewed_date` | Date reviewed. |
| `approval_notes` | Why this asset is safe or restricted. |
| `expiration_or_recheck_date` | Date to revisit rights if needed. |

## Important Rule

Keep `visible_content_tags` separate from `TJC_terms`.

Example: a photo may visibly show `people, table, flowers`, but the TJC context may be `fellowship lunch` or `youth ministry`.

