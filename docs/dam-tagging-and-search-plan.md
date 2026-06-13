# DAM Tagging And Search Plan

## Scope

This is a tagging/search scaffold on top of current DAM read models, not a rebuild. ResourceSpace stays source of truth, Google Shared Drive stays master media custody, and portal search consumes role-safe asset records.

## Tag Types

| Type | Fields | Rule |
|---|---|---|
| AI suggested | `ai_title_suggestion`, `ai_visible_tag_suggestions`, `ai_tjc_term_suggestions` | Searchable hints only. AI never finalizes rights, consent, minors, doctrine, or approval. |
| Human approved | `human_title_final`, `human_tags_final`, `visible_content_tags`, `TJC_terms` | Reviewer-owned final discovery vocabulary. |
| Source/import | `source_account`, `source_album`, `source_album_memberships`, `import_batch` | Preserved provenance and album context. Do not mutate source media. |
| Controlled taxonomy | `visible_content_tags`, `TJC_terms`, `usage_terms`, alias groups | Store canonical labels; expand synonyms in search. |
| Freeform/review context | `approval_notes`, `sensitive_context`, `rights_notes` | Useful for review, but not broad approval automation. |

## Searchable Fields

Search now indexes title, collection, status, usage scope, media type, people risk, event dates, source platform/system/account/album, ResourceSpace ID, original filename, final tags, TJC terms, usage terms, and AI suggestion fields.

Current categories covered by `frontend/lib/tagging-model.ts`:

- asset type
- ministry
- event type
- location/church via source album, event, and collection fields
- subject
- visual content
- color/mood/style
- season/context
- language
- source account
- source album
- approval/reuse tier
- rights/use channel
- TJC terms

## Aliases

Alias source of truth stays in `frontend/lib/taxonomy.ts`. Added deterministic coverage:

- `RE` -> `Religious Education`
- `Sabbath` -> `Sabbath Service`
- `Evangelical` -> `Evangelical Service`
- `testimony` -> `Testimony`
- `hymn` -> `Hymns of Praise`

Search expands aliases at query time. Asset metadata should keep canonical terms instead of spelling variants.

## AI Lifecycle

1. AI writes only suggestion fields.
2. Reviewers accept, edit, or reject suggestions.
3. Human-approved tags land in final tag fields.
4. Sensitive governance remains reviewer-owned: doctrine, rights, minors, people visibility, consent, usage scope, and public/internal approval.

## Trusted Source Behavior

`lm.photos@tjc.org` import/beta fixtures are trusted by default and may be public-approved/stock-safe unless explicit fixture/test data says otherwise. This trust sets sensible defaults for discovery and reuse tier labels; it does not bypass reviewer evidence for minors, consent, doctrine, music rights, or sensitive contexts.

## Fixture Distribution

Fallback fixtures intentionally contain 4 records:

- 2 public-approved / stock-safe = 50%
- 1 needs-review / context-safe = 25%
- 1 restricted archive-only-like = 25%

This gives search, filters, and reviewer flows realistic safety coverage without adding media files.

## Limitations

- No semantic embeddings yet.
- No live ResourceSpace writeback for AI tags.
- No automatic approval from AI suggestions.
- Location/church coverage depends on source album/event metadata until a dedicated church/location field is mapped.
- UI already shows tag chips in Library cards; broad UI redesign is deferred to avoid conflict with parallel UI work.

## Future ResourceSpace Mapping

Map these fields when ResourceSpace field refs are stable:

- `visible_content_tags` -> keyword field
- `TJC_terms` -> controlled TJC vocabulary field
- `ai_visible_tag_suggestions` and `ai_tjc_term_suggestions` -> suggestion/review fields
- `source_album` and `source_album_memberships` -> provenance fields
- `reuse_tier`, `approved_channels`, `rights_basis`, and `required_notice` -> controlled rights/reuse fields
