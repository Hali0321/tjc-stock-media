# UI debug notes

Date: 2026-06-07

Repo paths discovered:
- App shell/nav: `frontend/components/AppChrome.tsx`, `frontend/components/AppNav.tsx`
- Global styles: `frontend/app/globals.css`
- Library: `frontend/components/LibraryPage.tsx`, `frontend/components/AssetCard.tsx`, `frontend/components/LibraryPagination.tsx`
- Collections: `frontend/components/CollectionsPage.tsx`, `frontend/components/CollectionAlbumCard.tsx`, `frontend/components/CollectionShelfInspector.tsx`
- Upload: `frontend/components/UploadPage.tsx`, `frontend/components/UploadFileDropzone.tsx`, `frontend/components/InputWithTags.tsx`, `frontend/lib/tjc-toasts.tsx`
- Review: `frontend/components/ReviewPage.tsx`, `frontend/components/ReviewQueueAssetCard.tsx`, `frontend/components/HoldReleaseButton.tsx`, `frontend/components/DataTable.tsx`
- Asset Detail: `frontend/components/AssetDetailPage.tsx`, `frontend/components/MediaPreviewPanel.tsx`, `frontend/components/DownloadOptionsPanel.tsx`

Notes:
- Project does not use `frontend/src`; active code lives under `frontend/app`, `frontend/components`, and `frontend/lib`.

## Bugs Tracked

| Bug | Component/file touched | Before behavior | After behavior | Screenshot proof |
| --- | --- | --- | --- | --- |
| Mobile bottom nav overlap | `frontend/app/globals.css`, `frontend/components/AppChrome.tsx` | Floating bottom nav could cover page actions/cards. | Shared mobile nav/safe-area variables and bottom padding on `main#main-content` / `.dam-shell`. Toasts offset above nav. | Pending browser refresh |
| Skip link visible without focus | `frontend/app/globals.css` | Skip link could be visible in screenshots. | Skip link hidden by default with opacity and pointer-events, shown on focus/focus-visible only. | Pending browser refresh |
| Toasts covering active fields / stacked confirmations | `frontend/components/AppChrome.tsx`, `frontend/lib/tjc-toasts.tsx` | Upload file/save/submit toasts could stack near forms. | Toaster moved bottom-center with desktop/mobile offsets; upload/draft toasts use stable IDs and submit completion dismisses progress toast. | Pending browser refresh |
| Upload desktop dead zone | `frontend/components/UploadPage.tsx`, `frontend/app/globals.css` | Reviewer packet waited below full three-column row while files/tags column was tall. | Upload form uses desktop grid areas: context/people/files, packet/packet/files, actions/message/receipt. Mobile source order unchanged. | Pending browser refresh |
| Collections clipping / cramped cards | `frontend/components/CollectionsPage.tsx`, `frontend/components/CollectionAlbumCard.tsx`, `frontend/components/LibraryPage.tsx` | Spotlight could be tall, embedded collections allowed three columns, stat pills could squeeze. | Spotlight capped and top-aligned, embedded Library collections capped at two columns, album cards wrap stat pills and use narrower media column. | Pending browser refresh |
| Collection inspector sticky clipping | `frontend/components/CollectionsPage.tsx` | Inspector sticky offset could slide under header. | Sticky top uses `--app-header-height`; max-height and overflow allow full inspector access. | Pending browser refresh |
| Review mobile repeated/heavy controls | `frontend/components/ReviewPage.tsx`, `frontend/components/ReviewQueueAssetCard.tsx` | Queue cards repeated expanded action context; mobile had metrics/banner before selected work. | Compact queue cards, selected asset block split from action inspector, evidence collapsed on mobile, hold buttons only dangerous actions. Mobile metrics/source banner hidden. | `docs/screenshots/primitive-proof/review-workbench-desktop-1440.png` before final refresh |
| Asset detail restricted height / related repetition | `frontend/components/MediaPreviewPanel.tsx`, `frontend/components/AssetDetailPage.tsx` | Restricted preview could feel too tall on mobile; related cards risked repeated heavy restricted states. | Restricted preview mobile min-height reduced; related assets remain compact link cards under one section. | Pending browser refresh |

## Tests Run

- `npm --prefix frontend run typecheck` - pass
- `git diff --check` - pass

## Remaining QA

- `npm --prefix frontend run build`
- Safety smoke: `/api/download/367?role=Viewer` returns `403`
- Browser viewport checks: 1440, 1280, 1024, 768, 390, 320 for priority pages
- Refresh requested screenshots where feasible
