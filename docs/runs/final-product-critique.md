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
| 3 | Main nav and upload intake still missed two requested workflow components. | Added Tubelight-inspired nav, `Cmd/Ctrl+K` command palette, and upload file preview/remove controls. |
| 4 | Remaining limitation is ResourceSpace/export derivative readiness and production mapping, not UI polish or safety logic. | Refreshed screenshots and documented no-preview state as a data readiness signal. |
| 5 | Detail and review sections still used loose tab-like controls or one long inspector list. | Added maintained `DamTabs` with real tab semantics and arrow-key behavior for Asset Detail and Review inspector panels. |
| 6 | Original access and review-help actions were raw email links with little safety context. | Added `ReuseRequestDialog` so requests are clearly email drafts only and do not change ResourceSpace or pending writes. |
| 7 | Review mobile still felt endless because the queue rendered too many rows before progressive disclosure. | Added a 24-row load-more gate with exact loaded/total copy and preserved selected-row visibility. |

## Final Product Read

The portal now reads as a mature internal DAM workflow product rather than a landing page or decorative gallery. It is denser, more operational, more media-first where derivatives exist, and more honest where ResourceSpace export data is incomplete.

## Find

- Search is first on Library with ministry/use-case placeholder text.
- `Cmd/Ctrl+K` command palette jumps to saved views, collections, upload, review queues, Guide, Admin diagnostics, and ResourceSpace IDs.
- Saved views use stable view IDs for Website hero, Slides, Newsletter, Social, No people, Internal ready, Recently approved, Needs review, and related workflow queues.
- Results appear high on desktop and mobile.
- Counts distinguish rendered, matching, visible-to-role, approved, pending review, rights review, children/youth, and archive.
- Collections use album-style cards and stable collection IDs; Sabbath wording is preserved.
- Upload preview shows selected files, type/size, large-media handoff warning, and remove/clear controls before submit.

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
- Added restrained Tubelight-inspired workflow nav as maintained `AppNav`, without turning navigation into decoration.
- Contact-sheet asset cards use compact status, title, collection/source, usage, and blocked/download state.
- No-preview derivatives are labeled as `Preview pending` or `Preview unavailable`.
- Guide is searchable secondary help with compact Do/Avoid rules.

## Reference Accountability

