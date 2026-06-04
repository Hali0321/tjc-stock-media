# ADR 0003: AI Suggestions With Cost Cap

## Status

Accepted.

## Context

Manual tagging thousands of photos is slow. AI can help with titles, visible tags, people/minor flags, and quality suggestions, but it can also be wrong and can incur cost.

## Decision

Use AI only for suggestions. AI must not directly write final title, tag, rights, people/minor, or approval fields.

For the LM Photos completion run:

- Use deterministic album/filename/EXIF rules for bulk metadata.
- Use paid AI only for representative samples or unclear images.
- Hard cap paid AI cost at `$5`.
- Stop before spending beyond the cap.
- Record provider, model, prompt version, run ID, estimated cost, and suggestion notes.

## Consequences

- Tagging can scale without giving AI rights authority.
- Cost remains bounded.
- Human/rule workflow remains accountable for final metadata and approval.
