# PRD: Approved Library Pilot

## Introduction

The current TJC Stock Media prototype is strong for reviewers/admins, but normal church users still see too much governance language: blockers, derivatives, ResourceSpace state, original restrictions, and admin readiness. This feature splits the product into two experiences:

- **Approved Library mode:** normal church users find approved media, choose a safe preset, and ask for help when unsure.
- **Governance mode:** reviewers/admins resolve blockers, confirm rights, manage derivatives, and preserve ResourceSpace truth.

The goal is to make a limited church-member pilot feel calm and DAM-like without weakening safety.

## Goals

- Default normal users to a curated Portal Ready / Approved Library view.
- Reduce visible complexity on normal-user Library and Asset Detail surfaces.
- Keep reviewer/admin governance tools intact and role-gated.
- Improve mobile Library trust at 320/390 px with one-column approved-media cards.
- Reduce duplicate confirmations in Upload while keeping inline safety copy.

## User Stories

### US-001: Default normal users to Approved Library
**Description:** As a church member, I want to land on approved media only so that I can search and download without decoding review blockers.

**Acceptance Criteria:**
- [ ] Viewer default Library query shows only assets that pass portal-ready reuse policy.
- [ ] A clear empty state appears if no portal-ready assets exist.
- [ ] Reviewer and DAM Admin can still switch to governance/problem views.
- [ ] URL or saved-view state reflects Approved Library filter.
- [ ] Typecheck/build pass.
- [ ] Verify in browser using dev-browser skill at 1440, 390, and 320 px.

### US-002: Simplify normal-user asset cards
**Description:** As a church member, I want each card to show one clear trust state so I know what action is available.

**Acceptance Criteria:**
- [ ] Viewer cards show one primary state: `Ready to use`, `Internal only`, `Needs review`, or `Original restricted`.
- [ ] Secondary badges stay hidden from Viewer cards and remain available in detail/governance surfaces.
- [ ] Card action hierarchy favors preset download/request, not raw ResourceSpace status.
- [ ] Typecheck/build pass.
- [ ] Verify in browser using dev-browser skill at 1440, 390, and 320 px.

### US-003: Mobile Library one-column approved feed
**Description:** As a mobile church user, I want a readable one-column media list so I can trust each asset without badge clutter.

**Acceptance Criteria:**
- [ ] At 320/390 px, Viewer Library uses one-column card/list layout.
- [ ] Each mobile card shows title, preview/restricted state, one trust label, and one clear action.
- [ ] No horizontal overflow.
- [ ] No giant filter wall before assets.
- [ ] Typecheck/build pass.
- [ ] Verify in browser using dev-browser skill at 320 and 390 px.

### US-004: Keep governance mode for reviewers/admins
**Description:** As a reviewer/admin, I want blockers, rights, derivatives, ResourceSpace, and pending-write details to remain visible when I need to resolve media.

**Acceptance Criteria:**
- [ ] Reviewer/Admin Library and Detail can expose governance chips, blocker lists, ResourceSpace links, and diagnostics.
- [ ] Viewer cannot access original/master metadata or ResourceSpace admin links.
- [ ] Pending writes remain clearly local/server-routed until ResourceSpace mapping exists.
- [ ] Typecheck/build pass.
- [ ] Verify in browser using dev-browser skill for Reviewer and DAM Admin roles.

### US-005: Make download presets the reuse center
**Description:** As a user, I want to choose Web image, Slide, Social, or Original request without thinking about masters/derivatives.

**Acceptance Criteria:**
- [ ] Asset Detail decision/download panel centers preset choices.
- [ ] Viewer sees original as request-only, never a direct download.
- [ ] Download blocked state still returns `403`.
- [ ] Safety copy remains inline, not toast-only.
- [ ] Typecheck/build pass.
- [ ] Verify in browser using dev-browser skill.

### US-006: Reduce Upload confirmation noise
**Description:** As a contributor, I want submit feedback to confirm intake without repeating the same status in a toast, modal, and receipt.

**Acceptance Criteria:**
- [ ] Upload submit shows one quiet Sonner toast and one inline final submission summary.
- [ ] No submit modal opens automatically.
- [ ] Safety copy remains inline: `Needs Review / Do Not Publish` and ResourceSpace persistence caveat.
- [ ] Draft/save actions still toast.
- [ ] Typecheck/build pass.
- [ ] Verify in browser using dev-browser skill with staged file and submitted receipt.

### US-007: Curate album covers for pilot shelves
**Description:** As a church user, I want album covers to feel photographic and intentional so Collections looks like a real media library.

**Acceptance Criteria:**
- [ ] Portal Ready collections use real approved cover derivatives when available.
- [ ] Placeholder covers remain only when no safe derivative exists.
- [ ] Card heights remain controlled at mobile widths.
- [ ] Typecheck/build pass.
- [ ] Verify in browser using dev-browser skill.

## Functional Requirements

- FR-1: Add or reuse a computed Portal Ready filter for Viewer default Library.
- FR-2: Keep raw ResourceSpace status separate from computed portal reuse state.
- FR-3: Role-gate governance-heavy UI so Viewer sees only user-relevant state.
- FR-4: Preserve all existing unsafe download and original/master restrictions.
- FR-5: Use app-native components already present: `FilterPills`, `DownloadOptionsPanel`, `TjcStatusBadge`, `StateBanner`, `UploadFileDropzone`, `InputWithTags`, `DamTabs`, and `Dialog`.
- FR-6: Keep all public safety facts persistent inline; toasts may confirm actions but never replace safety text.
- FR-7: Maintain browser proof screenshots in `docs/screenshots/primitive-proof/` or `docs/screenshots/qa-live/`.

## Non-Goals

- No production ResourceSpace API write mapping.
- No real auth/SSO implementation.
- No migration of source media, master files, or Google Shared Drive structure.
- No fake approved assets or fake derivative access.
- No decorative redesign that hides safety state from reviewers/admins.

## Design Considerations

- Normal-user language should be calm: `Ready to use`, `Download approved copy`, `Ask media team`.
- Reviewer/admin language can remain explicit: blockers, rights, people/minors, derivatives, pending writes.
- Mobile Library should prioritize readability over grid density.
- Upload should keep current structure, with less duplicate confirmation.

## Technical Considerations

- Existing role model is demo-only and stored in localStorage; do not treat it as production auth.
- Reuse policy already exists in `frontend/lib/reuse-policy.ts`.
- Download safety already runs through `/api/download/[id]`; keep `403` smoke tests.
- Avoid introducing new component library dependencies unless required.

## Success Metrics

- Viewer first screen shows mostly or only reusable media in pilot mode.
- Viewer card comprehension improves: one state, one action.
- Mobile Library has zero horizontal overflow at 320/390 px.
- Upload submit confirmation uses one toast plus one inline receipt.
- Reviewer/admin can still find full governance details.

## Open Questions

- Which role should represent normal church-member pilot: current `Viewer`, or a new `Member`/`Portal User` role?
- Should `Approved Internal` be visible to normal church users, or only to trusted internal staff?
- Which collections should be curated first for pilot: Sabbath, Teaching & Study, Seasonal Details, or MVP 2024 First Batch?
- Should Guide become contextual help snippets before or after Approved Library work?