| Reference/source | Used where | Implemented components | Rejected ideas | Reason | Screenshot evidence | Code paths | Remaining debt |
|---|---|---|---|---|---|---|---|
| 21st.dev | App shell, command access, operational cards, upload dropzone/preview, tag input, pagination, review/admin summaries, tabs, dialogs, secondary action dropdowns, and high-risk action confirmation | `AppNav`, `CommandPalette`, `SavedViewCard`, `LibraryPagination`, `DamTabs`, `DropdownActionMenu`, `AssetActionsMenu`, `HoldReleaseButton`, `InputWithTags`, `ReviewActionDialog`, `ReuseRequestDialog`, `UploadFileDropzone`, compact health/status cards | Full glassmorphism, hero components, pricing blocks, particles, component showcase | Workflow components helped real DAM tasks; decorative components would weaken safety clarity | `library-desktop.png`, `asset-detail-desktop.png`, `upload-desktop.png`, `review-desktop.png`, `admin-desktop.png` when refreshed | `frontend/components/AppNav.tsx`, `frontend/components/CommandPalette.tsx`, `frontend/components/SavedViewCard.tsx`, `frontend/components/LibraryPagination.tsx`, `frontend/components/DamTabs.tsx`, `frontend/components/DropdownActionMenu.tsx`, `frontend/components/AssetActionsMenu.tsx`, `frontend/components/HoldReleaseButton.tsx`, `frontend/components/InputWithTags.tsx`, `frontend/components/ReviewActionDialog.tsx`, `frontend/components/ReuseRequestDialog.tsx`, `frontend/components/UploadFileDropzone.tsx`, `frontend/components/UploadPage.tsx`, `frontend/components/AdminPage.tsx` | Download-options dialog remains deferred until derivative choices are richer. Theme toggle deferred pending safety contrast pass. |
| Dribbble DAM references | Library density, collections, review workbench, admin diagnostics | Contact-sheet grid, filter sidebar, collection album cards, Grid/List controls, dense review rows | Oversized dashboard cards and generic analytics panels | DAM browsing needs media density and triage speed, not decorative dashboard rhythm | `library-desktop.png`, `collections-desktop.png`, `review-desktop.png` | `frontend/components/LibraryPage.tsx`, `frontend/components/AssetCard.tsx`, `frontend/components/FilterSidebar.tsx`, `frontend/components/CollectionAlbumCard.tsx`, `frontend/components/ReviewPage.tsx` | True table-view metadata density can still be deepened later; Grid/List controls exist now. |
| Awwwards | Asset detail image treatment, restrained visual polish, Guide readability | Large preview/detail trust layout, minimal contextual UI | Cinematic heroes, flashy scroll motion, portfolio storytelling | Restraint improved media inspection; storytelling would slow ministry workflows | `asset-detail-desktop.png`, `detail-mobile-320.png`, `guide-desktop.png` | `frontend/components/AssetDetailPage.tsx`, `frontend/components/MediaPreview.tsx`, `frontend/components/GuidePage.tsx` | Dedicated zoom/inspection dialog remains deferred. |
| CodePen upload/gallery patterns | Contributor intake and preview behavior | Drop/browse upload target, selected-file preview, file type/size, remove/clear, large-media warning | Pure decorative uploader and masonry-lightbox-first browsing | Upload dropzone was useful; lightbox-first gallery would hide DAM metadata and safety state | `upload-desktop.png`, `upload-mobile-320.png` | `frontend/components/UploadFileDropzone.tsx`, `frontend/components/UploadPage.tsx`, `frontend/app/api/upload/route.ts` | Safe image thumbnails can be added when real upload backend/policy is wired. |
| Godly / Frame.io mood | Media review SaaS polish | Review inspector, queue tabs, pending-write state | Dark-heavy trend chrome and collaboration-widget clutter | Review needed serious cockpit feel while staying church-safe and readable | `review-desktop.png`, `review-mobile-320.png` | `frontend/components/ReviewPage.tsx` | Comment-thread collaboration remains out of scope until ResourceSpace workflow mapping exists. |
| Monet | Admin/Guide calm enterprise sections | Diagnostics cards, production blocker sections, readable guide blocks | Marketing feature-showcase layout for Library | Monet-style calm works for docs/admin, not contact-sheet browsing | `admin-desktop.png`, `guide-desktop.png` | `frontend/components/AdminPage.tsx`, `frontend/components/GuidePage.tsx` | Admin remains read-only; ResourceSpace admin replacement intentionally rejected. |
| Pinterest moodboard | Archive/upload visual rhythm only | Album-card mood and upload selection layout | Dark neon dashboards, generic startup templates, nostalgic archive decoration | Moodboard used as loose density signal, not implementation source | `collections-desktop.png`, `upload-desktop.png` | `frontend/components/CollectionsPage.tsx`, `frontend/components/CollectionAlbumCard.tsx`, `frontend/components/UploadPage.tsx` | None beyond real derivative coverage improving thumbnail richness. |
| AI design tools | Research-only prompt direction | No app dependency added | Fake church people, AI media, decorative motion | Production DAM must not add fabricated ministry media or extra tool dependencies | Not applicable | No production code paths | Deferred by design. |
| Font references | App-wide typography | Inter + Noto Sans TC are current app fonts; Geist Mono remains for technical IDs | Extra font churn beyond current app stack | Inter/Noto supports dense product UI and Chinese fallback without changing safety/workflow behavior | All screenshots | `frontend/app/layout.tsx`, `frontend/app/globals.css`, `DESIGN.md` | Typography is stable; future pass can tune weights/spacing only. |
| Product/design references | Find/Trust/Reuse/Govern flows | Search/views, trust record, download gates, review queues, usage guide | Copying Brandfolder/Frontify/Bynder/PhotoShelter layouts directly | Borrowed product logic while preserving ResourceSpace truth layer and TJC rules | Full refreshed screenshot set | `frontend/components/*`, `frontend/lib/reuse-policy.ts`, `frontend/lib/asset-governance.ts`, `frontend/app/api/*` | Real auth, ResourceSpace write mapping, derivative presets, and original-access workflow remain production blockers. |

## 21st.dev Component Scouting Results

