# Team Beta GO/NO-GO Packet

Last updated: 2026-06-11

Purpose: one canonical decision packet for the TJC Stock Media internal Team Beta test round. This packet is the final place to check whether the current build is ready for owner-led dry run, teammate invite batch, or production launch.

This packet does not approve public launch, production SSO, live ResourceSpace writeback, public downloads, broad archive reuse, source media mutation, staging, commits, deploys, or external communications.

## Decision

| Scope | Decision | Reason |
|---|---|---|
| Owner-led internal dry run | GO | Local technical and browser evidence is green for the covered beta workflow. |
| Tiny teammate invite batch | GO | Final owner signoff is complete for six named internal testers only. |
| Production/internal launch | NO-GO | Production SSO, durable storage, live ResourceSpace writeback, full rights review, production delivery, and full archive readiness are not proven. |

## What Is Ready

| Area | Evidence | Status |
|---|---|---|
| Core local readiness | `make launch-readiness` passes with `failures=0`, `warnings=1`; warning is `.env` placeholder values. | GO for beta dry run |
| Type safety | `npm --prefix frontend run typecheck` passes. | GO |
| API payload safety | `node scripts/api-payload-guard.mjs` passes. | GO |
| API audit coverage | `node scripts/api-audit-guard.mjs` passes. | GO |
| Storage honesty | `node scripts/storage-honesty-guard.mjs` passes. | GO |
| Browser QA | `docs/screenshots/qa/browser-qa-report.json` covers 17 pages, 6 viewport widths, 23 screenshots, zero failures, zero warnings, zero console errors, and zero network failures. | GO |
| Local beta rehearsal | `.runtime/beta-rehearsals/20260611T182011Z-71517/summary.json` passes Viewer search/open/download-block/review-block, Reviewer evidence lock, honest queued write, and Admin readiness. | GO for local dry run |
| Seed/media signoff packet | `docs/team-beta-seed-media-signoff.md` includes counts, sample searches, fail conditions, research-derived categories, and signoff text. | Signed for preview-only tiny internal beta |
| Hosted access/env packet | `docs/team-beta-hosted-access-proof.md` defines required hosted env, private URL policy, smoke safety, fail conditions, and owner signoff text. | Signed for queued/disabled writeback |
| Feedback/incident runbook | `docs/team-beta-feedback-incident-runbook.md` defines P0/P1/P2/P3, watch cadence, export path, stop-test triggers, and tester notices. | Primary and backup assigned |
| Tester packet | `docs/team-beta-internal-test-packet.md` contains invite copy, role links, tasks, boundaries, feedback questions, stop-test policy, and pre-send checklist. | Ready for six named testers |
| Signoff record | `docs/team-beta-signoff-record.md` is the human-owned place to fill owner, timestamp, evidence, and decision fields. | Complete; GO for tiny internal Team Beta |
| Research alignment | `docs/team-beta-research-synthesis.md`, `docs/team-beta-rights-playbook.md`, and `docs/team-beta-qa-matrix.md` cover TJC-only positioning, reuse tiers, doctrine/sacrament review, hymn/channel rights, RE/minors consent, testimony sensitivity, taxonomy, masters vs derivatives, and AI limits. | GO |

## Closed Human Gates

These gates are closed only for the six-person tiny internal Team Beta batch named below.

| Gate | Required owner | Required evidence | Current status |
|---|---|---|---|
| Seed/media safety | Enoch Liu primary; Hali Ding backup | Preview-only tiny beta visibility accepted; seed has 181 Viewer-visible records and 0 portal-ready/downloadable records. | Closed for tiny beta |
| Access/private URL | Enoch Liu | Named tester list, stable URL-only policy, no Vercel preview URL sharing, no forwarding outside group. | Closed for tiny beta |
| Hosted env/writeback | Hali Ding | Hosted env confirmation: `RESOURCESPACE_ENABLE_WRITEBACK=0`, `RESOURCESPACE_WRITEBACK_MODE=queued`, `BETA_FEEDBACK_ENABLED=1`, `BETA_TASK_MODE_ENABLED=1`, `DOWNLOAD_GATE_ALLOW_DEMO_ROLES=0`. | Closed for tiny beta |
| Feedback triage | Hali Ding primary; Enoch Liu backup | First 24 hours after invite watched; Hali owns export and next-batch decision with project owners. | Closed for tiny beta |
| Stop-test response | Hali Ding primary; Enoch Liu backup | Hali can pause testing, notify testers, preserve safe evidence, and decide resume/no-resume; Enoch backs up. | Closed for tiny beta |

