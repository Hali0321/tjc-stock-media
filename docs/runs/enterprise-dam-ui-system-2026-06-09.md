# Enterprise DAM UI System Run - 2026-06-09

## Branch

- Repo: `Hali0321/tjc-stock-media`
- Branch: `codex/dam-v2-enterprise-ui-system`
- Base commit: `a912237`
- Starting commit for this run: `e661f7c`

## Goal

Continue the enterprise DAM UI refinement without restarting the product. The portal remains a private church/NGO DAM front end over ResourceSpace metadata/review and Google Shared Drive master-original storage.

Primary objective: deepen shared UI module boundaries and keep polishing the whole route set so normal church users can find approved media, open a record, read "Can I use this?", download only when approved, request review when unsure, and send media without publishing.

## Safety Invariants

- ResourceSpace remains the metadata/search/review source of truth.
- Google Shared Drive remains the master-original storage layer.
- Viewer and Contributor surfaces use viewer-safe language.
- Reviewer/Admin surfaces may show operational truth.
- Upload and Send media create review packets only; they do not publish.
- Unknown source, rights, consent, people/minors, usage scope, or approval blocks self-serve download.
- Source/original access remains request-only and auditable.
- Download, review decision, admin action, and source-file request behavior remains auditable.
- Package approval never implies item-level approval.
- Viewer defaults do not show unapproved assets as reusable.
- Yellow review-needed surfaces must say download remains blocked until approval.

## Route List

- `/` - Find approved media / ops search by role
- `/assets/[id]` - media record and "Can I use this?" verdict
- `/collections` - Packages
- `/upload` - Send media for review
- `/review` - Review Inbox
- `/admin` - Governance
- `/guide` - task assistant

## Test Plan

- `npm --prefix frontend run typecheck`
- `npm --prefix frontend run build`
- `git diff --check`
- `BASE_URL=http://localhost:3008 make portal-api-smoke`
- `BASE_URL=http://localhost:3008 make portal-browser-qa`
- `make frontend-check`
- `make demo-check`
- `make launch-readiness`

Known acceptable warning: existing launch-readiness `.env` placeholder warning is acceptable only if emitted by existing repo scripts/docs and no new launch blockers appear.

## Screenshots To Refresh

- Library / Find: desktop, 390, 320
- Packages: desktop, 390, 320
- Upload / Send media: desktop, 390, 320
- Review: desktop, 390, 320
- Asset Detail: desktop, 390, 320
- Admin / Governance: desktop, 390
- Guide: desktop, 390, 320

## Baseline

- Branch fast-forwarded from `a912237` to remote `e661f7c`; ancestry from `a912237` verified.
- Baseline `npm --prefix frontend run typecheck`: PASS.
- Baseline `npm --prefix frontend run build`: PASS.
- Baseline `git diff --check`: PASS.
