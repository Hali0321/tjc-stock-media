# TJC Stock Media UI Design Decision Log

Last updated: 2026-06-06

## 2026-06-06 - 21st.dev Scouting Pass

Decision: use 21st.dev as a component scouting source, not as a drop-in visual system.

Subagent: used. Dedicated scouting subagent `019e9bb6-78c4-72e1-97c1-fa42cac99e66` reviewed the 21st.dev community library and Image Comparison Slider, then produced a scouting report. A direct browser scouting pass also checked the library and slider page.

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
- Review queue commands use stable `/review?queue=...` URLs instead of generic `/review` jumps.
- Display cards only for operational summaries.
- Contact-sheet grid for asset browsing.
- Filter sidebar/drawer for DAM facets.
- File upload preview for contributor confidence.
- Review cockpit row/list pattern for governance.
- Accessible tabs for Asset Detail trust sections and Review inspector sections.
- Request dialogs for original access, review request, and media coworker help.
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
| Full 80-row review render | Review load-more gate | Queue truth remains visible while reducing mobile scroll before action work | First 24 loaded rows show by default; selected row remains reachable; load-more is explicit |
| One long review inspector list | Shared `DamTabs` inspector panels | Checklist, metadata, rights, history, and pending writes remain explicit without burying action evidence | Real tab semantics, arrow-key movement, and horizontal mobile scroll |
| Asset detail `aria-pressed` section buttons | Shared `DamTabs` detail panels | Use, Source, Review, Files, and Related stay separated as trust record sections | Real tab semantics and keyboard movement replace loose buttons |
| Direct request `mailto:` links | Focused `ReuseRequestDialog` | Original/master access and review requests clearly do not change ResourceSpace status or pending writes | Focus-trapped dialog, Escape/cancel, and explicit email-draft action |
| Ordinary high-risk review buttons | `HoldReleaseButton` for archive/do-not-publish | Accidental archive-only or do-not-publish queueing should require intentional hold after evidence completion | Pointer and keyboard hold, disabled until checklist/note pass, muted red progress |
| Backend-ish status chips | StatusBadge / safety panels | Raw ResourceSpace status remains separate from portal reuse state | Status text never relies on color alone |
| First-page-only Library results | LibraryPagination | Count truth now says `Showing X-Y of Z` and query/view/filter state is preserved | Previous/Next buttons have accessible labels and fit 320 px |
| Immediate review action POST | ReviewActionDialog confirmation | Reviewers must see pending-write, not-final-ResourceSpace semantics before queueing | Focus trap, Escape/cancel, and initial confirm focus are implemented |
| Standalone detail/review admin/copy actions | DropdownActionMenu / AssetActionsMenu | Secondary actions should be available without competing with reuse, trust, or review evidence panels | Viewer/Reviewer see copy actions only; DAM Admin can open ResourceSpace source-of-truth link |

## Open Debt

- Upload preview now supports drop/browse drag state; safe thumbnails remain deferred until real upload backend and preview policy are wired.
- Download-options dialog remains deferred until derivative choices are richer; request-original/review/help dialogs are implemented.
