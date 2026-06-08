# UI debug combined pass

Date: 2026-06-07

Starting HEAD: `25e9790f145b07d05d367d69df3ad4538f3bfe81`

## Path Notes

The repo does not use `frontend/src`; active frontend code lives under:
- `frontend/app`
- `frontend/components`
- `frontend/lib`

## Fix Log

| Bug | Screenshot where seen | Files changed | Fix applied | Proof |
| --- | --- | --- | --- | --- |
| Mobile bottom nav overlapping content | Latest mobile screenshots across Library, Collections, Upload, Review, Asset Detail, Admin, Guide | `frontend/components/AppChrome.tsx`, `frontend/components/AppNav.tsx`, `frontend/app/globals.css` | Mobile nav moved out of fixed overlay and into normal document flow below main content; tap target height reduced; shared safe-area padding retained. | refreshed screenshots in `docs/screenshots/*mobile*`; proof screenshots under `docs/screenshots/proof/` |
| Review browser QA duplicate `Review note` label | `portal-browser-qa` strict-mode failure | `frontend/components/ReviewPage.tsx` | Removed duplicate hidden/visible evidence-control DOM. Single details panel is open on desktop and collapsed on mobile. | `portal-browser-qa` rerun pending after patch |
| Review mobile selected-first | `review-mobile-320.png`, `review-mobile-390.png` | `frontend/components/ReviewPage.tsx`, `frontend/components/ReviewQueueAssetCard.tsx` | Selected asset block split from action inspector; compact mobile queue cards; mobile evidence collapsible. | `docs/screenshots/review-mobile-320.png`, `docs/screenshots/proof/review-mobile-selected-first.png` |
| Hold button scope | Review workbench screenshots | `frontend/components/ReviewPage.tsx` | `HoldToConfirmButton` only renders for `archive-only` and `do-not-publish`; normal actions are ordinary buttons. | Review screenshot / DOM proof |
| Upload desktop dead zone | `upload-desktop.png` | `frontend/components/UploadPage.tsx`, `frontend/app/globals.css` | Desktop upload grid uses `context people files / packet packet files / actions actions actions`. | `docs/screenshots/upload-desktop.png`, `docs/screenshots/proof/upload-balanced-desktop.png` |
| Toast stacking/field coverage risk | Upload tag/toast screenshots | `frontend/components/AppChrome.tsx`, `frontend/lib/tjc-toasts.tsx` | Toaster moved bottom-center with offsets; upload/draft toasts use stable ids and submit completion dismisses start toast. | QA pending |
| Collections clipping/sticky | `collections-desktop.png`, `collections-1024-no-clipping.png` | `frontend/components/CollectionsPage.tsx`, `frontend/components/CollectionAlbumCard.tsx`, `frontend/components/LibraryPage.tsx` | Spotlight capped/top-aligned; inspector sticky offset uses header variable; album cards wrap pills; mobile full-card overlay disabled. | `docs/screenshots/collections-desktop.png`, `docs/screenshots/proof/collections-1024-no-clipping.png` |
| Asset Detail preview/related compactness | `detail-mobile-320.png`, `asset-detail-related-compact.png` | `frontend/components/MediaPreviewPanel.tsx`, `frontend/components/AssetDetailPage.tsx` | Compact preview height reduced; related assets remain compact link cards. | `docs/screenshots/detail-mobile-320.png`, `docs/screenshots/proof/asset-detail-related-compact.png` |
| Skip link visible without focus | Upload desktop screenshot | `frontend/app/globals.css` | Skip link opacity/pointer-events hidden by default, visible on focus/focus-visible. | DOM proof: hidden until focus |
| Asset actions strict-mode/mobile access | `portal-browser-qa` strict-mode failures on `/assets/368` | `frontend/components/AssetActionsMenu.tsx`, `frontend/components/AssetDetailPage.tsx` | Primary `Asset actions` remains visible on desktop/mobile; secondary ResourceSpace block is named `Source actions` to avoid duplicate accessible names. | `portal-browser-qa` pass at `2026-06-07T20:46:26.334Z` |
| Admin backlog proof hidden | `portal-browser-qa` proof capture for `#backlog` | `frontend/components/AdminPage.tsx` | Admin defaults to Queue tab so production blocker backlog DataTable is visible for proof capture. | `docs/screenshots/primitive-proof/admin-datatable.png` |
| Horizontal control clipping | QA report failures on Review, Admin, Guide, Detail tabs | `frontend/components/DamTabs.tsx`, `frontend/components/GuidePage.tsx`, `frontend/components/ReviewPage.tsx`, `frontend/components/ReviewQueueAssetCard.tsx` | DAM tabs and guide jump chips now wrap; Review workbench columns use zero-min grid tracks and capped panels/buttons. | `portal-browser-qa` pass; no clipped controls across 15 pages x 6 viewports |
| Library empty-state duplication | `library-mobile-320.png` | `frontend/components/LibraryPage.tsx` | Empty result state now shows one message/card; sort, pagination, duplicate summary, and empty contact grid are hidden when no assets are visible. | `docs/screenshots/library-mobile-320.png` refreshed after final QA |
| Library search chip count | `portal-browser-qa` search interaction | `frontend/components/LibraryPage.tsx` | Search pill appears once in active filters instead of repeating inside result summary. | `portal-browser-qa` pass |
| Asset detail related tab keyboard | `portal-browser-qa` asset detail tab assertion | `frontend/components/AssetDetailPage.tsx` | Related section heading now matches `Related` after ArrowRight from Files tab. | `portal-browser-qa` pass |

## QA

Passed final:
- `npm --prefix frontend run typecheck`
- `npm --prefix frontend run build`
- `git diff --check`
- `BASE_URL=http://localhost:3034 make portal-browser-qa`
  - checked: `2026-06-07T20:46:26.334Z`
  - pages: `15`
  - viewports: `1440, 1280, 1024, 768, 390, 320`
  - screenshots: `20`
  - failures: `0`
  - consoleErrors: `0`
  - networkFailures: `0`
  - warnings: `0`
  - expectedDeniedConsole: `9`
- `BASE_URL=http://localhost:3034 make portal-api-smoke`
- unsafe download smoke: `/api/download/367?role=Viewer` returned `403`
- original/master-like request smoke: `/api/download/368?role=Viewer&variant=original` returned `403`
- `make frontend-check demo-check launch-readiness`
  - launch readiness failures: `0`
  - launch readiness warnings: `.env` placeholders, local free disk below 20 GiB (`15 GiB`)

Passed earlier in this combined pass:
- `make smoke` completed with Docker warnings.

## Safety Preserved

- ResourceSpace remains source of truth.
- Pending review writes remain local/pending until ResourceSpace write mapping exists.
- No fake ResourceSpace write success added.
- Viewer unsafe download and Viewer original/master-like request both return `403`.
- Demo role switch remains non-production auth.
- Upload intake remains staged/pending, not approved.
