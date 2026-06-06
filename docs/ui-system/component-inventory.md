# TJC Stock Media UI Component Inventory

Last updated: 2026-06-06

This inventory records the 21st.dev scouting pass for TJC Stock Media. The source library was reviewed as a component idea library, not as drop-in branding. Every selected pattern must be restyled into the TJC DAM system: Inter + Noto Sans TC fallback, evergreen accent, subtle borders, restrained radius, high-contrast safety labels, consistent badge language, and mobile behavior that works at 320/390/768 px.

## 2026-06-06 Light DAM Rebuild Continuation

This pass replaced the remaining dark/gradient dashboard direction with a lighter DAM product system and made selected 21st.dev patterns visible in real workflows:

- Library now opens as a warm-neutral contact sheet with compact search, a saved-view row, truthful pagination, and a quiet filter sidebar instead of a dashboard card wall. Evidence: `docs/screenshots/qa/library-light-desktop.png`, `docs/screenshots/qa/library-light-mobile-375.png`, plus refreshed browser QA screenshots.
- Asset cards support `standard`, `wide`, `tall`, and `feature` media ratios so the contact sheet has media rhythm while preserving role-aware preview and download policy. Code: `frontend/components/AssetCard.tsx`, `frontend/components/LibraryPage.tsx`.
- Upload, Review, Admin, Collections, Asset Detail, and Guide now use light operational headers, neutral surfaces, evergreen accents, restrained banners, and fewer nested containers. Code: `frontend/app/globals.css`, `frontend/components/UploadPage.tsx`, `frontend/components/ReviewPage.tsx`, `frontend/components/AdminPage.tsx`, `frontend/components/CollectionsPage.tsx`, `frontend/components/AssetDetailPage.tsx`, `frontend/components/GuidePage.tsx`.
- Review now places visual triage, queue rows, and the sticky inspector in one workbench grid so the inspector is visible as a real approval workspace. Evidence: `docs/screenshots/qa/review-light-desktop.png`, `docs/screenshots/qa/review-pending-write-dialog-open.png`, `docs/screenshots/qa/review-hold-to-confirm.png`.
- Admin now uses a left admin rail and list/table rhythm for production decisions, field coverage, vocabulary, and blockers rather than generic KPI-card spam. Code: `frontend/components/AdminPage.tsx`.
- Required interaction evidence was refreshed: `docs/screenshots/qa/command-palette-open.png`, `docs/screenshots/qa/upload-selected-file-preview.png`, `docs/screenshots/qa/asset-actions-menu-open.png`, `docs/screenshots/qa/request-original-dialog-open.png`.

