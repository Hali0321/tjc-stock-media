# TJC DAM Benchmark Patterns

Last updated: 2026-06-08

## Rule

Do not copy vendor screenshots. Copy proven DAM product patterns, then adapt them to church media governance.

Sources are vendor/product references, so treat claims as pattern input, not neutral ranking.

## Benchmark Mix

```text
Bynder        = system-of-record mindset + governed search
Brandfolder   = request access/download + public/private collections
Canto         = clear DAM vs cloud storage distinction
Acquia/Widen  = metadata, rights, analytics, enterprise governance
Cloudinary    = API-first media pipeline + derivatives
Aprimo        = lifecycle, compliance workflow, audit seriousness
MediaValet    = adoption, onboarding, proofing, analytics
Frontify      = end-user brand/media portal
AEM Assets    = metadata-driven permissions
Filecamp      = small-team simplicity and proofing
ResourceSpace = actual source-of-truth API/write mapping
```

## Bynder

Pattern to copy:

- DAM as trusted source of approved content.
- Governed search and audience-specific portals.

Pattern to avoid:

- Enterprise content ecosystem bloat.
- AI-heavy marketing language.

TJC adaptation:

```text
ResourceSpace is source of truth.
TJC Stock Media is the safe-use workflow layer.
```

Acceptance criteria:

- Viewer-facing asset cards answer: can I use it, under what scope, what next safe action.
- Admin/Reviewer internals stay out of Viewer default surfaces.

## Brandfolder

Pattern to copy:

- Request download and request access flows.
- Public/private collections and future expiration windows.

Pattern to avoid:

- Blocked actions that still look clickable.
- Exposing every DAM folder as a public collection.

TJC adaptation:

```text
Download unavailable
Request review
Ask media coworker
Request original access
```

Acceptance criteria:

- Blocked downloads are not links.
- Collections are curated, role-safe navigation contexts.
- Collection page says per-asset Library/detail checks are required before reuse.

## Canto

Pattern to copy:

- DAM governs reusable assets. Cloud storage stores files.
- Metadata filters and approved status search.

Pattern to avoid:

- Prettier Google Drive behavior.
- Folder browsing, raw filenames, unclear permissions, download-first flow.

TJC adaptation:

```text
Google Shared Drive keeps master originals.
ResourceSpace is metadata/source truth.
TJC Stock Media is the safe reuse workflow.
```

Acceptance criteria:

- Library defaults to saved views and reuse states, not folder-first browsing.
- Search and empty states point users to approved use cases.

## Acquia / Widen

Pattern to copy:

- Metadata drives findability, rights, reuse, and governance.
- Analytics later: blocked reasons, searched terms, review bottlenecks.

Pattern to avoid:

- Too many integrations before core governance works.
- Pretty cards while rights/source metadata stays ambiguous.

TJC adaptation:

```text
Unknown rights = no public download.
Unknown people/minors = no public download.
Missing source = review required.
```

Acceptance criteria:

- ResourceSpace write mapping includes reuse state, reviewer, date, note, rights, people/minors, source, derivative, and scope.
- Admin keeps launch blocked until production blockers are resolved.

## Cloudinary

Pattern to copy:

- API-first media pipeline.
- Derivative states for thumbnails, safe previews, approved web copies, and document shells.

Pattern to avoid:

- Frontend-direct ResourceSpace mutation.
- Auto-crop, generative fill, object removal, or social variants that alter ministry context without review.

TJC adaptation:

```text
Portal action
  -> local pending write
  -> validation
  -> ResourceSpace API adapter
  -> success/failure audit
```

Acceptance criteria:

- Review actions queue pending writes until backend adapter and ResourceSpace mapping exist.
- Guide warns against crops that change ministry context.

## Aprimo

Pattern to copy:

- Content lifecycle thinking.
- Compliance workflow and audit seriousness.

Pattern to avoid:

- Enterprise MRM modules: budgets, campaign spend, planning agents.

TJC adaptation:

```text
uploaded / staged
needs review
approved internal
approved public
blocked
archived
pending write
written to ResourceSpace
```

Acceptance criteria:

- State dictionary exists and maps visibility, mutability, actions, ResourceSpace mapping, and audit events.
- Audit is treated as production-critical, not optional polish.

## MediaValet

Pattern to copy:

- Adoption-first DAM rollout.
- Proofing and review as a decision flow.

Pattern to avoid:

- Vendor comparison bragging.
- Excessive dashboard metrics before launch blockers are solved.

TJC adaptation:

Viewer:

```text
Find approved media -> understand safety -> download or request review
```

Contributor:

```text
Add context -> add rights/people info -> add file/source -> submit for review
```

Acceptance criteria:

- Non-technical users can complete Viewer and Contributor paths without ResourceSpace jargon.
- Review is a workspace, not just a queue table.

## Frontify

Pattern to copy:

- End-user portal, not admin database.
- Living guidelines.

Pattern to avoid:

- Collections that look like raw folders.
- Long static policy walls.

TJC adaptation:

```text
I know what I can use.
I know what I cannot use.
I know what to do next.
```

Acceptance criteria:

- Viewer mode defaults to Library, Collections, Guide, and Asset Detail.
- Guide starts with task cards and can be searched by policy terms.

## AEM Assets

Pattern to copy:

- Metadata-driven permissions.
- Server-side access rules decoupled from folder structure.

Pattern to avoid:

- Permission logic only in frontend.
- Assuming folder or collection means safe.

TJC adaptation:

```text
Backend decides whether an asset is visible/downloadable.
Frontend explains the decision.
```

Acceptance criteria:

- Unsafe download requests return `403`.
- Frontend shows why the action is unavailable and the next safe action.

## Filecamp

Pattern to copy:

- Simplicity for small teams.
- Brand guidelines and proofing connected to workflow.

Pattern to avoid:

- Under-building governance for rights, children/youth, originals, and reviewer approval.

TJC adaptation:

```text
Search
Browse Collections
Open asset
Request review
Download approved copy
```

Acceptance criteria:

- Guide appears where users need help: Asset Detail, Review, Upload, Library empty state.
- Governance remains stronger than a lightweight upload/tag/share DAM.

## ResourceSpace

Pattern to copy:

- Source-of-truth metadata.
- Signed API write discipline through backend adapter.

Pattern to avoid:

- Fake ResourceSpace write success.
- Frontend role switch or frontend-only checks for real permissions.

TJC adaptation:

```text
TJC review action
  -> local audit record
  -> pending write queue
  -> ResourceSpace API adapter
  -> signed request
  -> response saved
  -> audit updated
```

Acceptance criteria:

- UI says `Pending local review write` until ResourceSpace write succeeds.
- Production requires SSO, server-side RBAC, backend ResourceSpace adapter, and audit log.

## Rules To Enforce In QA

1. Viewer UI should feel like a media/brand portal, not ResourceSpace.
2. Request/review flows should use request access patterns.
3. Permissions must be metadata-driven and server-enforced.
4. Derivative states must distinguish safe preview, approved copy, restricted original, document shell, and unknown shell.
5. Review actions must create audit-ready pending write data.
6. Viewer and Contributor flows must stay simple enough for normal church users.
7. ResourceSpace source-of-truth writes must never be faked.
