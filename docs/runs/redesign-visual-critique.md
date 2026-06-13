# Redesign visual critique

Date: 2026-06-07

Design read: premium church DAM product, photo-first where safe derivatives exist, decision-first where previews are restricted, and operational only where it helps reuse or governance. Current pass preserves ResourceSpace truth, portal reuse policy, pending-write semantics, and download safety.

## Global

- App shell now reads as a product surface instead of a report. Tubelight-style nav gives clear Library / Albums / Upload / Review workflow orientation.
- `Cmd/Ctrl+K` command palette, dialogs, dropdowns, tabs, pagination, status badges, upload preview, tag input, DataTable, and hold-to-confirm behavior are visible in real workflows.
- 320px and 390px screenshots show no horizontal overflow. The 320px nav switches to icon-first accessible labels so Admin navigation does not clip.
- Placeholders are now explicit ResourceSpace readiness states instead of broken media. Library still benefits most from future exported derivatives, but the UI no longer fabricates safe thumbnails.

## Library

Screenshots: `docs/screenshots/library-desktop.png`, `docs/screenshots/library-mobile-320.png`, `docs/screenshots/library-mobile-390.png`

- Desktop now reads as a DAM contact sheet with count truth, pagination, active filters, saved views, and compact cards.
- 320px uses single-column compact cards; 390px keeps denser contact-sheet rhythm where text remains legible. Title, primary reuse state, one blocker, and blocked/view actions are readable.
- Mobile still has a long contact sheet by nature, but pagination limits the wall and avoids infinite scroll.
- Remaining debt: real safe derivatives would improve visual variety more than another layout pass.

## Review

Screenshots: `docs/screenshots/review-desktop.png`, `docs/screenshots/review-mobile-320.png`, `docs/screenshots/review-mobile-390.png`

- Desktop feels like a governance cockpit: queue state, write-mapping banner, selected asset inspector, evidence checklist, tabs, actions, and compact queue rows.
- Mobile now reaches selected asset/action context before the queue wall. Queue selection is a compact select, and mobile renders 8 queue cards before load-more.
- Hold-to-confirm high-risk actions remain available after evidence completion; regular approval actions still use the confirmation dialog.
- Remaining debt: add a low-vision countdown label to hold-to-confirm.

## Asset Detail

Screenshots: `docs/screenshots/asset-detail-desktop.png`, `docs/screenshots/detail-mobile-320.png`, `docs/screenshots/detail-mobile-390.png`

- Desktop no-preview state is now intentional: decision and download panels dominate, preview restriction is framed as export readiness, and original/master remains restricted.
- Mobile order keeps title, source, preview/restricted preview, reuse decision, actions, trust summary, download options, tabs, and related assets in the right decision sequence.
- Raw ResourceSpace status and portal reuse state remain visibly separate.
- Remaining debt: true comparison slider waits for safe paired derivatives.

## Collections

Screenshots: `docs/screenshots/collections-desktop.png`, `docs/screenshots/collections-mobile-320.png`, `docs/screenshots/collections-mobile-390.png`

- Page is album-first: album cards, selected shelf inspector, stable collection IDs, approval summaries, and one Library handoff action.
- ResourceSpace export details are secondary/collapsed instead of dominating browsing.
- Placeholder repetition is softened by album-level shelf treatment and selected inspector context.
- Remaining debt: collection hero thumbnails should improve when ResourceSpace exports collection-level derivatives.

## Upload

Screenshots: `docs/screenshots/upload-desktop.png`, `docs/screenshots/upload-mobile-320.png`, `docs/screenshots/upload-mobile-390.png`

- Dropzone, selected-file preview, file type/size, remove/clear actions, tag chips, taxonomy warning, toast feedback, and staged/review state are visible.
- No-file submit does not fake a file upload; source-link intake remains a review packet.
- New media still lands as `Needs Review / Do Not Publish`.

## Admin

Screenshots: `docs/screenshots/admin-desktop.png`, `docs/screenshots/admin-mobile-390.png`

- Admin now reads as an executive readiness console: readiness score, blockers, source/read/write cards, backlog/integration/field/vocabulary DataTables, and audit log.
- Mobile starts with summary and blockers; diagnostics remain available without becoming first impression.
- Remaining debt: production auth, write mapping, host, backup ownership, and derivative presets remain blockers.

## Guide

Screenshots: `docs/screenshots/guide-desktop.png`, `docs/screenshots/guide-mobile-320.png`, `docs/screenshots/guide-mobile-390.png`

- Guide remains readable and secondary. Mobile chips wrap without clipped controls, and the collapsible preview-safety section documents safe image/video/audio/document/restricted/unknown preview modes without faking catalog media.
- Sabbath language is correct; no Sunday wording appears in the current screenshots.
- Remaining debt: guide can gain a little editorial spacing polish, but it is acceptable for demo.

## QA result

- Full screenshot capture: `docs/screenshots/industry-dam-redesign-captures.json`, 29 captures, no horizontal overflow.
- Browser QA: `docs/screenshots/qa/browser-qa-report.json`, 15 pages, 6 viewport widths, 0 failures, 0 warnings, 0 console errors, 0 network failures.
- Safety checks remain server-owned: unsafe downloads return 403, malformed download returns 400, missing review evidence returns 400, valid reviewer evidence queues 202 pending write.
