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

Backend routes expose a Media source session envelope so every portal surface reports source truth the same way:

```json
{
  "source": "...role-safe source status...",
  "sourceStatus": "...same status for older callers...",
  "sourceKind": "resourcespace | fallback-fixtures | media-library",
  "live": true
}
```

Reviewer/Admin responses may show operational ResourceSpace/export details. Viewer/Contributor responses receive role-safe media-library copy where operational source truth would leak custody or setup details.

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

- Live ResourceSpace API reads require server-only credentials. The portal has a signed API adapter and falls back to export mode when credentials or endpoints fail.
- Live ResourceSpace review writeback is gated by `RESOURCESPACE_ENABLE_WRITEBACK=1`, `RESOURCESPACE_WRITEBACK_MODE=live`, a valid field map, and a ResourceSpace API smoke check. Otherwise decisions remain pending-sync.
- ResourceSpace collection endpoint reads for Brand Hub are backend-gated and report setup/error states when collection IDs or credentials are missing.
- Google Shared Drive ingest automation.
- S3 derivative generation and signed delivery.
- SSO-backed identity and group claims. A trusted-header shim is available, but production IdP headers still need verification.
- Durable external audit/event analytics storage. Local SQLite usage analytics is available when `PORTAL_USAGE_LOGGING=1`; external analytics remains pending.

## Required Server-Only Env Vars

```txt
RESOURCESPACE_BASE_URL=
RESOURCESPACE_API_USER=
RESOURCESPACE_API_KEY=
RESOURCESPACE_FIELD_MAP_JSON=
RESOURCESPACE_DEFAULT_COLLECTION_ID=
RESOURCESPACE_ENABLE_WRITEBACK=0
RESOURCESPACE_WRITEBACK_MODE=queued

S3_BUCKET=
S3_REGION=
S3_ACCESS_ROLE=
S3_PREVIEW_PREFIX=
S3_ORIGINAL_PREFIX=

GOOGLE_SHARED_DRIVE_ID=
GOOGLE_APPLICATION_CREDENTIALS=

SSO_PROVIDER=
SSO_CLIENT_ID=
SSO_TRUSTED_HEADERS=0
SSO_ROLE_MAP_JSON=
PORTAL_USAGE_LOGGING=0
USAGE_ANALYTICS_DSN=
USAGE_ANALYTICS_DB_PATH=

BRAND_KIT_MVP_2024_COLLECTION_ID=
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

Current route: `/api/brand-kits/mvp-2024`
Current registry: `frontend/lib/brand-kits.ts`

If `BRAND_KIT_MVP_2024_COLLECTION_ID` is missing, the UI shows setup state and disables downloads. If it is configured but no export records match collection/source membership, the UI reports that mismatch instead of inventing files.

When ResourceSpace API credentials are configured, Brand Hub uses the ResourceSpace collection endpoint through backend routes and resolves collection resource IDs against ResourceSpace metadata records. If the collection endpoint fails, responses include `collectionStatus` and keep downloads blocked or clearly setup-gated instead of showing fake kit files.

## Writeback Guard

Reviewer decisions create a local pending write record first. Live ResourceSpace updates happen only when all are true:

- `RESOURCESPACE_ENABLE_WRITEBACK=1`
- `RESOURCESPACE_WRITEBACK_MODE=live`
- ResourceSpace API credentials are configured
- the field map contains approval, reviewer, review date, and notes fields
- ResourceSpace API smoke succeeds

If any condition fails, the pending write stays queued or sync-failed and the UI/API must not claim ResourceSpace was updated.

## SSO-Ready Shim

Production SSO is deferred, but the backend can map trusted headers to portal roles when `SSO_TRUSTED_HEADERS=1` or `SSO_PROVIDER=cloudflare-access`. Supported inputs include Cloudflare Access style email headers, generic auth request group headers, and optional `SSO_ROLE_MAP_JSON`. Local query/form roles remain beta fallback only.

## Durable Analytics

When `PORTAL_USAGE_LOGGING=1`, the portal records search, asset view, download gate, review action, and Brand Hub view events into local SQLite at `.runtime/analytics/portal-usage.sqlite` or `USAGE_ANALYTICS_DB_PATH`. Insights can replace sample search/asset rows when real event rows exist.

## Next Integration Work

1. Confirm ResourceSpace API signing and collection endpoints.
2. Replace export collection matching with live ResourceSpace collection reads.
3. Verify review status writeback on a staging ResourceSpace field.
4. Add S3 signed derivative delivery smoke test.
5. Wire SSO role claims to existing backend permission decisions.
