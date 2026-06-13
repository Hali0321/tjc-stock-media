# TJC Stock Media State Dictionary

Last updated: 2026-06-08

## Rule

State names are product promises. Use them only when the underlying metadata, role, and write status support the promise.

## Asset Lifecycle

```text
staged / uploaded
  -> needs review
  -> approved internal
  -> approved public
  -> blocked / do not use
  -> archived

review action
  -> pending write
  -> validating
  -> writing
  -> written to ResourceSpace
  -> failed / retrying / manual review
```

## States

| State | Who can see it | Who can change it | Allowed action | Blocked action | ResourceSpace mapping | Audit event |
|---|---|---|---|---|---|---|
| Staged | Contributor, Reviewer, Admin | Contributor before submit | Save draft, remove file, edit context | Treat as submitted or approved | None until submitted | `upload_draft_saved` |
| Draft saved locally | Contributor | Contributor | Continue editing | Claim ResourceSpace intake exists | None | `upload_draft_saved` |
| Needs review | All roles when visible | Reviewer/Admin through review flow | Request review, inspect evidence | Public download, original download | ResourceSpace review/status field after write adapter exists | `asset_review_requested` |
| Approved internal | Viewer if role allows, Reviewer, Admin | Reviewer/Admin | Internal reuse under scope | Public sharing unless separately approved | Portal reuse state / usage scope | `review_decision_queued`, `rs_write_succeeded` |
| Approved public | Viewer, Contributor, Reviewer, Admin | Reviewer/Admin | Download approved copy under stated scope | Original/master download unless authorized | Portal reuse state / usage scope | `review_decision_queued`, `rs_write_succeeded` |
| Blocked | All roles when visible | Reviewer/Admin | Ask media coworker, inspect reason | Download, public reuse, publish | Do Not Use or blocked workflow state | `download_denied`, `review_decision_queued` |
| Restricted | Viewer, Contributor | Reviewer/Admin can inspect more metadata | Request original access, request review | Render hidden original or source media | ResourceSpace permissions/source fields | `original_access_requested`, `download_denied` |
| Pending write | Reviewer, Admin | Backend review queue only | Show queued local write and audit preview | Claim ResourceSpace was updated | None until adapter writes successfully | `pending_write_created` |
| Written to ResourceSpace | Reviewer, Admin | Backend write adapter | Show confirmed ResourceSpace write | Show if API write failed or was skipped | ResourceSpace target fields | `rs_write_succeeded` |
| Failed write | Reviewer, Admin | Backend write adapter/Admin | Retry, manual review | Hide failure behind success toast | ResourceSpace unchanged or partially rejected | `rs_write_failed` |
| Empty view | Viewer | System result only | Browse collections, reset view | Show system error language | Search result state | `view_empty` |
| No matching assets | Viewer | System result only | Clear search/filter | Imply assets are missing from archive | Search result state | `search_no_results` |
| Unknown preview | All roles | System result only | Show shell, request help/review | Fake thumbnail, broken image placeholder | Media type/derivative state | `preview_unavailable` |

## Backend Permission Rule

Production access must be metadata-driven and server-side:

```text
role + approval state + rights status + people/minors status + usage scope + derivative availability
  -> visible/downloadable decision
```

React can explain the decision. React must not be the only enforcement layer.

## Audit Event Minimum

Production audit must record:

```text
who
role
asset ID
previous state
requested state
note
timestamp
write status
ResourceSpace response
```

Required events:

- `role_resolved`
- `asset_review_requested`
- `original_access_requested`
- `review_decision_queued`
- `pending_write_created`
- `rs_write_attempted`
- `rs_write_succeeded`
- `rs_write_failed`
- `download_denied`
- `admin_export_generated`
