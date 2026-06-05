# Product Redesign Loop 1

Date: 2026-06-05

## Screenshots reviewed
- `docs/screenshots/library-desktop.png`
- `docs/screenshots/review-desktop.png`
- `docs/screenshots/upload-desktop.png`
- `docs/screenshots/asset-detail-desktop.png`

## Score
7.4 / 10

## What felt AI-generated
- Library still opened like a rounded dashboard slab.
- Saved views looked like repeated cards rather than DAM shortcuts.
- Review page had the right data, but rows and actions felt prototype-heavy.
- Upload used three large form cards and the file control could overflow.
- Detail page had too much heavy radius and bold type.

## What changed
- Rebuilt app shell into a compact product header instead of sidebar-first admin chrome.
- Reworked cards into sharper media records with preview, short status, title, collection, usage, and one download or lock control.
- Added count fields for visible, matching, and rendered assets.
- Added metadata confidence states for source, people/minors, rights, usage guidance, and review.
- Changed saved views into command rows backed by existing ResourceSpace export logic.

## Still blocking 10/10
- Library results needed to appear sooner.
- Rights-review counts needed tighter interpretation for already approved assets.
- Review workbench needed a more serious selected inspector and audit preview.

## Next actions
- Move results above collections on Library.
- Tune rights-review logic.
- Refresh browser QA across desktop and mobile.
