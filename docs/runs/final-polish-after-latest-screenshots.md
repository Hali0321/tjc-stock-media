# Final Polish After Latest Screenshots

Generated: 2026-06-07

Starting HEAD: `25e9790f145b07d05d367d69df3ad4538f3bfe81`

Branch: `codex/industry-dam-ui-rebuild`

Commit/push: not requested; not performed.

## Fix Log

| Issue | Screenshot Where Seen | Files Changed | Fix Applied | Proof Screenshot | QA Result |
|---|---|---|---|---|---|
| Asset Detail desktop left column went blank after Use Guidance while right rail continued | `docs/screenshots/asset-detail-desktop.png` | `frontend/components/AssetDetailPage.tsx`, `frontend/app/globals.css` | Moved Governance Passport, Tags, and Related into desktop left flow below tabs; kept mobile lower ordering. Added two-line title clamp. | `docs/screenshots/proof/asset-detail-left-column-no-dead-zone.png`, `docs/screenshots/proof/asset-detail-governance-below-use-guidance.png` | Browser QA passed |
| Raw filename/dimension titles could dominate Asset Detail | `docs/screenshots/asset-detail-desktop.png` | `frontend/lib/display.ts`, `frontend/app/globals.css` | Extended shared title cleanup to remove leading dimensions, raw/uncropped noise, date stamps, and importer icon tokens. | `docs/screenshots/asset-detail-desktop.png` | Typecheck/build/browser QA passed |
| Review desktop remained three squeezed columns | `docs/screenshots/review-desktop.png` | `frontend/components/ReviewPage.tsx` | Replaced three-column workbench with two columns: queue left, combined selected asset plus evidence/actions inspector right. | `docs/screenshots/proof/review-desktop-two-column-inspector.png` | Browser QA passed |
| Review queue rows clipped status/action content | `docs/screenshots/review-desktop.png` | `frontend/components/ReviewPage.tsx` | Reduced DataTable to preview, asset, submitter, primary blocker, action; long status details remain in inspector. | `docs/screenshots/proof/review-queue-no-clipped-actions.png` | Browser QA passed |
| Upload desktop still had sparse vertical rhythm | `docs/screenshots/upload-desktop.png` | `frontend/components/UploadPage.tsx`, `frontend/app/globals.css` | Tightened form gap/margins and kept reviewer packet directly beneath first two columns while files column continues. | `docs/screenshots/proof/upload-desktop-no-dead-zone.png` | Browser QA passed |
| Library empty state flowed into collections without transition copy | `docs/screenshots/library-desktop.png` | `frontend/components/LibraryPage.tsx` | Added explicit “Browse collections instead” bridge when asset results are empty. | `docs/screenshots/proof/library-empty-collections-transition.png` | Browser QA passed |
| Collections desktop hero placeholder carried too much visual weight | `docs/screenshots/collections-desktop.png` | `frontend/components/CollectionsPage.tsx` | Reduced desktop spotlight placeholder height and column weight; changed copy to “Cover pending”. | `docs/screenshots/proof/collections-placeholder-reduced.png` | Browser QA passed |

## Safety Notes

- ResourceSpace source-of-truth copy retained.
- Raw ResourceSpace status remains separate from computed portal reuse state.
- Review write mapping copy remains pending/not configured.
- Upload intake copy remains staged/pending, not approved.
- No download policy code changed.

## QA

- `npm --prefix frontend run typecheck`: pass.
- `npm --prefix frontend run build`: pass.
- `git diff --check`: pass.
- `BASE_URL=http://localhost:3038 make portal-api-smoke`: pass.
- `BASE_URL=http://localhost:3038 make portal-browser-qa`: pass, 0 failures, 0 console errors, 0 network failures.
- `make frontend-check demo-check launch-readiness`: pass with 2 existing launch warnings: `.env` placeholders and local disk below 20 GiB.
- Viewer unsafe download: `403`.
- Viewer original/master-like request: `403`.

