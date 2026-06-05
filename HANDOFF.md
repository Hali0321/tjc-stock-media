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

Latest local QA captured the required screenshots under `docs/screenshots/` from the production Next server and checked 1440 px desktop plus 320 px mobile browser widths with no horizontal page overflow. The screenshots have no Next dev badge.

The current frontend shell is the redesigned ministry media-library UI:

- Desktop uses an app-like sidebar plus top utility bar rather than the old centered demo header.
- Styling is Tailwind v4 with a small global token/base layer, Geist via `next/font/google`, and `lucide-react` icons.
- Main nav: Library, Collections, Upload, Review.
- Mobile at 320 px uses icon-first nav with accessible labels to preserve fit.
- Usage Guide: secondary utility/footer link, not primary navigation.
- Library: compact DAM command center, early search, use-case shortcuts, operational saved views, compact collection rail, filters, sort chips, clear result count, and photo-first asset grid.
- Asset cards: short status, usage label, display-normalized title, one tag, download/blocked signal, provenance on hover/focus.
- Asset detail: usage guidance, source/review/technical provenance, approved copy separated from original/master restriction.
- Upload: guided three-step intake.
- Review: queue tabs, compact decision rows, selected-asset inspector, and desktop-only GSAP pin/scale motion disabled by reduced-motion.

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

Display title cleanup is presentation-only. Original filenames and ResourceSpace IDs remain in asset detail metadata and the ResourceSpace export remains the source data.

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

Latest checked behavior on 2026-06-05:

| Check | Result |
|---|---|
| Viewer download for unsafe asset `644` | 403 blocked |
| Viewer unsafe detail asset `644` | cannot view |
| Reviewer unsafe detail asset `644` | visible for review, no active download link |
| Viewer review POST | 403 blocked |
| Reviewer review POST without ResourceSpace API write config | 409 honest blocker |
| Viewer upload POST | 403 blocked |
| Contributor upload intake POST | 200 validated; empty browser file placeholders ignored |
| Reviewer unsafe detail page | no active `/api/download` links |

Reviewer action labels are user-facing, but map to backend workflow values:

| UI action | Backend action/status |
|---|---|
| Approve for church-wide use | Approved Public |
| Approve for internal ministry use | Approved Internal |
| Archive only | Searchable Archive |
| Do not publish externally | Do Not Use |

## Download Safety

Only approved use copies are downloadable through `/api/download/:id`.

Needs Review, Searchable Archive, Possible Minors, and Do Not Use assets return blocked responses for normal users. The UI presents these as `Please review before public sharing`, `Archive only`, `Contains children/youth`, and `Do not publish externally`. Original/master files are visually separated and restricted.

## Thumbnail Safety

The frontend uses `/api/assets/thumbnail/:id` to resolve a ResourceSpace derivative for a specific asset ID. It never exposes the whole filestore directory and never copies thumbnails into Git.

## Remaining Before Church PC/NAS

- Configure production host and storage.
- Restore ResourceSpace backup on clean church machine.
- Protect access through Cloudflare Access or Google Workspace allowlist.
- Configure signed ResourceSpace API field mapping for portal review/upload writes.
- Confirm backup job and restore test on the target host.
- Pilot video/audio import with large-media intake.
- Replace local demo role switch with real church access control.
