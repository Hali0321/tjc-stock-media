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
- Geist variable sans via `next/font/google`; Geist Mono reserved for technical IDs and tabular figures.
- App-like shell with persistent navigation, utility role switch, compact command search, use-case shortcuts, operational saved views, compact album rail, filter controls, sort controls, and image grid high on page.
- Status labels use warm text plus color. Color never carries meaning alone.
- Cards stay simple: thumbnail, short status, title, usage label, collection/event, one tag, download state.
- Deeper metadata moves to hover/focus and asset detail so the library feels like a media product, not a database.
- Use less explanatory text. Thumbnails, badges, filters, and clear actions should carry the product.
- Asset detail includes moment-of-use guidance: best used for, please avoid, caption suggestion, credit requirement, and ministry sensitivity.

Reference patterns, adapted without copying:

- Google Photos / Apple Photos: minimal chrome, image-first browsing, fast visual scanning.
- Brandfolder: professional DAM search, metadata clarity, approval/download confidence.
- Frontify: usage guidance and lifecycle/status clarity.
- PhotoShelter: contributor/reviewer/user role separation.
- Notion Gallery: calm cards, simple tags, approachable metadata.
- Airbnb: warm, human, photo-led trust.

Avoided:

- abstract generated art
- huge hero section
- beige/yellow dashboard
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
| Background | warm white `#f7f8f4`; no beige/yellow dashboard treatment |
| Surface | white or translucent white; minimal borders and soft depth |
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
| Card radius | 16-28px for app panels; image cards tighter inside panels |
| Chip radius | 999px pills |
| Shadow | very soft image shadow only |
| Typography | Geist variable sans, compact app hierarchy, no giant marketing landing hero |
| Buttons | evergreen primary, neutral secondary/action chips |
| Motion | GSAP only in review workbench; disabled under reduced-motion |

## Current Library Pattern

- App shell: sidebar on desktop, compact top navigation on tablet/mobile.
- Mobile at 320px uses icon-first primary nav with accessible labels so controls fit without horizontal page overflow.
- Main workspace is bounded to a wide app canvas so ultra-wide monitors do not stretch controls.
- Library attention area is a compact DAM command center: Find / Trust / Reuse / Govern, search, use-case buttons, source/safety, and operational counters.
- Saved DAM views are compact action cards with count and purpose, not long documentation cards.
- Featured collections render as compact album thumbnail collages with count/date/scope signals, avoiding oversized low-resolution derivatives.
- Search result copy uses `Showing first 84 of 2,290 matching assets` style language.
- Responsive media grid uses CSS columns: 5 columns desktop, 3 tablet landscape, 2 tablet/mobile landscape, 1 at 320px.
- Asset cards eager-load thumbnails in the local demo to avoid placeholder-heavy stakeholder screenshots.
- Raw filenames are not mutated; a display helper normalizes titles such as `Copy Of Img 0625` to `Image 0625` while preserving original filename in detail metadata.
- Final 320px Library QA measured search at 286px, asset results at 798px, no horizontal overflow, and no visible clipped controls.

## Workflow Screens

- Upload uses a lighter guided intake layout with Context, People and rights, and Files and tags.
- Review uses a professional workbench layout: compact governance metrics, queue tabs, tighter review rows, smaller workflow actions, a selected-asset inspector for source/risk/ResourceSpace traceability, and desktop-only GSAP pin/scale motion that is skipped for reduced-motion users.
- Guide is an actionable usage guide with download decision rows and Do/Avoid blocks.
- Asset detail keeps a large preview and a right-side usage/download inspector, with approved copy and original/master restrictions separated.

## Latest QA Evidence

- `npm run typecheck`: passed on 2026-06-05.
- `npm run build`: passed on 2026-06-05 after a clean `.next` rebuild.
- Production browser QA covered Library, Collections, Detail, Upload, Review, and Guide at 1440px and 320px. Library was also checked at 1280, 1024, 768, 390, and 320px with no horizontal page overflow.
- Role safety API checks: unsafe Viewer download 403; Viewer review/upload 403; Reviewer write action 409 when ResourceSpace API write config is missing; Contributor upload intake 200.
- Refreshed screenshot set lives under `docs/screenshots/`.

## Anti-AI Checklist

- No abstract blob thumbnails.
- No fake AI landscape cards.
- No giant generic hero slogan.
- No fake people/faces.
- No copied stock assets.
- No meaningless decorative icons.
- No over-polished empty dashboard.
- No repeated placeholder-only cards in first viewport.
