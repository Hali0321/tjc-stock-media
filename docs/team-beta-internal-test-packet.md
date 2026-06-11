# Team Beta Internal Tester Packet

Last updated: 2026-06-11

Use this packet only after the pre-send gates below are signed. This is the send-ready packet for a tiny internal Team Beta workflow test of TJC Stock Media. It is not approval for production launch, public sharing, source media changes, live ResourceSpace writeback, public downloads, or broad archive reuse.

Canonical beta URL:

`https://tjc-stock-media.vercel.app`

Supporting docs:

- `docs/team-beta-go-no-go-packet.md`
- `docs/team-beta-signoff-record.md`
- `docs/beta-readiness-command-center.md`
- `docs/team-beta-seed-media-signoff.md`
- `docs/team-beta-hosted-access-proof.md`
- `docs/team-beta-feedback-incident-runbook.md`
- `docs/teammate-beta-invite-pack.md`
- `docs/teammate-test-guide.md`
- `docs/team-beta-rights-playbook.md`
- `docs/team-beta-qa-matrix.md`
- `docs/team-beta-research-synthesis.md`
- Research source: `/Users/halim4pro/Downloads/deep-research-report.md`

## Current Send Status

Packet status: ready to send to the signed six-person tiny internal Team Beta batch.

Invite status: GO for the named testers below. Do not widen beyond this group without a new signoff.

| Gate | Required signoff | Owner | Timestamp | Decision |
|---|---|---|---|---|
| Seed/media safety | Rights/media reviewer confirms preview-only beta visibility is safe, or seed is scrubbed/hidden before invites. | Enoch Liu primary; Hali Ding backup | 2026-06-11T21:36:44Z | Approved |
| Access and private URL | Access owner confirms the invite list is internal only, only the stable unlisted URL is shared, and no Vercel preview URL is shared. | Enoch Liu | 2026-06-11T21:36:44Z | Approved |
| Hosted writeback env | Tech owner confirms `RESOURCESPACE_ENABLE_WRITEBACK=0`, `RESOURCESPACE_WRITEBACK_MODE=queued`, `BETA_FEEDBACK_ENABLED=1`, and `BETA_TASK_MODE_ENABLED=1`. | Hali Ding | 2026-06-11T21:36:44Z | Approved |
| Feedback triage | First-batch triager confirms they will watch Admin -> Feedback Inbox, classify P0/P1/P2/P3, export agent-ready JSON, and decide next-batch status. | Hali Ding primary; Enoch Liu backup | 2026-06-11T21:36:44Z | Approved |
| Stop-test response | Incident lead confirms they can pause testing, notify testers, preserve safe evidence, and decide resume/no-resume. | Hali Ding primary; Enoch Liu backup | 2026-06-11T21:36:44Z | Approved |

Signed send rule:

- Send only to Jackie Yu, Alan Yu, Enoch Liu, Hali Ding, Joanna Chou, and Richard Pang.
- Use only `https://tjc-stock-media.vercel.app`; do not share Vercel preview URLs.
- Feedback watch window is the first 24 hours after invite.
- Next-batch review time is 24 hours after first invite.
- Do not claim production launch, public launch, public downloads, broad reuse, live ResourceSpace writeback, source media mutation, staging, commits, deploys, or external communications.

## Final Invite Copy

Subject: TJC Stock Media tiny internal beta test

Hi team,

We are running a tiny internal beta test of TJC Stock Media, a TJC-only media library workbench for safer search, review, and reuse decisions.

This is not a production launch and not a public media library. Google Shared Drive remains the master-original warehouse. ResourceSpace remains the DAM/search/review source of truth. The portal helps us test whether ministry teammates can find media, understand whether it is stock-safe, context-safe, or archive-only, and report unclear or unsafe states.

Please use only the role link assigned to you:

- Viewer: `https://tjc-stock-media.vercel.app/?role=Viewer&taskMode=1`
- Contributor: `https://tjc-stock-media.vercel.app/upload?role=Contributor&taskMode=1`
- Reviewer: `https://tjc-stock-media.vercel.app/review?role=Reviewer&taskMode=1`
- DAM Admin: `https://tjc-stock-media.vercel.app/admin?role=DAM%20Admin&taskMode=1`
- Guide: `https://tjc-stock-media.vercel.app/guide?role=Viewer&taskMode=1`

Important boundaries:

- Do not forward these links outside the named test group.
- Do not upload sensitive, private, unreleased, youth-identifiable, copyrighted, source, master, or personal media.
- Use harmless sample files only if your task asks you to test Upload.
- Do not treat any visible seed media as reusable or downloadable.
- Do not treat raw `Approved Public` as final reuse approval.
- Do not publish, repost, download around gates, or move any source media.
- Role switch is simulated for beta QA only; it is not production authentication.
- ResourceSpace writeback is queued/disabled for this beta.
- Queued review decisions are portal evidence, not ResourceSpace success.

