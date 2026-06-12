# Rights Workflow

## Default State

Every imported asset starts as:

- `rights_status = Unknown`
- `publish_status = Needs Review`
- `public_safe = Unknown`
- `usage_scope = Do Not Publish`
- `quality_status = Unreviewed`

## Roles

| Role | Can do |
|---|---|
| Uploader | Submit or provide context for media. |
| Tagger | Add descriptive and TJC-context tags. |
| Rights reviewer | Approve public/internal/restricted status. |
| DAM admin | Manage fields, users, exports, and system setup. |

## Approval Rules

| Rule | Reason |
|---|---|
| Every import defaults to Do Not Publish. | Prevents accidental use. |
| Only reviewer changes public/internal approval. | Separates upload from approval. |
| Approval requires reviewer, date, usage scope, and notes. | Creates accountability. |
| Public approval requires extra confidence. | Public church media has higher reputational risk. |
| Unknown people or children default to Needs Review. | Consent risk. |
| No asset goes to Approved Public without metadata. | Prevents looks-fine approvals. |
| Portal review action is not ResourceSpace truth until live writeback is confirmed by re-read. | Prevents queued sidecar state from masquerading as DAM state. |

## Quality vs Rights vs Publishing

Do not use one field to mean everything.

| Field | Question |
|---|---|
| `quality_status` | Is this useful stock media? |
| `rights_status` | Do we know the source/use rights? |
| `usage_scope` | Where may it be used? |
| `publish_status` | What should users do with it operationally? |

Low-use but safe media should be `Archive - Not Promoted`, not `Do Not Use`. Reserve `Do Not Use` for rights, safety, privacy, or mission-alignment problems.

## Review States

```text
Needs Review
   |
   +--> Approved Internal
   |
   +--> Approved Public
   |
   +--> Searchable Archive
   |
   +--> Archive - Not Promoted
   |
   +--> Do Not Use
```

## Sensitive Media

Keep these in `Needs Review` until a reviewer approves:

- baptism
- footwashing
- holy communion
- worship footage
- sermons
- music or hymns
- minors/children
- unknown people
- volunteer-created media
- third-party design assets

## Archive Tiers

| Tier | Meaning |
|---|---|
| Approved Stock | Reviewed, tagged, and approved public/internal assets. |
| Searchable Archive | Indexed and traceable, but not publishable until reviewed. |
| Cold Archive / Do Not Use | Duplicate, low-value, restricted, risky, or unreviewed assets. |

Full archive launch should use tiers. Do not promise that every imported archive file is fully reviewed and usable.