## Usability Hierarchy Pass

Triggered by follow-up audit that UI was visually polished but still exposed too much internal DAM state.

| Issue | Files Changed | Fix Applied | Proof Screenshot | QA Result |
|---|---|---|---|---|
| Blocked downloads looked like actions | `frontend/components/DownloadOptionsPanel.tsx`, `frontend/components/AssetDetailPage.tsx`, `frontend/components/AssetQuickLookDialog.tsx`, `frontend/components/StatusBadge.tsx`, `frontend/lib/reuse-policy.ts` | Changed blocked download button into `Download unavailable` status plus one primary `Request review` action. Reworded visible `portal review`/`derivative` copy to user-facing `Needs review`/`approved copy`. | `docs/screenshots/proof/ux-asset-detail-one-primary-action.png`, `docs/screenshots/proof/ux-asset-detail-mobile-320.png` | Browser assertion passed |
| Restricted thumbnails looked like broken media | `frontend/components/AssetDetailPage.tsx` | Hide repeated blank thumbnail/related placeholders when no role-safe image exists; show one explanatory restricted-preview message instead. | `docs/screenshots/proof/ux-asset-detail-one-primary-action.png` | Browser assertion passed |
| Library mobile empty state could dead-end | `frontend/components/LibraryPage.tsx` | Added mobile empty bridge with `Browse collections` primary action and `Clear search` secondary action. | `docs/screenshots/proof/ux-library-mobile-empty-bridge.png` | Browser assertion passed |
| Collections mixed Albums/Shelves terms and empty collections had open actions | `frontend/components/AppNav.tsx`, `frontend/components/CommandPalette.tsx`, `frontend/components/CollectionsPage.tsx`, `frontend/components/CollectionAlbumCard.tsx`, `frontend/components/CollectionShelfInspector.tsx`, `frontend/components/DamStates.tsx` | Standardized visible label to `Collections`; empty collections now show `No assets yet` and no `Open Library` action. | `docs/screenshots/proof/ux-collections-empty-actions.png` | Browser assertion passed |
| Admin Queue/Backlog mismatch | `frontend/components/AdminPage.tsx` | Renamed admin blocker tab/nav to `Action backlog`; kept `Review queue` only for reviewer asset queues. | `docs/screenshots/proof/ux-admin-action-backlog-term.png` | Browser assertion passed |
| Review mobile/actions had too many competing labels | `frontend/components/ReviewPage.tsx`, `frontend/components/ReviewQueueAssetCard.tsx`, `scripts/portal-browser-qa.mjs` | Simplified queue action label to `Review`, removed table `Detail` action duplication, and updated QA to assert new user-facing copy. | `docs/screenshots/proof/ux-review-one-review-action.png` | Browser QA passed |

Additional QA:

- `BASE_URL=http://localhost:3039 make portal-browser-qa`: pass, 0 failures, 0 console errors, 0 network failures.
- Fresh Playwright assertions on `3039`: passed for asset primary action, collection empty actions, Library mobile empty bridge, Admin action backlog tab, Review action label.

## P0 Product-Hierarchy Pass

Triggered by latest screenshot audit: the app looked visually improved but still exposed too much internal DAM state and repeated actions.

