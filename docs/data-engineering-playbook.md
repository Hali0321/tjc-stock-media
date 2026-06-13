# Data Engineering Playbook

This project needs a lightweight data engineering spine, not a standalone data
platform. The goal is to make ResourceSpace, Google Shared Drive, the portal,
exports, and future AI runs agree on asset truth without slowing the DAM MVP.

## Decision

Use a canonical asset metadata catalog as the core data product.

That catalog is the durable contract across:

- Google Shared Drive master-original custody
- ResourceSpace DAM records, review state, tags, previews, and collections
- Portal read models and role-safe payloads
- Metadata CSV exports and backup/restore checks
- Future AI suggestion, search, and quality workflows

Do not introduce a data lake, warehouse, orchestration platform, vector
database, or custom DAM database until volume, latency, or AI search needs prove
they are required.

## Operating Terms

| Term | Meaning in this repo | Current implementation |
|---|---|---|
| Master warehouse | Human-browsable custody of selected original media. | Google Shared Drive / local staging mirror. |
| DAM index | Search, review, preview, collection, and permission layer. | ResourceSpace. |
| Canonical asset catalog | Stable metadata contract for one asset across source, DAM, portal, exports, and AI. | ResourceSpace records plus metadata export fields. |
| Source manifest | Batch inventory with filenames, counts, paths, sizes, checksums, and source context before import. | Import audit CSVs and batch manifests. |
| Lineage | Where an asset came from, where it lives now, and which derivatives or duplicates belong to it. | `source_*`, `master_drive_*`, `checksum_sha256`, `duplicate_*`, `derivative_*`. |
| Data quality contract | Rules that make a record safe to search, review, approve, or reuse. | Metadata schema, reuse policy, review gates, launch readiness. |
| Read model | Role-safe view assembled for portal screens. | Backend API routes and media-source adapters. |
| AI suggestion layer | Non-authoritative labels, titles, OCR, quality hints, and people/minor risk hints. | `ai_*` fields, human approval required. |
| Embedding index | Optional sidecar for semantic search over approved text/tags/previews. | Not implemented; Phase 2+ only. |

## Data Flow

```text
Legacy sources
Google Photos / old Drive folders / local exports / ministry folders
        |
        | extract: one batch at a time
        | state: source manifest + checksum + source album boundary
        v
Source manifest
batch inventory / dedupe evidence / planned master path
        |
        | load: copy or manifest-only staging, then ResourceSpace import
        | rerun behavior: idempotent by checksum + source path + import batch
        v
Google Shared Drive master warehouse
selected originals / original filenames / custody path
        |
        | index: ResourceSpace import or link
        v
ResourceSpace DAM catalog
metadata / previews / permissions / collections / review state
        |
        | publish read model: server-side API only
        v
TJC Stock Media portal
role-safe search / reuse verdict / review workbench / packages
        |
        | optional sidecars
        v
Metadata exports / audit logs / AI suggestions / future embeddings
```

## Source Boundaries

Every batch must name its boundary before import:

- Source system: Google Photos, Google Drive, local ZIP, Shared Drive Incoming,
  ResourceSpace export, or other.
- Source account or owner when known.
- Source album, folder, ZIP, or collection boundary.
- Import batch ID.
- Snapshot time or capture date range when available.
- Rerun rule.

Default rerun rule:

```text
If checksum + source path + import batch already exists, do not create a second
asset record. Link duplicate source membership and preserve provenance.
```

If the same checksum appears in a new source album, preserve the new album
membership instead of deleting or hiding it.

## Pipeline Shape

Use simple batch ELT language even when scripts are manual:

1. Extract source inventory into a manifest.
2. Validate counts, paths, extensions, and checksums.
3. Stage selected originals into the master warehouse or manifest-only staging.
4. Load/index records into ResourceSpace.
5. Transform metadata into searchable/reviewable fields.
6. Publish role-safe portal read models.
7. Export metadata and audit evidence.

This keeps data work explainable to ministry stakeholders and still gives
engineers the state boundaries needed for safe reruns.

## Data Quality Contract

An asset should not be treated as portal-ready unless these data groups are
complete enough for its use case:

