# TJC Stock Media UI Design Decision Log

Last updated: 2026-06-06

## 2026-06-06 - 21st.dev Scouting Pass

Decision: use 21st.dev as a component scouting source, not as a drop-in visual system.

Subagent: used. Dedicated subagent `019e9b6f-3c09-7eb0-8445-fbb2b356e47c` reviewed the 21st.dev community library and Image Comparison Slider, then produced a scouting report. A direct local browser/curl scouting pass also confirmed the library categories and slider page.

Categories reviewed:

```text
Navigation menus, command palettes / menus, cards, buttons, dialogs / modals,
dropdowns, file uploads, forms, inputs, paginations, sidebars, sliders,
skeletons / spinner loaders, tables, tabs, tags, text areas, toggles,
tooltips, badges, alerts / banners, empty states.
```

Accepted patterns:

- Tubelight-style navigation for workflow orientation.
- Command palette for fast DAM task switching.
- Display cards only for operational summaries.
- Contact-sheet grid for asset browsing.
- Filter sidebar/drawer for DAM facets.
- File upload preview for contributor confidence.
- Review cockpit row/list pattern for governance.
- Badges/banners/tooltips for safety clarity, with essential warnings visible in primary UI.
- Skeleton loaders that match final layout.

Rejected patterns:

- Marketing heroes, pricing sections, and campaign blocks.
- Full glass over asset cards, metadata, or safety labels.
- Particle effects, shaders, animated backgrounds, and dark neon dashboard treatments.
- Floating docks that create a second navigation system.
- Any component that makes the app feel like a component showcase.

Style decision:

```text
Inter + Noto Sans TC fallback
TJC evergreen accent
neutral off-white background
white operational surfaces
subtle borders
restrained radius
visible focus states
high-contrast text safety labels
no decorative motion that weakens workflow
```

## Image Comparison Slider Decision

Reference: `https://21st.dev/community/components/thanh/image-comparison-slider/default`

Decision: defer.

Rationale:

- Potentially valuable for comparing approved derivative vs restricted original, approved crop vs source crop, or portal preview vs approved downloadable copy.
- Not safe to implement until ResourceSpace derivative policy and preview permissions provide a trustworthy paired-image source.
- Current implementation would either use fake placeholders or risk exposing restricted original/master media.

Future implementation requirements:

- Build `frontend/components/ImageComparisonReviewPanel.tsx`.
- Use only in reviewer/admin context unless both sides are explicitly public-safe.
- Gate both images through existing preview/access decisions.
- Render clear `Preview restricted` / `Original restricted` states.
- Provide keyboard-accessible slider controls or a static accessible fallback.
- Never use the slider in Library, Collections, or Guide decoration.

## Replacement Decisions

| Old pattern | New pattern | Safety impact | Mobile/accessibility impact |
|---|---|---|---|
| Inline primary nav inside app shell | Maintained `AppNav` | Keeps Admin role-gated and core workflows clear | Screen-reader labels preserved when mobile text hides |
| Generic saved view cards | Compact display cards | Counts and reuse states stay truthful | Touch targets remain compact but reachable |
| Large asset card wells | Contact-sheet tiles | Blocked/download state remains visible without fake media | Grid fits 320 px without horizontal overflow |
| Plain upload file input | File preview workflow | Upload still enters Needs Review / Do Not Publish | Selected files can be removed before submit |
| Soft review cards | Review cockpit rows + inspector | Evidence and pending-write state stay explicit | Mobile uses stacked cards without horizontal overflow |
| Backend-ish status chips | StatusBadge / safety panels | Raw ResourceSpace status remains separate from portal reuse state | Status text never relies on color alone |
| First-page-only Library results | LibraryPagination | Count truth now says `Showing X-Y of Z` and query/view/filter state is preserved | Previous/Next buttons have accessible labels and fit 320 px |

## Open Debt

- Review confirmation dialog should be added with focus trap and explicit pending-write copy.
- Asset detail and review inspector tabs should become maintained components.
- Upload preview should support drag state and safe thumbnails.
- Command palette should add arrow-key selection and stronger dialog focus management.