Signed invite scope:

- Named testers: Jackie Yu, Alan Yu, Enoch Liu, Hali Ding, Joanna Chou, Richard Pang.
- Project owners: Hali Ding and Enoch Liu.
- Stakeholders/supervisors: Jackie, Alan, Joanna, Richard.
- Stable URL only: `https://tjc-stock-media.vercel.app`.
- Do not widen beyond these testers without a new signoff record.

## Research-Derived No-Go Checks

Teammate invite returns to NO-GO if any of these are violated or not explicitly covered in the owner review:

| Risk | Required beta behavior |
|---|---|
| Doctrine/sacrament | Baptism, Holy Spirit, footwashing, Holy Communion, Sabbath, prayer, and worship-context media require domain review before broad reuse. |
| Hymn/music | Hymns of Praise, choir, lyric slides, public livestream, public video, and hymn 470-525 use require channel, territory, rights basis, and notice validation. |
| RE/minors | Religious Education, youth, children, student events, and minor-identifying captions default restricted until consent/release basis is documented. |
| Testimony/pastoral | Illness, healing, visions, family conversion, spiritual battle, grief, prayer requests, and pastoral/private details default context-safe or archive-only unless explicitly reviewed. |
| Reuse tiers | Stock-safe, context-safe, and archive-only are separate states; found does not mean approved. |
| Masters/derivatives | Ordinary roles see previews or approved derivatives only; masters, originals, source paths, checksums, private URLs, and source custody details stay restricted. |
| AI | AI may suggest tags only; AI cannot approve rights, people/minors, doctrine, sensitivity, public reuse, or internal reuse. |

## What To Tell Testers After Gates Close

Use `docs/team-beta-internal-test-packet.md` as the send packet. Keep this framing:

- This is a tiny internal Team Beta workflow test.
- This is not production and not a public media library.
- Google Shared Drive remains the master-original warehouse.
- ResourceSpace remains the DAM/search/review source of truth.
- Current seed is preview-only unless a human reviewer signs otherwise.
- Do not upload real church media, youth media, sensitive media, copyrighted media, source files, or masters.
- Stop testing immediately for any P0 privacy, source-truth, unsafe-download, writeback-honesty, minors/RE, hymn/sacrament/testimony, or source-custody issue.

## Verification Commands

Run these before posting a final send decision:

```bash
git diff --check
npm --prefix frontend run typecheck
node scripts/api-payload-guard.mjs
node scripts/api-audit-guard.mjs
node scripts/storage-honesty-guard.mjs
make launch-readiness
```

Recommended before widening beyond owner-led dry run:

```bash
BASE_URL=http://localhost:4868 make portal-feedback-smoke
BASE_URL=http://localhost:4868 make portal-beta-rehearsal
BASE_URL=http://localhost:4868 make portal-browser-qa
```

Do not run hosted mutating smokes without owner approval. `portal-hosted-smoke` writes beta feedback storage, and `portal-writeback-guard-smoke` posts review decisions.

## Final Signoff Block

Fill this block before sending teammate invites, or use `docs/team-beta-signoff-record.md` as the source of truth:

```text
Decision: GO
Decision timestamp: 2026-06-11T21:36:44Z
Decision owner: Hali Ding + Enoch Liu
Seed/media reviewer: Enoch Liu primary; Hali Ding backup
Access coordinator: Enoch Liu
Tech/env owner: Hali Ding
Primary feedback triager: Hali Ding
Backup feedback triager: Enoch Liu
Incident lead: Hali Ding primary; Enoch Liu backup
Named tester list: Jackie Yu, Alan Yu, Enoch Liu, Hali Ding, Joanna Chou, Richard Pang
Stable URL only confirmed: Yes
Preview URL sharing blocked: Yes
Seed/media preview-only visibility approved: Yes
Hosted writeback disabled/queued confirmed: Yes
Task Mode and Report issue enabled: Yes
Download demo-role bypass disabled: Yes
Stop-test rule sent to testers: Yes
Feedback watch window: First 24 hours after invite
Next-batch review time: 24 hours after first invite
Notes: Tiny internal Team Beta only. Production, public launch, public downloads, broad reuse, live ResourceSpace writeback, deploys, commits, staging, source media mutation, and external communications remain out of scope.
```

For fastest completion, use the fast final reply template in `docs/team-beta-signoff-record.md` and keep `docs/team-beta-internal-test-packet.md` as the invite copy source.

Current final call: **GO for tiny internal Team Beta invite batch. Production/internal launch remains NO-GO.**
