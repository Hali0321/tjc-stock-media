# ADR 0005: Media Source Session Seam

## Status

Accepted.

## Context

The portal must present ResourceSpace-backed records honestly while hiding operational source truth from roles that should only see the media library. Search, asset detail, review, Brand Hub, download gates, and Admin all need the same answer to whether data is live ResourceSpace, read-only export, fixture fallback, or role-safe portal copy.

## Decision

Use a Media source session seam for request-time source truth. Server routes build a source envelope once per request and return normalized `source`, `sourceStatus`, `sourceKind`, and `live` fields instead of each route recalculating live/read-only/fallback semantics.

## Consequences

- ResourceSpace, export, and fallback status wording stays local to one module.
- Viewer-safe source redaction remains part of the source session instead of being hand-coded per route.
- Future S3/Google Shared Drive/ResourceSpace live adapter changes can deepen the same seam without changing every UI caller.
