# TJC Stock Media UI Design Decision Log

Last updated: 2026-06-07

## 2026-06-07 - Primitive Proof, Mobile Density, and Final QA

Decision: close final acceptance gaps by deepening existing app-native modules, documenting source status honestly, and validating the rebuild on a fresh production server instead of importing more component code.

Replacement summary:

| Old pattern | New pattern | Safety impact | Mobile/accessibility impact |
|---|---|---|---|
| Report-like Admin/Review lists | Shared `DataTable` for serious desktop governance surfaces plus card fallback | Read-only tables surface blockers, mappings, vocabulary, and pending-write constraints without changing API contracts | Tables run on desktop/xl; mobile/tablet gets labelled cards and no clipped controls |
| Ad hoc toast calls | `tjc-toasts` Sonner helper layer | Toasts announce events but persistent panels/banners still carry safety truth | Toasts stay within viewport; icons/text avoid color-only feedback |
| Repeated blank restricted placeholders | Unified `RestrictedPreviewPanel` and `MediaPreviewPanel` modes | Restricted previews never expose originals; safe collection/type context explains why preview is blocked | 320px Library uses single-column compact cards; preview states remain readable |
| Asset Detail media area tied to images only | `MediaPreviewPanel` image/video/audio/document/restricted/unknown wrapper | Only role-safe derivatives render; document/video/audio shells are partial until export data exists | Compact preview mode used on mobile/inspector; no horizontal overflow |
| Backend-ish status chips | `TjcStatusBadge` primitive plus semantic wrappers | Raw ResourceSpace status, portal reuse, review, rights, visibility, and download state now share one text+icon+tone interface | Badges keep text labels and do not rely on color alone |
| Admin sidebar omitted audit-log target | `Audit log` nav item and read-only section | Pending writes and integration blockers are visible as audit signals without claiming ResourceSpace persistence | Section uses table-like stacked rows, no horizontal trap |
| Guide anchor nav desktop-only | Mobile jump navigation row | Usage guidance remains reachable without hiding safety copy | Horizontal chip nav keeps 44px-ish touch targets and avoids crushed desktop layout |
| Auth-gated/missing 21st registry references | Source-status matrix | Prevents source-level overclaiming while preserving app-native primitive proof | Screenshot evidence links each primitive to real page usage |
| Mobile Review queue repeated controls | Mobile queue selector plus compact queue slice | Review actions remain in selected asset inspector; pending-write truth unchanged | Selected asset/action panel appears before queue cards, with 8 mobile cards before load-more |
| 320px Admin nav clipping | Icon-first `AppNav` labels under 360px | Nav semantics and `aria-current` remain intact | No clipped Admin navigation in browser QA |

Verification:

- `npm --prefix frontend run typecheck`: pass.
- `npm --prefix frontend run build`: pass.
- `make frontend-check`: pass.
- `make demo-check`: pass.
- `make smoke`: pass with Docker/ResourceSpace/MariaDB not running warnings only.
- `make launch-readiness`: pass with `.env` placeholder and 19 GiB free-disk warnings.
- `BASE_URL=http://localhost:3029 make portal-api-smoke`: pass.
- `BASE_URL=http://localhost:3029 make portal-browser-qa`: pass, 15 pages, 1440/1280/1024/768/390/320, zero failures, zero warnings, zero console errors, zero network failures.
- `git diff --check`: pass.

## 2026-06-06 - Visual-To-Code Mockup Continuation

Decision: apply the latest generated mockup direction directly to the production UI, with ResourceSpace safety unchanged.

Replacement summary:

| Old pattern | New pattern | Safety impact | Mobile/accessibility impact |
|---|---|---|---|
| Horizontal saved-view cards above Library results | Desktop saved-view/browse rail plus right filter drawer | Saved views still use stable API view IDs and count truth | Main results appear quickly; mobile keeps horizontal saved views to avoid cramped sidebars |
| Collections card rows with weak preview geometry | Wider album rows with lead thumbnail rail and selected inspector hero preview-pending state | No fake thumbnails; collection approval remains navigation context, not reuse permission | Browser QA confirms no horizontal overflow at 320/390/768 |
| Upload form ended in one full-width submit button | Autosave checkpoint, file count surface, and bottom action bar | Submit still routes to server intake; all uploads remain Needs Review / Do Not Publish | Buttons keep 44px targets and remain accessible at 320/390 |
| Review inspector used old Checklist/Rights wording | Overview / Metadata / Usage / AI Insights / Pending write tabs | Evidence checklist, note, dialog, pending-write truth, and hold actions are unchanged | QA script updated to verify requested tab names and arrow-key panel movement |
| Asset detail lacked derivative comparison area | Safe `ImageComparisonPanel` | Uses role-safe display derivative only; original/master stays hidden | Range control is keyboard reachable; no mobile overflow |
| Admin readiness card was too plain | Readiness panel with progress bar and source/read/write cards | Does not claim production readiness; blockers remain visible | Cards stack cleanly on mobile |
| Guide rows were text-only | Editorial row icons plus top-right uncertainty callout | Safety guidance remains visible text, not tooltip-only | Anchor menu remains desktop; content stacks on mobile |

