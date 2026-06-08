# TJC Stock Media UI Rules

Last updated: 2026-06-08

## Purpose

This file defines the reusable product UI rules for the TJC Stock Media portal. It is not a production launch checklist. Production blockers live separately in launch readiness docs and admin diagnostics.

Core promise:

```text
The UI must not lie about whether an asset is safe, approved, written, or downloadable.
```

## Design Thesis

Hybrid ministry DAM interface: enterprise metadata/permission/audit spine, ResourceSpace companion truth layer, neutral operations surfaces, evergreen action color, dense but readable governance information, and minimal decorative motion. This is workflow software for repeated church media tasks, not a marketing site or photo gallery.

## Token Rules

### Color Semantics

Use status color only for real state. Never use decorative status color.

| Token | Meaning |
|---|---|
| `success` | Approved or cleared for the stated scope |
| `warning` | Needs attention before reuse |
| `danger` | Do not use, blocked, or launch-critical |
| `info` | Neutral system information |
| `pending` | Queued locally or waiting for review |
| `blocked` | Action cannot proceed |
| `restricted` | Role cannot access source/original/preview |
| `review-needed` | Reviewer decision required |
| `approved` | Safe under stated scope only |

### Surface Semantics

| Surface | Use |
|---|---|
| `surface.default` | Main page background |
| `surface.muted` | Secondary bands and quiet grouping |
| `surface.elevated` | Dialogs, dropdowns, selected inspectors |
| `surface.policy` | Guide and rights instruction areas |
| `surface.review` | Review queue, evidence, decision workspace |
| `surface.admin` | Launch readiness, mappings, action backlog |
| `surface.blocked` | Denied actions and blockers |

### Border Semantics

| Border | Use |
|---|---|
| `border.subtle` | Regular separation |
| `border.emphasis` | Selected or focused state |
| `border.warning` | Needs review or missing evidence |
| `border.danger` | Do not use or launch blocked |
| `border.selected` | Current queue item, collection, saved view |

### Text Hierarchy

Use current app classes before inventing new size scales.

| Text | Rule |
|---|---|
| Page title | One per page, short workflow name |
| Section title | Names the work area, not marketing copy |
| Card title | Asset, collection, blocker, or action name |
| Supporting text | One sentence of operational guidance |
| Metadata text | Secondary, compact, never dominant |
| Badge text | Real state label, not decorative category |
| Field label | Visible label above or beside control |
| Helper text | Explains safety, validation, or scope |

## State Dictionary

| State | Meaning | UI rule |
|---|---|---|
| Approved | Safe to reuse under stated scope | Pair with scope, never imply unlimited use |
| Needs review | Not safe yet | Primary next action is request/review |
| Blocked | Action cannot proceed | Show why and what to do next |
| Restricted | Source/original not available to role | Do not render hidden media |
| Pending write | Local review action queued | Say ResourceSpace is not updated |
| Staged | Local/upload intake item selected | Do not imply submitted or approved |
| Draft saved locally | Local demo/draft only | Toast may confirm, persistent UI carries truth |
| Empty view | Saved view has no assets | Offer collections or reset view |
| No matching assets | Query/filter found nothing | Offer clear search/filter |
| Unknown preview | File type cannot render safely | Use standard unknown shell |

## Orthogonal Status Lanes

Never collapse safety into one vague badge. Enterprise DAM trust uses separate lanes.

| Lane | Values |
|---|---|
| Workflow | Draft, Submitted, In review, Needs info, Approved, Held, Rejected, Archived |
| Distribution | External ministry, Internal only, Reviewer-only, Archive only, Do not publish |
| Rights | Verified, Restricted, Unverified, Consent required, Expiring, Expired |
| People / release | No people, Adults visible, Children/youth possible, Release verified, Missing, Unverified |
| Availability | Download available, Preview only, Rendition missing, Original restricted, Preview unavailable |
| Source | Verified, Incomplete, Conflict, ResourceSpace, Shared Drive, Manual intake, Duplicate candidate |
| Sync | Read-only export, Pending write, Failed, Retrying, Synced, Mapping missing |
| Sensitivity | General ministry, Children/youth, Pastoral/private, Sacramental/worship, Music/teaching rights, Third-party design, Re-review required |

## Ministry Risk Rules

The UI must expose ministry-specific risk as structured state, not vague notes.

