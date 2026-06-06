# Final Product Critique - 2026-06-06

## Scope

Final DAM product UI pass for the Next.js TJC Stock Media portal at `http://localhost:3008`.

This pass was not a backend rewrite. It preserved:

- ResourceSpace as source of truth for assets, metadata, workflow state, review notes, permissions, and download eligibility.
- Google Shared Drive as master-original warehouse.
- Portal as the church-facing search, upload-intake, review, guide, and approved-copy download surface.
- No second DAM database, fake approval persistence, client-side ResourceSpace API key, source-media mutation, committed media, or master-original exposure.

## Loop Summary

| Loop | Product critique | Fix |
|---|---|---|
| 1 | Screens still felt too soft and card-heavy; Library buried results under operational panels. | Tightened global surface, app chrome, asset cards, saved views, collection cards, and Library density. |
| 2 | Detail mobile put preview/related assets before trust answer; upload cards stretched with empty space; no-preview assets looked like broken thumbnails. | Reordered mobile detail, tightened upload sections, added explicit `Preview pending` / `Preview unavailable` states. |
| 3 | Remaining limitation is ResourceSpace/export derivative readiness, not UI polish or safety logic. | Refreshed screenshots and documented no-preview state as a data readiness signal. |

## Final Product Read

The portal now reads as a mature internal DAM workflow product rather than a landing page or decorative gallery. It is denser, more operational, more media-first where derivatives exist, and more honest where ResourceSpace export data is incomplete.

## Find

- Search is first on Library with ministry/use-case placeholder text.
- Saved views use stable view IDs for Website hero, Slides, Newsletter, Social, No people, Internal ready, Recently approved, Needs review, and related workflow queues.
- Results appear high on desktop and mobile.
- Counts distinguish rendered, matching, visible-to-role, approved, pending review, rights review, children/youth, and archive.
- Collections use album-style cards and stable collection IDs; Sabbath wording is preserved.

## Trust

- Asset detail is the trust record: raw ResourceSpace status, portal reuse state, blockers, source/provenance, reviewer/date, rights, people/minors, metadata confidence, files, tags, and related assets.
- Mobile detail shows title, reuse state, blockers, and download decision before preview/related assets.
- Unknown people/minors and rights states tell users a reviewer should confirm before public use.
- ResourceSpace approval is shown separately from portal reuse.

## Reuse

- Download panel separates Web image, Slide/presentation, Social square, Request original access, Request review, and Original/master restricted.
- Non-portal-ready assets show no active `/api/download` links for Viewer.
- Asset `367` remains blocked for Viewer download with `403`.
- Original/master files remain restricted.

## Govern

- Review is a compact workbench with governance metrics, queue tabs, dense rows, selected-asset inspector, evidence checklist, note field, action buttons, audit preview, ResourceSpace link, and pending-write messaging.
- Missing checklist/note fails with `400`.
- Valid evidence queues a local pending-write record and returns `202`; it does not claim ResourceSpace is updated.

## Visual System

- Removed giant hero blocks, oversized cards, heavy font weights, pale green wash, repeated dashboard cards, and broken-image-looking thumbnails.
- Contact-sheet asset cards use compact status, title, collection/source, usage, and blocked/download state.
- No-preview derivatives are labeled as `Preview pending` or `Preview unavailable`.
- Guide is searchable secondary help with compact Do/Avoid rules.

## Browser QA Evidence

Chrome-backed screenshot capture refreshed:

- `docs/screenshots/library-desktop.png`
- `docs/screenshots/library-mobile-320.png`
- `docs/screenshots/asset-detail-desktop.png`
- `docs/screenshots/detail-mobile-320.png`
- `docs/screenshots/upload-desktop.png`
- `docs/screenshots/upload-mobile-320.png`
- `docs/screenshots/review-desktop.png`
- `docs/screenshots/review-mobile-320.png`
- `docs/screenshots/guide-desktop.png`
- `docs/screenshots/guide-mobile-320.png`
- `docs/screenshots/collections-desktop.png`

Measured browser QA:

- 1440 px and 320 px screenshots had no horizontal page overflow.
- Library, detail, upload, review, guide, and collections rendered at expected routes.
- Viewer detail for asset `367` had zero active `/api/download` links.
- Review mobile and desktop had no horizontal overflow.

## Checks

- `npm run typecheck`: pass.
- `npm run build`: pass.
- `make frontend-check`: pass after clean `.next` rebuild.
- `make demo-check`: pass.
- `make smoke`: pass with Docker daemon / ResourceSpace container warnings only.
- `make launch-readiness`: pass with warnings for `.env` placeholders and 16 GiB free disk.
- `git diff --check`: pass.
- `BASE_URL=http://127.0.0.1:3008 make portal-api-smoke`: pass.
- `BASE_URL=http://127.0.0.1:3008 make portal-browser-qa`: pass with zero failures, zero warnings, and zero console errors.

## Current Blockers

- ResourceSpace API write mapping is not configured.
- Demo role switch must become real church access control.
- Production host, access allowlist, backup schedule, and restore ownership remain external.
- Production derivative policy still needs approved presets for web, slide, social, and approved copy.
- Current ResourceSpace export lacks preview derivatives for many first-batch assets; UI handles this honestly but product readiness improves when derivatives are exported/configured.