Stop testing and report immediately if you see any P0 issue:

- A blocked, Needs Review, Possible Minors, archive-only, or Do Not Use asset downloads.
- A page says ResourceSpace was updated when a decision only queued locally.
- Sensitive, private, youth-identifiable, unreleased, copyrighted, source, or master media appears exposed.
- Original/master paths, private URLs, checksums, or source custody details appear to Viewer or Contributor roles.
- Hymn, worship, sacrament, sermon, RE/minors, testimony, or contributor-uncertain media appears reusable without documented review.
- AI suggestions appear to approve rights, people/minors, doctrine, sensitivity, or reuse.

Use the in-app Report issue button in Task Mode. Include your role, route/page, task, device, expected behavior, actual behavior, severity, and screenshot/link when safe.

Thank you for helping us test whether the safest path is also the easiest path.

## Role Expectations

Viewer:

- Search and inspect media.
- Decide whether the asset clearly says if it is stock-safe, context-safe, archive-only, or blocked.
- Confirm unsafe downloads stay blocked.
- Report trust copy that is unclear.

Contributor:

- Test Upload/intake with harmless sample files only.
- Confirm upload never claims publish, approval, or broad reuse.
- Confirm source, event, people/minors, rights, consent/restrictions, and reviewer-note prompts make sense.
- Do not upload real church media, youth media, sensitive media, copyrighted third-party files, source files, or masters.

Reviewer:

- Test review queues, evidence requirements, and pending-write honesty.
- Confirm approval without evidence and note stays blocked.
- Confirm a completed beta decision says queued/synced/blocked honestly.
- Do not treat portal queueing as ResourceSpace truth.

DAM Admin:

- Inspect Admin readiness, blockers, integration states, and Feedback Inbox.
- Confirm source custody details stay hidden from Viewer/Contributor roles.
- Triage reports and export agent-ready JSON after the test.
- Keep launch claims conservative.

## Test Tasks

Run only the tasks for your role unless the coordinator asks you to help with another role.

Viewer tasks:

1. Open your Viewer link.
2. Search `Bible`, open one asset, and decide whether the page clearly says if you can use it.
3. Search `scripture`, then `Bible`; confirm both lead to useful results or useful recovery guidance.
4. Search `Sabbath Service`, `Religious Education`, `RE`, `Hymns of Praise`, `baptism`, `Holy Communion`, `testimony`, and `children`.
5. Confirm doctrine/sacrament, hymn/music, RE/minors, testimony, and archive-only results do not look stock-safe without reviewer evidence.
6. Open a Needs Review or blocked asset and try the download path; confirm it blocks or explains the gate.
7. Open Insights and common use-case cards; confirm routes lead to useful searches.
8. On one mobile pass around 390 px, check nav, Guide, Task Mode, feedback button, and text fit.

Contributor tasks:

1. Open your Contributor link.
2. Walk through Upload using harmless sample files or safe dummy details only.
3. Confirm the default state is `Needs Review / Do Not Publish`.
4. Confirm no screen says upload publishes, approves, or clears public use.
5. Inspect Collections and Package Builder.
6. Confirm ResourceSpace references are clear and originals/masters are not copied or exposed.
7. Report any copy that makes collection or package membership feel like permission.

Reviewer tasks:

1. Open your Reviewer link.
2. Switch review queue tabs and change rows per page.
3. Try to approve a review item without evidence and note; confirm it stays blocked.
4. Complete evidence and note, queue a decision, and confirm the result is honest about queued/synced/blocked status.
5. Check that TJC-specific risks are visible where relevant: doctrine/sacrament review, hymn rights/channel clearance, minors/RE consent, testimony/pastoral sensitivity, reuse tier, and master/derivative separation.
6. Confirm `Approved Public` alone does not become `Portal Ready`.
7. Report any path that makes AI, package membership, collection membership, or raw approval look like final rights clearance.

DAM Admin tasks:

1. Open your DAM Admin link.
2. Inspect Admin modules and confirm each module heading/content changes.
3. Check launch blockers: production SSO, live ResourceSpace writeback, durable storage, S3 derivative delivery, seed safety, rights review, doctrine/sacrament review, hymn rights/channel clearance, minors/RE consent, testimony sensitivity, and master/derivative governance.
4. Open Feedback Inbox, classify at least one test report, and export agent-ready JSON if reports exist.
5. Confirm Admin readiness does not overclaim production launch, public downloads, live writeback, or broad archive approval.

## Feedback Questions

Answer these after the test, using the in-app Report issue button when possible:

