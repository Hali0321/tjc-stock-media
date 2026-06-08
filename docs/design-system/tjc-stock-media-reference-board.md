# TJC Stock Media Reference Board

Last updated: 2026-06-08

## Purpose

This board records product references for the portal UI direction. It is not a dependency list. Borrow the workflow patterns, not the brand skin.

## Strong References

### ResourceSpace

Why it matters:

- Source-of-truth DAM model.
- Metadata, collection, search, and review vocabulary already map to project constraints.
- Good reminder that the portal is a role-safe workflow layer, not a second DAM.

Borrow:

- Clear distinction between resource metadata and collection context.
- Admin-first vocabulary for field mappings and source state.
- Conservative treatment of originals.

Do not borrow:

- Dense admin-first layout for normal Viewers.
- Assuming raw approval equals portal-safe reuse.

### Brandfolder / Smartsheet DAM Pattern

Why it matters:

- Mature asset browsing pattern with search, collections, thumbnails, usage context, and brand governance.
- Useful model for Library and Collections scanning.

Borrow:

- Contact-sheet browsing where preview and asset name are dominant.
- Collection browsing as a navigation bridge.
- Asset detail pages that separate usage guidance from technical metadata.

Do not borrow:

- Marketing-heavy polish that hides governance.
- Download-first behavior before reuse state is clear.

### Bynder DAM Pattern

Why it matters:

- Strong enterprise DAM pattern for campaigns, asset metadata, rights, and role-based operations.
- Useful model for Review and Admin workflows.

Borrow:

- Explicit approval and review states.
- Role-aware action surfaces.
- Governance language close to the decision.

Do not borrow:

- Complex enterprise navigation that slows a small church team.
- Any implication that an action wrote back to ResourceSpace before mapping exists.

## Supporting References

### GOV.UK Service Design

Why it matters:

- Trust-first interaction language.
- Plain copy, strong form validation, visible error reasons, and accessible task flow.

Borrow:

- One task per step in upload/review.
- Error messages near the blocked control.
- Plain state language.

Do not borrow:

- Full public-sector visual style.
- Heavy page chrome where existing app components already work.

### Linear Product UI

Why it matters:

- Clear command palette, quiet navigation, restrained state surfaces.
- Useful for app shell, command acceleration, and dense but calm workspaces.

Borrow:

- Command palette as accelerator.
- Compact nav hierarchy.
- Crisp state transitions without decorative motion.

Do not borrow:

- Over-minimal copy when governance needs explanation.
- Dark-mode/productivity aesthetics that do not match TJC media review tone.

## Anti-Reference

### Generic AI Media Gallery

Avoid:

- Purple gradients, glass panels, and decorative status dots.
- Three equal feature cards on operational pages.
- Fake thumbnails or div-built fake product previews.
- Download buttons that look available while policy blocks them.
- Raw filenames as user-facing titles.
- "Looks approved" visual language without reviewer/date/scope evidence.

## Application Map

| Portal area | Primary reference | Borrowed pattern |
|---|---|---|
| App nav | Linear | Workflow-first nav plus command accelerator |
| Library | Brandfolder / Bynder | Contact sheet, saved views, collection context |
| Asset Detail | Brandfolder / ResourceSpace | Usage first, source and files separated |
| Upload | GOV.UK service flow | Step validation and visible blocked reasons |
| Review | Bynder / ResourceSpace | Decision workspace, missing evidence, pending write truth |
| Admin | ResourceSpace / GOV.UK | Launch blockers, owners, mappings, diagnostics |
| Guide | GOV.UK | Task cards, Do / Avoid guidance, plain fallback |

## Design Guardrails

- Use existing app tokens, components, radii, and typography.
- Keep ResourceSpace as source of truth in copy and behavior.
- Treat "download", "original", "approved", and "written" as protected words.
- Every state label must map to a real data or policy state.
- Visual density may be compact, but the reuse decision must stay dominant.
