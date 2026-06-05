# TJC Stock Media DAM Prototype

North Star: a TJC user can find a rights-safe asset for a real communication need in under 60 seconds.

This repo sets up a local ResourceSpace DAM prototype and a TJC-facing Next.js portal for True Jesus Church stock media. Google Shared Drive remains the master copy. ResourceSpace is the librarian: intake, tags, search, rights review, and approved downloads. The Next.js portal is the friendly search/upload/review surface for stakeholders and ministry users.

```text
Legacy sources
Google Photos / old Drive folders / IA DME folders
        |
        | manual selected batch import for MVP
        v
TJC Stock Media Library Shared Drive
master warehouse / selected originals / organized storage
        |
        | manual import now
        | Phase 2: Google Drive connector or StaticSync-style workflow
        v
ResourceSpace prototype on Hali Mac
DAM index / tags / search / review / downloads
        |
        v
Metadata exports + approved sample exports back to Shared Drive
Controlled launch target: church PC/NAS + Cloudflare Access + fresh install/restore.
Approved Public/Internal folders are delivery shelves, not the archive.
```

## Launch Plan

Combined launch plan:

`docs/launch-plan.md`

Key launch wording:

```text
4-6 weeks to launch full-archive-capable infrastructure,
with tiered archive import and partial human review.
```

Launch is blocked until a church-owned PC/NAS can run ResourceSpace without Hali's Mac, Cloudflare Access protects the site, backups restore on a clean host, large media has an admin intake path, and unreviewed assets cannot be mistaken for approved media.

## First Batch

Source folder:

`/Users/halim4pro/Desktop/MVP/Stock Media/01_Source Exports/Photos/Imported/MVP 2024`

Current inventory:

- 181 files
- 480 MB
- 142 JPG, 3 JPEG, 18 PNG, 18 HEIC

Current import status:

- ResourceSpace collection: `MVP 2024 - First Batch`
- Imported active resources: 181
- Review state: 181 approved and published for the MVP 2024 prototype batch
- Files with stored binaries: 181
- HEIC result: 18 originals preserved, 2 previewed natively, 16 have attached JPG derivative alternatives for preview/use
- HEIC front preview: derivative JPG thumbnails promoted for ResourceSpace cards while original HEIC files remain preserved
- Featured collection: `MVP 2024 - First Batch`
- Demo metadata: 77 resources seeded with visible/TJC tags
- Search checks: Bible 23, Plant 34, Fountain 6
- Latest approval audit: `.runtime/audits/approval-audit-20260604-165722.csv`
- Latest UI polish audit: `.runtime/audits/ui-polish-audit-20260604-171229.csv`
- Latest metadata export: `.runtime/exports/resourcespace-metadata-20260604-193852.csv`
- Local acceptance note: `docs/runs/local-prototype-acceptance-2026-06-04.md`

## Where Imported Files Are

ResourceSpace imported files live in:

`/Users/halim4pro/Desktop/MVP/tjc-stock-media/.runtime/filestore`

Finder hides `.runtime` because the folder starts with a dot. For a visible Finder entry, use:

`/Users/halim4pro/Desktop/MVP/Stock Media/02_Imported Into ResourceSpace`

That folder contains links to the filestore, database, metadata exports, and LM Photos batch report. They are pointers, not duplicate copies.

## Quick Start

```bash
cp .env.example .env
make up
make smoke
make import-audit
make frontend-dev
```

Open ResourceSpace:

`http://localhost:8088`

Open TJC Stock Media portal:

`http://localhost:3008`

Current local prototype login:

- URL: `http://localhost:8088`
- Credentials file: `.runtime/local-admin-credentials.txt` (ignored by Git)

If you rebuild from scratch and see the ResourceSpace setup page, use:

- Database host: `mariadb`
- Database name: `resourcespace`
- Database user/password: values from `.env`

## Demo Flow

Do not demo "ResourceSpace is running." Demo the product behavior:

1. Search `Bible`, `Plant`, `Fountain`, `MVP 2024`, `Approved Public`.
2. Open a result.
3. Show source path, tags, approval label, usage scope, and notes.
4. Explain every new import starts as `Needs Review / Do Not Publish`.
5. Show MVP 2024 resources are now displayed as `Approved for church-wide use`.
6. Show `Reviewed By`, `Reviewed Date`, and `Public and Internal` usage scope.
7. Export metadata CSV.
8. Copy approved sample back to Shared Drive.
9. Show original source files remain untouched.

## Commands

