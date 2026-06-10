# Teammate Beta Invite Pack

Last updated: 2026-06-10

Use this for small internal testing only. Share the stable hosted beta URL, not a deployment-specific Vercel preview URL:

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
- No sensitive uploads.
- Role switch is simulated for QA only.
- ResourceSpace writeback is disabled unless explicitly approved.
- Queued review decisions are portal evidence, not ResourceSpace success.
- Original/source media stays restricted; portal downloads must stay behind role and reuse gates.

## Feedback Expectations

Use the in-app Report issue button during Task Mode. Each report should include role, route, task, severity, expected behavior, actual behavior, and screenshot/link when useful.

Severity mapping:

- Critical: security, privacy, source-truth, writeback honesty, or unsafe download issue.
- High: workflow blocked or broken route.
- Medium: confusing UX slowing the mission.
- Low: visual polish, wording, or preference.

Stop the test batch for Critical/P0 issues. Triage High issues before inviting a wider group.
