# AGENTS.md

## Project Rules

- Treat Google Shared Drive as the master copy.
- Treat ResourceSpace as the DAM/search/review layer.
- Treat Approved Public/Internal folders as delivery outputs, not the complete archive.
- Do not commit church media files to GitHub.
- Do not delete, rename, move, or mutate source media.
- Exception: downloaded LM Photos ZIPs may be deleted only after that ZIP's album has been extracted, imported or duplicate-linked, audited, verified, and temporary extraction removed.
- Use manual batch import for MVP. Google Drive connector/sync is Phase 2.
- Every imported asset defaults to `Needs Review / Do Not Publish`.
- Exact duplicate resources may be linked by checksum, but preserve every source album membership and source path.
- AI may suggest tags, but humans approve rights.

## Local Commands

```bash
make up
make smoke
make import-audit
make backup
make restore-test
```

## Safety

Any public-use approval must include reviewer, review date, usage scope, and notes. Unknown people, children, sacrament, worship, sermon, music, or unclear contributor media stays `Needs Review` until a rights reviewer approves.
