# ADR 0001: Google Shared Drive Master Warehouse and ResourceSpace DAM Layer

## Status

Accepted.

## Context

TJC stock media starts in Google Photos exports, old Drive folders, and local downloads. ResourceSpace can store imported binaries, but its filestore is not meant to be the human master folder structure. Stakeholders need both a browsable warehouse and a searchable/reviewable DAM.

## Decision

Use `TJC Stock Media Library` Google Shared Drive as the master warehouse for selected original media. Use ResourceSpace as the DAM/search/review/download layer.

Approved Public/Internal folders are delivery surfaces for curated copies, shortcuts, or exports after ResourceSpace review. They are not the only master location.

## Consequences

- Original filenames are preserved in the master warehouse.
- ResourceSpace metadata stores human meaning, approval state, search tags, and provenance.
- Restricted, duplicate, and Needs Review assets can still have master records and audit history.
- Google Photos remains a source discovery/export system, not the long-term operational library.
