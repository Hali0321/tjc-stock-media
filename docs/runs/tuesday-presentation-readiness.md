# Tuesday Presentation Readiness

Status: Tuesday presentation / church pilot demo candidate

Checked on 2026-06-06.

## Git State

Start of visual rebuild branch: `f4362287cc4070c6e18111717b5802b7b4ead159`.

Safety checkpoint before broad UI refactor: `0ec41407cfaa015fcd0adfd9d233956d25b10097`.

End state contains the visual rebuild changes, refreshed QA screenshots, and this handoff/readiness documentation. Final commit hash should be read from `git rev-parse HEAD` after the commit is created.

Current notable paths:

- Visual system: `frontend/app/globals.css`
- App chrome/nav: `frontend/components/AppNav.tsx`
- DAM surfaces: `frontend/components/AssetCard.tsx`, `frontend/components/MediaPreview.tsx`, `frontend/components/SavedViewCard.tsx`, `frontend/components/FilterSidebar.tsx`, `frontend/components/LibraryPagination.tsx`
- Workflows: `frontend/components/LibraryPage.tsx`, `frontend/components/AssetDetailPage.tsx`, `frontend/components/UploadPage.tsx`, `frontend/components/ReviewPage.tsx`, `frontend/components/CollectionsPage.tsx`, `frontend/components/AdminPage.tsx`, `frontend/components/GuidePage.tsx`
- Accessibility hardening: `frontend/components/DamTabs.tsx`
- QA evidence: `docs/screenshots/qa/`
- Final evidence report: `docs/runs/industry-dam-ui-final-report.md`

## Before / After Visual Inspection

### Library Desktop

- Improved: changed from unstyled/repetitive admin layout into a dense DAM contact sheet with saved views, filters, count truth, card overlays, and intentional restricted states.
- Still weaker: many assets remain placeholder/restricted because real derivatives are incomplete.
- Acceptable for Tuesday demo: yes.
- Remaining fix made: recaptured screenshots from production `next start` to remove Next dev indicator.

### Asset Detail Desktop

- Improved: split-view workspace now answers “Can I use this?” immediately through trust panel, blockers, governance passport, reuse options, and files/use/review tabs.
- Still weaker: primary preview can still be unavailable for Viewer because derivative policy is not complete.
- Acceptable for Tuesday demo: yes, because blocked preview state is visually intentional and safety-honest.
- Remaining fix made: verified inactive tab panels remain mounted with stable `aria-controls`.

### Upload Desktop

- Improved: upload now reads as a real intake workflow with context, people/rights, file/tag card, selected-file preview, and review-state framing.
- Still weaker: desktop layout has some open vertical space when the right files/tags column is taller than the first two columns.
- Acceptable for Tuesday demo: yes.
- Remaining fix made: refreshed selected-file screenshot and verified upload default remains `Needs Review / Do Not Publish`.

### Review Desktop

- Improved: review now reads as an approval cockpit with queue rows, governance counts, sticky inspector, tabs, evidence checklist, hold actions, and pending-write warning.
- Still weaker: queue is necessarily dense and long, especially with many pending assets.
- Acceptable for Tuesday demo: yes.
- Remaining fix made: refreshed pending-write dialog and hold-to-confirm screenshots.

### Guide Mobile 320

- Improved: guide changed from plain stacked text into a mobile-friendly operational guide with readable sections and Do/Avoid callouts.
- Still weaker: long policy content remains long on 320, but it is readable and not crushed.
- Acceptable for Tuesday demo: yes.
- Remaining fix made: confirmed no horizontal overflow at 320/390/768.

## Visual Blocker Checklist

