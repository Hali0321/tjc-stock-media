# Large Media Policy

## Decision

ResourceSpace upload is the default for photos and normal-size media. Large video/audio files use Shared Drive Incoming or local church network admin intake first, then DAM Owner/Admin imports or indexes them in ResourceSpace.

## Why

Cloudflare-proxied browser uploads can hit request body limits. A large MP4 can fail before ResourceSpace receives it. Users should not experience mysterious upload failures for 600 MB to 2 GB videos.

## Policy

Photos and small media:

- Upload through ResourceSpace.
- Default to `Needs Review / Do Not Publish`.
- AI image suggestions may run if cost cap is available.

Large video/audio:

- Upload to Shared Drive Incoming or local church network intake folder.
- DAM Owner/Admin creates manifest and checksum.
- DAM Owner/Admin imports/indexes into ResourceSpace.
- ResourceSpace stores metadata, previews when available, review state, and download policy.
- Master path and checksum are recorded.
- No public/internal approval until video/audio review passes.

Never:

- Upload large files randomly into master folders.
- Treat Shared Drive Incoming as an approved-use folder.
- Let normal contributors bypass ResourceSpace review.

## Threshold

Use `100 MB` as the first conservative threshold for browser-upload caution when Cloudflare Free/Pro may be in front of ResourceSpace.

Files above that threshold should use admin large-media intake unless the live Cloudflare plan and ResourceSpace upload limit are explicitly verified.

## User Message

If a contributor has a large video/audio file:

```text
Do not upload this directly through the browser.
Place it in Shared Drive Incoming or give it to the DAM admin.
It will still be reviewed and searchable in ResourceSpace after admin intake.
```

