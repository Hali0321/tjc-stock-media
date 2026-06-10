# Teammate Test + Enterprise DAM Gap Analysis

Date: 2026-06-10
Branch: `goal/dam-workbench-v2-redesign`
Repo: `/Users/halim4pro/Desktop/MVP/tjc-stock-media`

## Current Read

The product is no longer at the early Google Photos / Google Drive planning stage. The current branch is a ResourceSpace-backed, role-aware DAM portal with Library, Collections, Upload, Review, Asset Detail, Insights, Brand Hub, Packages, Admin/Governance, Guide, teammate test docs, demo scripts, and launch readiness scripts.

For the first teammate test round, the missing work is not another generic DAM report. The missing work is a controlled beta surface: private URL, current seed data, assigned testers, clear roles, known-limit copy, and tight feedback triage.

For an enterprise-level DAM target, the remaining gaps are mostly production trust, backend persistence, identity, derivative/rendition workflow, audit, and operational ownership.

## Evidence Checked

- `git status --short --branch`: on `goal/dam-workbench-v2-redesign`, clean before this memo.
- Latest commits include `ac75bff fix: prepare DAM beta for teammate testing`.
- `make frontend-check`: passed typecheck and production Next build.
- `make launch-readiness`: now passes after allowing app brand assets under `frontend/public/brand/`; remaining warning is `.env` placeholder values.
- `BASE_URL=http://localhost:4868 make portal-api-smoke`: passed.
- `BASE_URL=http://localhost:4868 make portal-browser-qa`: passed with 16 pages, six viewport widths, 23 screenshots, zero failures, zero warnings, zero console errors, and zero network failures.

## Ready Enough For Teammate Test

- Frontend builds.
- Teammate test guide exists.
- Demo/stakeholder scripts exist.
- Role flows exist for Viewer, Contributor, Reviewer, and DAM Admin.
- Viewer unsafe download paths are designed to stay blocked.
- Review decisions are intentionally pending-write only until ResourceSpace writeback is configured.
- Admin/Governance screen communicates launch blockers instead of pretending the system is production-ready.

## Not Ready For Enterprise Launch

- Hosted private beta URL is still TBD.
- Production auth/SSO is not live.
- Server-side RBAC is not production-grade yet.
- ResourceSpace writeback mapping is not configured.
- Pending writes are local evidence, not durable source-of-truth updates.
- Package drafts, saved views, favorites, and invites are beta/local affordances until backend storage exists.
- Production derivative/rendition presets are not complete.
- Many preview states depend on current ResourceSpace export derivative coverage.
- Audit log is read-only/admin-signaling, not a full durable enterprise audit ledger.
- Production host, access allowlist, backup schedule, restore owner, and church PC/NAS handoff remain external blockers.
- Launch readiness allows app brand PNGs but still blocks church media assets tracked by Git.

## Missing For Initial Teammate Test Round

1. Private beta deployment
   - Need a URL behind approved access.
   - Static S3-only hosting is not enough because Next API routes are required.

2. Tester roster and role assignment
   - Name 2-3 Viewers, 1-2 Contributors, 1-2 Reviewers, and 1 Admin/test observer.
   - Give each tester one role, not "click everything."

3. Seed-data choice
   - Decide whether teammate beta uses current ResourceSpace export, fallback demo data, or a refreshed small export.
   - Testers should not see empty or misleading states unless the goal is to test those states.

4. Known-limits banner/checklist
   - Must say: beta only, no sensitive uploads, role switch is simulated, ResourceSpace writeback disabled, pending writes not final truth.

5. Feedback intake owner
   - Use `docs/teammate-feedback-template.md`, but assign one triager.
   - Triage P0/P1 before continuing more teammate testing.

6. Test completion criteria
   - Define pass/fail: 60-second find task, blocked unsafe download, contributor upload clarity, reviewer evidence lock, admin blocker clarity.

7. Demo data hygiene
   - Confirm no private church media or sensitive youth-identifiable media is visible in beta.
   - Confirm tracked brand PNGs remain the only allowed media exception.

## Missing For Enterprise-Level DAM Target

1. Identity and access
   - Real church identity provider, SSO, group mapping, server-side role claims, route/API enforcement.

2. ResourceSpace write adapter
   - Map review decisions, reviewer/date/notes, rights status, publish status, usage scope, and pending-write retry/failure state.

3. Durable audit ledger
   - Capture login, role resolution, sensitive views, downloads, denied downloads, review decisions, metadata edits, write success/failure, retries, admin mapping changes.

4. Rendition pipeline
   - Define approved web, slide, social, internal, thumbnail, and original-restricted copies.
   - Make derivative availability part of the asset trust record.

5. Rights and consent operating model
   - Assign rights reviewers.
   - Lock people/minors/sacrament/worship/music/teaching risk states.
   - Define re-review dates and expiration alerts.

6. Metadata schema lock
   - Finalize required fields, vocabularies, field refs, migration mapping, CSV/export contract, and ResourceSpace field ownership.

7. Archive and import operations
   - Tier assets into Approved Stock, Searchable Archive, and Cold Archive / Do Not Use.
   - Define duplicate handling, checksums, source album preservation, large video/audio intake, and rollback.

8. Production infrastructure
   - Church-owned host or NAS, Cloudflare Access or Google Workspace allowlist, backup automation, restore test, disk monitoring, and owner handoff.