Mobile proof captured in this pass showed no horizontal overflow at 320, 390, or 768 px: `scrollWidth` equaled viewport width for Library and Collections QA screenshots.

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
| Display cards | Implemented selectively | Oversized generic dashboard cards | Useful for saved views, review metrics, admin health, metadata confidence, pending writes, and collection shelf context | White surfaces, compact count/purpose/action, no glass over safety state | Do not use for main asset grid or guide content | `frontend/components/DisplayCard.tsx`, `frontend/components/SavedViewCard.tsx`, `frontend/components/CollectionAlbumCard.tsx`, `frontend/components/CollectionShelfInspector.tsx`, `frontend/components/AdminPage.tsx`, `frontend/components/ReviewPage.tsx` |
| DAM contact sheet/grid | Implemented | Large card wells and weak thumbnails | Library must scan like DAM/media browser | Media-led tiles, compact metadata, one primary status, no fake preview art | Must preserve blocked state text and no active unsafe downloads | `frontend/components/AssetCard.tsx`, `frontend/components/LibraryPage.tsx` |
| Library quick preview dialog | Implemented | Asset tiles forced full navigation for basic inspection | Browsers need fast preview, trust state, blockers, and approved-copy decision without leaving the contact sheet | White dialog shell with media preview and governance pane; no heavy glass over status; same badges and blocker language as detail | Focus trap, Escape/outside close, return focus, no active unsafe download link for blocked Viewer assets, no overflow at 320 px | `frontend/components/AssetQuickLookDialog.tsx`, `frontend/components/AssetCard.tsx` |
| Filter sidebar/drawer | Implemented | Scattered chips and competing filters | DAM facets belong in a compact filter control | Neutral panel, small labels, stable facet groups | Mobile must not push results too low or overflow | `frontend/components/FilterSidebar.tsx` |
| File upload dropzone / preview | Implemented | Plain form/file input | Contributors need drop/browse state and selected-file context before submitting review evidence | Dashed neutral dropzone, type/size rows, remove/clear controls, large-media warning | Does not imply review bypass; all submissions still enter Needs Review / Do Not Publish | `frontend/components/UploadFileDropzone.tsx`, `frontend/components/UploadPage.tsx`, `frontend/app/api/upload/route.ts` |
| Upload reviewer handoff packet | Implemented | Static checklist below the form | Contributors should see the exact evidence packet reviewers receive before submitting | Display-card style evidence states for context, people/rights, files, tags, persistence mode, and reuse safety | No fake persistence; explicitly states production writes need ResourceSpace API field mapping; no overflow at 320 px | `frontend/components/UploadIntakePacket.tsx`, `frontend/components/UploadPage.tsx` |
| Input with tags | Implemented | Plain comma-only suggested-tags field | Suggested tags should be easy to add while staying tied to existing taxonomy/export terms | Compact chips, suggestion buttons, evergreen focus, hidden canonical-only serialized form value | Uses `canonicalTags` through `upload-tags`; typed non-canonical terms are rejected with guidance to add new wording to intake notes; reviewers still approve final taxonomy before ResourceSpace write | `frontend/components/InputWithTags.tsx`, `frontend/components/UploadPage.tsx`, `frontend/lib/upload-tags.ts`, `frontend/lib/taxonomy.ts`, `frontend/app/api/upload/route.ts` |
| Review visual triage board | Implemented | Review opened directly into records without a media-first scan layer | Reviewers need to scan risk visually before opening record details | Light contact-sheet board, thumbnail-led buttons, first-risk label, no preview bypass | Responsive grid keeps focusable controls in viewport at 320/768/1440 px | `frontend/components/ReviewTriageStrip.tsx`, `frontend/components/ReviewPage.tsx` |
| Review cockpit queue cards | Implemented | Long soft generated review cards | Reviewers need dense triage and selected-asset inspector | Media-led records with ResourceSpace ID, raw status, usage badge, risk callout, next check, and quiet secondary detail action | Mobile stacks into readable review cards; no horizontal overflow; selected state uses text/border/background | `frontend/components/ReviewQueueAssetCard.tsx`, `frontend/components/ReviewPage.tsx` |
| Collection shelf inspector | Implemented | Collections page looked like a metric header plus generic album cards | Collections should feel like PhotoShelter/Brandfolder album browsing with selected album evidence, stable IDs, approval summary, source, range, and Library handoff | Light album rows, quiet preview rails, white trust facts; no fake media; preview-pending state is intentional | Hover/focus selection works; 320 px stacks album rows then inspector; no horizontal overflow | `frontend/components/CollectionsPage.tsx`, `frontend/components/CollectionAlbumCard.tsx`, `frontend/components/CollectionShelfInspector.tsx` |
| Review cockpit rows | Implemented | Long soft generated review cards | Reviewers need dense triage and selected-asset inspector | Compact queue tabs, cards, blocker text, audit preview | Mobile switches to compact cards; no horizontal overflow | `frontend/components/ReviewPage.tsx`, `frontend/components/ReviewQueueAssetCard.tsx`, `frontend/components/ReviewTriageStrip.tsx` |
| Review load-more gate | Implemented | Rendering up to 80 review rows at once | Reviewers still get a dense queue, but mobile reaches inspector/actions sooner | Shows first 24 loaded rows, exact loaded/total copy, evergreen load-more button | Preserves selected row visibility and avoids hiding review status | `frontend/components/ReviewPage.tsx` |
| Banner | Implemented | Inline warnings competing with metadata chips | Operational warnings need high signal without becoming decorative | Muted info/warning/danger surfaces, text-first labels, no glass | Important safety copy appears in the banner body, not only color or tooltip | `frontend/components/StatusBanner.tsx`, `frontend/components/ReviewPage.tsx`, `frontend/components/UploadPage.tsx` |
| Tooltip | Implemented selectively | Dense governance hints either missing or over-explained inline | Helps compact DAM controls without hiding safety facts | Small neutral text treatment, evergreen focus/hover behavior where used | Essential blockers are never tooltip-only | `frontend/components/AppNav.tsx`, `frontend/components/AssetCard.tsx`, `frontend/components/DownloadOptionsPanel.tsx` |
| Status badges and trust badges | Implemented | Inconsistent chips and backend wording | Safety status must be clear and role-aware | Text plus color, muted warning/danger palette | Essential blockers never tooltip-only | `frontend/components/StatusBadge.tsx`, `frontend/components/DownloadOptionsPanel.tsx`, `frontend/components/AssetTrustPanel.tsx` |
| Animated Loading Skeleton | Implemented | Generic loading blocks | Loading should match final DAM surfaces | Calm shimmer and stable dimensions | `prefers-reduced-motion` disables animation | `frontend/app/globals.css`, page/component loading states |
| Pagination | Implemented | First-page-only browsing | Large DAM search needs truthful ranges and preserved query/view/filter state | Compact operational nav with `Showing X-Y of Z`, disabled states, evergreen focus | Controls must stay reachable at 320 px and never imply infinite scroll | `frontend/components/LibraryPagination.tsx`, `frontend/components/LibraryPage.tsx`, `frontend/app/api/assets/search/route.ts` |
| Review confirmation dialog | Implemented | Immediate review action POST after checklist | Reviewer must explicitly confirm pending-write semantics before queueing action | Focus-trapped dialog, pending-not-final copy, no decorative glass | Escape/cancel available; confirmation button gets initial focus | `frontend/components/ReviewActionDialog.tsx`, `frontend/components/ReviewPage.tsx` |
| Hold-and-release button | Implemented for high-risk review actions | Ordinary buttons for archive/do-not-publish decisions | Prevents accidental archive-only or do-not-publish queueing while keeping normal approval actions efficient | Muted red border/fill progress, no flashy motion, same spacing/radius as review actions | Pointer and keyboard hold supported; disabled until evidence/note requirements pass | `frontend/components/HoldReleaseButton.tsx`, `frontend/components/ReviewPage.tsx` |
| Liquid Glass Button | Evaluated / deferred | None | Flashy glass treatment did not fit the calm church DAM direction | Primary actions use solid evergreen styling instead | Avoids contrast loss and component-showcase behavior | No production component |
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

