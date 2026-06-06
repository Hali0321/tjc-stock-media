# TJC Stock Media Design

## Product Intent

TJC Stock Media is a practical media library for ministry teams. The first impression should be: search approved church media, understand safety status, download only what is allowed, and upload new material for review.

North Star:

```text
A TJC user can find a rights-safe approved media asset in under 60 seconds.
```

## Visual Direction

- Photo-first library, not admin dashboard.
- Warm white background, deep charcoal text, evergreen/navy accents.
- Tailwind v4 utility system with a small global token/base layer.
- Inter plus Noto Sans TC fallback via `next/font/google`; Geist Mono reserved for technical IDs and tabular figures.
- App-like shell with persistent navigation, utility role switch, compact command search, use-case shortcuts, operational saved views, collection entry points, filter controls, sort controls, and asset contact sheet high on page.
- Tubelight-inspired workflow navigation for Library, Collections, Upload, and Review is implemented as maintained `AppNav`. Guide, command palette, ResourceSpace, and Admin diagnostics stay utility/role-aware.
- Command palette provides `Cmd/Ctrl+K` navigation for search, saved views, collections, upload, review queues, ResourceSpace ID lookup, guide, and admin diagnostics.
- Status labels use warm text plus color. Color never carries meaning alone.
- Cards stay simple: thumbnail, short status, title, usage label, collection/event, one tag, download state.
- Deeper metadata moves to hover/focus and asset detail so the library feels like a media product, not a database.
- Use less explanatory text. Thumbnails, badges, filters, and clear actions should carry the product.
- Asset detail includes moment-of-use guidance: best used for, please avoid, caption suggestion, credit requirement, and ministry sensitivity.

Best combined direction:

```text
Dribbble DAM density
+ 21st.dev workflow components
+ Tubelight Navbar
+ Display Cards for operational state
+ restrained liquid/glass for nav and primary actions
+ Awwwards photographic restraint
+ Inter/Noto typography
+ ResourceSpace truth layer
+ TJC safety rules
```

Reference patterns, adapted without copying:

- 21st.dev: Tubelight-style nav, command palette, display cards for operational state, loading skeletons, upload dropzone/preview, pagination, maintained tabs, review confirmation dialog, request dialogs, secondary action dropdowns, and hold-and-release buttons for high-risk review decisions.
- Dribbble DAM references: dense thumbnail grid, left filter/sidebar rhythm, asset detail panel, table/list toggle, and review/admin information density.
- Awwwards references: clean photographic hierarchy, image-first detail view, restrained white/evergreen polish, and mobile filter behavior without cinematic storytelling.
- CodePen interaction references: upload drag/preview/remove states and gallery filtering ideas adapted to DAM reuse states.
- Godly / Frame.io references: polished media-review cockpit feel, used carefully without dark-heavy trend chrome.
- Monet: calm light-theme admin/guide sections, diagnostics, production blockers, and workflow explanation patterns.
- Pinterest moodboard: archive/upload visual rhythm only; no direct layout copying.
- AI design tools: research/prototyping only. No generated church people, fake ministry media, or production AI dependency.
- Google Photos / Apple Photos: minimal chrome, image-first browsing, fast visual scanning.
- Brandfolder: approval clarity, asset safety, permissions, and download controls.
- Frontify: usage guidance, brand rules, Do/Avoid guidance, and lifecycle clarity.
- PhotoShelter: albums/events, source attribution, contributor/reviewer separation, and permission-aware downloads.
- Bynder / Canto / AEM Assets: metadata facets, governance, review lifecycle, renditions, and reporting.
- ResourceSpace: source-of-truth backend, workflow state, metadata, permissions, admin settings, and asset IDs.
- Notion: calm documentation and guide readability.
- Airtable / Linear: dense workflow UI, clear actions, and table/list/detail rhythm.

Reference accountability lives in `docs/runs/final-product-critique.md`. Each source group is mapped to maintained components, rejected ideas, screenshot evidence, code paths, and remaining debt. This prevents the reference list from becoming a moodboard with no implementation proof.

The detailed 21st.dev scouting inventory and decision log live in `docs/ui-system/component-inventory.md` and `docs/ui-system/design-decision-log.md`.

Current maintained components from that scouting pass include `AppNav`, `CommandPalette`, `DamTabs`, `DropdownActionMenu`, `AssetActionsMenu`, `HoldReleaseButton`, `LibraryPagination`, `ReviewActionDialog`, `ReuseRequestDialog`, and `UploadFileDropzone`. Image Comparison Slider remains deferred until ResourceSpace provides safe paired derivatives and preview permissions.

Avoided:

- abstract generated art
- huge hero section
- component showcase
- glassmorphism demo
- beige/yellow dashboard
- dark neon dashboard
- pricing/hero/particle templates
- developer console look
- ResourceSpace clone
- second metadata UI

## Safety UX

Every asset detail page answers:

- Can I use this?
- Is it public or internal?
- Can I download it?
- Where did it come from?
- Who reviewed it?

Approved copy and original/master are visually separated. Normal users only see active download for approved use copies. Original/master files are marked restricted.

User-facing labels map to backend statuses:

| Backend status | User-facing label |
|---|---|
| `Approved Public` | Approved for church-wide use |
| `Approved Internal` | Internal ministry use only |
| `Needs Review` | Please review before public sharing |
| `Searchable Archive` | Archive only |
| `Do Not Use` | Do not publish externally |
| `Possible Minors` | Contains children/youth |

Primary navigation is intentionally limited to Library, Collections, Upload, and Review. The usage Guide remains available through the help utility and footer so normal browsing stays media-first.