| Risk | Rule |
|---|---|
| Children/youth | Public-facing use requires explicit reviewer clearance and consent/organizer evidence |
| Pastoral/private context | Requires senior or DAM Admin review before broad reuse |
| Sacramental/worship context | Show usage scope and avoid casual repurposing |
| Sermon/teaching/music rights | Treat as rights-specific evidence, not generic media metadata |
| Third-party graphics | Block external reuse until ownership or license is verified |
| Local-church-only | Do not relabel as church-wide or internet-public |
| Re-review date | Surface expiry and route stale approvals to Governance |

Collections, campaigns, packages, and saved views never grant permission. Asset-level policy still decides download and reuse.

## CTA Hierarchy

Each decision area has one primary CTA.

Asset Detail:

| Role | Primary | Secondary | Status only |
|---|---|---|---|
| Viewer | Request review | Ask media coworker, Request original access | Download unavailable, original/master restricted |
| Reviewer | Queue review decision | Copy IDs, open related metadata | Pending write, missing evidence |
| DAM Admin | Inspect source-of-truth link | Export/copy actions | Launch blockers |

Review confirmation dialog:

| Primary | Secondary | Required copy |
|---|---|---|
| Queue pending review write | Cancel | This queues local pending write. ResourceSpace is not updated until API field mapping is configured. |

Upload:

| Primary | Secondary | Blocked state |
|---|---|---|
| Submit intake | Save draft | Submit disabled until file/source and packet requirements pass |

## Blocked Action Rules

Every blocked action answers:

1. Why this action is blocked.
2. What the next safe action is.
3. Whether the action affects local pending state or ResourceSpace truth.

Do not render blocked downloads as real download links. Use disabled controls, lock icons, and nearby copy.

## Role-Specific Language

| Role | Language focus |
|---|---|
| Viewer | Can I use this safely? What do I ask for next? |
| Contributor | What evidence must I submit? What stays draft/local? |
| Reviewer | What is missing? What decision can I queue? |
| DAM Admin | What blocks launch? Who owns it? What is mapped? |

## Page Rules

### Library

Library is table-first and facet-first. Grid remains a visual browsing mode, not the default enterprise mode.

Priority order on cards:

```text
reuse state -> asset title -> safe preview/restricted shell -> one key blocker -> source/collection -> ResourceSpace ID
```

Empty states:

| Situation | Title |
|---|---|
| Saved view empty | No assets in this view yet |
| Query/filter empty | No matching approved assets |
| Collection empty | No assets in this collection yet |

Search placeholder:

```text
Search approved media...
```

### Asset Detail

Viewer tabs:

```text
Use
Source
Files
```

Collapsed by default for Viewer:

```text
Trust summary
Governance passport
Related
```

Preview shell modes:

```text
Image preview
Document shell
Restricted preview
Unknown file shell
```

### Intake

Mobile step order:

```text
Context -> People and rights -> Files or source -> Review and submit
```

Validation rules:

- Context cannot continue without required event/source fields.
- People and rights cannot continue without visibility/rights fields.
- Files or source cannot continue without uploaded file or source link.
- Submit cannot create approved media.
- Save draft is always available and local-only.

### Review

Desktop Review is a three-pane workbench:

```text
queue groups -> queue table/selected preview -> decision console
```

Reviewer order:

```text
current reviewing asset -> risk summary -> missing evidence -> decision actions -> review note -> checklist -> queue
```

Disabled decisions use one compact decision-lock panel, not repeated verbose copy under every button. The panel may say:

```text
Complete before approval: people/minors confirmed, rights confirmed, review note added.
```

### Admin

Priority order:

```text
Launch blocked -> top blockers -> owner -> count/severity -> action path -> detailed tables
```

Top production blockers stay explicit:

```text
ResourceSpace write mapping
Real authentication / SSO
Rights and consent review coverage
```

### Guide

Mobile starts with:

```text
What are you trying to do?
```

Each task opens into Do / Avoid guidance. Search matches tasks and policy terms. Fallback action remains:

```text
Ask a media coworker
```

## QA Rules

Screenshot QA catches layout. Click-path QA proves workflow truth.

Required flows:

```text
viewer-library-empty-to-collections
viewer-asset-blocked-request-review
contributor-upload-stepper
reviewer-decision-workflow
admin-launch-blocked
guide-task-cards
```

Run across desktop, 390px, and 320px where workflow is mobile-sensitive.

## Production Blockers

These are not visual polish:

- Real auth / SSO with server-side role claims.
- ResourceSpace write adapter and field mapping.
- Required production env/secrets classification.
- Audit log for identity, review, pending write, write success/failure, export, and denied events.

Keep Admin honest until these are solved.
