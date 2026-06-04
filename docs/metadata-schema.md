# Metadata Schema

## Source / Provenance

| Field | Purpose |
|---|---|
| `canonical_asset_id` | Stable ID for the same asset across manifest, ResourceSpace, and exports. |
| `source_platform` | High-level source, such as Google Photos or Google Drive. |
| `source_system` | Google Photos, Google Drive, IA DME folder, local copy, etc. |
| `source_account` | Source account, such as `lm.photo@tjc.org`. |
| `source_album` | Google Photos album or source folder name. |
| `source_album_path` | Local/export folder for this album during import. |
| `source_album_memberships` | All source albums this exact asset appeared in. |
| `source_path` | Original path or source link. |
| `source_paths_all` | All known source paths for exact duplicate appearances. |
| `original_filename` | Filename before import. |
| `original_extension` | Original file extension before import. |
| `original_file_size_bytes` | Original byte size before import. |
| `checksum_sha256` | Proves whether two copies are the same file. |
| `import_batch` | Batch name, such as `MVP 2024 First Batch`. |
| `import_manifest_row_id` | Row ID from batch manifest. |
| `import_date` | Date imported or audited. |
| `master_drive_path` | Intended or verified Google Shared Drive master path. |
| `master_drive_paths_all` | All Shared Drive master paths for exact duplicate album appearances. |
| `resourcespace_ref` | ResourceSpace resource ID for cross-checking exports. |
| `duplicate_group` | Group ID for exact or near duplicates. |
| `duplicate_role` | Canonical, exact duplicate source, near duplicate, crop, edited version, etc. |

## Description / Search

| Field | Purpose |
|---|---|
| `media_type` | Photo, video, audio, graphic, document. |
| `event_name` | Church event or album context when known. |
| `event_date` | Event date when known. |
| `captured_date` | Capture date from Google Photos details or file metadata. |
| `captured_date_source` | Google Photos UI, EXIF, filename, album range, or unknown. |
| `camera_make` | Camera make when available. |
| `camera_model` | Camera model/device when available. |
| `image_dimensions` | Width x height. |
| `file_format` | Original file format, such as JPG, HEIC, TIF, ARW. |
| `visible_content_tags` | Generic visual tags, such as Bible, plant, fountain. |
| `TJC_terms` | Church-context tags, such as baptism, fellowship, worship. |
| `brand_terms` | Usage/brand feel such as warm, welcoming, hopeful, real. |
| `usage_terms` | Where this asset may be useful, such as newsletter, poster, social, report. |
| `human_title_final` | Human-approved searchable title. |
| `human_tags_final` | Human-approved final tag list. |
| `people_visible` | Yes, no, unknown. |
| `minors_visible` | Yes, no, unknown. |
| `sensitive_context` | Prayer counseling, private moment, sacrament, minors, music rights, etc. |
| `location` | City/church/location when known. |

## Rights / Review

| Field | Purpose |
|---|---|
| `quality_status` | Hero Candidate, Useful, Context Only, Low Use, Reject, Unreviewed. |
| `technical_quality` | Visual/audio technical quality, separate from rights and usefulness. |
| `rights_status` | Unknown, TJC-Owned, Permission Confirmed, Rights Concern. |
| `publish_status` | Needs Review, Approved Public, Approved Internal, Archive - Not Promoted, Do Not Use. |
| `workflow_state` | Intake, Metadata Drafted, Rights Review, Approved, Archived. |
| `public_safe` | Yes, no, unknown. |
| `usage_scope` | Do Not Publish, Public, Internal Only, Archive Only, Limited. |
| `consent_status` | Confirmed, not confirmed, not applicable, unknown. |
| `reviewed_by` | Rights reviewer name/account. |
| `reviewed_date` | Date reviewed. |
| `approval_notes` | Why this asset is safe or restricted. |
| `expiration_or_recheck_date` | Date to revisit rights if needed. |

## Derivatives / Format Handling

| Field | Purpose |
|---|---|
| `derivative_status` | Notes whether a preview/use derivative exists, especially for HEIC originals. |
| `alternative_file_count` | Export-only count of attached alternatives, such as generated JPG derivatives. |
| `original_format` | Original format, such as HEIC or JPG. |
| `preview_format` | Preview format ResourceSpace or derivative workflow uses. |
| `conversion_needed` | Whether user-facing preview/download derivative is needed. |
| `conversion_status` | Not evaluated, generated, failed, not needed. |
| `derivative_path` | Local/export path for generated derivative when applicable. |
| `original_preserved` | Yes/no check that original file remains untouched. |

Policy: preserve originals as masters. If HEIC preview fails, attach a metadata-stripped JPG derivative to the same asset record instead of replacing the HEIC or creating an unmanaged duplicate.

## AI Suggestions

| Field | Purpose |
|---|---|
| `ai_provider` | AI tool/provider used for suggestions. |
| `ai_model` | Model used for suggestions. |
| `ai_prompt_version` | Prompt version used for repeatability. |
| `ai_run_id` | Run identifier for audit. |
| `ai_cost_estimate` | Estimated or actual cost for the suggestion run. |
| `ai_title_suggestion` | Suggested title, not final title. |
| `ai_visible_tag_suggestions` | Suggested visible tags, not final tags. |
| `ai_tjc_term_suggestions` | Suggested TJC terms, not final terms. |
| `ai_quality_suggestion` | Suggested quality/usefulness status. |
| `ai_people_or_minor_flag` | Suggested people/minor risk flag. |
| `human_ai_decision` | Accepted, edited, rejected, or not reviewed. |

## Important Rule

Keep `visible_content_tags` separate from `TJC_terms`.

Example: a photo may visibly show `people, table, flowers`, but the TJC context may be `fellowship lunch` or `youth ministry`.

AI fields are suggestion fields only. They must not overwrite `human_title_final`, `human_tags_final`, rights, people, minor, approval, or usage fields without human review.
