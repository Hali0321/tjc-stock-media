# V2 Enterprise DAM UI Acceptance Audit

Date: 2026-06-08
Branch: `codex/dam-v2-enterprise-ui-system`

## Scope

This audit starts from the current DAM-native rebuild screenshots in `docs/screenshots/`. The current branch is safer and cleaner than the original UI, but it still reads as a prototype in several high-visibility surfaces. V2 must preserve the safety model while replacing remaining card-heavy and placeholder-heavy patterns with a mature DAM workspace.

## Find / Asset Library

- Evidence: `docs/screenshots/library-desktop.png`, `docs/screenshots/library-mobile-320.png`, `docs/screenshots/library-mobile-390.png`
- Prototype signals:
  - Top search area still feels like a large page hero rather than a compact asset-bank toolbar.
  - Use-case shortcuts are still card rows with repeated icon/arrow structure.
  - Empty state is large and boxed, with page-like explanatory rhythm.
  - Actual work state sits too low when no viewer-safe results exist.
- DAM-native replacement:
  - Compress Find into a toolbar/search-console structure.
  - Turn use cases into compact command rows.
  - Make empty state a practical inline result panel with a small action cluster.
  - Preserve Viewer-safe default and blocked-download behavior.

## Media Record / Asset Detail

- Evidence: `docs/screenshots/asset-detail-desktop.png`, `docs/screenshots/detail-mobile-390.png`
- Prototype signals:
  - Related media uses four repeated placeholder cards with the same title.
  - Preview is safe but still reads as a large empty block on mobile.
  - Lower sections are stacked white boxes, making record content feel more like docs than a DAM inspector.
- DAM-native replacement:
  - Keep large preview plus one verdict/action inspector.
  - Convert related media to compact horizontal record rows/cards with smaller protected thumbnails.
  - Keep Viewer labels as plain language: `Reference code`, `Source file`, `Request DAM review`.
  - Keep ops-only ResourceSpace/source/write details behind reviewer/admin gates.

## Packages

- Evidence: `docs/screenshots/collections-desktop.png`, `docs/screenshots/collections-mobile-390.png`
- Prototype signals:
  - Repeated `Cover pending` blocks dominate every package card.
  - Cards repeat the same metric and reminder pattern.
  - Mobile becomes a long sequence of identical package blocks plus inspector.
- DAM-native replacement:
  - Replace blank covers with intentional generated package covers/montages.
  - Use compact package records with counts, owner, and best use.
  - Keep item-level approval reminder, but make it an inline safety rule rather than repeated wall copy.
  - Viewer ready counts must remain portal-ready safe counts.

## Send Media

- Evidence: `docs/screenshots/upload-desktop.png`, `docs/screenshots/upload-mobile-390.png`
- Prototype signals:
  - Safe and functional, but still a centered stack of large cards.
  - Type choices are oversized rows.
  - Action panel feels like another card instead of workflow footer.
- DAM-native replacement:
  - Keep 5-step wizard and validation.
  - Use a workflow split: stepper/packet context plus compact selection rows.
  - Preserve mobile order: required fields before actions.
  - Preserve Send-never-publishes copy and API contract.

## Review Inbox

- Evidence: `docs/screenshots/review-desktop.png`, `docs/screenshots/review-mobile-320.png`, `docs/screenshots/review-mobile-390.png`
- Prototype signals:
  - Desktop is closest to target, but rows still have many small pills.
  - Mobile renders too much inspector content in one long sequence.
  - Decision lanes overflow visually at narrow width.
- DAM-native replacement:
  - Keep desktop workbench structure and sticky inspector.
  - On mobile, show current asset + evidence + decision first, with queue collapsed/limited below.
  - Compress lane panels and evidence controls.
  - Preserve evidence locks and selected item reset behavior.

## Governance

- Evidence: `docs/screenshots/admin-desktop.png`, `docs/screenshots/admin-mobile-390.png`
- Prototype signals:
  - Desktop has a cockpit base, but top section still looks like hero plus warning card.
  - Mobile stacks blocker cards and a huge blocked status block.
  - Diagnostics are hidden, but top priority content remains too verbose.
- DAM-native replacement:
  - Use metric strip plus issue table as primary structure.
  - Mobile should start with readiness score, blockers as compact rows, and diagnostics accordion.
  - Admin-only ResourceSpace, pending writes, launch gate, and mapping language must remain available.

## Help

- Evidence: `docs/screenshots/guide-desktop.png`, `docs/screenshots/guide-mobile-390.png`
- Prototype signals:
  - Help still has a large prompt panel and many cards.
  - Mobile feels like a policy card wall.
  - Quick decision content is useful but below too much furniture.
- DAM-native replacement:
  - Build contextual assistant layout: search, topic list, selected answer, fast paths.
  - Prefer rows/accordion panels over equal cards.
  - Keep Viewer-safe language and route actions.

## Safety Behavior to Preserve

- Viewer default shows only portal-ready approved copies.
- Unsafe ResourceSpace-approved media is never labeled `Ready to use`.
- Viewer sees no ResourceSpace IDs, raw status, Shared Drive paths, pending writes, launch gate, write mapping, source-system truth, or backend/API language.
- Source/original access remains governed.
- Send media never publishes.
- Review approval remains evidence-locked and auditable.
- Governance remains admin-only.
- Package ready counts remain Viewer-safe portal-ready counts.
