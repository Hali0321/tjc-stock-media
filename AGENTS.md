# AGENTS.md

## Project Rules

- Treat Google Shared Drive as the master copy.
- Treat ResourceSpace as the DAM/search/review layer.
- Do not commit church media files to GitHub.
- Do not delete, rename, move, or mutate source media.
- Use manual batch import for MVP. Google Drive connector/sync is Phase 2.
- Every imported asset defaults to `Needs Review / Do Not Publish`.
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

