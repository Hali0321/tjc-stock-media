# ResourceSpace Integration Status

Last updated: 2026-06-10

## Data Flow

```txt
Google Shared Drive / Amazon S3
        ↓
ResourceSpace
        ↓
True Jesus Church Media Library UI
```

ResourceSpace is the canonical source for asset records, metadata, review state, collections, previews, and permissions. Google Shared Drive remains master-original custody. Amazon S3 remains the intended approved derivative and preview delivery layer. The Media Library UI must consume backend API routes only.

## What Works Now

- Read-only ResourceSpace metadata export search through `/api/assets/search`.
- Read-only asset detail through `/api/assets/:id`.
- Backend thumbnail route with explicit unavailable/failure states.
- Backend download gate checks with audit logging.
- Viewer download denial for unsafe/unapproved access.
- Portal pending-sync review events when ResourceSpace writeback is not configured.
- Disconnected fallback mode, visibly labeled as fixture fallback.

## What Is Read-Only

- ResourceSpace CSV/export records.
- Review queue decisions. Reviewer actions create portal pending-sync events and do not mutate ResourceSpace truth.
- Package builder. Drafts store ResourceSpace IDs in local UI state; publishing is blocked unless all visible refs are approved and share-link infrastructure is wired.

## What Does Not Work Yet

- Live ResourceSpace API reads.
- Live ResourceSpace review writeback.
- ResourceSpace collection endpoint reads for Brand Hub.
- Google Shared Drive ingest automation.
- S3 derivative generation and signed delivery.
- SSO-backed identity and group claims.
- Durable production audit/event analytics storage.

## Required Server-Only Env Vars

```txt
RESOURCESPACE_BASE_URL=
RESOURCESPACE_API_USER=
RESOURCESPACE_API_KEY=
RESOURCESPACE_FIELD_MAP_JSON=
RESOURCESPACE_DEFAULT_COLLECTION_ID=

S3_BUCKET=
S3_REGION=
S3_ACCESS_ROLE=
S3_PREVIEW_PREFIX=
S3_ORIGINAL_PREFIX=

GOOGLE_SHARED_DRIVE_ID=
GOOGLE_APPLICATION_CREDENTIALS=

SSO_PROVIDER=
SSO_CLIENT_ID=
PORTAL_USAGE_LOGGING=0
USAGE_ANALYTICS_DSN=

BRAND_KIT_EASTER_2024_COLLECTION_ID=
BRAND_KIT_LOGO_COLLECTION_ID=
BRAND_KIT_SOCIAL_TEMPLATES_COLLECTION_ID=
```

Legacy `RS_BASE_URL`, `RS_API_USER`, and `RS_API_KEY` are still accepted. Do not expose ResourceSpace, S3, or Drive secrets with `NEXT_PUBLIC_`.

## Field Map

`RESOURCESPACE_FIELD_MAP_JSON` should map portal field names to ResourceSpace field refs or export column names. Unknown ResourceSpace IDs should stay documented rather than hardcoded.

Minimum required mapping keys:

```json
{
  "title": "title",
  "approvalStatus": "publish_status",
  "usageRights": "usage_terms",
  "licenseType": "license_type",
  "territory": "territory",
  "modelRelease": "model_release",
  "propertyRelease": "property_release",
  "categories": "tjc_terms",
  "keywords": "visible_content_tags",
  "usageChannels": "usage_terms"
}
```

## Preview And Download Rules

- Preview UI must never substitute generated prototype imagery for missing real previews.
- Missing preview shows an explicit unavailable/failure/unsupported state.
- Approved-copy download must use backend gate first.
- Private originals, private S3 URLs, ResourceSpace secrets, and uncontrolled Drive links must not reach browser payloads.

## Brand Hub Mapping

Brand Hub editorial content can exist in the portal. Downloadable assets must come from ResourceSpace collection/source mappings.

Current route: `/api/brand-kits/easter-2024`

If `BRAND_KIT_EASTER_2024_COLLECTION_ID` is missing, the UI shows setup state and disables downloads. If it is configured but no export records match collection/source membership, the UI reports that mismatch instead of inventing files.

## Next Integration Work

1. Confirm ResourceSpace API signing and collection endpoints.
2. Replace export collection matching with live ResourceSpace collection reads.
3. Verify review status writeback on a staging ResourceSpace field.
4. Add S3 signed derivative delivery smoke test.
5. Wire SSO role claims to existing backend permission decisions.
