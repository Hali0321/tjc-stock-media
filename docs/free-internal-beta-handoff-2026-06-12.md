# TJC Stock Media Free Internal Beta Handoff

Status: ready for signed tiny internal beta handoff; production launch, production analytics, durable sharing, durable audit storage, production SSO, live ResourceSpace writeback, and broad reuse remain blocked.

This is a TJC internal DAM beta, not a SaaS/customer rollout and not a public marketplace. Keep Vercel project protection enabled. Google Shared Drive remains master-original custody. ResourceSpace remains the metadata/search/review source of truth and private backend/admin software for DAM operators only.

## Current Architecture

```txt
Internal testers
  -> Vercel protected TJC Media Portal
  -> beta persona login
  -> role-scoped portal views over governed metadata/previews/approved-copy gates

DAM admins only
  -> private ResourceSpace backend
  -> review/search/admin source system

Google Shared Drive
  -> master-original custody
  -> no source mutation or full migration during beta
```

## Beta Portal URL

Use the protected Vercel deployment:

```txt
https://tjc-stock-media.vercel.app
```

When beta auth is enabled, testers should enter through:

```txt
https://tjc-stock-media.vercel.app/beta-login
```

Do not share Vercel preview URLs with testers. Do not treat the beta login as production SSO or real church member authentication.

## Required Vercel Env Vars

Set these in Vercel project environment variables. Do not commit values.

| Variable | Required | Purpose |
|---|---:|---|
| `BETA_AUTH_ENABLED` | Yes | Set to `true` for internal beta login gate. |
| `BETA_SESSION_SECRET` | Yes | Server-only signing secret for beta session cookie. Use a long random value. |
| `BETA_VIEWER_PASSWORD` | Yes | Password for Viewer QA persona. |
| `BETA_CONTRIBUTOR_PASSWORD` | Yes | Password for Contributor QA persona. |
| `BETA_REVIEWER_PASSWORD` | Yes | Password for Reviewer QA persona. |
| `BETA_ADMIN_PASSWORD` | Yes | Password for DAM Admin QA persona. |
| `RESOURCESPACE_ENABLE_WRITEBACK` | Yes | Keep `0` for beta unless a later scoped ResourceSpace writeback test is approved. |
| `RESOURCESPACE_WRITEBACK_MODE` | Yes | Keep `queued` for beta. |
| `DOWNLOAD_GATE_ALLOW_DEMO_ROLES` | Recommended | Keep `0` unless a recorded temporary approved-download demo is explicitly scoped. |

Optional beta operations vars depend on feature use:

| Variable | Use |
|---|---|
| `BETA_FEEDBACK_ENABLED` | Enable in-app beta feedback. |
| `BETA_TASK_MODE_ENABLED` | Enable task mode if using guided tester tasks. |
| `PORTAL_USAGE_LOGGING` | Use only if durable/local usage analytics are intentionally enabled. |

Do not represent missing analytics, audit, package, or saved-search durability as zero incidents or production success. Missing/unconfigured storage remains unavailable or beta-local until proven otherwise.

## Persona Matrix

Passwords are not printed here. Share credentials out-of-band only with named internal testers.

| Persona | Portal Role | ResourceSpace Access | Expected Access |
|---|---|---|---|
| Viewer | Viewer | No | Library/search/detail preview experience only; blocked downloads stay blocked; no review/admin/source/original internals. |
| Contributor | Contributor | No | Upload/intake and draft/reference workflows only; no reviewer/admin controls; no source/original internals. |
| Reviewer | Reviewer | Usually no direct login | Review workflow where already allowed; decisions stay queued/pending unless ResourceSpace writeback is explicitly configured and proven later. |
| DAM Admin | DAM Admin | Yes, 2-3 people max | Admin/governance/readiness and private ResourceSpace admin access for DAM operators only. |

When user provides team names, assign most people to Viewer or Contributor. Limit ResourceSpace direct accounts to 2-3 DAM admins.

## Tester Copy

Use this exact copy for the beta:

> Use the TJC Media Portal for beta testing. ResourceSpace is private backend admin software and is not for normal teammate use. This beta uses governed references, previews, and approved-copy gates only. Do not upload sensitive production media. Original and master files remain protected in Google Shared Drive custody.

Short version:

> Teammates use the TJC Media Portal. ResourceSpace is private backend admin software for DAM admins only. Google Shared Drive keeps originals. Approved folders, packages, collections, saved views, metrics, and AI suggestions do not grant permission.

## What Testers Should Try

