# TJC DAM Beta Teammate Test Guide

Last updated: 2026-06-10

## Test URL

- Hosted beta URL candidate: `https://tjc-stock-media.vercel.app`
- Draft invite pack: `docs/teammate-beta-invite-pack.md`
- Local QA URL used for this readiness pass: `http://localhost:4868`
- Beta readiness command center: `docs/beta-readiness-command-center.md`

This is a beta test deployment, not a production launch. ResourceSpace remains the source of truth. Review decisions may queue as portal pending-write evidence unless live writeback is explicitly enabled. Do not upload sensitive, private, unreleased, youth-identifiable, or copyrighted media for this test round.

Before inviting teammates, clear the Go / No-Go checklist in `docs/beta-readiness-command-center.md`. A local dry run can proceed before hosted smoke passes. External teammate invites should use the stable URL only after private access, safe seed data, and feedback triage ownership are confirmed.

## Roles

- Viewer: searches approved media, opens asset details, confirms blocked unsafe downloads.
- Contributor: tests upload/intake clarity without sensitive media.
- Reviewer: tests review queue, evidence checklist, and queued decision truth.
- DAM Admin: tests governance/admin setup clarity.

Use the account menu role switch for beta QA only. Production access will use trusted identity/SSO.

## Role Invite Links

- Viewer: `[approved-private-host]/?role=Viewer&taskMode=1`
- Contributor: `[approved-private-host]/upload?role=Contributor&taskMode=1`
- Reviewer: `[approved-private-host]/review?role=Reviewer&taskMode=1`
- DAM Admin: `[approved-private-host]/admin?role=DAM%20Admin&taskMode=1`
- Guide: `[approved-private-host]/guide?role=Viewer&taskMode=1`

Task Mode opens an in-app checklist, quick links, beta limits, and a Report issue button. Reports are stored through `/api/beta-feedback` and visible to DAM Admins in Admin → Feedback Inbox.

## Test Tasks

1. Viewer: search for `Bible`, open an asset, and decide whether the page clearly says if you can use it.
2. Viewer: open a Needs Review or blocked asset and try an unsafe download path; confirm the app blocks or explains the download gate.
3. Viewer: open Insights and click common use-case cards. Confirm they route to useful library searches.
4. Contributor: open Upload and step through the packet using only harmless sample files.
5. Contributor: inspect Collections and Package Builder. Confirm ResourceSpace references are clear and originals are not copied.
6. Reviewer: open Review Queue, switch queue tabs, and change rows per page.
7. Reviewer: try Approve without completing evidence and a note. Confirm it stays blocked.
8. Reviewer: complete evidence and note, queue a decision, and confirm the message says queued/synced/blocked honestly.
9. DAM Admin: open Admin modules and verify each module heading/content changes.
10. Any role: test Brand Hub actions, Help Guide clarity, and one mobile pass around 390px width.

## Known Limits

- Deployment-specific Vercel preview URLs may require Vercel login. Share only an approved private/stable URL for teammate testing.
- ResourceSpace writeback should remain disabled unless explicitly approved.
- Vercel env should include `BETA_FEEDBACK_ENABLED=1`, `BETA_TASK_MODE_ENABLED=1`, `RESOURCESPACE_ENABLE_WRITEBACK=0`, and `RESOURCESPACE_WRITEBACK_MODE=queued`.
- Vercel KV/Blob env comes from Vercel storage integrations; local development falls back to `data/runtime/beta-feedback.json`.
- Package drafts, saved views, favorites, and invites are local beta affordances unless backend storage is connected.
- SSO is not live; beta role switch simulates access.
- Static S3-only hosting is not enough for this app because Next API routes are required.

## Feedback Format

Use the in-app Report issue button during Task Mode. Use `docs/teammate-feedback-template.md` only if the app is unavailable. Include role, route, device, expected behavior, actual behavior, screenshot, and severity.

Severity labels:

- P0: security, privacy, source-truth, writeback honesty, or download gate issue.
- P1: workflow blocked or broken route.
- P2: confusing UX that slows testing.
- P3: visual polish or wording preference.

Triage rule: fix all P0 before continuing testing. Fix P1 or document as a known limit. Batch P2/P3 for post-test cleanup unless they affect core test tasks.