First 10 seconds should prove:

1. This is a media library.
2. Approved media is safe to use.
3. Unapproved media is blocked.
4. ResourceSpace remains backend/source of truth.

## Roles

- Viewer: search approved public, download approved public copies only.
- Contributor: search approved media and submit uploads for review.
- Reviewer: see review queue and send review actions through server route.
- DAM Admin: sees ResourceSpace escape hatch.

The local role switch is demo-only. Production should map church access control to portal/ResourceSpace roles.

## Data And Backend Boundary

Browser calls Next.js routes. Next.js routes read ResourceSpace API/export data through adapters. ResourceSpace remains source of truth for asset records, metadata, workflow state, approval status, reviewer notes, permissions, and download eligibility.

Current adapter priority:

1. ResourceSpace API when signed API fields are configured.
2. Latest ResourceSpace metadata CSV export.
3. Temporary demo fallback only if ResourceSpace data is unavailable.

The frontend does not persist approval state or create a second DAM database.

## Thumbnail Policy

The Mac reference uses a dev-only thumbnail route that resolves ResourceSpace preview derivatives for individual asset IDs. It does not expose the whole `.runtime/filestore` directory and does not copy media into Git.

## Design Tokens

Current UI tokens live in `frontend/app/globals.css`.

| Token | Value / rule |
|---|---|
| Background | neutral off-white `#f7f8f6`; no beige/yellow dashboard treatment |
| Surface | white with restrained borders; minimal shadow |
| Text | deep charcoal `#20221f` |
| Muted text | gray-green `#687068` |
| Accent | deep evergreen `#123f3a` |
| Secondary accent | calm navy `#1f4f73` |
| Approved for church-wide use | restrained green |
| Internal ministry use only | navy/blue |
| Please review before public sharing | muted amber |
| Archive only | muted purple/gray |
| Do not publish externally | muted red |
| Spacing scale | 4px rhythm, mostly 8/12/16/24px |
| Card radius | mostly 6-8px; larger rounding avoided on workflow surfaces |
| Chip radius | compact rounded rectangles; pills used sparingly |
| Shadow | very soft image shadow only |
| Typography | Inter + Noto Sans TC fallback, compact app hierarchy, no giant marketing landing hero |
| Buttons | evergreen primary, neutral secondary/action chips |
| Motion | GSAP only in review workbench; disabled under reduced-motion |

## Current Library Pattern

- App shell: compact top navigation with a single demo role selector. Library uses a left saved-view/filter rail on desktop and stacked controls on mobile.
- Mobile at 320px uses icon-first primary nav with accessible labels so controls fit without horizontal page overflow.
- Main workspace is bounded to a wide app canvas so ultra-wide monitors do not stretch controls.
- Library attention area is a compact DAM command bar: search, use-case buttons, source/count truth, and collapsible production signals.
- Saved DAM views are compact action cards with count and purpose, not long documentation cards.
- Featured collections render as compact album thumbnail collages with count/date/scope signals, avoiding oversized low-resolution derivatives.
- Search result copy uses `Showing first 84 of 2,290 matching assets` style language.
- Responsive media grid uses contact-sheet columns: up to 6 wide desktop, 4-5 standard desktop, 3 tablet, and 2 at mobile widths.
- Assets without exported preview derivatives show `Preview pending`/`Preview unavailable` states instead of broken-image placeholders. This is honest data readiness, not fabricated media.
- Raw filenames are not mutated; a display helper normalizes titles such as `Copy Of Img 0625` to `Image 0625` while preserving original filename in detail metadata.
- Final 320px Library QA shows search and results without horizontal overflow or clipped controls.

## Workflow Screens

- Upload uses a guided intake workflow with Context, People and rights, Files and tags, required-field markers, reviewer handoff checklist, large-media guidance, and blocked-until-review receipt copy.
- Upload previews selected files before submit, shows type/size, flags files over 100 MB for Shared Drive Incoming, and lets contributors remove/clear selected files.
- Review uses a professional workbench layout: compact governance metrics, queue tabs, dense review rows, smaller workflow actions, selected-asset inspector, evidence checklist, audit preview, pending write state, and desktop-only GSAP motion skipped for reduced-motion users.
- Guide is a searchable secondary usage guide with download decision rows and Do/Avoid blocks.
- Asset detail is the trust record. On mobile, title/reuse state/blockers/download decision render before preview/related assets. Approved copy and original/master restrictions stay separated.

## Latest QA Evidence

- `npm run typecheck`: passed on 2026-06-06 during final DAM UI pass.
- Production browser QA refreshed Library, Collections, Detail, Upload, Review, and Guide at 1440px and 320px, plus responsive QA at 1280, 1024, 768, 390, and 320px, with no horizontal page overflow.
- Role safety API checks remain server-owned: blocked Viewer downloads return 403, missing review evidence returns 400, valid review evidence queues a 202 pending write, and upload intake does not fake file counts.
- Latest browser QA includes command palette and upload file-preview checks. Expected 400/403 denials are recorded as safety checks.
- Refreshed screenshot set lives under `docs/screenshots/`.

## Anti-AI Checklist

- No abstract blob thumbnails.
- No fake AI landscape cards.
- No giant generic hero slogan.
- No fake people/faces.
- No copied stock assets.
- No meaningless decorative icons.
- No over-polished empty dashboard.
- No broken-image placeholders; no-preview export gaps are labeled.
- Theme toggle deferred: dark mode needs a full safety-label contrast pass before enabling.
