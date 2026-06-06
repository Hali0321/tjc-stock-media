# TJC Stock Media UI Component Inventory

Last updated: 2026-06-06

This inventory records the 21st.dev scouting pass for TJC Stock Media. The source library was reviewed as a component idea library, not as drop-in branding. Every selected pattern must be restyled into the TJC DAM system: Inter + Noto Sans TC fallback, evergreen accent, subtle borders, restrained radius, high-contrast safety labels, consistent badge language, and mobile behavior that works at 320/390/768 px.

## Sources Reviewed

- 21st.dev community components: `https://21st.dev/community/components`
- Image Comparison Slider: `https://21st.dev/community/components/thanh/image-comparison-slider/default`
- Dribbble DAM references: Media Library Dashboard, Media Library Panel, Photographers Admin Panel, Asset Management Dashboard UX UI.
- Awwwards references: Kontainer DAM System, SK Photographer, Ottografie Reinvented.
- CodePen references: Drag + Drop Image Uploader, React Preview Upload, Filter Masonry Lightbox.
- Godly references: User Interface Gallery and Frame.io.
- Monet reference: Monet Feature Showcase.
- Pinterest moodboard: media library dashboard, file/asset management, photo upload selection, Delis Archive.
- Product references: Google Photos, Apple Photos, Brandfolder, Frontify, PhotoShelter, Bynder, Canto, AEM Assets, ResourceSpace, Notion, Airtable, and Linear.
- AI design tools discussed: Stitch by Google, Midjourney Moodboards, and Higgsfield. These remain research-only and are not production dependencies.

The community library exposes many useful and many unsuitable categories. Reviewed categories included navigation menus, command palettes/menus, cards, buttons, dialogs/modals, dropdowns, file uploads, forms, inputs, paginations, sidebars, sliders, skeleton/spinner loaders, tables, tabs, tags, text areas, toggles, tooltips, badges, alerts/banners, and empty states.

## Selected Patterns