9. Analytics and governance reporting
   - Track search failures, blocked reasons, review queue aging, metadata gaps, download activity, rights-risk backlog, derivative gaps, and upload intake quality.

10. Enterprise support model
   - Admin runbook, reviewer guide, user guide, incident plan, field-change process, taxonomy-change process, and release notes.

## Product Trio Ideas

### Product Manager Ideas

1. Beta launch gate
   - A single checklist that decides whether teammate testing can start.
   - Selected because it prevents "demo ready" from being confused with "beta ready."
   - Assumption: one person can own go/no-go.

2. DAM maturity ladder
   - Stages: local demo, private beta, church pilot, production DAM, enterprise governance.
   - Selected because stakeholders need a truthful roadmap.
   - Assumption: leadership accepts staged readiness instead of all-or-nothing launch.

3. Rights reviewer operating policy
   - Defines who can approve internal/public/restricted use.
   - Selected because enterprise trust depends on human authority, not UI polish.
   - Assumption: TJC can appoint reviewers.

4. Beta feedback SLA
   - P0 stop-test, P1 fix/document, P2/P3 batch later.
   - Selected because teammate feedback can become noise without triage.
   - Assumption: beta testers will report rough edges.

5. Launch blocker dashboard
   - Convert Admin blockers into owner/date/status accountability.
   - Selected because current Admin is strong, but ownership needs to become operational.
   - Assumption: owners can be assigned.

### Designer Ideas

1. Beta welcome/known-limits panel
   - Clear first-screen test framing for each role.
   - Selected because testers need confidence about what is fake, queued, blocked, or live.
   - Assumption: role switch stays for beta.

2. Teammate task mode
   - Small in-app checklist for Viewer/Contributor/Reviewer/Admin test tasks.
   - Selected because it keeps testers on target.
   - Assumption: lightweight UI is faster than another doc.

3. Evidence-first asset card variant
   - More compact card showing can-use answer, blocker, rights, people/minors, derivative state.
   - Selected because DAM trust should scan before beauty.
   - Assumption: current density can support one more trust-focused variant.

4. Reviewer decision timeline
   - Visualizes pending write, retry, synced, failed.
   - Selected because pending-write honesty is a differentiator.
   - Assumption: backend state will eventually persist this.

5. Admin blocker ownership table
   - Owner, due date, severity, next action.
   - Selected because enterprise admins need control, not just diagnostics.
   - Assumption: current Admin table primitives are enough.

### Engineer Ideas

1. Production auth/RBAC spike
   - Server-side role claims, protected API routes, no role switch outside beta.
   - Selected because this is the largest enterprise trust gap.
   - Assumption: identity provider can be chosen soon.

2. ResourceSpace writeback adapter
   - Durable review decision writes with mapping validation and retry.
   - Selected because review is currently local pending evidence.
   - Assumption: ResourceSpace fields and credentials can be configured safely.

3. Durable pending-write queue
   - Persist retries, failures, operator actions, and audit events.
   - Selected because enterprise systems need recovery paths.
   - Assumption: simple database or file-backed queue can bridge pilot.

4. Rendition generator
   - Produce approved web/slide/social copies and thumbnails with policy metadata.
   - Selected because derivatives are the current product-readiness gap.
   - Assumption: ResourceSpace derivative/export path is accessible.

5. Launch-readiness media allowlist
   - Keep tracked brand assets explicitly allowed while blocking church media.
   - Selected because app logos are intentional frontend assets, while source media must stay out of Git.
   - Assumption: brand logos are intentional app assets, not church media archive files.

## Top Five Priorities

1. Private beta deployment with access control
   - One sentence: Put the current app at a private URL with beta-only role rules and no sensitive upload permission.
   - Why selected: Teammate testing cannot start cleanly without a reachable, protected environment.
   - Validate: Testers can open the URL, run tasks, and cannot bypass unsafe downloads.

2. Beta test command center
   - One sentence: Combine role tasks, known limits, feedback link, and go/no-go state into a single beta page or pinned doc.
   - Why selected: The repo has pieces, but not yet one operational cockpit for testers.
   - Validate: A tester can start without a live walkthrough.

3. Production auth/RBAC plan
   - One sentence: Replace beta role switch with server-enforced church roles before pilot launch.
   - Why selected: Enterprise DAM without real identity is not enterprise.
   - Validate: Viewer cannot hit reviewer/admin APIs by changing query params or UI state.

4. ResourceSpace writeback + durable audit
   - One sentence: Turn review decisions from local pending evidence into confirmed ResourceSpace writes with audit trail.
   - Why selected: Source-of-truth honesty is currently the core product promise and core blocker.
   - Validate: Reviewer decision creates ResourceSpace update, audit event, retry/failure state, and visible sync result.

5. Approved rendition pipeline
   - One sentence: Generate and expose approved use copies separately from restricted originals.
   - Why selected: "Can I use this?" depends on safe derivatives, not only metadata.
   - Validate: Web/slide/social/internal copies show only when approved and downloadable for the current role.

## Recommended Next Move

Do the teammate test prep slice first:

1. Assign owner/status for private URL, seed data, roles, known limits, feedback intake, and stop-test rule.
2. Deploy or rehearse the private beta path behind access control.
3. Run one more internal dry test as Viewer + Reviewer on hosted beta before inviting teammates.

Do not start enterprise backend rebuild before the teammate round unless beta testing is blocked by auth or deployment.