| Group | Required evidence |
|---|---|
| Identity | `canonical_asset_id`, ResourceSpace ref, original filename, media type. |
| Provenance | Source system/account/album/path, import batch, checksum, master path. |
| Search | Visible tags, TJC terms when applicable, title or event context. |
| Rights | Rights status, publish status, usage scope, reviewer, review date, notes. |
| People/minors | People visibility, minors visibility, consent/sensitivity status. |
| Derivatives | Preview/download derivative state, original preserved check. |
| Audit | Batch manifest, approval audit, pending write or writeback evidence. |

Missing data is not a UI bug. It is a readiness signal. The portal should show
`Needs review`, `Needs metadata`, or `Not portal-ready` rather than guessing.
Raw ResourceSpace `Approved Public` is not enough for portal-ready reuse. The
portal contract also requires rights, people/minors, reviewer/date, derivative,
and production reuse fields to be present or explicitly warned. Portal pending
review writes are sidecar evidence only until ResourceSpace live writeback
succeeds and a post-write read confirms the status, reviewer, date, and notes.

## Schema Drift Rules

Metadata fields will evolve. Handle drift deliberately:

- Additive field: safe by default if old exports can leave it blank.
- Rename: keep old alias mapping until all exports and UI code migrate.
- Type change: create a new field or versioned parser; do not silently coerce.
- Controlled vocabulary change: record old value, new value, and migration rule.
- Missing field in export: degrade to setup/readiness warning, not fake truth.
- Breaking ResourceSpace field ref change: update field map and smoke test before
  enabling writeback.

Use `metadata_record_version` or export schema labels when metadata exports start
feeding multiple environments.

## AI Use

AI should consume canonical catalog fields and write suggestion fields only.

Allowed AI inputs:

- Role-safe preview derivative or approved analysis copy.
- Visible-content tags and TJC vocabulary.
- Source context that does not expose secrets, private paths, or credentials.
- Prior human-approved examples for taxonomy consistency.

AI outputs must stay separate:

- `ai_title_suggestion`
- `ai_visible_tag_suggestions`
- `ai_tjc_term_suggestions`
- `ai_quality_suggestion`
- `ai_people_or_minor_flag`
- `ai_run_id`
- `ai_prompt_version`
- `ai_cost_estimate`
- `human_ai_decision`

AI must not write final title, final tags, rights status, approval state, usage
scope, reviewer identity, or public-safety status.

If semantic search is added later, treat embeddings as a sidecar:

```text
canonical_asset_id -> embedding vector + embedding_model + indexed_at
```

The embedding index may improve retrieval, but ResourceSpace/catalog metadata
remains the source of truth.

## Observability

For each batch, keep evidence that answers:

- How many source files were seen?
- How many were staged, imported, duplicate-linked, failed, or skipped?
- Which checksums changed?
- Which preview/derivative jobs failed?
- Which records are missing required metadata?
- Which review decisions were final vs pending sync?
- Which portal actions were blocked and why?
- Which AI run produced which suggestions and cost estimate?

Good enough V1 storage:

- CSV manifests and exports
- local audit files
- local SQLite for portal usage events
- ResourceSpace metadata
- docs/run notes

Use a warehouse only when stakeholders need cross-batch analytics, dashboards,
or reporting beyond what exports and SQLite can answer.

## Build Triggers

Keep the current lightweight path until one of these becomes true:

| Trigger | Next data step |
|---|---|
| Manual imports become error-prone across repeated batches. | Add idempotent import automation around manifests. |
| Reviewers need cross-batch reporting. | Add a small reporting mart from ResourceSpace exports. |
| Search quality depends on meaning, not tags. | Add embedding sidecar over approved metadata. |
| AI costs or prompt versions need audit at scale. | Add AI run table/log with cost and prompt fingerprints. |
| Source systems update continuously. | Add scheduled extract with watermarks and dead-letter records. |
| Multiple environments need same data contract. | Add explicit export schema version and contract tests. |

## Product / CTO / Engineering Alignment

Product principle:

- Ship a trustworthy DAM workflow before building invisible infrastructure.

CTO data principle:

- Preserve original custody, provenance, and rerun safety before optimizing for
  automation.

Staff engineering principle:

- Keep ResourceSpace and the canonical catalog authoritative. Portal state,
  package drafts, usage analytics, AI suggestions, and embeddings are derived
  sidecars unless explicitly promoted through review and writeback.
