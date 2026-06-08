# TJC Stock Media Product Context

## Purpose

TJC Stock Media is a private church-use enterprise DAM portal for safely finding, reviewing, approving, governing, distributing, and auditing ministry media.

The product sits above ResourceSpace and Google Shared Drive:

- ResourceSpace is the source of truth for DAM records, metadata, workflow state, review status, permissions, and approved asset metadata.
- Google Shared Drive keeps master originals and long-term source storage.
- TJC Stock Media is the role-aware portal for safe reuse, contributor intake, reviewer decisions, governance, and operational visibility.

North Star:

```text
A TJC user can find a rights-safe approved ministry media asset in under 60 seconds and understand exactly what use is allowed.
```

## Non-goals

TJC Stock Media is not:

- Public SaaS.
- Marketplace.
- Billing product.
- Pricing product.
- Public media gallery.
- External customer portal.
- Public unauthenticated download flow.
- ResourceSpace clone.
- Replacement for Google Shared Drive master originals.
- Replacement for ResourceSpace as source of truth.
- Decorative church media showcase.

## Primary Users

### Viewer

Finds approved role-safe media, reads usage guidance, downloads approved renditions, and requests review or original access when blocked.

### Contributor

Creates intake sessions, adds files or source links, provides metadata, declares people/rights context, saves drafts, and submits media for review.

### Reviewer

Reviews assets, resolves evidence gaps, approves internal or external ministry use, requests more information, holds or archives assets, and queues pending ResourceSpace writes.

### DAM Admin

Manages launch readiness, ResourceSpace mapping, taxonomy, integrations, pending writes, metadata quality, users/roles, policy rules, audit, and production blockers.

## Role Definitions

| Role | Purpose | Can do | Cannot do |
|---|---|---|---|
| Viewer | Safe reuse | Search approved assets, open collections, download approved renditions, request review/original access | Upload, review, approve, access originals, see admin internals |
| Contributor | Intake | Create drafts, submit for review, respond to info requests | Publish, approve, bypass review, download blocked assets |
| Reviewer | Governance decision | Review evidence, approve/hold/reject, request info, queue pending writes | Fake ResourceSpace success, bypass audit |
| DAM Admin | Operations | Inspect mappings, manage policies, view audit, monitor pending writes, configure launch gate | Treat pending writes as ResourceSpace truth |

## Source-of-Truth Rules

1. ResourceSpace remains source of truth for asset records and DAM metadata.
2. Google Shared Drive remains master-original warehouse.
3. TJC Stock Media does not mutate source media.
4. Approved Public in ResourceSpace is traceability, not automatic portal-safe reuse.
5. Portal reuse is computed from source, rights, people/release, reviewer/date, usage scope, and rendition checks.
6. Review actions queue local pending writes until ResourceSpace write mapping is configured.
7. UI must never claim ResourceSpace was updated unless the write adapter confirms it.
8. Upload never publishes. Upload submits for review only.
9. Unsafe Viewer downloads remain blocked.
10. Original/master access remains restricted.

## Lifecycle Model

Enterprise DAM lifecycle:

```text
ingest -> enrich metadata -> review -> approve/use -> distribute internally -> audit/archive
```

Minimum states:

- Draft intake
- Submitted for review
- Needs contributor information
- In review
- Review blocked
- Approved for internal ministry use
- Approved for external ministry use
- Approved but rendition missing
- Held
- Do not publish
- Archive only
- Rejected
- Expired
- Pending ResourceSpace write
- ResourceSpace write failed
- Synced

## Permission Model

Permissions are role-based and server-enforced.

- Viewer sees only role-safe metadata and approved download actions.
- Contributor sees intake drafts, submitted status, missing-info requests, and reviewer feedback.
- Reviewer sees review queues, evidence, blocker detail, decision history, and pending-write state.
- DAM Admin sees sync, mapping, ResourceSpace IDs, field coverage, integration health, audit, and launch gates.

Frontend hiding is not permission enforcement. API routes must enforce role policy.

## Trust Model

Every reusable asset must answer:

- Can I use this?
- For what scope?
- Can I publish externally?
- Can I use it internally?
- Are people visible?
- Are children/youth possibly visible?
- Are rights verified?
- Is a safe rendition available?
- Is the original restricted?
- Who reviewed it?
- When was it reviewed?
- What credit/source is required?
- What usage should be avoided?

Trust comes from evidence, not visual softness.

## Status Lanes

Never collapse all status into one vague badge.

### Workflow