| Issue | Files Changed | Fix Applied | Proof Screenshot | QA Result |
|---|---|---|---|---|
| Upload submit looked available with no file or source link | `frontend/components/UploadPage.tsx`, `frontend/components/UploadIntakePacket.tsx` | Submit now requires at least one selected file or a valid `http`/`https` source link. Invalid submit remains focusable as a button, shows “Add a file or source link before submitting.”, and scrolls focus to source/file area. Save Draft remains available. | `docs/screenshots/proof/p0-upload-submit-disabled-source-required.png` | Typecheck/build/browser QA passed |
| Asset Detail repeated blocked-download actions | `frontend/components/AssetDetailPage.tsx`, `frontend/components/DownloadOptionsPanel.tsx`, `frontend/components/DamStates.tsx` | First decision card now owns the primary `Request review` CTA plus secondary coworker/original-access actions. Download panel is status/explanation only. Removed visible `Use request workflow`. | `docs/screenshots/proof/p0-asset-detail-primary-decision-action.png` | Browser QA passed |
| Asset Detail tabs could wrap at 320px | `frontend/components/DamTabs.tsx`, `frontend/app/globals.css` | DAM tabs now stay in a single horizontal scroll row on narrow screens. QA ignores expected clipped controls inside the tab scroller only. | `docs/screenshots/proof/p0-asset-detail-mobile-tabs-320.png` | Browser QA passed |
| Review mobile duplicated the selected asset above the queue | `frontend/components/ReviewPage.tsx`, `frontend/components/ReviewQueueAssetCard.tsx` | Mobile is queue-first; selected item collapses to a compact `Currently reviewing` row instead of duplicating a full preview. Queue cards use one `Review` action. | `docs/screenshots/proof/p0-review-mobile-queue-first-currently-reviewing.png` | Browser QA passed |
| Review desktop metric and inspector hierarchy still felt technical/empty | `frontend/components/ReviewPage.tsx`, `frontend/components/HoldReleaseButton.tsx` | Hero metric leads with total pending reviews and loaded count as secondary. Right rail stays as a sticky reviewer workspace with selected asset, risk, evidence, decision actions, note, and submit/save controls. | `docs/screenshots/proof/review-desktop-two-column-inspector.png`, `docs/screenshots/proof/review-desktop-no-inspector-overflow.png` | Browser QA passed |
| Admin zero-count backlog rows showed active queue actions | `frontend/components/AdminPage.tsx` | Zero-count rows now show static `No open items` or `View policy` labels; active `Review queue` appears only for rows with open assets. | `docs/screenshots/proof/p0-admin-zero-count-static-actions.png` | Browser QA passed |
| Library empty results kept irrelevant selection/view controls | `frontend/components/LibraryPage.tsx` | Empty result state hides `0 selected`, Grid/List toggles, and bulk selection controls. Clear/Browse actions remain prominent. | `docs/screenshots/proof/p0-library-empty-no-selection-controls.png` | Browser QA passed |
| Browser QA could fail on stale chunks or expected scroll-tab clipping | `scripts/portal-browser-qa.mjs` | Added `gotoAndSettle()` load helper and narrowed clipping detection so intentional mobile tab scrolling is not reported as page overflow. | `docs/screenshots/qa/browser-qa-report.json` | Browser QA passed |

Latest QA:

- `npm --prefix frontend run typecheck`: pass.
- `npm --prefix frontend run build`: pass.
- `git diff --check`: pass.
- `BASE_URL=http://localhost:3043 make portal-api-smoke`: pass.
- `BASE_URL=http://localhost:3043 make portal-browser-qa`: pass, 0 failures, 0 console errors, 0 network failures.
- `make frontend-check demo-check launch-readiness`: pass with 1 existing launch warning: `.env` placeholders.

## Remaining Risks

- Launch readiness still warns on environment placeholders.
- Real auth/SSO and ResourceSpace write mapping remain production blockers.
- Remaining next-pass UX work is now narrower: viewer trust copy can still be tuned after fresh human screenshots, but the major workflow issues from this audit have been addressed.

## Workflow Redesign Follow-up Pass

Triggered by follow-up audit that the app was safer but still felt like an internal DAM/admin system wearing a user-friendly skin.

