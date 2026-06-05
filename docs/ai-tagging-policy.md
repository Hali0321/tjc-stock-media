# AI Tagging Policy

## Decision

AI v1 is image-suggestion only, capped under `$25/month`.

AI helps humans tag assets faster. It does not approve rights, decide public safety, identify people, or publish assets.

## Allowed In V1

- Label/tag suggestions for images.
- Optional OCR for graphics/documents after label suggestions prove useful.
- Batch cost logging.
- Manual review of AI suggestions.
- Kill switch before any bulk run.

## Not Allowed In V1

- Automatic public/internal approval.
- Rights decisions.
- Face identity matching.
- Final minors/people status.
- Replacing human-approved titles, tags, usage scope, or review notes.

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