| Persona | Tests |
|---|---|
| Viewer | Log in, search library, open asset detail, confirm use-status copy is clear, try a blocked download and confirm it blocks. |
| Contributor | Log in, inspect upload/intake with harmless sample details only, confirm uploads do not publish or approve media, inspect Package Builder draft/reference states, and verify packages/collections are not permission truth. |
| Reviewer | Log in, open review workflow, confirm incomplete approval is blocked, confirm completed decision reports queued/pending honestly, and check doctrine/sacrament, hymn/music, RE/minors, testimony/pastoral, lifecycle, and approved-copy blockers. |
| DAM Admin | Log in, inspect Admin/Governance readiness, confirm source/original details stay hidden from normal roles, review feedback and launch blockers, and verify metrics/readiness read as diagnostics only. |

## What Testers Must Not Do

- Do not upload sensitive production media.
- Do not upload youth-identifiable, private, unreleased, copyrighted, source, master, or personal media.
- Do not forward portal or ResourceSpace access.
- Do not treat beta persona passwords as production login.
- Do not treat found media as approved for reuse.
- Do not treat package, collection, or Brand Hub membership as permission.
- Do not treat raw `Approved Public`, saved views, metrics, readiness cards, or AI suggestions as permission.
- Do not request or create public links.
- Do not bypass blocked downloads.

## ResourceSpace Boundary

Current portal posture remains reference-only:

- ResourceSpace remains metadata/search/review truth.
- Google Shared Drive remains master-original custody.
- Portal read models, previews, metrics, packages, and saved views are governed beta surfaces, not a new DAM truth store.
- Previews and metadata are beta fixtures, ResourceSpace-backed records, or approved snapshots depending on environment.
- Original/source files remain restricted.
- Approved folders and approved-copy derivatives are delivery outputs/readiness shelves, not the complete archive and not permission truth.
- Package Builder stores references only; it does not copy originals, publish packages, create public links, export ZIPs, or bypass per-asset clearance.
- Review decisions do not mutate ResourceSpace unless a later scoped live-writeback implementation is configured, approved, and smoke-tested.
- AI/smart suggestions are separate from human-approved metadata and never approve rights, consent, doctrine, minors, hymn/music, sensitivity, public use, or portal-ready state.

## Screenshots

Saved responsive QA proof:

```txt
docs/screenshots/free-internal-beta-2026-06-12/desktop-1440-login.png
docs/screenshots/free-internal-beta-2026-06-12/desktop-1440-library.png
docs/screenshots/free-internal-beta-2026-06-12/mobile-390-login.png
docs/screenshots/free-internal-beta-2026-06-12/mobile-390-library.png
docs/screenshots/free-internal-beta-2026-06-12/mobile-320-login.png
docs/screenshots/free-internal-beta-2026-06-12/mobile-320-library.png
docs/screenshots/free-internal-beta-2026-06-12/summary.json
```

## Safety Confirmation

- No public launch.
- Vercel protection stays enabled.
- Beta auth is labeled internal beta access.
- Personas are QA-only, not production SSO and not impersonation.
- Passwords come from server env vars.
- No passwords or secrets committed.
- Signed HttpOnly beta session cookie is used.
- Beta session role overrides query/localStorage role spoofing.
- Viewer and Contributor do not receive ResourceSpace admin/source/original internals.
- Blocked download gates remain blocked.
- Package Builder remains reference-only and all-item governed.
- Metrics/readiness/audit summaries remain diagnostics/accountability evidence only.
- Google Shared Drive remains master-original custody.
- ResourceSpace remains metadata/search/review truth.
- No full archive migration.
- No paid resources created.

## QA Results

Latest local proof recorded during this pass:

| Check | Result |
|---|---|
| `git diff --check` | Pass |
| `npm run typecheck` | Pass |
| `make launch-readiness` | Pass with existing `.env` placeholder warning |
| `make portal-hosted-smoke` | Pass |
| `make portal-download-ticket-smoke` | Pass |
| `make portal-writeback-guard-smoke` | Pass |
| `make portal-package-smoke` | Pass |
| Production build with bundled Node 24 | Pass |
| Beta login for Viewer/Contributor/Reviewer/DAM Admin | Pass |
| Logout | Pass |
| Query-role spoofing under beta session | Blocked |
| Desktop 1440 / mobile 390 / mobile 320 | Pass, no horizontal overflow or console errors in recorded Playwright run |

## Remaining Caveats

- Oracle ResourceSpace cloud backend is not complete until user account/login/free-capacity step is available.
- Hosted Vercel env vars still need to be set/confirmed in Vercel before inviting testers.
- Current beta is not production SSO.
- ResourceSpace live writeback remains disabled/queued.
- Metrics/analytics, audit, saved-search, and package storage are beta/local or unavailable unless production-durable storage is explicitly configured and proven.
- Package/share flows are draft/reference workflows; no live public share link, ZIP export, or original/master package export is approved.
- Viewer approved-copy download is gated; current seed may still have zero portal-ready/downloadable assets.
- No full archive import or sensitive production upload should happen.
- Cloudflare Access/Tunnel is optional and pending domain/account availability.
- Human rights/media reviewer signoff is still required before showing real sensitive production media to a wider team.
