# Teammate Beta Invite Pack

Last updated: 2026-06-11

Use this only after `docs/beta-readiness-command-center.md` marks the Team Beta ops runbook complete. This invite pack is for tiny internal Team Beta testing only. Share the stable hosted beta URL, not a deployment-specific Vercel preview URL:

`https://tjc-stock-media.vercel.app`

## Role Links

- Viewer: `https://tjc-stock-media.vercel.app/?role=Viewer&taskMode=1`
- Contributor: `https://tjc-stock-media.vercel.app/upload?role=Contributor&taskMode=1`
- Reviewer: `https://tjc-stock-media.vercel.app/review?role=Reviewer&taskMode=1`
- DAM Admin: `https://tjc-stock-media.vercel.app/admin?role=DAM%20Admin&taskMode=1`
- Guide: `https://tjc-stock-media.vercel.app/guide?role=Viewer&taskMode=1`

## Missions

- Viewer: find `Bible` media, open one asset, and decide whether it is usable for your ministry channel.
- Contributor: submit a harmless intake packet through Upload. Do not upload sensitive, private, unreleased, youth-identifiable, or copyrighted media.
- Reviewer: try to approve a review item without evidence, confirm it blocks, then complete evidence and queue a valid decision.
- DAM Admin: inspect Admin readiness, integration blockers, and Feedback Inbox. Export feedback JSON for agents after testing.

## Safety Copy

- Beta only.
- Tiny internal Team Beta only; do not forward outside the named test group.
- No sensitive, private, unreleased, youth-identifiable, copyrighted, source, or master media uploads.
- Role switch is simulated for QA only.
- ResourceSpace writeback is queued/disabled unless explicitly approved.
- Queued review decisions are portal evidence, not ResourceSpace success.
- Original/source media stays restricted; portal downloads must stay behind role and reuse gates.
- Stop testing and notify the triager for any P0 issue.

## Feedback Expectations

Use the in-app Report issue button during Task Mode. Each report should include role, route, task, severity, expected behavior, actual behavior, and screenshot/link when useful.

Severity mapping:

- P0: security, privacy, source-truth, writeback honesty, or unsafe download issue.
- P1: workflow blocked or broken route.
- P2: confusing UX slowing the mission.
- P3: visual polish, wording, or preference.

Stop the test batch for P0 issues. Triage P1 issues before inviting another batch.
