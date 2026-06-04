# TJC Stock Media DAM Prototype

North Star: a TJC user can find a rights-safe asset for a real communication need in under 60 seconds.

This repo sets up a local ResourceSpace DAM prototype for True Jesus Church stock media. Google Shared Drive remains the master copy. ResourceSpace is the librarian: intake, tags, search, rights review, and approved downloads.

```text
Legacy sources
Google Photos / old Drive folders / IA DME folders
        |
        | manual selected batch import for MVP
        v
TJC Stock Media Library Shared Drive
master copy / organized storage
        |
        | manual import now
        | Phase 2: Google Drive connector or StaticSync-style workflow
        v
ResourceSpace on Hali Mac
DAM index / tags / search / review / downloads
        |
        v
Metadata exports + approved sample exports back to Shared Drive
```

## First Batch

Source folder:

`/Users/halim4pro/Desktop/MVP/ResourceSpace/MVP 2024`

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
- Latest metadata export: `.runtime/exports/resourcespace-metadata-20260604-171242.csv`

## Quick Start

```bash
cp .env.example .env
make up
make smoke
make import-audit
```

Open ResourceSpace:

`http://localhost:8088`

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
3. Show source path, tags, rights status, usage scope, and notes.
4. Explain every new import starts as `Needs Review / Do Not Publish`.
5. Show MVP 2024 resources are now `Approved Public`.
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
make export-metadata # export current ResourceSpace MVP metadata CSV
make backup          # dump database and archive filestore/config
make restore-test    # non-destructive backup restore check
make down            # stop local containers
```

## HEIC Policy

Keep HEIC originals as the master files. When ResourceSpace cannot preview a HEIC, create an attached metadata-stripped JPG derivative on the same asset record. Normal users can use/download the JPG derivative; admins or designers can still retrieve the original HEIC when Apple-format originals are needed.

## Not Production

This is a local prototype. It does not prove 24/7 uptime, production security, remote access, or full backup policy. Production hosting is a later decision.