```bash
make up              # bootstrap official ResourceSpace Docker repo and start local app
make smoke           # local health checks
make import-audit    # generate source manifest with checksums
make import-mvp-batch # import first batch into ResourceSpace
make approve-mvp-batch # approve/publish MVP 2024 after reviewer signoff
make heic-derivatives # attach JPG derivatives to HEICs that failed preview
make polish-mvp-ui    # feature MVP collection and promote HEIC JPG thumbnails to front previews
make lm-photos-zip-inventory # inventory remaining LM Photos album ZIPs
make lm-photos-stream-run # dry-run one-album-at-a-time ZIP processing plan
make lm-photos-run-report # summarize LM Photos streaming audits into Markdown
make video-manifest # manifest/checksum Samuel Kuo video intake without importing
make export-metadata # export current ResourceSpace MVP metadata CSV
make backup          # dump database and archive filestore/config
make restore-test    # non-destructive backup restore check
make launch-readiness # local launch documentation/config guardrail check
make frontend-dev # run Next.js portal locally at http://localhost:3008
make frontend-check # typecheck/build frontend and scan for media/secrets/runtime files
make demo-check # frontend checks plus demo/doc guardrails
make down            # stop local containers
```

## Frontend Portal

The portal lives in `frontend/`.

```text
Browser -> Next.js portal -> server-side media-source adapter -> ResourceSpace API/export -> ResourceSpace backend
```

Current data source priority:

1. ResourceSpace API when signed API credentials and field mapping are configured.
2. Latest local ResourceSpace metadata CSV export under `.runtime/exports`.
3. Temporary safe fallback data only if ResourceSpace data is unavailable.

Current Mac reference uses exported ResourceSpace metadata for search/detail/review queue and a dev-only thumbnail proxy for individual ResourceSpace preview derivatives. Approval writes are intentionally read-only until ResourceSpace API field mapping is configured. The route refuses fake persistence instead of creating a second approval database.

Normal users can only download approved use copies. Original/master files stay restricted.

User-facing approval labels are warmer than backend values:

- `Approved Public` appears as `Approved for church-wide use`
- `Approved Internal` appears as `Internal ministry use only`
- `Needs Review` appears as `Please review before public sharing`
- `Searchable Archive` appears as `Archive only`
- `Do Not Use` appears as `Do not publish externally`
- `Possible Minors` appears as `Contains children/youth`

Latest UI QA screenshots:

- `docs/screenshots/library-desktop.png`
- `docs/screenshots/asset-detail-desktop.png`
- `docs/screenshots/upload-desktop.png`
- `docs/screenshots/review-desktop.png`
- `docs/screenshots/library-mobile-320.png`
- `docs/screenshots/detail-mobile-320.png`

Latest browser QA checked 1440, 1024, 768, and 320 px widths with no horizontal overflow. The visual target is Google Photos / Apple Photos simplicity, Brandfolder asset safety, PhotoShelter role-aware browsing, Notion gallery calm, Frontify usage guidance, and a warm TJC ministry tone.

## HEIC Policy

Keep HEIC originals as the master files. When ResourceSpace cannot preview a HEIC, create an attached metadata-stripped JPG derivative on the same asset record. Normal users can use/download the JPG derivative; admins or designers can still retrieve the original HEIC when Apple-format originals are needed.

## Not Production

This is a local prototype. It does not prove 24/7 uptime, production security, remote access, or full backup policy. Production hosting is a later decision.

## LM Photos Completion

Remaining LM Photos are downloaded as Google Photos album ZIPs under:

`/Users/halim4pro/Desktop/MVP/Stock Media/01_Source Exports/Photos/Incoming/lm-photo`

Use streaming mode because local disk is tight:

```bash
make lm-photos-zip-inventory
DRY_RUN=1 make lm-photos-stream-run
DRY_RUN=0 DELETE_VERIFIED_ZIPS=1 make lm-photos-stream-run
```

ZIP deletion is allowed only after an album is extracted, imported or duplicate-linked, audited, verified, and temp extraction is removed. `Open Album` is processed last because it is the largest ZIP.

Each real streaming album now creates:

- a source manifest with SHA-256 checksums
- a Shared Drive-style master path under `.runtime/shared-drive-staging`
- a ResourceSpace import audit
- duplicate-linked rows when an exact checksum already exists

Batch success is not "many files imported." Batch success is that approved media is searchable, rights-aware, traceable, and safe to use.

## Video Intake

Video sources now live separately from photo sources:

`/Users/halim4pro/Desktop/MVP/Stock Media/01_Source Exports/Videos/Incoming`

Current waiting video source:

- `Samuel Kuo/Samuel Kuo-3-001.zip`
- 9.9 GB compressed
- 18 files inside: 11 MP4 and 7 JPG
- About 10.6 GB uncompressed
- Intake note: `docs/runs/video-intake-samuel-kuo.md`

The ZIP has since been extracted locally for inspection. Do not bulk-import the video batch until `make video-manifest` passes and 1-2 MP4 files pass preview/playback/download/storage checks.

Large video/audio files should use Shared Drive Incoming or local admin intake, then be imported/indexed by the DAM admin. Do not force large browser uploads through Cloudflare.