Verification:

- `npm --prefix frontend run typecheck`: pass.
- `npm --prefix frontend run build`: pass.
- `make frontend-check`: pass when run alone. A previous parallel run collided with another `next build` cache rename and was rerun successfully.
- `make demo-check`: pass.
- `make smoke`: pass with Docker/ResourceSpace/MariaDB not running warnings only.
- `make launch-readiness`: pass with `.env` placeholder and 19 GiB free disk warnings.
- `BASE_URL=http://localhost:3029 make portal-api-smoke`: pass.
- `BASE_URL=http://localhost:3029 make portal-browser-qa`: pass, 15 pages, 1440/1280/1024/768/390/320, zero failures, zero warnings, zero console errors.

## 2026-06-06 - 21st.dev Scouting Pass

Decision: use 21st.dev as a component scouting source, not as a drop-in visual system.

Subagent: used. Dedicated scouting subagent `019e9bb6-78c4-72e1-97c1-fa42cac99e66` reviewed the 21st.dev community library and Image Comparison Slider, then produced a scouting report. A direct browser scouting pass also checked the library and slider page.

Categories reviewed:

```text
Navigation menus, command palettes / menus, cards, buttons, dialogs / modals,
dropdowns, file uploads, forms, inputs, paginations, sidebars, sliders,
skeletons / spinner loaders, tables, tabs, tags, text areas, toggles,
tooltips, badges, alerts / banners, empty states.
```

Accepted patterns:

- Tubelight-style navigation for workflow orientation.
- Command palette for fast DAM task switching.
- Review queue commands use stable `/review?queue=...` URLs instead of generic `/review` jumps.
- Display cards only for operational summaries.
- Contact-sheet grid for asset browsing.
- Filter sidebar/drawer for DAM facets.
- File upload preview for contributor confidence.
- Review cockpit row/list pattern for governance.
- Accessible tabs for Asset Detail trust sections and Review inspector sections.
- Request dialogs for original access, review request, and media coworker help.
- Badges/banners/tooltips for safety clarity, with essential warnings visible in primary UI.
- Animated Loading Skeleton-style loaders that match final layout.

Rejected patterns:

- Marketing heroes, pricing sections, and campaign blocks.
- Full glass over asset cards, metadata, or safety labels.
- Particle effects, shaders, animated backgrounds, and dark neon dashboard treatments.
- Floating docks that create a second navigation system.
- Any component that makes the app feel like a component showcase.

Style decision:

```text
Inter + Noto Sans TC fallback
TJC evergreen accent
neutral off-white background
white operational surfaces
subtle borders
restrained radius
visible focus states
high-contrast text safety labels
no decorative motion that weakens workflow
```

## Image Comparison Slider Decision

Reference: `https://21st.dev/community/components/thanh/image-comparison-slider/default`

Decision: implement a safe comparison panel now; defer true original-vs-approved derivative slider.

Rationale:

- Potentially valuable for comparing approved derivative vs restricted original, approved crop vs source crop, or portal preview vs approved downloadable copy.
- Not safe to implement a true before/after slider until ResourceSpace derivative policy and preview permissions provide a trustworthy paired-image source.
- A safe `ImageComparisonPanel` now appears on Asset Detail. It uses only the role-safe display derivative and labels the original/master as hidden.

Future implementation requirements:

- Keep current safe panel at `frontend/components/ImageComparisonPanel.tsx`.
- Build future richer reviewer/admin-only `frontend/components/ImageComparisonReviewPanel.tsx`.
- Use only in reviewer/admin context unless both sides are explicitly public-safe.
- Gate both images through existing preview/access decisions.
- Render clear `Preview restricted` / `Original restricted` states.
- Provide keyboard-accessible slider controls or a static accessible fallback.
- Never use the slider in Library, Collections, or Guide decoration.

