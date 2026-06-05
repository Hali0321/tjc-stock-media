# TJC Stock Media Handoff

## What Runs Locally

- ResourceSpace backend: `http://localhost:8088`
- TJC Stock Media frontend: `http://localhost:3008`

Run:

```bash
make up
make frontend-dev
```

Check:

```bash
make frontend-check
make demo-check
```

Latest local QA also captured the required screenshots under `docs/screenshots/` and checked 1440, 1024, 768, and 320 px browser widths with no horizontal overflow.

## Architecture

```text
Browser
  -> Next.js portal
  -> server-side media-source adapter
  -> ResourceSpace API or ResourceSpace metadata export
  -> ResourceSpace backend
  -> Google Shared Drive master-original references
```

ResourceSpace remains the source of truth for assets, metadata, review state, approval status, reviewer notes, permissions, and download eligibility.

Google Shared Drive remains the master-original warehouse.

The frontend is not a second DAM. It does not store approval state, create a second metadata database, rename files, move files, delete files, or expose ResourceSpace API keys to the browser.

## Current Data Source

Current Mac reference reads the latest local ResourceSpace metadata CSV export from:

```text
.runtime/exports/resourcespace-metadata-*.csv
```

Latest checked export: `.runtime/exports/resourcespace-metadata-20260604-193852.csv`.

This is real ResourceSpace-exported data, but approval writes are read-only until ResourceSpace signed API field mapping is configured.

## Role Safety

Viewer cannot approve.

Viewer cannot download unsafe assets.

Contributor can submit upload intake but cannot approve.

Reviewer/DAM Admin can open review queue. Review actions go through `/api/review`; if ResourceSpace API write config is missing, the route refuses fake persistence and tells the user to use ResourceSpace admin.

## Download Safety

Only approved use copies are downloadable through `/api/download/:id`.

Needs Review, Searchable Archive, Possible Minors, and Do Not Use assets return blocked responses for normal users. Original/master files are visually separated and restricted.

## Thumbnail Safety

The frontend uses `/api/assets/thumbnail/:id` to resolve a ResourceSpace derivative for a specific asset ID. It never exposes the whole filestore directory and never copies thumbnails into Git.

## Remaining Before Church PC/NAS

- Configure production host and storage.
- Restore ResourceSpace backup on clean church machine.
- Protect access through Cloudflare Access or Google Workspace allowlist.
- Configure signed ResourceSpace API field mapping for portal review/upload writes.
- Confirm backup job and restore test on the target host.
- Pilot video/audio import with large-media intake.
