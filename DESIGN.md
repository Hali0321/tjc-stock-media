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
- Compact header, utility role switch, large search, filter chips, sort chips, curated album cards, and image grid high on page.
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
| Background | warm white `#faf9f5`; no beige/yellow dashboard treatment |
| Surface | white or translucent white; minimal borders |
| Text | deep charcoal `#20221f` |
| Muted text | gray-green `#6b6f69` |
| Accent | deep evergreen `#123f3a` |
| Secondary accent | calm navy `#1f4f73` |
| Approved for church-wide use | restrained green |
| Internal ministry use only | navy/blue |
| Please review before public sharing | muted amber |
| Archive only | muted purple/gray |
| Do not publish externally | muted red |
| Spacing scale | 4px rhythm, mostly 8/12/16/24px |
| Card radius | image radius 10px; cards unboxed where possible |
| Chip radius | 999px pills |
| Shadow | very soft image shadow only |
| Typography | system sans, compact hierarchy, no giant marketing hero |
| Buttons | evergreen primary, neutral secondary/action chips |

## Current Library Pattern

- Max shell width: 1320px.
- Featured collections render as thumbnail album cards with count/date/scope signals.
- Search result copy uses `Showing first 84 of 2,290 matching assets` style language.
- Responsive media grid uses CSS columns: 4 columns desktop, 3 tablet landscape, 2 tablet/mobile landscape, 1 at 320px.
- Asset cards eager-load thumbnails in the local demo to avoid placeholder-heavy stakeholder screenshots.
- Raw filenames are not mutated; a display helper normalizes titles such as `Copy Of Img 0625` to `Image 0625` while preserving original filename in detail metadata.

## Anti-AI Checklist

- No abstract blob thumbnails.
- No fake AI landscape cards.
- No giant generic hero slogan.
- No fake people/faces.
- No copied stock assets.
- No meaningless decorative icons.
- No over-polished empty dashboard.
- No repeated placeholder-only cards in first viewport.