| Pattern | Status | Old pattern replaced | TJC DAM fit | Style normalization | Accessibility/mobile risks | Code paths |
|---|---|---|---|---|---|---|
| Tubelight-style workflow nav | Implemented | Inline nav living inside app chrome | Gives Library, Collections, Upload, and Review clear workflow orientation | Evergreen active surface, subtle border, low motion, no heavy glass | Keep `aria-current`; labels become screen-reader-only under 430 px to avoid overflow | `frontend/components/AppNav.tsx`, `frontend/components/AppChrome.tsx` |
| Command palette | Implemented | Slow manual route/search jumps | Speeds saved views, collection navigation, ResourceSpace ID lookup, Upload, stable Review queue URLs, Guide, Admin | White dialog shell, evergreen icons, selected-row ring, no neon/marketing styling | Arrow/Home/End selection, focus trap, Escape close, return-focus behavior, and queue URL state are implemented | `frontend/components/CommandPalette.tsx`, `frontend/components/ReviewPage.tsx`, `frontend/app/review/page.tsx` |
| Display cards | Implemented selectively | Oversized generic dashboard cards | Useful for saved views, review metrics, admin health, metadata confidence, pending writes | White surfaces, compact count/purpose/action, no glass over safety state | Do not use for main asset grid | `frontend/components/SavedViewCard.tsx`, `frontend/components/CollectionAlbumCard.tsx`, `frontend/components/AdminPage.tsx`, `frontend/components/ReviewPage.tsx` |
| DAM contact sheet/grid | Implemented | Large card wells and weak thumbnails | Library must scan like DAM/media browser | Media-led tiles, compact metadata, one primary status, no fake preview art | Must preserve blocked state text and no active unsafe downloads | `frontend/components/AssetCard.tsx`, `frontend/components/LibraryPage.tsx` |
| Filter sidebar/drawer | Implemented | Scattered chips and competing filters | DAM facets belong in a compact filter control | Neutral panel, small labels, stable facet groups | Mobile must not push results too low or overflow | `frontend/components/FilterSidebar.tsx` |
| File upload dropzone / preview | Implemented | Plain form/file input | Contributors need drop/browse state and selected-file context before submitting review evidence | Dashed neutral dropzone, type/size rows, remove/clear controls, large-media warning | Does not imply review bypass; all submissions still enter Needs Review / Do Not Publish | `frontend/components/UploadFileDropzone.tsx`, `frontend/components/UploadPage.tsx`, `frontend/app/api/upload/route.ts` |
| Input with tags | Implemented | Plain comma-only suggested-tags field | Suggested tags should be easy to add while staying tied to existing taxonomy/export terms | Compact chips, suggestion buttons, evergreen focus, hidden canonical-only serialized form value | Uses `canonicalTags` through `upload-tags`; typed non-canonical terms are rejected with guidance to add new wording to intake notes; reviewers still approve final taxonomy before ResourceSpace write | `frontend/components/InputWithTags.tsx`, `frontend/components/UploadPage.tsx`, `frontend/lib/upload-tags.ts`, `frontend/lib/taxonomy.ts`, `frontend/app/api/upload/route.ts` |
| Review cockpit rows | Implemented | Long soft generated review cards | Reviewers need dense triage and selected-asset inspector | Compact queue tabs, rows, blocker text, audit preview | Mobile switches to compact cards; no horizontal overflow | `frontend/components/ReviewPage.tsx` |
| Review load-more gate | Implemented | Rendering up to 80 review rows at once | Reviewers still get a dense queue, but mobile reaches inspector/actions sooner | Shows first 24 loaded rows, exact loaded/total copy, evergreen load-more button | Preserves selected row visibility and avoids hiding review status | `frontend/components/ReviewPage.tsx` |
| Banner | Implemented | Inline warnings competing with metadata chips | Operational warnings need high signal without becoming decorative | Muted info/warning/danger surfaces, text-first labels, no glass | Important safety copy appears in the banner body, not only color or tooltip | `frontend/components/StatusBanner.tsx`, `frontend/components/ReviewPage.tsx`, `frontend/components/UploadPage.tsx` |
| Tooltip | Implemented selectively | Dense governance hints either missing or over-explained inline | Helps compact DAM controls without hiding safety facts | Small neutral text treatment, evergreen focus/hover behavior where used | Essential blockers are never tooltip-only | `frontend/components/AppNav.tsx`, `frontend/components/AssetCard.tsx`, `frontend/components/DownloadOptionsPanel.tsx` |
| Status badges and trust badges | Implemented | Inconsistent chips and backend wording | Safety status must be clear and role-aware | Text plus color, muted warning/danger palette | Essential blockers never tooltip-only | `frontend/components/StatusBadge.tsx`, `frontend/components/DownloadOptionsPanel.tsx`, `frontend/components/AssetTrustPanel.tsx` |
| Animated Loading Skeleton | Implemented | Generic loading blocks | Loading should match final DAM surfaces | Calm shimmer and stable dimensions | `prefers-reduced-motion` disables animation | `frontend/app/globals.css`, page/component loading states |
| Pagination | Implemented | First-page-only browsing | Large DAM search needs truthful ranges and preserved query/view/filter state | Compact operational nav with `Showing X-Y of Z`, disabled states, evergreen focus | Controls must stay reachable at 320 px and never imply infinite scroll | `frontend/components/LibraryPagination.tsx`, `frontend/components/LibraryPage.tsx`, `frontend/app/api/assets/search/route.ts` |
| Review confirmation dialog | Implemented | Immediate review action POST after checklist | Reviewer must explicitly confirm pending-write semantics before queueing action | Focus-trapped dialog, pending-not-final copy, no decorative glass | Escape/cancel available; confirmation button gets initial focus | `frontend/components/ReviewActionDialog.tsx`, `frontend/components/ReviewPage.tsx` |
| Hold-and-release button | Implemented for high-risk review actions | Ordinary buttons for archive/do-not-publish decisions | Prevents accidental archive-only or do-not-publish queueing while keeping normal approval actions efficient | Muted red border/fill progress, no flashy motion, same spacing/radius as review actions | Pointer and keyboard hold supported; disabled until evidence/note requirements pass | `frontend/components/HoldReleaseButton.tsx`, `frontend/components/ReviewPage.tsx` |
| Liquid Glass Button | Partial inspiration only | Primary actions that looked too flat | High-value actions benefit from a stronger premium treatment, but safety labels must remain solid | Used as restrained depth/highlight inspiration for primary buttons; no full glass surface over media/status | Must not reduce contrast; no standalone dependency or flashy refraction effect added | `frontend/app/globals.css`, `frontend/components/UploadPage.tsx`, `frontend/components/ReviewPage.tsx` |
| Apple Tahoe Liquid Glass Button | Evaluated / deferred | None | Alternate primary-action inspiration, but too platform-specific for this church DAM | Deferred beyond subtle highlight treatment | Would need complete contrast verification before use | No production component |
| Accessible DAM tabs | Implemented | Chip-style tab buttons and one long review inspector list | Asset Detail and Review need focused task panels without hiding safety facts | Shared evergreen segmented tabs, real `tablist`/`tab`/`tabpanel`, arrow-key roving focus | Horizontal scroll at 320 px, selected state uses text and border/background | `frontend/components/DamTabs.tsx`, `frontend/components/AssetDetailPage.tsx`, `frontend/components/ReviewPage.tsx` |
| Request dialogs | Implemented | Raw `mailto:` links for original/review/help requests | Users should see original-access and review-request implications before leaving the portal | Focus-trapped white dialog, explicit no-fake-persistence copy, email draft only | Escape/cancel available; does not change ResourceSpace or pending writes | `frontend/components/ReuseRequestDialog.tsx`, `frontend/components/DownloadOptionsPanel.tsx` |
| Dropdown action menus | Implemented for Asset Detail and Review inspector secondary actions | Standalone ResourceSpace admin link and scattered copy/open actions | Keeps copy ResourceSpace ID, copy portal link, and DAM Admin ResourceSpace open action quiet without hiding safety decisions | White menu, evergreen focus, no glass; action labels include context | Viewer/Reviewer cannot see ResourceSpace admin action; Escape/outside close supported | `frontend/components/DropdownActionMenu.tsx`, `frontend/components/AssetActionsMenu.tsx`, `frontend/components/AssetDetailPage.tsx`, `frontend/components/ReviewPage.tsx` |

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
| Apple Tahoe Liquid Glass Button | Defer | Too platform-specific and easy to overuse; current primary actions already gained restrained depth without weakening status readability. |

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
- Add a dedicated download-options dialog only if approved derivative choices become richer; request dialogs are now implemented.
- Consider extracting richer `AssetDetailTabs` / `ReviewInspectorTabs` panel composition if the panels keep growing; base tab behavior now lives in `DamTabs`.
- Keep component styling unified; reject any imported 21st.dev component that cannot be fully restyled into the TJC DAM system.
