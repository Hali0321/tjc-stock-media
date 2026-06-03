# Rights Workflow

## Default State

Every imported asset starts as:

- `rights_status = Needs Review`
- `public_safe = Unknown`
- `usage_scope = Do Not Publish`

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

## Review States

```text
Needs Review
   |
   +--> Approved Internal
   |
   +--> Approved Public
   |
   +--> Restricted
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

