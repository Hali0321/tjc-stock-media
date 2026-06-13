# Live DAM Surface Codemap

Date: 2026-06-10

## Decision

The live portal surface is the enterprise DAM family under `frontend/components/dam/enterprise/`, exported through `frontend/components/dam/EnterpriseDamPages.tsx` and mounted by `frontend/app/**/page.tsx`.

Legacy page modules under `frontend/components/*.tsx` remain in the repo as reference material until deletion is safe, but new DAM work should not extend them.

## Live Routes

- `/` -> `EnterpriseLibraryPage`
- `/collections` -> `EnterpriseCollectionsPage`
- `/packages` -> `EnterprisePackageBuilderPage`
- `/brand-hub` -> `EnterpriseBrandHubPage`
- `/insights` -> `EnterpriseInsightsPage`
- `/admin` -> `EnterpriseAdminPage`
- `/review` -> `EnterpriseReviewPage`
- `/assets/[id]` -> `EnterpriseAssetDetailPage`
- `/upload` -> `UploadPage`
- `/guide` -> `GuidePage`

## Legacy Reference Modules

Do not add new behavior here unless first reactivating them through a route-level decision.

- `frontend/components/AdminPage.tsx`
- `frontend/components/ReviewPage.tsx`
- `frontend/components/LibraryPage.tsx`
- `frontend/components/AssetDetailPage.tsx`
- `frontend/components/CollectionsPage.tsx`
- `frontend/components/DamExperience.tsx`

## Quarantine Status

- `frontend/components/dam/DamOperations.tsx` no longer imports from `frontend/components/DamExperience.tsx`.
- Remaining references to legacy page modules should be treated as migration debt and audited before deletion.
- Upload and Guide are still live top-level modules and are not part of this quarantine.

## Next Deletion Test

Before deleting legacy modules:

1. Run `rg "@/components/(AdminPage|ReviewPage|LibraryPage|AssetDetailPage|CollectionsPage|DamExperience)" frontend`.
2. Run `make frontend-check`.
3. Run Viewer and Reviewer browser QA.
4. Only remove files when no live route, primitive, or screenshot harness depends on them.
