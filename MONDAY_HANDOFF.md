# Monday Handoff — TJC Stock Media

Status: Tuesday presentation / church pilot demo candidate

This is not production-ready. The current build is a visually refreshed, ResourceSpace-backed demo candidate for church pilot review. Production still needs real authentication/access allowlist, hosting, ResourceSpace write mapping, backup/restore ownership, derivative presets, and replacement of the demo role switch.

## What Changed

- Rebuilt the visual system around calmer DAM surfaces, stronger focus states, richer cards, clearer safety colors, and more stable 320/390/768 responsive layouts.
- Upgraded AppNav, Library, Asset Detail, Upload, Review, Collections, Admin, and Guide so the app reads as a photo-first ministry DAM rather than repeated admin boxes.
- Preserved current routes and API behavior. No derivative-system, auth, hosting, persistence, backend route, or write-mapping scope was started.
- Kept Image Comparison Slider deferred because safe paired derivative previews are not guaranteed yet. Future location should be Asset Detail > Files or Review inspector evidence.

## Visual Proof

Before/after screenshot pairs inspected:

- `docs/screenshots/qa/before-library-desktop.png` / `docs/screenshots/qa/after-library-desktop.png`
- `docs/screenshots/qa/before-detail-desktop.png` / `docs/screenshots/qa/after-detail-desktop.png`
- `docs/screenshots/qa/before-upload-desktop.png` / `docs/screenshots/qa/after-upload-desktop.png`
- `docs/screenshots/qa/before-review-desktop.png` / `docs/screenshots/qa/after-review-desktop.png`
- `docs/screenshots/qa/before-guide-mobile-320.png` / `docs/screenshots/qa/after-guide-mobile-320.png`

Interaction proof screenshots refreshed:

- `docs/screenshots/qa/command-palette-open.png`
- `docs/screenshots/qa/upload-selected-file-preview.png`
- `docs/screenshots/qa/asset-actions-menu-open.png`
- `docs/screenshots/qa/request-original-dialog-open.png`
- `docs/screenshots/qa/review-pending-write-dialog-open.png`
- `docs/screenshots/qa/review-hold-to-confirm.png`
- `docs/screenshots/qa/after-admin-desktop.png`
- `docs/screenshots/qa/after-library-mobile-320.png`
- `docs/screenshots/qa/after-detail-mobile-320.png`
- `docs/screenshots/qa/after-upload-mobile-320.png`
- `docs/screenshots/qa/after-review-mobile-320.png`

## Safety Proof

- Viewer blocked download remains `403`.
- Viewer payloads do not expose original/master source metadata.
- Restricted thumbnails/download variants remain role scoped.
- Reviewer POST without evidence remains `400`.
- Valid review action queues `202` pending-write state instead of fake ResourceSpace persistence.
- Upload intake remains `Needs Review / Do Not Publish`.
- `DamTabs` inactive tabs keep stable `aria-controls` targets.
- No media files or secrets were tracked by Git.

## Known Production Blockers

- Real authentication and access allowlist are not implemented.
- Hosting/deployment is not complete.
- ResourceSpace API write mapping is not configured.
- Demo role switch is still not production auth.
- Derivative presets and safe paired derivatives are not complete.
- Public portal gate still blocks assets until rights, people/minors, and derivative confidence improve.
- Local `.env` still contains placeholder values.
- Local disk free space is below 20 GiB.
- Local Docker daemon was unavailable during `make smoke`, so ResourceSpace/MariaDB containers were not running.

## Monday Test List for Hali

- Open Library as Viewer and confirm it feels like a DAM contact sheet, not an admin grid.
- Open `/assets/368` as Viewer and confirm the page answers “Can I use this?” before download actions.
- Open Upload as Contributor, select a local file, and confirm selected-file preview plus `Needs Review / Do Not Publish`.
- Open Review as Reviewer, inspect queue, open pending-write dialog, and confirm it says ResourceSpace is not updated.
- Open Admin as DAM Admin and confirm blockers explain what prevents production launch.
- Check mobile at 320/390 for Library, Detail, Upload, Review, and Guide.
- Re-run `make portal-api-smoke` and `make portal-browser-qa` after any Monday edits.
