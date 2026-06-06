# TJC Stock Media UI Component Inventory

Last updated: 2026-06-06

This inventory records the 21st.dev scouting pass for TJC Stock Media. The source library was reviewed as a component idea library, not as drop-in branding. Every selected pattern must be restyled into the TJC DAM system: Inter + Noto Sans TC fallback, evergreen accent, subtle borders, restrained radius, high-contrast safety labels, consistent badge language, and mobile behavior that works at 320/390/768 px.

## Sources Reviewed

- 21st.dev community components: `https://21st.dev/community/components`
- Image Comparison Slider: `https://21st.dev/community/components/thanh/image-comparison-slider/default`

The community library exposes many useful and many unsuitable categories. Reviewed categories included navigation menus, command palettes/menus, cards, buttons, dialogs/modals, dropdowns, file uploads, forms, inputs, paginations, sidebars, sliders, skeleton/spinner loaders, tables, tabs, tags, text areas, toggles, tooltips, badges, alerts/banners, and empty states.

## Selected Patterns

| Pattern | Status | Old pattern replaced | TJC DAM fit | Style normalization | Accessibility/mobile risks | Code paths |
|---|---|---|---|---|---|---|
| Tubelight-style workflow nav | Implemented | Inline nav living inside app chrome | Gives Library, Collections, Upload, and Review clear workflow orientation | Evergreen active surface, subtle border, low motion, no heavy glass | Keep `aria-current`; labels become screen-reader-only under 430 px to avoid overflow | `frontend/components/AppNav.tsx`, `frontend/components/AppChrome.tsx` |
| Command palette | Implemented | Slow manual route/search jumps | Speeds saved views, collection navigation, ResourceSpace ID lookup, Upload, Review, Guide, Admin | White dialog shell, evergreen icons, no neon/marketing styling | Needs future arrow-key selection and stronger focus trap | `frontend/components/CommandPalette.tsx` |
| Display cards | Implemented selectively | Oversized generic dashboard cards | Useful for saved views, review metrics, admin health, metadata confidence, pending writes | White surfaces, compact count/purpose/action, no glass over safety state | Do not use for main asset grid | `frontend/components/SavedViewCard.tsx`, `frontend/components/CollectionAlbumCard.tsx`, `frontend/components/AdminPage.tsx`, `frontend/components/ReviewPage.tsx` |
| DAM contact sheet/grid | Implemented | Large card wells and weak thumbnails | Library must scan like DAM/media browser | Media-led tiles, compact metadata, one primary status, no fake preview art | Must preserve blocked state text and no active unsafe downloads | `frontend/components/AssetCard.tsx`, `frontend/components/LibraryPage.tsx` |
| Filter sidebar/drawer | Implemented | Scattered chips and competing filters | DAM facets belong in a compact filter control | Neutral panel, small labels, stable facet groups | Mobile must not push results too low or overflow | `frontend/components/FilterSidebar.tsx` |
| File upload preview | Implemented | Plain form/file input | Contributors need selected-file state before submitting review context | Type/size rows, remove/clear controls, large-media warning | Future drag state and image thumbnails must not imply review bypass | `frontend/components/UploadPage.tsx`, `frontend/app/api/upload/route.ts` |
| Review cockpit rows | Implemented | Long soft generated review cards | Reviewers need dense triage and selected-asset inspector | Compact queue tabs, rows, blocker text, audit preview | Mobile switches to compact cards; no horizontal overflow | `frontend/components/ReviewPage.tsx` |
| Status badges and banners | Implemented | Inconsistent chips and backend wording | Safety status must be clear and role-aware | Text plus color, muted warning/danger palette | Essential blockers never tooltip-only | `frontend/components/StatusBadge.tsx`, `frontend/components/DownloadOptionsPanel.tsx`, `frontend/components/AssetTrustPanel.tsx` |
| Skeleton loaders | Implemented | Generic loading blocks | Loading should match final DAM surfaces | Calm shimmer and stable dimensions | `prefers-reduced-motion` disables animation | `frontend/app/globals.css`, page/component loading states |
| Pagination | Implemented | First-page-only browsing | Large DAM search needs truthful ranges and preserved query/view/filter state | Compact operational nav with `Showing X-Y of Z`, disabled states, evergreen focus | Controls must stay reachable at 320 px and never imply infinite scroll | `frontend/components/LibraryPagination.tsx`, `frontend/components/LibraryPage.tsx`, `frontend/app/api/assets/search/route.ts` |

## Selected For Future Replacement

| Pattern | Status | Replacement target | Why deferred |
|---|---|---|---|
| Maintained asset detail tabs | Defer | Chip-heavy detail sections | Current detail is safe and usable; tabs should be added in a focused accessibility pass with keyboard semantics. |
| Maintained review inspector tabs | Defer | Dense inspector sections | Review logic is stable; tab extraction should not disturb evidence requirements or pending-write truth. |
| Dialog/modals for review/download decisions | Defer | Inline confirmation/decision surfaces | Useful, but must add focus trap, escape handling, and honest ResourceSpace-write copy. |
| Dropdown action menus | Defer | Secondary asset/collection/review actions | Do not hide critical safety status; implement only for secondary copy/open actions. |

## Rejected Patterns

| Pattern | Decision | Reason |
|---|---|---|
| Hero/pricing/marketing sections | Reject | TJC Stock Media is not a landing page or pricing site. |
| Heavy glassmorphism over cards/status | Reject | Reduces trust and readability for rights, minors, and download blockers. |
| Particle/shader/gradient backgrounds | Reject | Distracts from photo scanning and safety state. |
| Dark neon dashboard style | Reject | Wrong tone for church-safe ministry workflow and high risk for contrast regressions. |
| Floating quick-action dock | Defer/reject for now | Risks becoming a second nav, especially on mobile. |
| Animated numbers | Defer | Low workflow value compared with pagination and review dialogs. |
| Theme toggle | Defer | Dark mode requires a full safety-label contrast pass before release. |

## Image Comparison Slider

Reference: `https://21st.dev/community/components/thanh/image-comparison-slider/default`

Status: deferred.

Reason: the pattern could help compare original/master against approved derivative, uncropped source against approved web crop, or current portal preview against approved downloadable copy. Current ResourceSpace export does not guarantee safe paired derivative images, and the portal must not expose restricted originals to Viewers. Implementing now would either fake the comparison or risk weakening preview/download policy.

Future location:

- Asset Detail > Files tab
- Asset Detail > Review tab
- Review inspector > Evidence / Files area

Future code path:

- `frontend/components/ImageComparisonReviewPanel.tsx`

Safety requirements before implementation:

- Reviewer/DAM Admin only by default.
- Viewer never sees restricted original/master.
- Both before/after sources must pass preview access checks.
- Show `Original restricted` or `Preview restricted` when needed.
- Keyboard-accessible slider or static accessible fallback.
- No use in Library grid, Collections, or Guide decoration.
- No fake AI enhancement or fake media generation.

## Remaining Component Debt

- Extract `FileUploadPanel` for drag/drop and image thumbnails once backend upload mode is clearer.
- Extract `ReviewActionDialog` and `DownloadOptionsDialog` with focus trap and no fake ResourceSpace persistence.
- Extract `AssetDetailTabs` and `ReviewInspectorTabs` with keyboard support.
- Keep component styling unified; reject any imported 21st.dev component that cannot be fully restyled into the TJC DAM system.