## Latest Visual Proof

Review cockpit industry pass screenshots captured locally:

- `docs/screenshots/qa/after-review-industry-pass-desktop.png`
- `docs/screenshots/qa/after-review-industry-pass-tablet-768.png`
- `docs/screenshots/qa/after-review-industry-pass-mobile-320.png`

Browser proof against `http://127.0.0.1:3028/review` with Reviewer role:

- 1440 desktop: visual triage board present, 24 queue cards rendered, inspector tabs present, 2 hold-to-confirm buttons present, no console errors, no horizontal overflow.
- 768 tablet: visual triage board present, 24 queue cards rendered, inspector tabs present, 2 hold-to-confirm buttons present, no console errors, no horizontal overflow.
- 320 mobile: visual triage board present, 24 queue cards rendered, inspector tabs present, 2 hold-to-confirm buttons present, no console errors, no horizontal overflow.

Library quick preview screenshots captured locally:

- `docs/screenshots/qa/library-quick-preview-desktop.png`
- `docs/screenshots/qa/library-quick-preview-mobile-320.png`

Browser proof against `http://127.0.0.1:3028/` with Viewer role:

- 1440 desktop: quick preview dialog opens, trust-record link present, blocked asset has zero active download links, no console errors, no clipped controls, no horizontal overflow.
- 320 mobile: quick preview dialog opens, trust-record link present, blocked asset has zero active download links, no console errors, no clipped controls, no horizontal overflow.

Upload intake packet screenshots captured locally:

- `docs/screenshots/qa/upload-intake-packet-desktop.png`
- `docs/screenshots/qa/upload-intake-packet-mobile-320.png`

Browser proof against `http://127.0.0.1:3028/upload` with Contributor role:

- 1440 desktop: reviewer packet visible, selected-file preview visible, `Needs Review / Do Not Publish` visible, ResourceSpace write-mapping honesty visible, no console errors, no clipped controls, no horizontal overflow.
- 320 mobile: reviewer packet visible, selected-file preview visible, `Needs Review / Do Not Publish` visible, ResourceSpace write-mapping honesty visible, no console errors, no clipped controls, no horizontal overflow.

Collections shelf inspector screenshots captured locally:

- `docs/screenshots/qa/collections-industry-pass-desktop.png`
- `docs/screenshots/qa/collections-industry-pass-mobile-320.png`

Browser proof against `http://127.0.0.1:3008/collections` with Viewer role:

- 1440 desktop: collection shelf inspector present, stable ID labels present, `Open Library results` action present, no console errors, no horizontal overflow.
- 320 mobile: album cards stack before inspector, collection search intent remains visible, `Open Library results` action present, no console errors, no horizontal overflow.