1. Could you tell within 60 seconds whether a found asset was stock-safe, context-safe, archive-only, or blocked?
2. Did the blocked download feel clear and trustworthy, or did it feel broken?
3. Which words were confusing: Approved Public, Portal Ready, Needs Review, queued, stock-safe, context-safe, archive-only, derivative, original/master?
4. As a Viewer, did you know what to do next when an asset was not downloadable?
5. As a Contributor, did Upload make it clear that test submissions do not publish?
6. As a Reviewer, did the evidence checklist match real TJC risks?
7. As a DAM Admin, did the command center make launch blockers obvious?
8. Did anything expose too much private source, path, people, youth, testimony, hymn-rights, consent, checksum, or source-custody information?
9. Did search feel TJC-native for terms like Sabbath Service, Religious Education/RE, Evangelical Service, Hymns of Praise, baptism, Holy Communion, Holy Spirit, testimony, children/youth, and archive-only?
10. What one thing must be fixed before inviting another internal tester batch?
11. Did anything make the beta look more production-ready than it is?

Severity labels:

- P0: security, privacy, source-truth, writeback honesty, unsafe download, source custody exposure, minors/RE exposure, hymn/sacrament/testimony misuse.
- P1: workflow blocked, broken route, missing TJC-native recovery guidance, or evidence gate failure.
- P2: confusing UX that slows the mission.
- P3: visual polish, wording, or preference.

## Stop-Test Policy

Stop the test batch for any P0.

P0 examples:

- Viewer downloads a blocked, Needs Review, Possible Minors, archive-only, or Do Not Use asset.
- UI says ResourceSpace was updated when the decision only queued locally.
- Raw `Approved Public` appears to mean public reuse without portal readiness.
- Hymn 470-525, worship, sacrament, sermon, music, RE/minors, testimony, or contributor-uncertain media can be reused without documented review.
- A testimony or pastoral/private item is shown as stock-safe without sensitivity review.
- Original/master paths, private URLs, checksums, or source custody leak to Viewer or Contributor.
- Beta role switching is presented as production authentication.
- AI suggestions are presented as rights, people/minors, doctrine, sensitivity, or public-use approval.

Stop-test response:

1. Stop active testing and do not invite the next batch.
2. Capture role, route, asset id, expected behavior, actual behavior, and screenshot only when safe.
3. Mark the report P0 in Feedback Inbox.
4. Notify the stop-test incident lead and relevant owner.
5. Do not delete, rename, move, or mutate source media.
6. Keep ResourceSpace writeback disabled/queued during triage.
7. Resume only after incident lead records a no-resume or resume decision.

## What Not To Claim

Do not claim:

- Production SSO is live.
- This is production-ready.
- This is a public launch.
- This is a generic stock library.
- Any visible seed media is reusable or downloadable.
- Raw `Approved Public` means stock-safe or Portal Ready.
- ResourceSpace writeback is live.
- Queued means synced.
- Google Shared Drive or ResourceSpace has been replaced.
- The portal owns the archive.
- Original/master access is available to normal roles.
- Package, collection, or Brand Hub membership grants permission.
- AI approved rights, people/minors, doctrine, sensitivity, or reuse.
- Full archive launch means every file is approved.

Use these claims instead:

- This is a church-internal beta, not a production launch.
- This is a TJC-only church media library, not a generic stock bucket.
- Google Shared Drive remains the master-original warehouse.
- ResourceSpace remains the source of truth for DAM search and review.
- The portal is the role-aware workbench.
- Found does not mean approved.
- The default is Needs Review / Do Not Publish.
- Blocked download is a feature, not a bug.
- Current beta is preview-only workflow testing until rights reviewers approve reusable seed media.
- Stock-safe, context-safe, and archive-only are different reuse states.
- Doctrine/sacrament review, hymn rights/channel clearance, minors/RE consent, testimony sensitivity, and master/derivative separation must stay visible.

## Pre-Send Checklist

Before sending:

- [ ] Signoff packets reviewed: seed/media, hosted access/env, and feedback/incident runbook.
- [ ] Seed/media safety owner, timestamp, and decision filled.
- [ ] Access/private URL owner, timestamp, and decision filled.
- [ ] Hosted writeback env owner, timestamp, and decision filled.
- [ ] Feedback triage owner, backup, timestamp, and decision filled.
- [ ] Stop-test incident lead, timestamp, and decision filled.
- [ ] Invite list limited to named internal testers.
- [ ] Stable URL only; no Vercel preview URL.
- [ ] Role assignment chosen for each tester.
- [ ] Testers told not to forward links.
- [ ] Testers told not to upload real or sensitive media.
- [ ] Testers told current seed has zero portal-ready/downloadable assets.
- [ ] P0 stop-test rule included in message.
- [ ] Admin Feedback Inbox owner ready during test window.
- [ ] No claim of production launch, public publishing, live writeback, production SSO, or approved downloads.

After testing:

- [ ] Feedback triager reviews all reports.
- [ ] P0 reports stop the batch.
- [ ] P1 reports are fixed or documented before next batch.
- [ ] P2/P3 reports are batched for cleanup.
- [ ] DAM Admin exports agent-ready JSON.
- [ ] Owner posts next-batch GO/NO-GO with evidence.
