# PRD: Premium Enterprise DAM Architecture

## Introduction

Make TJC Stock Media feel and behave like a premium enterprise DAM by deepening the modules that decide reuse safety, review evidence, route source truth, and beta readiness. The product must preserve the accepted operating model: Google Shared Drive is the master warehouse, ResourceSpace is the DAM layer, source filenames stay intact, AI only suggests, and humans approve rights.

## Goals

- Concentrate portal reuse state, preview/download gates, and Viewer/Reviewer answers behind one deep module.
- Concentrate review evidence rules, labels, checklist defaults, missing evidence, and Pending Review Write packets behind one deep module.
- Keep media source session truth consistent across route responses without exposing operational details to Viewer.
- Keep private beta readiness facts synchronized across command line, Admin, and teammate docs.
- Preserve existing safety gates while making the interface easier for future agents and teammates to navigate.

## User Stories

### US-001: Deepen Portal reuse decision
**Description:** As a DAM maintainer, I want one reuse decision module so that Viewer, Reviewer, detail, thumbnail, and download surfaces agree on reuse safety.

**Acceptance Criteria:**
- [ ] Add one portal reuse decision module that returns role-aware reuse, preview, download, original request, blocker, and viewer verdict facts.
- [ ] Existing `reuse-policy`, `access-decisions`, and `viewer-verdict` callers continue to compile through compatibility exports.
- [ ] Download and thumbnail routes still block unsafe access.
- [ ] Typecheck passes.
- [ ] Build passes.

### US-002: Deepen Review evidence
**Description:** As a rights reviewer, I want UI checklist locks and backend review evidence checks to use the same rules so that decisions do not drift.

**Acceptance Criteria:**
- [ ] Add one review evidence module that owns checklist items, labels, defaults, required fields, missing labels, completion rows, and disabled reason.
- [ ] Existing `review-decision` and `review-decision-presenter` callers continue to compile through compatibility exports.
- [ ] `Approve Public` still requires source, rights, people/minors, usage scope, derivative, sensitive context, credit, attribution, expiration/re-review, proof link, and review note.
- [ ] Typecheck passes.
- [ ] Build passes.

### US-003: Deepen route session response
**Description:** As a portal maintainer, I want route modules to share request identity, media source session, role-safe payload, audit, and usage helpers so that source truth and redaction stay consistent.

**Acceptance Criteria:**
- [ ] Add a request/session response module without changing ADR-0005 media source session.
- [ ] At least asset detail, search, thumbnail, download, and review routes use the shared module for source envelope or role-safe response helpers.
- [ ] Viewer payloads still hide original/master metadata.
- [ ] Typecheck passes.
- [ ] Build passes.

### US-004: Quarantine legacy DAM page family
**Description:** As a developer or agent, I want the live enterprise DAM page family to be obvious so that future work does not edit stale modules.

**Acceptance Criteria:**
- [ ] Audit route imports and live imports for legacy page modules.
- [ ] Extract any still-live primitives out of legacy modules before quarantine.
- [ ] Add a codemap or deprecation note if deletion is not yet safe.
- [ ] No live route imports a quarantined page.
- [ ] Typecheck passes.
- [ ] Build passes.

### US-005: Deepen beta readiness facts
**Description:** As a beta operator, I want one readiness truth packet feeding shell, Admin, and docs so that teammate invite decisions stay honest.

**Acceptance Criteria:**
- [ ] Produce one machine-readable readiness output covering SSO, ResourceSpace writeback, derivatives, private URL, seed data, env warnings, allowlists, browser QA, and Viewer/Reviewer dry-run status.
- [ ] `make launch-readiness` uses or validates the same facts.
- [ ] Admin readiness route exposes the same go/no-go fields.
- [ ] Typecheck passes.
- [ ] Build passes.

### US-006: Add smart discovery search intelligence
**Description:** As a church media user, I want search to understand ministry language, synonyms, and useful follow-up filters so that I can find reusable assets like a premium DAM without knowing exact metadata terms.

**Acceptance Criteria:**
- [ ] Search expands common ministry/DAM terms such as hero, banner, sermon, slides, youth, social, newsletter, and background without calling paid AI.
- [ ] Search results include discovery metadata: summary, expanded terms, suggested filters, and ranking explanation.
- [ ] Library displays smart discovery without hiding source/reuse safety.
- [ ] Suggested filters are clickable and update the search result set.
- [ ] Typecheck passes.
- [ ] Build passes.
- [ ] Verify in browser using dev-browser skill.

### US-007: Deepen package governance
**Description:** As a ministry comms teammate, I want package preview, share, and publish readiness to use the same portal reuse policy as downloads so that a toolkit cannot become a shortcut around rights review.

**Acceptance Criteria:**
- [ ] Add one package governance module that returns can-preview, can-share, can-publish, counts, section blockers, and an audit message.
- [ ] Package Builder uses portal reuse decisions instead of raw `Approved` status for seeded refs and Portal Ready filtering.
- [ ] Publish requires all refs to be `Portal Ready`; internal-only and review-required refs stay visible as blockers.
- [ ] Package UI exposes governance command readiness inline.
- [ ] Typecheck passes.
- [ ] Build passes.
- [ ] Viewer and Reviewer browser QA still pass.

## Functional Requirements

- FR-1: Preserve ResourceSpace approval state separately from computed portal reuse state.
- FR-2: Preserve Viewer restrictions for original/master metadata and ResourceSpace admin links.
- FR-3: Preserve `403` behavior for unsafe downloads.
- FR-4: Preserve Pending Review Write semantics when live ResourceSpace writeback is not configured.
- FR-5: Use compatibility exports where needed so incremental refactors do not break current dirty UI work.
- FR-6: Keep module interfaces small and implementation-rich.
- FR-7: Keep safety facts persistent inline; never rely on toasts alone.
- FR-8: Package drafts must store ResourceSpace refs only and must not override portal reuse, download, or original-file restrictions.

## Non-Goals

- No source media deletion, movement, renaming, or mutation.
- No production deploy.
- No paid AI/tool calls.
- No fake ResourceSpace writeback or fake approved media.
- No new external storage provider.
- No claim of 100% market superiority without external beta evidence.

## Design Considerations

- Viewer language should be premium and calm: `Ready to use`, `Download approved copy`, `Ask media team`.
- Reviewer/Admin language should stay explicit: blockers, rights, people/minors, derivatives, Pending Review Write, source truth.
- Enterprise DAM polish means fewer leaked implementation details for normal users and more audit depth for operators.

## Technical Considerations

- Current app uses Next 15, React 19, TypeScript, and Make targets.
- `frontend/lib/reuse-policy.ts`, `frontend/lib/access-decisions.ts`, and `frontend/lib/viewer-verdict.ts` are the current shallow reuse family.
- `frontend/lib/review-decision.ts` and `frontend/lib/review-decision-presenter.ts` currently duplicate required evidence logic.
- `frontend/lib/package-drafts.ts` is the portal-local package draft interface; package governance should sit behind it rather than adding button-local policy in the page.
- Existing branch has dirty beta readiness work; preserve it.

## Success Metrics

- `make frontend-check` passes.
- `make launch-readiness` passes or reports only explicit environment warnings.
- Viewer and Reviewer dry-runs pass through `make portal-api-smoke` and `make portal-browser-qa`.
- Future agents can locate reuse and review evidence truth from one module each.
- No regression in source/master restrictions.

## Open Questions

- Which route-session helpers should become mandatory first: source envelope, redaction, audit, usage, or response shape?
- Should legacy modules be deleted, moved, or marked deprecated after primitive extraction?
- Should beta readiness emit JSON, Markdown, or both?
