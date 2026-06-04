# ADR 0004: Batch 02 Media Supply Chain

## Status

Accepted.

## Context

Batch 02 must prove a repeatable TJC media supply chain, not only a larger import count. The risk is mixing source archive, review state, and approved-use folders until users cannot tell what is merely stored versus what is safe to publish.

## Decision

Use this model for LM Photos Batch 02:

```text
Google Photos export
  -> local one-album intake
  -> manifest + checksum audit
  -> Shared Drive-style master staging
  -> ResourceSpace import/search/review
  -> Approved Public/Internal delivery outputs only after review
```

Albums become ResourceSpace collections for provenance. Metadata fields carry the searchable meaning, rights state, duplicate history, and master path.

All imports default to:

```text
publish_status = Needs Review
usage_scope = Do Not Publish
rights_status = Unknown
workflow_state = Intake
```

## Consequences

- Master storage can preserve selected originals even when assets are not yet approved.
- Approved folders become safe-use delivery shelves, not the complete archive.
- Exact duplicates are not reimported as duplicate binaries, but every album membership and source path is preserved.
- AI can suggest tags or titles later, but final metadata and rights decisions stay human-reviewed.