Subagent used: yes. Dedicated scouting subagent `019e9bb6-78c4-72e1-97c1-fa42cac99e66` reviewed the 21st.dev community library and Image Comparison Slider. A direct browser scouting pass also checked `https://21st.dev/community/components` and confirmed available categories including navigation menus, alerts, badges, buttons, cards, dialogs/modals, dropdowns, empty states, file uploads, forms, inputs, menus, paginations, sidebars, sliders, spinner loaders, tables, tabs, tags, text areas, toggles, and tooltips.

Selected patterns:

| 21st.dev pattern/category | Status | Replaced old pattern | Why it fits TJC Stock Media | Style normalization | Code paths | Screenshot evidence |
|---|---|---|---|---|---|---|
| Tubelight Navbar | Implemented | Inline primary nav | Clarifies Library, Collections, Upload, Review as core workflows | Evergreen active surface, subtle border, low motion, role-aware Admin | `frontend/components/AppNav.tsx`, `frontend/components/AppChrome.tsx` | `library-desktop.png`, `library-mobile-320.png` |
| Command palette / menus | Implemented | Slow manual route and saved-view switching | Speeds asset search, saved views, collection jumps, stable review queue URLs, ResourceSpace IDs | White dialog shell, evergreen icons, Arrow/Home/End selection, focus trap, no neon/glass showcase | `frontend/components/CommandPalette.tsx`, `frontend/components/ReviewPage.tsx`, `frontend/app/review/page.tsx` | `library-desktop.png`, `review-desktop.png` |
| Display cards | Implemented selectively | Oversized generic dashboard cards | Good for saved views, review metrics, admin health, metadata confidence | Compact white operational cards, no asset-grid use | `frontend/components/SavedViewCard.tsx`, `frontend/components/CollectionAlbumCard.tsx`, `frontend/components/AdminPage.tsx`, `frontend/components/ReviewPage.tsx` | `library-desktop.png`, `collections-desktop.png`, `admin-desktop.png` |
| File upload dropzone / preview | Implemented | Plain file input | Contributors can drop/browse files, see selected file, type, size, large-media warning, remove/clear | Neutral dashed dropzone, review-blocked receipt copy | `frontend/components/UploadFileDropzone.tsx`, `frontend/components/UploadPage.tsx` | `upload-desktop.png`, `upload-mobile-320.png` |
| Input with tags | Implemented | Plain comma-only suggested-tags field | Contributors add taxonomy-backed tags from existing visible-content and TJC terms without creating a second taxonomy | Compact tag chips, evergreen focus, suggestion buttons, non-canonical typed terms rejected, hidden canonical-only form value for server route | `frontend/components/InputWithTags.tsx`, `frontend/components/UploadPage.tsx`, `frontend/lib/taxonomy.ts`, `frontend/app/api/upload/route.ts` | `upload-desktop.png`, `upload-mobile-320.png` |
| Review table/list cockpit | Implemented | Long soft review card list | Reviewers can triage blockers, raw status, pending writes, and evidence quickly | Dense rows, sticky inspector, readable warnings | `frontend/components/ReviewPage.tsx` | `review-desktop.png`, `review-mobile-320.png` |
| Review load-more | Implemented | Rendering up to 80 review rows at once | Keeps the governance queue dense without making mobile feel endless | Shows first 24 loaded rows with exact copy and an explicit load-more action | `frontend/components/ReviewPage.tsx` | `review-desktop.png`, `review-mobile-320.png` |
| Tabs | Implemented | Asset detail loose buttons and long review inspector fact list | Gives Use/Source/Review/Files/Related and Checklist/Metadata/Rights/History/Pending write stable, keyboard-friendly task sections | Shared `DamTabs`, evergreen active state, real `tablist`/`tab`/`tabpanel`, arrow-key movement | `frontend/components/DamTabs.tsx`, `frontend/components/AssetDetailPage.tsx`, `frontend/components/ReviewPage.tsx` | `asset-detail-desktop.png`, `review-desktop.png`, mobile screenshots after refresh |
| Dialog / modal | Implemented for review actions | Immediate action POST after checklist | Confirmation step makes local pending-write semantics explicit before any queued review action | Focus-trapped white shell, evergreen confirm action, no decorative glass, Escape/cancel supported | `frontend/components/ReviewActionDialog.tsx`, `frontend/components/ReviewPage.tsx` | `review-desktop.png`, `review-mobile-320.png` |
| Request dialogs | Implemented | Raw `mailto:` request links | Original access, review request, and media coworker help now explain that email drafts do not grant access or update ResourceSpace | Focus-trapped white shell, explicit no-fake-persistence copy, role/status context visible | `frontend/components/ReuseRequestDialog.tsx`, `frontend/components/DownloadOptionsPanel.tsx` | `asset-detail-desktop.png`, `detail-mobile-320.png` |
| Dropdown menu | Implemented for Asset Detail and Review inspector | Standalone ResourceSpace admin link and scattered copy/open actions | Secondary copy/open actions belong in a quiet menu, while trust/reuse/review safety remains visible on page | White menu, evergreen focus, Viewer/Reviewer cannot see ResourceSpace admin action | `frontend/components/DropdownActionMenu.tsx`, `frontend/components/AssetActionsMenu.tsx`, `frontend/components/AssetDetailPage.tsx`, `frontend/components/ReviewPage.tsx` | `asset-detail-desktop.png`, `detail-mobile-320.png`, `review-desktop.png` |
| Hold-and-release button | Implemented for high-risk review actions | Ordinary buttons for archive/do-not-publish decisions | Archive-only and do-not-publish queueing should require intentional hold after evidence is complete | Muted red progress fill, keyboard/pointer hold support, disabled until checklist/note pass | `frontend/components/HoldReleaseButton.tsx`, `frontend/components/ReviewPage.tsx` | `review-desktop.png`, `review-mobile-320.png` |
| Badges / alerts / tooltips | Implemented selectively | Inconsistent chip-heavy safety text | Keeps raw status, portal reuse state, and blockers visible | Text plus color, no tooltip-only safety copy | `frontend/components/StatusBadge.tsx`, `frontend/components/DownloadOptionsPanel.tsx`, `frontend/components/AssetTrustPanel.tsx` | `asset-detail-desktop.png`, `detail-mobile-320.png` |
| Pagination | Implemented | First-page-only result browsing | Lets large DAM searches move through results without losing search, view, collection, sort, or count truth | Compact evergreen controls, disabled states, exact `Showing X-Y of Z` copy | `frontend/components/LibraryPagination.tsx`, `frontend/components/LibraryPage.tsx`, `frontend/app/api/assets/search/route.ts` | `library-desktop.png`, `library-mobile-320.png` |

