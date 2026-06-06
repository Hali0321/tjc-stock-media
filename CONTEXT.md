# TJC Stock Media Context

## Domain

TJC Stock Media is an internal church media system for finding, reviewing, and safely reusing photos, videos, and audio.

## North Star

A TJC user can find a rights-safe asset for a real communication need in under 60 seconds.

## Core Terms

- **Source export**: downloaded copy of media from Google Photos or another legacy source. It is intake evidence, not the long-term library.
- **Selected master original**: an original file selected for the stock media system and staged for `TJC Stock Media Library` Google Shared Drive without renaming or metadata mutation.
- **Master warehouse**: `TJC Stock Media Library` Google Shared Drive. It stores selected master originals by year/source album.
- **Approved delivery copy**: curated output copy, shortcut, or derivative placed in Approved Public/Internal folders after review. It is not the only master record.
- **DAM**: Digital Asset Management system. ResourceSpace is the DAM layer for tags, search, previews, rights review, and approved downloads.
- **Source system**: where media originally came from, such as Google Photos, old Drive folders, IA DME folders, or local downloads.
- **Source album**: original Google Photos album name. It is provenance and collection context, not the whole taxonomy.
- **Collection**: ResourceSpace grouping used for source albums, run batches, and curated sets. Collections do not replace metadata/status fields.
- **Import batch**: a selected group of files imported into ResourceSpace for review.
- **Rights reviewer**: person allowed to approve public/internal/restricted use.
- **Quality status**: whether an asset is useful for stock media, such as `Hero Candidate`, `Useful`, `Context Only`, `Low Use`, or `Reject`.
- **Rights status**: whether use rights are known, such as `Unknown`, `TJC-Owned`, `Permission Confirmed`, or `Rights Concern`.
- **Publish status**: operational status for use, such as `Needs Review`, `Approved Public`, `Approved Internal`, `Archive - Not Promoted`, or `Do Not Use`.
- **Approved Public**: raw ResourceSpace status indicating ResourceSpace approval. It is not automatically portal-reusable unless portal reuse policy also passes.
- **Approved Internal**: safe inside TJC, not public.
- **Portal Ready**: computed portal state where source, rights/consent, people/minors, reviewer/date, usage scope, and derivative checks all pass.
- **Batch Approved With Blockers**: raw ResourceSpace-approved asset that still lacks one or more portal reuse requirements. User-facing label: `Needs portal review`.
- **Pending Review Write**: local queued review decision that has not yet been written to ResourceSpace; audit evidence and retry state, not source of truth.
- **Needs Review**: default state for imported assets.
- **Do Not Publish**: default usage scope until reviewed.
- **Exact duplicate**: same SHA-256 checksum. ResourceSpace should keep one canonical asset while preserving all source album memberships and source paths.
- **AI suggestion**: machine-generated title/tag/quality hint. It is audit evidence, not final metadata until accepted by human/rule workflow.

## Current First Batch

- Source: `/Users/halim4pro/Desktop/MVP/Stock Media/01_Source Exports/Photos/Imported/MVP 2024`
- Size: about 480 MB
- Count: 181 image files
- Goal: prove search, tags, review, metadata export, and approved-copy workflow.

## Current Portal Product Surface

- **Library**: find and reuse workspace with compact search, stable saved views, filters, count truth, collection entry points, and contact-sheet asset records.
- **Collections**: album-oriented browsing by stable collection ID. Sabbath language is used instead of Sunday language.
- **Asset detail**: trust record for raw ResourceSpace status, portal reuse state, blockers, source/provenance, reviewer/date, rights, people/minors confidence, files, related assets, and download/original restrictions.
- **Upload**: contributor intake workflow. New media remains blocked as `Needs Review / Do Not Publish` until review.
- **Review**: governance workbench with queue tabs, risk/missing metadata triage, inspector, required checklist, note field, audit preview, and local pending-write queue.
- **Guide**: secondary searchable help for Do/Avoid rules, download decisions, children/youth, source/credit, and large-media intake.
- **No-preview state**: if ResourceSpace export lacks a derivative for the current role, the portal labels the tile as `Preview pending` or `Preview unavailable`; it does not invent or commit media.

## Current LM Photos Completion Source

- Source ZIP folder: `/Users/halim4pro/Desktop/MVP/Stock Media/01_Source Exports/Photos/Incoming/lm-photo`
- Count: 31 Google Photos album ZIP files
- Size: about 8.3 GB compressed
- ZIP inventory observed: about 3,963 files, mostly JPG plus HEIC, PNG, JPEG, TIF, and one ARW
- Constraint: local disk is tight, so process album ZIPs one at a time and delete a ZIP only after that album is imported, audited, staged, and verified.
- Imported LM Photos binaries live in `/Users/halim4pro/Desktop/MVP/tjc-stock-media/.runtime/filestore`. Finder-visible links live in `/Users/halim4pro/Desktop/MVP/Stock Media/02_Imported Into ResourceSpace`.

## Current Video Intake

- Source ZIP: `/Users/halim4pro/Desktop/MVP/Stock Media/01_Source Exports/Videos/Incoming/Samuel Kuo/Samuel Kuo-3-001.zip`
- Size: about 9.9 GB compressed
- ZIP inventory observed: 18 files, including 11 MP4 and 7 JPG
- Uncompressed estimate: about 10.6 GB
- Status: parked for next video stock workflow. Do not extract until disk space and video import plan are confirmed.
