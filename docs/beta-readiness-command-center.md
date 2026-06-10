# Beta Readiness Command Center

Last updated: 2026-06-10

Use this page before inviting teammates. The goal is a controlled beta test, not production launch. ResourceSpace remains source of truth, Google Shared Drive remains master-original warehouse, and TJC Stock Media remains the role-aware workbench.

## Go / No-Go

Current recommendation: **Local and hosted smoke are ready for small internal teammate testing on the stable unlisted Vercel URL. Hold wider rollout until KV/Blob storage, SSO, and seed-data ownership are confirmed.**

Local dry run may continue when these pass:

- [x] `make frontend-check`
- [x] `make launch-readiness`
- [x] `BASE_URL=http://localhost:4868 make portal-api-smoke`
- [x] `BASE_URL=http://localhost:4876 make portal-sso-smoke` against `SSO_TRUSTED_HEADERS=1` local server
- [x] `BASE_URL=http://localhost:4878 make portal-usage-smoke` against `PORTAL_USAGE_LOGGING=1` local server
- [x] `BASE_URL=http://localhost:4880 make portal-delivery-smoke`
- [x] `BASE_URL=http://localhost:4868 make portal-writeback-guard-smoke` against no-live-writeback local server
- [x] `BASE_URL=http://localhost:4880 make portal-beta-rehearsal`
- [x] `BASE_URL=https://tjc-stock-media.vercel.app make portal-hosted-smoke`
- [x] `BASE_URL=http://localhost:4868 make portal-browser-qa`
- [x] Viewer unsafe download stays blocked.
- [x] Reviewer approval without evidence stays blocked.
- [x] Reviewer approval with evidence returns honest queued/pending-write state.

Invite a small internal teammate batch only when these are also true:

- [x] Stable unlisted beta URL exists: `https://tjc-stock-media.vercel.app`.
- [x] Hosted post-deploy smoke passes: `BASE_URL=https://tjc-stock-media.vercel.app make portal-hosted-smoke`.
- [x] Test data source is safe fallback/export data, not live writeback.
- [ ] No sensitive, private, unreleased, youth-identifiable, or copyrighted media is visible in beta.
- [x] Role switch is clearly labeled beta-only.
- [ ] ResourceSpace writeback is disabled unless explicitly approved.
- [x] Feedback triager is assigned: Hali until delegated.
- [x] P0 stop-test rule is documented for testers.

## Beta Surface

| Area | Beta expectation | Owner | Status |
|---|---|---|---|
| URL | Stable unlisted Vercel Next.js deployment with API routes; not static S3-only | Hali | Ready for internal beta |
| Access | Beta access only; production SSO not live | TBD | Blocked |
| Data | Safe fallback/export data; no live writeback | Hali | Ready for internal beta |
| Viewer | Can search, open records, request review, and see blocked unsafe downloads | Hali | Ready for dry run |
| Contributor | Can test harmless intake only; uploads never publish | Hali | Ready for dry run |
| Reviewer | Can test evidence lock and pending-write truth | Hali | Ready for dry run |
| DAM Admin | Can inspect launch blockers and integration readiness | Hali | Ready for dry run |
| Feedback | In-app Report issue plus DAM Admin Feedback Inbox; Hali triages first batch | Hali | Ready; KV/Blob connection still preferred |

## Latest Local Rehearsal

Date: 2026-06-10

Result: **Pass for local beta dry run. Stable hosted alias is ready for small internal beta after hosted smoke passes.**

Checks:

- `make frontend-check`: pass.
- `make launch-readiness`: pass with one `.env` placeholder warning.
- `BASE_URL=http://localhost:4868 make portal-api-smoke`: pass.
- `BASE_URL=http://localhost:4876 make portal-sso-smoke`: pass against local trusted-header server.
- `BASE_URL=http://localhost:4878 make portal-usage-smoke`: pass against local usage-logging server.
- `BASE_URL=http://localhost:4880 make portal-delivery-smoke`: pass for delivery privacy and honest S3 readiness copy.
- `BASE_URL=http://localhost:4868 make portal-writeback-guard-smoke`: pass for no-live ResourceSpace writeback guard.
- `BASE_URL=http://localhost:4880 make portal-beta-rehearsal`: pass; evidence JSON written under `.runtime/beta-rehearsals/`.
- `BASE_URL=https://tjc-stock-media.vercel.app make portal-hosted-smoke`: pass against stable Vercel alias.
- `BASE_URL=http://localhost:4868 make portal-browser-qa`: pass; 16 pages, six viewport widths, 23 screenshots, zero failures, zero warnings, zero console errors, zero network failures.
- Explicit Viewer probe: `Bible` search returned assets, Viewer source payload stayed redacted as `media-library`, asset `368` opened, blocked download returned `403`, Viewer review action returned `403`.
- Explicit Reviewer probe: incomplete evidence returned `400` with evidence blockers; complete evidence returned `202` queued pending-write truth.

