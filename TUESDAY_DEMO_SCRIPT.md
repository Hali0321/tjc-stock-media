# Tuesday Demo Script — TJC Stock Media

Status: Tuesday presentation / church pilot demo candidate

## Opening

“This is a ResourceSpace-backed stock media portal prototype for TJC ministry teams. ResourceSpace remains the source of truth. Google Shared Drive remains the master-original warehouse. This portal helps people find, understand, request, and review media safely without pretending approval or persistence happened.”

Do not call it production-ready. Say: “This is a church pilot demo candidate.”

## 1. Library

Route: `/`

Show:

- Modern contact sheet with stable count truth.
- Saved DAM views such as Website hero, Slides, Newsletter, Social, No people.
- Preview restricted/pending states as intentional safety states, not broken images.
- Viewer cannot download blocked assets.

Line:

“The first decision is not ‘can I grab this file?’ It is ‘is this asset approved, safe, and reusable for this ministry context?’”

## 2. Asset Detail

Route: `/assets/368`

Show:

- “Can I use this?” panel.
- ResourceSpace status separated from portal reuse state.
- Governance passport, blockers, files/use/review tabs.
- Request original dialog.

Line:

“ResourceSpace may say Approved Public, but the portal can still block reuse when rights, people/minors, or derivative confidence are incomplete.”

## 3. Upload

Route: `/upload`, role Contributor

Show:

- Intake form split into context, people/rights, and files/tags.
- Selected-file preview.
- Existing Google/ResourceSpace link path for large/shared-drive media.
- Submission state: Needs Review / Do Not Publish.

Line:

“Every contributor intake starts blocked. Reviewers decide reuse later.”

## 4. Review

Route: `/review`, role Reviewer

Show:

- Queue cockpit and sticky inspector.
- Checklist / Metadata / Rights / History / Pending write tabs.
- Hold-to-confirm actions for high-risk decisions.
- Pending-write dialog.

Line:

“Review actions are honest. They queue local pending writes only; ResourceSpace is not updated until write mapping is configured.”

## 5. Collections

Route: `/collections`

Show:

- Album shelves using ResourceSpace export metadata.
- Approval summaries and people/minors warning.
- Draft collection persistence blocker.

Line:

“Collections help ministry teams browse contexts, but album approval summaries are not a shortcut around asset-level review.”

## 6. Admin

Route: `/admin`, role DAM Admin

Show:

- Readiness score.
- Action backlog.
- Integration readiness blockers.
- Field mapping coverage.
- Public portal gate.

Line:

“This screen is the launch honesty screen. It shows exactly why this is not production-ready yet.”

## 7. Guide

Route: `/guide`

Show:

- Mobile-friendly operational guide.
- Before downloading, search, approval, church-wide/internal, children/youth, credit/source, and large media rules.

Line:

“The guide gives normal ministry users plain rules without hiding safety-critical policy in tooltips.”

## Close

“The next build after this visual pass should be the Preview + Derivative System. That is where approved web copy, internal copy, slide copy, social square, original restrictions, and safe reviewer evidence become first-class workflows.”

Do not promise:

- production auth
- hosting/access allowlist
- ResourceSpace writes
- derivative presets
- public launch readiness
- real original access from the portal

## Backup Demo Path

If live browser has trouble, use screenshots in `docs/screenshots/qa/`:

- `after-library-desktop.png`
- `after-detail-desktop.png`
- `after-upload-desktop.png`
- `after-review-desktop.png`
- `after-admin-desktop.png`
- `after-guide-mobile-320.png`
- `command-palette-open.png`
- `request-original-dialog-open.png`
- `review-pending-write-dialog-open.png`
