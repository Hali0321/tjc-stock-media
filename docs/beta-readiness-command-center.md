# Beta Readiness Command Center

Last updated: 2026-06-10

Use this page before inviting teammates. The goal is a controlled beta test, not production launch. ResourceSpace remains source of truth, Google Shared Drive remains master-original warehouse, and TJC Stock Media remains the role-aware workbench.

## Go / No-Go

Current recommendation: **Local dry run passed. Hold external teammate invites until a private URL, seed-data choice, and feedback triager are confirmed.**

Local dry run may continue when these pass:

- [x] `make frontend-check`
- [x] `make launch-readiness`
- [x] `BASE_URL=http://localhost:4868 make portal-api-smoke`
- [x] `BASE_URL=http://localhost:4876 make portal-sso-smoke` against `SSO_TRUSTED_HEADERS=1` local server
- [x] `BASE_URL=http://localhost:4868 make portal-browser-qa`
- [x] Viewer unsafe download stays blocked.
- [x] Reviewer approval without evidence stays blocked.
- [x] Reviewer approval with evidence returns honest queued/pending-write state.

Invite teammates only when these are also true:

- [ ] Private beta URL exists behind approved access.
- [ ] Test data source is chosen: ResourceSpace export, ResourceSpace live API, or safe fallback.
- [ ] No sensitive, private, unreleased, youth-identifiable, or copyrighted media is visible in beta.
- [ ] Role switch is clearly labeled beta-only.
- [ ] ResourceSpace writeback is disabled unless explicitly approved.
- [ ] Feedback triager is assigned.
- [ ] P0 stop-test rule is accepted by testers.

## Beta Surface

| Area | Beta expectation | Owner | Status |
|---|---|---|---|
| URL | Private Next.js deployment with API routes; not static S3-only | TBD | Blocked |
| Access | Beta access only; production SSO not live | TBD | Blocked |
| Data | Current safe ResourceSpace export or explicit fallback | Hali | Needs decision |
| Viewer | Can search, open records, request review, and see blocked unsafe downloads | Hali | Ready for dry run |
| Contributor | Can test harmless intake only; uploads never publish | Hali | Ready for dry run |
| Reviewer | Can test evidence lock and pending-write truth | Hali | Ready for dry run |
| DAM Admin | Can inspect launch blockers and integration readiness | Hali | Ready for dry run |
| Feedback | In-app Report issue plus DAM Admin Feedback Inbox; single triage owner still needed | TBD | Tooling ready, owner needed |

## Latest Local Rehearsal

Date: 2026-06-10

Result: **Pass for local beta dry run. Not approved for teammate invites until hosted private access, seed data, and triage ownership are set.**

Checks:

- `make frontend-check`: pass.
- `make launch-readiness`: pass with one `.env` placeholder warning.
- `BASE_URL=http://localhost:4868 make portal-api-smoke`: pass.
- `BASE_URL=http://localhost:4876 make portal-sso-smoke`: pass against local trusted-header server.
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
BASE_URL=http://localhost:4868 make portal-browser-qa
```

For SSO rehearsal, start the server with `SSO_TRUSTED_HEADERS=1` or `SSO_PROVIDER=cloudflare-access`; otherwise `portal-sso-smoke` should fail because beta role fallback is intentionally not treated as trusted identity.

Manual Viewer dry run:

1. Open `/` as Viewer.
2. Search `Bible`.
3. Open asset `368`.
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