Draft, Submitted, In review, Needs info, Approved, Held, Rejected, Archived.

### Distribution

External ministry, Internal only, Reviewer-only, Archive only, Do not publish.

### Rights

Verified, Restricted, Unverified, Consent required, Expiring, Expired.

### People / Release

No people, Adults visible, Children/youth possible, Release verified, Missing, Unverified.

### Availability

Download available, Preview only, Rendition missing, Original restricted, Preview unavailable.

### Source

Verified, Incomplete, Conflict, ResourceSpace, Shared Drive, Manual intake, Duplicate candidate.

### Sync

Read-only export, Pending write, Failed, Retrying, Synced, Mapping missing.

## Core Modes

### Library

Find approved, reusable, role-safe media through search, facets, table/grid results, saved views, and right-side asset inspector.

### Review

Resolve evidence gaps, make decisions, assign work, request information, compare duplicates, and queue pending writes.

### Collections

Manage governed internal portals and curated asset groups. Collections are not folders and not decorative albums.

### Intake

Create structured upload/source-link sessions with required metadata, people/rights declarations, duplicate warnings, and reviewer packet preview.

### Governance

Manage launch gate, metadata quality, rights/release risk, people/minors risk, ResourceSpace mapping, pending writes, integrations, ingest health, renditions, duplicates, taxonomy, users/roles, policy, and audit.

## Launch Blockers

Production launch remains blocked until:

- Real auth/SSO exists.
- Server-side RBAC exists.
- ResourceSpace write adapter exists.
- Pending write queue has retry and failure states.
- Audit log exists.
- Env/secrets cleanup is complete.
- Derivative/rendition pipeline is defined.
- Metadata schema is locked.
- Rights and consent review coverage is real.
- Children/youth visibility model is enforceable.
- Viewer unsafe downloads remain blocked.
- Source-of-truth mapping is verified.

## Audit Requirements

Audit log must answer:

```text
Who did what, when, to which asset, from which role, and what changed?
```

Required audit events:

- login
- role resolution
- search query where appropriate
- sensitive asset detail open
- approved rendition download
- denied download
- request review
- request original
- upload draft created
- upload submitted
- contributor info requested
- review claimed
- review assigned
- review decision
- approval scope changed
- pending write queued
- write success
- write failure
- retry
- archive/do-not-use decision
- collection created/updated
- share/export created
- metadata changed
- rights changed
- people/minors state changed
- admin mapping changed

## P0 Roadmap

- PRODUCT.md and lifecycle state model.
- Orthogonal status lanes.
- Real auth/SSO plan.
- Server-side RBAC plan.
- ResourceSpace write adapter design.
- Pending write retry/failure model.
- Audit log design.
- Env/secrets classification.
- Metadata schema lock.
- Safe download authorization tests.

## P1 Roadmap

- Enterprise shell.
- Table-first Library.
- Facet model.
- Three-pane Review workbench.
- Intake sessions/templates.
- Governed Collections.
- Asset Detail trust matrix.
- Governance/Ops console.
- Reviewer assignment.
- Comments/history.
- Rendition/version panel.
- Request original/access workflow.
- Rights expiration alerts.

## P2 Roadmap

- Near-duplicate clustering.
- AI-assisted metadata suggestions with human approval.
- Automated taxonomy normalization.
- Campaign workspaces.
- Authenticated expiring share links.
- Usage analytics.
- Advanced rendition automation.
- Bulk metadata import/export.
- Multilingual metadata.
- Transcript/subtitle indexing.
- Full DAM audit reporting.

## Safety Invariants

- ResourceSpace remains source of truth.
- Google Shared Drive keeps master originals.
- Source media is not mutated.
- Upload never publishes.
- Pending writes are not final truth.
- Unsafe Viewer downloads remain blocked.
- Original/master access remains restricted.
- Blocked assets stay blocked.
- No fake ResourceSpace write success.
- AI may suggest tags, but humans approve rights and reuse.

## Glossary

- Asset: media record indexed by ResourceSpace.
- Master original: source file stored in Google Shared Drive or ResourceSpace filestore.
- Approved rendition: role-safe derivative approved for use/download.
- Portal reuse state: computed TJC Stock Media reuse result.
- ResourceSpace status: source DAM status, not always portal-safe.
- Pending write: local review decision queued for ResourceSpace mapping.
- Collection: manually curated governed group.
- Saved view: repeatable search query with filters.
- Campaign: time-bound delivery workspace with approvals, channels, exports, and audit.
- Trust matrix: visible status lanes proving reuse safety.