Rejected or deferred:

| Component/pattern | Status | Reason |
|---|---|---|
| Image Comparison Slider | Deferred | Useful for reviewer/admin derivative comparison, but current export lacks safe paired derivative/original previews. Must not expose restricted originals to Viewer. Future path: `frontend/components/ImageComparisonReviewPanel.tsx`. |
| Theme toggle | Deferred | Dark mode needs full safety-label contrast verification before release. |
| Download options dialog | Deferred | Request dialogs are implemented; a richer derivative download dialog waits until production derivative presets exist. |
| Floating quick-action dock | Deferred | Risks duplicating primary nav and crowding mobile. |
| Heavy glassmorphism / shaders / particles / heroes / pricing sections | Rejected | These weaken DAM scanning, rights/status readability, and church-safe tone. |
| Pagination/load more | Implemented as pagination | API now supports `offset`, Library preserves search/filter/view/sort state, and UI shows exact result ranges. |

Component-system debt now tracked in:

- `docs/ui-system/component-inventory.md`
- `docs/ui-system/design-decision-log.md`

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
- `docs/screenshots/admin-desktop.png`

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
- Browser QA now includes command palette, command arrow-key selection, upload file-preview checks, Review inspector tab checks, Asset Detail tab checks, tab `aria-controls` target checks, request-original dialog safety-copy checks, and review load-more checks.

## Current Blockers

- ResourceSpace API write mapping is not configured.
- Demo role switch must become real church access control.
- Production host, access allowlist, backup schedule, and restore ownership remain external.
- Production derivative policy still needs approved presets for web, slide, social, and approved copy.
- Current ResourceSpace export lacks preview derivatives for many first-batch assets; UI handles this honestly but product readiness improves when derivatives are exported/configured.
- Theme toggle is deferred until dark-mode status contrast can be fully designed and verified.
- Pagination beyond the first API cap is implemented for Library; richer collection/detail pagination remains future scope.
