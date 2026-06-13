# UI debug next pass

Date: 2026-06-07

Starting HEAD: `25e9790f145b07d05d367d69df3ad4538f3bfe81`
Branch: `codex/industry-dam-ui-rebuild`

## Scope

Targeted screenshot/debug follow-up. Active frontend paths are `frontend/app`, `frontend/components`, and `frontend/lib`; there is no active `frontend/src` app tree.

## Fix Log

| Bug | Screenshot where seen | Files changed | Fix applied | Proof |
| --- | --- | --- | --- | --- |
| Library empty state duplicated | `library-mobile-320.png`, `library-mobile-390.png` | `frontend/components/LibraryPage.tsx` | Empty results now show one main empty-state card; pagination, sort, duplicate result summary, and empty grid are hidden when no assets are visible. | `docs/screenshots/library-mobile-320.png`, `docs/screenshots/library-mobile-390.png` |
| Review mobile queue too repetitive | `review-mobile-320.png`, `review-mobile-390.png` | `frontend/components/ReviewQueueAssetCard.tsx` | Non-selected queue cards now show thumbnail, title, one compact risk state, gap count, and a single Inspect action; Detail link appears only on selected card. | Refresh pending |
| Review desktop/table clipping | `review-desktop.png`, browser QA clipped-control report | `frontend/components/ReviewPage.tsx`, `frontend/components/DamTabs.tsx` | Workbench grid uses zero-min tracks; tabs wrap instead of overflowing; inspector buttons stay within panel. | `portal-browser-qa` pass pending after latest patches |
| Asset Detail desktop dead space | `asset-detail-desktop.png` | `frontend/components/AssetDetailPage.tsx` | Desktop detail tabs now sit directly under preview/thumbnail rail while decision/download/trust remain sticky at right; mobile order remains unchanged. | Refresh pending |
| Asset Detail related placeholders dominate | `asset-detail-desktop.png`, `detail-mobile-320.png` | `frontend/components/AssetDetailPage.tsx`, `frontend/components/DamStates.tsx` | Related assets use compact cards with short restricted state instead of full reason/next-action panels. | Refresh pending |
| Admin mobile Queue tab empty | `admin-mobile-390.png` | `frontend/components/AdminPage.tsx` | Queue tab now shows mobile top blocker cards and launch decision copy; diagnostics remain collapsed. | Refresh pending |
| Restricted placeholders repeated too much | Asset Detail and related screenshots | `frontend/components/DamStates.tsx`, `frontend/components/MediaPreviewPanel.tsx` | Restricted preview panel now varies by cause: rights/consent, people/minors, no derivative, original/master hidden, pending preview. One icon, title, one-line reason, optional action chip. | Refresh pending |
| Guide needs light polish only | `guide-mobile-320.png`, `guide-mobile-390.png` | `frontend/components/GuidePage.tsx` | Jump chips wrap as compact chips, Do/Avoid spacing uses quiet cards, Ask media coworker block remains visible. | Refresh pending |
| Primitive matrix final contract | `docs/ui-system/21st-primitive-implementation-matrix.md` | `docs/ui-system/21st-primitive-implementation-matrix.md` | Header names now match final proof fields: primitive name, URL, source status, app-native component/code path, real usage, screenshot proof path, accessibility behavior, ported/rejected/debt. | Matrix file |

## Mobile Nav Tradeoff

Mobile nav remains in normal document flow at page bottom. This avoids content overlap at 320/390 and keeps footer readable, but navigation is not persistent on long pages. Reintroducing fixed nav should only happen with real reserved bottom padding, scroll-margin for focusable controls, and screenshot proof across all mobile pages.

## Safety Preserved

- ResourceSpace remains source of truth.
- Raw ResourceSpace status remains separate from portal reuse state.
- Pending review writes remain local/pending until ResourceSpace write mapping exists.
- No fake successful ResourceSpace writes.
- Viewer unsafe downloads and original/master-like requests remain blocked.
- Upload intake still implies staged review, not approval.

## QA

Latest complete pass before final patch set:
- `BASE_URL=http://localhost:3034 make portal-browser-qa` passed at `2026-06-07T20:46:26.334Z` with `0` failures, `0` console errors, `0` network failures.
- `BASE_URL=http://localhost:3034 make portal-api-smoke` passed.
- Unsafe download smoke returned `403`.
- Viewer original/master-like request returned `403`.

Final patch set requires rerun:
- `npm --prefix frontend run typecheck`
- `npm --prefix frontend run build`
- `BASE_URL=http://localhost:3034 make portal-browser-qa`
- `BASE_URL=http://localhost:3034 make portal-api-smoke`
- `git diff --check`
