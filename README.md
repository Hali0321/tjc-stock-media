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
- Review state: 179 Pending Review, 2 active demo-approved samples
- Files with stored binaries: 181
- HEIC result: 18 originals preserved, 2 previewed natively, 16 have attached JPG derivative alternatives for preview/use
- Demo metadata: 77 resources seeded with visible/TJC tags
- Search checks: Bible 23, Plant 34, Fountain 6, Needs Review 179
- Metadata export: `.runtime/exports/resourcespace-metadata-20260603-184435.csv`

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

1. Search `Bible`, `Plant`, `Fountain`, `MVP 2024`, `Needs Review`.
2. Open a result.
3. Show source path, tags, rights status, usage scope, and notes.
4. Show every import starts as `Needs Review / Do Not Publish`.
5. Show demo-approved resource `368` as `Approved Public`.
6. Show demo-approved resource `441` as `Approved Internal`.
7. Export metadata CSV.
8. Copy approved sample back to Shared Drive.
9. Show original source files remain untouched.

## Commands

```bash
make up              # bootstrap official ResourceSpace Docker repo and start local app
make smoke           # local health checks
make import-audit    # generate source manifest with checksums
make import-mvp-batch # import first batch into ResourceSpace
make heic-derivatives # attach JPG derivatives to HEICs that failed preview
make export-metadata # export current ResourceSpace MVP metadata CSV
make backup          # dump database and archive filestore/config
make restore-test    # non-destructive backup restore check
make down            # stop local containers
```

## HEIC Policy

Keep HEIC originals as the master files. When ResourceSpace cannot preview a HEIC, create an attached metadata-stripped JPG derivative on the same asset record. Normal users can use/download the JPG derivative; admins or designers can still retrieve the original HEIC when Apple-format originals are needed.

## Not Production

This is a local prototype. It does not prove 24/7 uptime, production security, remote access, or full backup policy. Production hosting is a later decision.
