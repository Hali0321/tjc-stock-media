# DAM Workbench V2 Redesign Run

## Starting State

- Branch: `goal/dam-workbench-v2-redesign`
- Starting SHA: `41e90ba`
- Date: `2026-06-09`
- Baseline QA: completed through final browser QA refresh
- Baseline screenshots reviewed: all requested desktop/mobile route captures reviewed after V2 refresh

## Baseline Critique

### App shell
- Header needed stronger enterprise workbench hierarchy and real DAM module ownership.
- Mobile menu needed more polish, clearer role mode, and no bottom-nav dependency.

### Find
- Find needed to read as an asset-bank workspace, with search command, use-case surfaces, readiness context, and intentional empty states.

### Packages
- Package cards needed curated ministry-kit identity, stronger covers, package-vs-item approval warning, and inspector hierarchy.

### Asset Detail
- Detail needed a larger protected preview stage, premium verdict panel, refined metadata sections, and intentional related-media treatment.

### Send media
- Send needed to feel like building a reviewer packet, with clearer stepper, category cards, packet summary, and publish-safety language.

### Review Inbox
- Review needed workbench hierarchy: queue rail, selected asset, blockers, evidence matrix, and locked decisions.

### Governance
- Governance needed a launch-readiness command center, score strip, blocker ownership, diagnostics, mapping, and audit hierarchy.

### Help
- Help needed to feel like a guided assistant with a task selector, quick decision panel, selected topic, and review escalation.

## Redesign Goals

- Visible screenshot-changing redesign across all routes.
- Move real implementation into DAM modules.
- Preserve backend/API/RBAC/download/review/audit behavior.
- Preserve Viewer-safe language.

## Safety Invariants

- Viewer safe copy: preserve user-facing labels such as Find, Packages, Send media, Help, Can I use this?, Ready copy, Approved copy, Request review, Request source-file access, Reference code.
- No fake download: only expose approved-copy links when existing verdict/download policy allows.
- Send never publishes: intake remains review-only and defaults to Needs Review / Do Not Publish.
- Review approval locked: decision actions remain disabled until evidence and note are complete.
- Package item approval: package approval is not item approval; each item keeps its own verdict.
- Governance Admin-only: admin route remains role-gated.

## Screenshot Review

- App shell: PASS. Desktop chrome now reads as a DAM workbench with role mode, utility actions, and polished mobile header/menu.
- Find desktop/mobile: PASS. Search-first asset-bank workspace, saved/use-case surfaces, readiness panel, and intentional approved-copy empty state are visible at 1440/390/320.
- Packages desktop/mobile: PASS. Package cards use curated covers, readiness stats, ministry-use hierarchy, safety copy, and item-level approval warning.
- Detail desktop/mobile: PASS. Record layout has protected preview stage, right-side verdict/actions, refined metadata sections, and related media treatment.
- Send desktop/mobile: PASS. Reviewer-packet flow, stepper, category cards, required context panel, summary, and "Send never publishes" language are visible.
- Review desktop/mobile: PASS. Review queue, selected asset, blockers, evidence matrix, decision lock panel, and audit preview form a workbench.
- Governance desktop/mobile: PASS. Admin command center shows launch status, score strip, blocker/action table, diagnostics, mapping, and audit areas.
- Help desktop/mobile: PASS. Guide page is task-led with search, quick decision panel, selected topic, escalation guidance, and Do/Avoid sections.

## Safety Acceptance

- Viewer safe language: PASS
- Viewer API payload safe: PASS
- Blocked downloads remain blocked: PASS
- Review approvals evidence-locked: PASS
- Send media never publishes: PASS
- Package approval does not imply item approval: PASS
- Governance Admin-only: PASS
- Audit behavior preserved: PASS
- Source/original access restricted: PASS
- 320/390 overflow: PASS

## QA Results

| Command | Result | Notes |
|---|---:|---|
| `npm --prefix frontend run typecheck` | PASS | Also rerun through `make frontend-check` and `make demo-check`. |
| `npm --prefix frontend run build` | PASS | Clean build after generated `.next` cache refresh. |
| `git diff --check` | PASS | No whitespace errors. |
| `BASE_URL=http://localhost:3008 make portal-api-smoke` | PASS | Includes Viewer search redaction assertion. |
| `BASE_URL=http://localhost:3008 make portal-browser-qa` | PASS | `failures=0`, `consoleErrors=0`, `networkFailures=0`, `warnings=0`. |
| `make frontend-check` | PASS | Typecheck and build complete. |
| `make demo-check` | PASS | Frontend check plus demo validation complete. |
| `make launch-readiness` | PASS | `failures=0`, `warnings=1` for existing `.env` placeholders. |

## Continuation Hardening Notes

- `288e432` tightened Send media source-link language so Contributor UI no longer mentions Drive-folder specifics while keeping "Send never publishes" and Needs Review / Do Not Publish safety.
- `084b50a` compacted Admin mobile tabs with short display labels while preserving full accessible tab names and stable panel IDs.
- `ba6d6dd` compacted mobile package cards into scannable ministry-kit rows so packages feel curated without repeating oversized generated covers.
- `3fce928` compacted mobile related records on Asset Detail so the record remains readable at 320/390 without weakening item-level approval warnings.
- `19e1ec0` changed normal-user API source payloads from scaffold adapter text to `media-library` and added smoke coverage against `demo-fallback` leaks.
- `cb828c0` hid Review Inbox from Viewer command-palette results and added browser QA assertions for Viewer-hidden Review/Governance/pending-write commands.
- `d59b748` made batch-action denial copy viewer-safe and added API smoke coverage so Viewer denial payloads do not expose governance or source-system language.

Latest verified gates after these slices:

| Command | Result | Notes |
|---|---:|---|
| `npm --prefix frontend run typecheck` | PASS | Rerun after command-palette and API copy changes. |
| `npm --prefix frontend run build` | PASS | Production build succeeds. |
| `git diff --check` | PASS | No whitespace errors. |
| `BASE_URL=http://localhost:3008 make portal-api-smoke` | PASS | Includes normal-user adapter, batch denial, download, upload, review, and search redaction guards. |
| `BASE_URL=http://localhost:3008 make portal-browser-qa` | PASS | Command-palette role filtering verified; last passing run had `failures=0`, `consoleErrors=0`, `networkFailures=0`, `warnings=0`. |