## Replacement Decisions

| Old pattern | New pattern | Safety impact | Mobile/accessibility impact |
|---|---|---|---|
| Inline primary nav inside app shell | Maintained `AppNav` | Keeps Admin role-gated and core workflows clear | Screen-reader labels preserved when mobile text hides |
| Generic saved view cards | Compact display cards | Counts and reuse states stay truthful | Touch targets remain compact but reachable |
| Large asset card wells | Contact-sheet tiles | Blocked/download state remains visible without fake media | Grid fits 320 px without horizontal overflow |
| Plain upload file input | File preview workflow | Upload still enters Needs Review / Do Not Publish | Selected files can be removed before submit |
| Soft review cards | Review cockpit rows + inspector | Evidence and pending-write state stay explicit | Mobile uses stacked cards without horizontal overflow |
| Full 80-row review render | Review load-more gate | Queue truth remains visible while reducing mobile scroll before action work | Desktop starts with 24 loaded rows; mobile starts with 8 compact cards after the selected asset/action panel; load-more is explicit |
| One long review inspector list | Shared `DamTabs` inspector panels | Checklist, metadata, rights, history, and pending writes remain explicit without burying action evidence | Real tab semantics, arrow-key movement, and horizontal mobile scroll |
| Asset detail `aria-pressed` section buttons | Shared `DamTabs` detail panels | Use, Source, Review, Files, and Related stay separated as trust record sections | Real tab semantics and keyboard movement replace loose buttons |
| Direct request `mailto:` links | Focused `ReuseRequestDialog` | Original/master access and review requests clearly do not change ResourceSpace status or pending writes | Focus-trapped dialog, Escape/cancel, and explicit email-draft action |
| Plain suggested-tags field | InputWithTags + `upload-tags` | Contributors should add tags from existing visible-content and TJC vocabulary without creating a second taxonomy | Suggestion buttons, typed canonical matches, and direct API upload validation share `upload-tags`; non-canonical terms are rejected with intake-note guidance; final ResourceSpace taxonomy still requires reviewer approval |
| Ordinary high-risk review buttons | `HoldReleaseButton` for archive/do-not-publish | Accidental archive-only or do-not-publish queueing should require intentional hold after evidence completion | Pointer and keyboard hold, disabled until checklist/note pass, muted red progress |
| Backend-ish status chips | StatusBadge / safety panels | Raw ResourceSpace status remains separate from portal reuse state | Status text never relies on color alone |
| First-page-only Library results | LibraryPagination | Count truth now says `Showing X-Y of Z` and query/view/filter state is preserved | Previous/Next buttons have accessible labels and fit 320 px |
| Immediate review action POST | ReviewActionDialog confirmation | Reviewers must see pending-write, not-final-ResourceSpace semantics before queueing | Focus trap, Escape/cancel, and initial confirm focus are implemented |
| Standalone detail/review admin/copy actions | DropdownActionMenu / AssetActionsMenu | Secondary actions should be available without competing with reuse, trust, or review evidence panels | Viewer/Reviewer see copy actions only; DAM Admin can open ResourceSpace source-of-truth link |

## Open Debt

- Upload preview now supports drop/browse drag state; safe thumbnails remain deferred until real upload backend and preview policy are wired.
- Download-options dialog remains deferred until derivative choices are richer; request-original/review/help dialogs are implemented.

## 2026-06-06 - Library Quick Preview Dialog

Decision: add a real Library quick preview dialog so the main contact sheet has visible 21st.dev-style dialog interaction, not only route navigation.

Replacement:

| Old pattern | New pattern | Safety impact | Mobile/accessibility impact |
|---|---|---|---|
| Asset cards only opened full detail route | `AssetQuickLookDialog` | Uses the same role-aware preview and download decisions as detail; blocked Viewer assets show no active `/api/download` link | Focus trap, Escape/outside close, return focus, no clipped controls at 320 px |
| Contact sheet hid trust context until detail page | Quick preview governance pane | Shows raw status, usage scope, reuse state, blockers, source, review line, and metadata confidence without changing ResourceSpace truth | Dialog scrolls internally on mobile and keeps the page from horizontal overflow |

Code paths:

- `frontend/components/AssetQuickLookDialog.tsx`
- `frontend/components/AssetCard.tsx`

Screenshot proof:

- `docs/screenshots/qa/library-quick-preview-desktop.png`
- `docs/screenshots/qa/library-quick-preview-mobile-320.png`

Verification:

