# TJC Stock Media Handoff

## What Runs Locally

- ResourceSpace backend: `http://localhost:8088`
- TJC Stock Media frontend: `http://localhost:4867`

Run:

```bash
make up
make frontend-dev
```

Check:

```bash
make frontend-check
make demo-check
```

Latest local QA captured the required screenshots under `docs/screenshots/` from a fresh production Next server at `http://localhost:3029` with `TJC_STOCK_MEDIA_ROOT` set to the repo root. The set includes desktop plus 320/390 mobile screenshots for Library, Collections, Upload, Review, Asset Detail, Guide, and Admin, plus primitive proof captures. Full browser QA covered 1440, 1280, 1024, 768, 390, and 320 px with zero failures, zero warnings, zero console errors, and zero network failures.

## Production Hardening Truth

Current branch hardens the portal boundary instead of promoting the portal into a second DAM. Production client role overrides are ignored. Without trusted SSO headers, privileged API actions fail closed. Local beta `?role=` and `localStorage` switching are QA-only and must not be described as production auth.

Runtime `.runtime` JSON/JSONL remains local/private-beta storage. In production, stateful writes that require durability must use an explicit durable runtime store or fail closed. Review writeback is only ResourceSpace truth when live API writeback succeeds and a re-read confirms status, reviewer, date, and notes.

The current frontend shell is the final dense ministry DAM UI:

- Desktop uses compact top navigation plus role utility controls.
- Styling is Tailwind v4 with a small global token/base layer, Inter plus Noto Sans TC via `next/font/google`, Geist Mono for technical IDs, and `lucide-react` icons.
- Main nav: Library, Collections, Upload, Review with restrained Tubelight-inspired active state.
- Mobile at 320 px uses icon-first nav with accessible labels to preserve fit.
- Usage Guide: secondary utility/footer link, not primary navigation.
- Command palette: `Cmd/Ctrl+K` for search, saved views, collections, upload, stable review queue URLs, ResourceSpace ID lookup, Guide, and Admin diagnostics.
- Library: compact command bar, early search, desktop saved-view/browse rail, use-case shortcuts, right filter panel, sort controls, honest count truth, contact-sheet results, and collapsible production signals.
- Collections: album-style records opened by stable collection ID, compact thumbnail rails, selected collection inspector, `Open Library results` action, and Sabbath wording.
- Asset cards: short status, usage label, display-normalized title, collection/event, blocked/download signal, provenance on hover/focus, and explicit restricted/pending preview states when the export lacks a derivative.
- Asset detail: trust record for raw ResourceSpace status, portal reuse state, blocker reasons, usage guidance, source/review/technical provenance, `MediaPreviewPanel`, safe derivative comparison panel, approved copy separated from original/master restriction. Mobile shows trust/download state before preview/related assets. Use/Source/Review/Files/Related use maintained `DamTabs`. Secondary copy/open actions use maintained `DropdownActionMenu` / `AssetActionsMenu`; the ResourceSpace source-of-truth link remains DAM Admin only.
- Upload: guided three-step intake with autosave checkpoint, maintained dropzone/selected-file preview, taxonomy-backed `InputWithTags`, type/size display, remove/clear controls, required evidence markers, reviewer handoff packet, large-media guidance, bottom action bar, and blocked-until-review receipt.
- Review: queue tabs, queue toolbar, xl desktop DataTable, compact tablet/mobile decision rows, selected-asset `Overview / Metadata / Usage / AI Insights / Pending write` inspector tabs, evidence checklist, note field, audit preview, pending write state, explicit load-more gate for long queues, secondary inspector actions via maintained `AssetActionsMenu`, hold-and-release controls for archive/do-not-publish decisions, and desktop-only GSAP motion disabled by reduced-motion.
- Admin: production readiness console with left admin sidebar, readiness progress panel, source/read/write cards, launch gate, DataTables for backlog/integration/field/vocabulary, pending blockers, field mapping coverage, vocabulary, and portal gate.
- Guide: editorial usage guide with anchor nav, uncertainty callout, row icons, Do/Avoid columns, media coworker callout, and a collapsible preview safety states section.

## Architecture

```text
Browser
  -> Next.js portal
  -> server-side media-source adapter
  -> ResourceSpace API or ResourceSpace metadata export
  -> ResourceSpace backend
  -> Google Shared Drive master-original references
```

ResourceSpace remains the source of truth for assets, metadata, review state, approval status, reviewer notes, permissions, and download eligibility.

Google Shared Drive remains the master-original warehouse.

The frontend is not a second DAM. It does not store approval state, create a second metadata database, rename files, move files, delete files, or expose ResourceSpace API keys to the browser.

Display title cleanup is presentation-only. Original filenames and ResourceSpace IDs remain in asset detail metadata and the ResourceSpace export remains the source data.

## Current Data Source

Current Mac reference reads the latest local ResourceSpace metadata CSV export from:

```text
.runtime/exports/resourcespace-metadata-*.csv
```