| Issue | Files Changed | Fix Applied | QA Result |
|---|---|---|---|
| Review mobile placed selected review work after queue list | `frontend/components/ReviewPage.tsx` | Mobile now puts the selected `Currently reviewing` decision workspace before the remaining queue items. The selected queue card is removed from the mobile list to avoid duplication. Decision options appear before note/checklist. | Browser QA + live mobile spot-check passed |
| Upload mobile exposed the whole compliance form at once | `frontend/components/UploadPage.tsx` | Added a four-step mobile flow: Context, People and rights, Files or source, Review and submit. Next step validates current required inputs and blocks progress until file/source, tags, and notes are present. Desktop layout unchanged. | Typecheck/build/browser QA passed |
| Upload blocked submit still looked too primary | `frontend/components/UploadPage.tsx` | Disabled submit state now loses primary visual weight with muted background/text/shadow while Save Draft stays active. | Typecheck/build/browser QA passed |
| Asset Detail viewer tabs and trust panels were still too technical | `frontend/components/AssetDetailPage.tsx`, `frontend/components/AssetTrustPanel.tsx`, `frontend/components/DownloadOptionsPanel.tsx` | Viewer tabs now show only Use, Source, Files. Trust details and Related are collapsed by default for viewers, and blocked viewer download no longer repeats the original/master restriction card. | Typecheck/build/browser QA passed |
| Collections repeated selected collection in spotlight, list, and inspector | `frontend/components/CollectionsPage.tsx`, `frontend/components/CollectionAlbumCard.tsx`, `frontend/components/CollectionShelfInspector.tsx` | Removed the desktop spotlight. Desktop now uses list + right inspector. Mobile renders the selected details immediately after the tapped card. Empty collections show `No assets yet` without CTA. CTA label standardized to `Open Library results`. | Browser QA passed |
| Library mobile search and empty copy were too heavy/misleading | `frontend/components/LibraryPage.tsx` | Mobile search bar is compact. Empty copy now distinguishes search/filter misses, empty saved views, and empty collections without contradicting collection counts. | Browser QA passed |
| Admin led with readiness score instead of launch status | `frontend/components/AdminPage.tsx`, `frontend/components/AppNav.tsx` | Admin hero now leads with `Launch blocked`, lists ResourceSpace write mapping, real auth/SSO, and rights/consent coverage as blockers, and demotes readiness score. DAM Admin role now gets an Admin nav item in bottom/primary nav. | Browser QA + live mobile spot-check passed |
| Guide still read like a policy document | `frontend/components/GuidePage.tsx` | Mobile Guide now starts with task cards under `What are you trying to do?`; each task opens Do/Avoid guidance and keeps `Ask a media coworker` as fallback. Desktop keeps structured guide. | Browser QA + live mobile spot-check passed |
| Browser QA asserted old Library empty copy | `scripts/portal-browser-qa.mjs` | Updated empty-state assertion to `No matching approved assets`. | Browser QA passed |

Latest follow-up QA:

- `npm --prefix frontend run typecheck`: pass.
- `npm --prefix frontend run build`: pass.
- `git diff --check`: pass.
- `BASE_URL=http://localhost:3044 make portal-api-smoke`: pass.
- `BASE_URL=http://localhost:3044 make portal-browser-qa`: pass, 0 failures, 0 console errors, 0 network failures, 9 expected denied console/API events.
- `make frontend-check demo-check launch-readiness`: pass with 1 existing launch warning: `.env` placeholders.
- Live Playwright spot-check on fresh `http://localhost:3045`: Upload mobile stepper, Review selected workspace first, Admin launch-blocked hero, Guide task mobile all passed.

Fresh dev server after final build:

- `http://localhost:3045`

## GitHub Readiness Verification

Run on 2026-06-08 before committing this version for normal GitHub branch review.

- `npm --prefix frontend run typecheck`: pass.
- `npm --prefix frontend run build`: pass.
- `git diff --check`: pass.
- `make frontend-check demo-check launch-readiness`: pass with 1 existing launch warning: `.env` placeholders.
- `BASE_URL=http://localhost:3047 make portal-api-smoke`: pass.
- `BASE_URL=http://localhost:3047 make portal-browser-qa`: pass, 0 failures, 0 warnings, 0 console errors, 0 network failures, 9 expected denied console/API events.

Fresh dev server after final verification:

- `http://localhost:3047`
