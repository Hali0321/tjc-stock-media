# DAM UI Modules

This UI system keeps business safety logic in existing policy modules and moves route composition toward smaller DAM presentation modules. Figma is not a dependency for implementation or verification; browser-visible previews and screenshots are references only.

## Module Boundaries

### `DamShell`

Owns app chrome, role-aware navigation, mobile menu behavior, command entry placement, footer copy, and safe top-level language. Viewer/Contributor shells never expose ops-only destinations.

### `DamWorkspace`

Owns page headers, task headers, search-first toolbars, result shells, empty states, saved/suggested view surfaces, and responsive workspace stacking. Used by Find, Packages, Guide, and Governance where the surface behaves like a workspace.

### `DamRecord`

Owns protected preview presentation, media record panels, "Can I use this?" verdict display, metadata rows, related media, and request-review/source-access presentation. It displays decisions from `viewer-verdict`; it does not invent reuse decisions.

### `DamPortal`

Owns package covers, package cards, package inspectors, package metadata summaries, ministry-kit visual language, and item-level approval warnings. Package approval is always presented as separate from item-level reuse approval.

### `DamOperations`

Owns review queue rows, selected review asset shells, evidence matrices, locked decision panels, governance metrics, blocker/diagnostic rows, audit rows, and ResourceSpace write-mapping presentation. Operational terms stay Reviewer/Admin-only.

### `DamFormFlow`

Owns upload/send-media steppers, required-field panels, selected-file/source-link previews, review packet summaries, draft/submit states, and intake language. It reinforces that Send media never publishes or approves anything.

## Viewer-Safe vs Ops Helpers

Viewer/Contributor route code imports viewer-safe presentation through `DamWorkspace`, `DamRecord`, `DamPortal`, and `DamFormFlow`. Reviewer/Admin route code may import `DamOperations`.

Rendered Viewer/Contributor copy should avoid:

- ResourceSpace
- Shared Drive
- source of truth
- pending write
- API mapping
- launch gate
- diagnostics
- field refs
- export
- original/master path

Reviewer/Admin copy may use operational terms when the user role and route authorize it.

## Safety Logic Ownership

Safety decisions remain in:

- `frontend/lib/reuse-policy.ts`
- `frontend/lib/viewer-verdict.ts`
- `frontend/lib/access-decisions.ts`
- API routes

UI modules render policy outputs and disabled-action explanations. They must not duplicate or weaken approval, download, review lock, RBAC, source access, or audit behavior.

## Current Implementation Shape

The first system pass keeps existing stable components in place and introduces `frontend/components/dam/*` as import boundaries. This lets route files depend on named DAM responsibilities while preserving behavior and reducing risk during continued polish.
