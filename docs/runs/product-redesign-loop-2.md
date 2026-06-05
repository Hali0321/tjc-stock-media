# Product Redesign Loop 2

Date: 2026-06-05

## Screenshots reviewed
- `docs/screenshots/library-desktop.png`
- `docs/screenshots/review-desktop.png`
- `docs/screenshots/upload-desktop.png`
- `docs/screenshots/library-mobile-320.png`
- `docs/screenshots/detail-mobile-320.png`

## Score
8.6 / 10

## What felt AI-generated
- The new visual language was calmer, but Library still let Collections dominate the first viewport.
- Mobile showed saved views before results, which slowed the main Find job.
- Source and count truth became clearer, but rights count looked alarming for approved assets.

## What changed
- Search shortcuts now use saved-view logic for Website hero, Slides, Newsletter, and Social instead of raw keyword search.
- Search submit now reads the actual form value, clears saved view state, and produces stable results.
- Review workbench became a dense queue with selected inspector, action area, write blocker, and audit preview.
- Upload became a guided intake workflow with context, rights, files, large-media guidance, and receipt.
- Guide became a practical reference instead of decorative cards.

## Still blocking 10/10
- Mobile needed results before saved views.
- Rights-review counts should not flag approved assets that already have approval notes.
- Final screenshot set needed viewport captures rather than full-page lazy-load artifacts.

## Next actions
- Reorder Library mobile and desktop flow so results appear quickly.
- Fix rights-review count interpretation.
- Recapture final screenshot set and rerun browser QA.