- AppNav feels modern, not like a basic bordered strip: pass.
- Library feels like a DAM contact sheet: pass.
- Asset cards no longer feel like repeated pale placeholders: pass, within derivative limitations.
- Preview pending/restricted states look intentional, not broken: pass.
- Asset Detail answers “Can I use this?” quickly: pass.
- Upload feels like real selected-file intake: pass.
- Review feels like an approval cockpit: pass.
- Admin explains production blockers clearly: pass.
- Guide is cleaner and less repetitive: pass.
- Mobile 320/390/768 feels designed, not crushed: pass.
- No horizontal overflow: pass in refreshed capture metadata and portal browser QA.

## Safety Regression Checklist

- Viewer blocked download still returns `403`: pass.
- Viewer has no active restricted original/master links: pass.
- Reviewer POST without evidence still returns `400`: pass.
- Valid review action queues `202` pending-write: pass.
- Upload remains `Needs Review / Do Not Publish`: pass.
- No fake ResourceSpace persistence: pass.
- No committed media: pass.
- No committed secrets: pass.

## Commands Run

- `npm --prefix frontend run typecheck`: pass.
- `npm --prefix frontend run build`: pass.
- `make frontend-check`: pass.
- `make demo-check`: pass.
- `make portal-api-smoke`: pass.
- `make portal-browser-qa`: pass. Report: `docs/screenshots/qa/browser-qa-report.json`.
- `make smoke`: pass with warnings that Docker daemon was unavailable, ResourceSpace/MariaDB were not running, and `localhost:8088` did not respond.
- `make launch-readiness`: pass with 0 failures and 2 warnings.
- `git diff --check`: pass.

Portal browser QA result:

- 15 page/role paths.
- Viewports: 1440, 1280, 1024, 768, 390, 320.
- Failures: 0.
- Console errors: 0.
- Network failures: 0.
- Warnings: 0.
- Expected denied console entries: 9.

## Screenshot Evidence

Required pairs:

- `docs/screenshots/qa/before-library-desktop.png`
- `docs/screenshots/qa/after-library-desktop.png`
- `docs/screenshots/qa/before-detail-desktop.png`
- `docs/screenshots/qa/after-detail-desktop.png`
- `docs/screenshots/qa/before-upload-desktop.png`
- `docs/screenshots/qa/after-upload-desktop.png`
- `docs/screenshots/qa/before-review-desktop.png`
- `docs/screenshots/qa/after-review-desktop.png`
- `docs/screenshots/qa/before-guide-mobile-320.png`
- `docs/screenshots/qa/after-guide-mobile-320.png`

Interaction proof:

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

Capture metadata:

- `docs/screenshots/qa/refreshed-visual-captures.json`
- `docs/screenshots/qa/interaction-proof-screenshots.json`
- `docs/screenshots/qa/focused-visual-fidelity-qa.json`

## Image Comparison Slider Decision

Deferred. The 21st.dev Image Comparison Slider is real, but this pass did not discover safe paired derivative previews that can be used without exposing originals or fake media. Future implementation should live in Asset Detail > Files or Review inspector evidence panel after derivative policy provides approved pairs.

## Known Production Blockers

- Real auth/access allowlist is not done.
- Hosting/deployment is not done.
- ResourceSpace write mapping is not configured.
- Demo role switch is not production auth.
- Derivative presets and safe paired derivatives are incomplete.
- Backup/restore ownership and production run cadence need signoff.
- `.env` still contains placeholder values.
- Local free disk reported 11 GiB, below the 20 GiB readiness threshold.
- Docker daemon was unavailable during smoke check, so local ResourceSpace/MariaDB runtime was not verified live.

## What Hali Should Test Monday

- Walk the demo in production mode: `cd frontend && npm run start`.
- Check Library, Detail, Upload, Review, Admin, and Guide at 1440.
- Check Library, Detail, Upload, Review, and Guide at 320/390.
- Try Viewer download from `/assets/368`; it should stay blocked.
- Try Review approval without evidence; it should fail.
- Try valid Review approval with evidence; it should queue pending write only.
- Try Upload with a selected local file; receipt should remain `Needs Review / Do Not Publish`.
- Confirm stakeholders understand this is a pilot demo candidate, not production-ready.