Latest checked export: `.runtime/exports/resourcespace-metadata-20260604-193852.csv`.

This is real ResourceSpace-exported data, but approval writes are read-only until ResourceSpace signed API field mapping is configured.

## Role Safety

Viewer cannot approve.

Viewer cannot download unsafe assets.

Contributor can submit upload intake but cannot approve.

Reviewer/DAM Admin can open review queue. Review actions go through `/api/review`. Missing evidence returns `400`. Valid evidence queues a local pending-write record and returns `202 pending-write` until ResourceSpace API write mapping is configured. Pending writes are not final ResourceSpace truth.

Request-original, request-review, and ask-media-coworker dialogs only open email drafts. They do not grant original access, approve reuse, update ResourceSpace, or create pending review writes.

Latest checked behavior on 2026-06-07:

| Check | Result |
|---|---|
| Viewer download for non-portal-ready / unsafe assets | 403 blocked |
| Viewer blocked detail asset | visible as trust record, no unsafe active download link |
| Reviewer blocked detail asset | visible for review, no unsafe active download link |
| Viewer review POST | 403 blocked |
| Reviewer review POST without note/checklist | 400 missing evidence |
| Reviewer review POST with valid evidence | 202 local pending write |
| Viewer upload POST | 403 blocked |
| Contributor source-link intake POST | validated; empty browser file placeholders ignored and fileCount stays 0 |
| Blocked asset detail page | no active `/api/download` links for Viewer |

Reviewer action labels are user-facing, but map to backend workflow values:

| UI action | Backend action/status |
|---|---|
| Approve for church-wide use | Approved Public |
| Approve for internal ministry use | Approved Internal |
| Archive only | Searchable Archive |
| Do not publish externally | Do Not Use |

## Download Safety

Only approved use copies are downloadable through `/api/download/:id`.

Needs Review, Searchable Archive, Possible Minors, and Do Not Use assets return blocked responses for normal users. The UI presents these as `Please review before public sharing`, `Archive only`, `Contains children/youth`, and `Do not publish externally`. Original/master files are visually separated and restricted.

## Thumbnail Safety

The frontend uses `/api/assets/thumbnail/:id` to resolve a ResourceSpace derivative for a specific asset ID. It never exposes the whole filestore directory and never copies thumbnails into Git.

If the current ResourceSpace export lacks a usable preview derivative for the role, the portal shows `Preview pending` or `Preview unavailable` and keeps the reuse decision governed by policy. It does not fabricate thumbnails.

## Deferred UI Items

- Theme toggle is intentionally deferred. Dark mode needs a full contrast/safety-label pass before it can be enabled without weakening approval, warning, blocked, people/minors, or pending-write clarity.
- Library pagination is implemented with preserved search/view/filter/sort state and exact `Showing X-Y of Z` copy. Richer collection/detail pagination remains a follow-up only if those views need deeper browsing.

## 2026-06-07 Handoff Delta

- `frontend/components/StatusBadge.tsx` now owns the shared `TjcStatusBadge` primitive and semantic wrappers for raw status, reuse, rights, review, visibility, and download states. Asset Detail uses the wrappers in `AssetTrustPanel`.
- `frontend/components/DataTable.tsx` is visible in Admin backlog/integration/field/vocabulary tables and Review xl desktop queue.
- `frontend/components/MediaPreviewPanel.tsx` supports image/video/audio/document/restricted/unknown modes; document/video/audio modes are safe shells until ResourceSpace exports matching safe derivatives.
- `frontend/lib/tjc-toasts.tsx` wires Sonner feedback for upload, draft, share/copy, review, pending write, blocked download, and save failure events.
- `frontend/components/AdminPage.tsx` includes an `Audit log` sidebar anchor and read-only audit section. Pending review writes still remain local queue records until ResourceSpace write mapping is configured.
- `frontend/components/GuidePage.tsx` mobile jump links wrap instead of scrolling offscreen; browser QA confirmed no clipped Guide controls at 768/390/320.
- `frontend/components/ReviewPage.tsx` uses a mobile queue selector plus an 8-card compact mobile queue while desktop/xl keeps the Review DataTable and load-more gate expected by browser QA.
- `frontend/components/AppNav.tsx` preserves Tubelight-style active state and uses 320px icon-first labels to avoid clipped Admin navigation.
- `docs/ui-system/21st-primitive-implementation-matrix.md` documents source status, app-native targets, real usage, screenshot evidence, accessibility behavior, rejected behavior, and debt for each mapped 21st.dev primitive.
- Required screenshots and primitive proofs were refreshed against `http://localhost:3029`; the capture manifest records no horizontal overflow.

## Remaining Before Church PC/NAS

- Configure production host and durable runtime storage.
- Restore ResourceSpace backup on clean church machine.
- Protect access through Cloudflare Access or Google Workspace allowlist.
- Configure signed ResourceSpace API field mapping for portal review/upload writes.
- Confirm backup job and restore test on the target host.
- Pilot video/audio import with large-media intake.
- Replace local demo role switch with real church access control and trusted SSO headers.
