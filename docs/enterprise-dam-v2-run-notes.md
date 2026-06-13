# Enterprise DAM V2 Run Notes

Date: 2026-06-08
Branch: `codex/dam-v2-enterprise-ui-system`

## Systemization Pass 2026-06-09

Goal: finish the current direction rather than restart it. This pass compressed the shared visual system and made the main surfaces feel more like one enterprise DAM workspace.

Changes made:

- Tightened shared primitives: restrained radii, compact buttons/search, smaller empty states, quieter navigation/menu shapes.
- Library: removed the competing default-empty toolbar panel so Viewer sees one compact results empty state inside the asset-bank flow.
- Library: removed internal/meta copy from the user-facing empty state; default copy now stays product-facing.
- Help: reduced hero scale, changed topic choices into denser task rows, and kept quick decision/review request higher on mobile.
- Asset Detail: upgraded protected previews into a controlled media stage with contact-sheet texture and a centered locked state.
- Packages: reduced repeated item-level approval warning weight while preserving the safety line and inspector warning.
- Governance: converted the duplicate top priority cards into a compact queue/table surface and fixed the mobile stacked table header.

Manual screenshot inspection:

- Captured updated systemization screenshots under `docs/screenshots/systemization-pass/`.
- Checked Library mobile/desktop, Help mobile, Packages mobile, Asset Detail mobile, Review mobile, Governance mobile, and Upload mobile.
- Added Upload/Send proof at 320px, 390px, and 1440px with Contributor role.
- Capture script reported zero horizontal overflow and zero console errors for inspected 390px and 1440px screens.

## Baseline Read

Latest browser QA screenshots show a safer and more coherent DAM portal, but several surfaces still read as simplified internal portal screens rather than enterprise DAM software:

- Find has a strong safe-default model, but the empty state still needs more asset-bank structure: toolbar, filters, result shell, and compact actions.
- Help is clear but too article/card-like on mobile. It should behave like a task assistant and route users back into product workflows.
- Media Record is clearer after the inspector rebuild, but protected previews need to feel intentional rather than like missing thumbnails.
- Packages now use generated covers, but the portal/kit treatment should keep moving toward compact cover, count, best-use, and item-level safety rows.
- Review desktop has the correct workbench shape. Mobile remains dense and must keep current asset, evidence, and decision controls easy to scan.
- Governance desktop has the right operational data. Mobile still feels like a tall launch-status article and needs a denser command-center summary.

## Changes Planned In This Run

- Tighten Find into an asset-bank workspace with compact search, filter/view controls, and a real result region even when empty.
- Convert Help into a compact contextual assistant: search, task rows, selected topic, quick decision, and review request without long card stacks.
- Improve protected preview surfaces with locked-preview visual language and consistent media treatment.
- Make Governance mobile start with compact score, asset counts, and blocker rows instead of a giant status article.
- Keep Review mobile evidence and decision controls visible while compressing lanes and rows.

## Safety Behaviors That Must Not Change

- Viewer default shows only portal-ready approved copies.
- Unsafe ResourceSpace-approved assets never display `Ready to use`.
- Viewer sees no ResourceSpace IDs, Shared Drive paths, raw workflow state, launch gate, pending writes, source-system truth, API/write mapping, or backend implementation language.
- Viewer may see `Reference code` only.
- Unknown source, approval, rights, people/youth, approved copy, or usage scope blocks self-serve download.
- Source/original access remains a governed request.
- Send media never publishes; submitted media stays `Needs Review / Do Not Publish` until reviewer approval.
- Review approval remains evidence-locked and auditable.
- Governance remains DAM Admin-only.
- Package counts shown to Viewer remain portal-ready safe counts; package approval never overrides item-level media records.

## Reference Standard

Layout decisions continue to use `REAL_APP_UI` and strong `DEMO_FRAME` evidence from `docs/reference-dam-ui-audit.md`. Marketing pages, vendor homepages, pricing pages, customer-logo sections, abstract product art, and YouTube channel pages remain rejected as layout structure.

## Stitch Visual Baseline

The Stitch export was unpacked into `docs/reference/stitch/stitch/` and read during this run:

- `asset_library_modernized/screen.png`
- `asset_detail_modernized/screen.png`
- `reviewer_approval_inbox_modernized/screen.png`
- `ministry_packages_modernized/screen.png`
- `governance_cockpit_modernized/screen.png`
- `evergreen_enterprise_dam/DESIGN.md`

Usable Stitch direction:

- More restrained 4-8px radii, thinner borders, fewer shadows, Inter-style density.
- Search/filter/grid first for Asset Library.
- Large media preview plus sticky inspector for Asset Detail.
- Portal cards with covers, counts, and selected package inspector for Packages.
- Queue plus selected decision inspector for Review.
- Metrics, blocker tables, pending-write/coverage modules for Governance.

Limits:

- Stitch is an internal visual baseline, not product truth and not production code.
- Static HTML was not pasted into the app.
- Viewer-safe hiding, review locks, package item-level safety, Send-never-publishes, and API/RBAC guards remain governed by existing app logic.
