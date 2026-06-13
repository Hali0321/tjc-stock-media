# AI Tagging Policy

## Decision

AI v1 is image-suggestion only, capped under `$25/month`.

AI helps humans tag assets faster. It does not approve rights, decide public safety, identify people, or publish assets.

AI uses the canonical asset metadata catalog described in
`docs/data-engineering-playbook.md`. AI outputs are derived sidecar suggestions,
not ResourceSpace truth until a human accepts or edits them through the review
workflow.

## Allowed In V1

- Label/tag suggestions for images.
- Optional OCR for graphics/documents after label suggestions prove useful.
- Batch cost logging.
- Manual review of AI suggestions.
- Kill switch before any bulk run.

## Internal Beta Rule

AI is off for internal beta unless a named beta owner explicitly enables a
bounded suggestion run. Internal beta must stay useful without AI.

Before any beta AI run:

- `AI_ENABLED=1` is set only for that run.
- A run owner, monthly remaining budget, prompt version, and asset set are named.
- The run uses role-safe previews or approved analysis copies, not source masters.
- Output lands only in `ai_*` suggestion fields or a sidecar review packet.
- Human review must accept, edit, or reject suggestions before final metadata
  changes.
- Any asset with people, possible minors, sacred context, music, sermon,
  testimony, third-party artwork, or unclear contributor consent stays
  `Needs Review / Do Not Publish`.

## Not Allowed In V1

- Automatic public/internal approval.
- Rights decisions.
- Face identity matching.
- Final minors/people status.
- Replacing human-approved titles, tags, usage scope, or review notes.
- Inferring consent, release status, copyright ownership, doctrine meaning, or
  sacred-context suitability from image content.
- Promoting AI-suggested labels into `Approved Public`, `Approved Internal`,
  `public_safe`, `usage_scope`, `rights_status`, reviewer, review date, or
  approval notes.

## High-Risk Suggestion Map

| Risk | Failure mode | Required beta response |
|---|---|---|
| Hallucinated tags | AI adds ministry or object labels not visible or not supported by source context. | Reviewer verifies against preview/source context; final tags stay blank or edited until confirmed. |
| People/minors | AI misses faces, youth, crowd details, or wrongly says no people. | Treat AI people/minor output as a risk hint only; reviewer confirms `people_visible`, `minors_visible`, consent, and usage scope. |
| Sacred contexts | AI flattens baptism, communion, footwashing, prayer, worship, testimony, or counseling into generic tags. | Keep sacred/ministry contexts in review until a TJC reviewer confirms context and appropriate use. |
| Copyrighted content | AI misses hymns, sermon/audio rights, third-party graphics, lyrics, brands, or embedded screens. | Route to rights review; do not approve public/internal use from AI labels. |
| Contributor consent | AI cannot know photographer, uploader, subject consent, license, withdrawal, or release limits. | Require source/contributor proof and reviewer notes before reuse. |

## Fields

AI writes suggestions only:

```text
ai_provider
ai_model
ai_prompt_version
ai_run_id
ai_cost_estimate
ai_title_suggestion
ai_visible_tag_suggestions
ai_tjc_term_suggestions
ai_quality_suggestion
ai_people_or_minor_flag
human_ai_decision
```

Humans write final fields:

```text
human_title_final
human_tags_final
TJC_terms
quality_status
rights_status
publish_status
usage_scope
reviewed_by
reviewed_date
approval_notes
```

## Cost Guardrails

- Default cap: `$25/month`.
- Do not run bulk AI jobs without `AI_ENABLED=1`.
- Log each batch's estimated or actual cost.
- Stop the batch if monthly cap would be exceeded.
- Prefer one feature first, such as label detection, because each feature can be billed separately.

## Future Search

If semantic search becomes useful, add an embedding index as a sidecar keyed by
`canonical_asset_id`. Store model name, prompt/input version, and `indexed_at`.
Do not use embeddings as the source of truth for rights, approval, people/minors,
or final taxonomy.