## Known Limits To Show Testers

- This is beta, not production.
- Role switch is simulated for QA.
- SSO is not live.
- ResourceSpace writeback may queue as pending evidence; queued is not synced.
- Package drafts, saved views, favorites, and invites are beta affordances unless backend storage is connected.
- Original/master access is not granted by the portal.
- Do not upload sensitive, private, unreleased, youth-identifiable, or copyrighted media.
- Stop testing for P0/Critical privacy, source-truth, writeback honesty, or unsafe download issues.

## Dry-Run Script

Run a local production server:

```bash
npm --prefix frontend run build
cd frontend
TJC_STOCK_MEDIA_ROOT=/Users/halim4pro/Desktop/MVP/tjc-stock-media npx next start --port 4868
```

In another terminal:

```bash
BASE_URL=http://localhost:4868 make portal-api-smoke
BASE_URL=http://localhost:4868 make portal-sso-smoke
BASE_URL=http://localhost:4868 make portal-usage-smoke
BASE_URL=http://localhost:4868 make portal-delivery-smoke
BASE_URL=http://localhost:4868 make portal-writeback-guard-smoke
BASE_URL=http://localhost:4868 make portal-beta-rehearsal
BASE_URL=http://localhost:4868 make portal-browser-qa
```

For SSO rehearsal, start the server with `SSO_TRUSTED_HEADERS=1` or `SSO_PROVIDER=cloudflare-access`; otherwise `portal-sso-smoke` should fail because beta role fallback is intentionally not treated as trusted identity.

For usage analytics rehearsal, start the server with `PORTAL_USAGE_LOGGING=1`; otherwise `portal-usage-smoke` should fail because no SQLite events should be recorded when analytics is disabled.

For delivery privacy rehearsal, no S3 credentials are required. The smoke proves private storage and source custody details stay out of browser-facing payloads and that Admin readiness does not overclaim signed S3 delivery.

For writeback guard rehearsal, use a no-live-writeback local server. The smoke proves ResourceSpace review writes stay queued and visible instead of claiming live API success.

For private beta rehearsal, `portal-beta-rehearsal` writes a JSON evidence packet to `.runtime/beta-rehearsals/<run-id>/summary.json`. Keep that artifact for local decision evidence; do not treat it as teammate invite approval unless the blocked invite prerequisites above are complete.

For hosted URL rehearsal, run:

```bash
BASE_URL=https://tjc-stock-media.vercel.app make portal-hosted-smoke
```

This verifies the hosted routes, feedback POST, non-admin feedback denial, DAM Admin feedback inbox, and Viewer unsafe download block.

Manual Viewer dry run:

1. Open `/` as Viewer.
2. Search `Bible`.
3. Open one result.
4. Confirm the page says whether it can be used.
5. Try unsafe download path and confirm it blocks.
6. Open Guide and confirm download rules are understandable.

Manual Reviewer dry run:

1. Open `/review?role=Reviewer`.
2. Switch queue tabs.
3. Select a review item.
4. Try approval without evidence and note; confirm it blocks.
5. Complete checklist and note.
6. Queue decision and confirm pending-write truth is explicit.

## Feedback Triage

Preferred path: use the in-app Report issue button during Task Mode. DAM Admin reviews reports in Admin → Feedback Inbox, sets status, and exports JSON for agents. Use `docs/teammate-feedback-template.md` only when the app is unavailable.

| Severity | Action |
|---|---|
| P0 | Stop testing. Fix before inviting more teammates. |
| P1 | Fix or document as known limit before next test batch. |
| P2 | Batch for post-test cleanup unless it blocks the core task. |
| P3 | Keep as polish backlog. |

## Beta Pass Criteria

- Viewer can complete find-and-trust task in under 60 seconds.
- Viewer cannot download unsafe/non-portal-ready media.
- Contributor understands send media never publishes.
- Reviewer understands evidence lock and pending-write truth.
- DAM Admin can identify top launch blockers.
- No tester confuses beta state with production state.