- Browser proof confirmed quick preview opens at 1440 and 320 px.
- Blocked Viewer quick preview had zero active download links.
- `portal-api-smoke` and full `portal-browser-qa` passed after the change.

## 2026-06-06 - Upload Reviewer Packet

Decision: replace the static upload handoff checklist with a live reviewer packet summary so Upload feels like a serious DAM intake workflow instead of a plain form.

Replacement:

| Old pattern | New pattern | Safety impact | Mobile/accessibility impact |
|---|---|---|---|
| Static four-item handoff checklist | `UploadIntakePacket` | Shows `Needs Review / Do Not Publish`, no-approval copy, and ResourceSpace write-mapping honesty before submit | Evidence cards stack cleanly at 320 px; no clipped controls or horizontal overflow |
| File/tag context split across form controls only | Selected file and tag packet summary | Reinforces that tags are suggested taxonomy terms and files are intake evidence, not approved media | Summary remains text-first and does not depend on color alone |

Code paths:

- `frontend/components/UploadIntakePacket.tsx`
- `frontend/components/UploadPage.tsx`

Screenshot proof:

- `docs/screenshots/qa/upload-intake-packet-desktop.png`
- `docs/screenshots/qa/upload-intake-packet-mobile-320.png`

Verification:

- Browser proof confirmed packet, selected-file preview, `Needs Review / Do Not Publish`, and ResourceSpace write-mapping honesty at 1440 and 320 px.
- `portal-api-smoke` and full `portal-browser-qa` passed after the change.

## 2026-06-06 - Review Cockpit Industry Pass

Decision: replace the weakest remaining Review surface with a more visible media-review cockpit rather than adding more generic cards.

Replacement:

| Old pattern | New pattern | Safety impact | Mobile/accessibility impact |
|---|---|---|---|
| Review opened directly into long generated records | `ReviewTriageStrip` responsive media board | Lets reviewers scan risk visually without changing preview/download policy | Buttons use `aria-pressed`; responsive grid keeps focusable controls inside viewport at 320 px |
| Soft row/card hybrid | `ReviewQueueAssetCard` | Raw ResourceSpace status, usage scope, ResourceSpace ID, risks, missing fields, and next check are visible per asset | Cards stack cleanly on 320 px; selected state is text/border/background, not color-only |
| Page-owned queue markup inside `ReviewPage` | Review queue presentation modules | `ReviewPage` keeps orchestration, fetching, role, evidence, and pending-write behavior; presentation now has better locality | Browser proof captured 1440/768/320 with no console errors and no horizontal overflow |

Code paths:

- `frontend/components/ReviewTriageStrip.tsx`
- `frontend/components/ReviewQueueAssetCard.tsx`
- `frontend/components/ReviewPage.tsx`

Screenshot proof:

- `docs/screenshots/qa/after-review-industry-pass-desktop.png`
- `docs/screenshots/qa/after-review-industry-pass-tablet-768.png`
- `docs/screenshots/qa/after-review-industry-pass-mobile-320.png`

## 2026-06-06 - Collections Album Shelf Pass

Decision: replace the Collections page's remaining generic album-grid feel with a selected shelf inspector so it behaves more like a real DAM album browser.

Replacement:

| Old pattern | New pattern | Safety impact | Mobile/accessibility impact |
|---|---|---|---|
| Metrics header plus repeated album cards | `CollectionShelfInspector` selected album evidence panel | Album approval remains a navigation signal only; inspector repeats that Library/detail checks are required before publication | Hover and keyboard focus update the inspector; 320 px stacks cards and inspector with no horizontal overflow |
| Album cards had no persistent selected state | Active `CollectionAlbumCard` shelf state | Stable collection ID and preview-pending state are visible without implying approved downloads | Selected state uses border/ring plus text labels, not color alone |
| No-preview cards could read as broken | Intentional ResourceSpace preview-pending contact sheet | No fake thumbnails and no Viewer preview bypass | Preview-pending text remains visible at desktop and 320 px |

Code paths:

- `frontend/components/CollectionsPage.tsx`
- `frontend/components/CollectionAlbumCard.tsx`
- `frontend/components/CollectionShelfInspector.tsx`

Screenshot proof:

- `docs/screenshots/qa/collections-industry-pass-desktop.png`
- `docs/screenshots/qa/collections-industry-pass-mobile-320.png`

Verification:

- Browser proof confirmed collection shelf inspector, stable ID labels, and `Open Library results` action at 1440 and 320 px.
- No console errors and no horizontal overflow were observed after restarting the stale dev server.
