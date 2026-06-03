# Import Runbook

## Current MVP 2024 Import

- Source: `/Users/halim4pro/Desktop/MVP/ResourceSpace/MVP 2024`
- ResourceSpace collection: `MVP 2024 - First Batch`
- Imported active resources: 181
- Stored binaries: 181
- Review state: 179 Pending Review, 2 active demo-approved samples
- Import audit: `.runtime/audits/resourcespace-import-audit-20260603-171816.csv`
- Demo metadata: 77 resources seeded with visible/TJC tags
- Metadata export: `.runtime/exports/resourcespace-metadata-20260603-172736.csv`

## Commands

Generate a source manifest before import:

```bash
make import-audit
```

Import the first batch:

```bash
make import-mvp-batch
```

Verify local runtime:

```bash
make smoke
make backup
make restore-test
```

## Import Rules

- Use manageable batches.
- Do not use multiple upload tabs for the same batch.
- Apply default metadata immediately.
- Keep source files untouched.
- Record failed files and preview warnings.

## HEIC Handling

18 HEIC files imported. 2 generated previews. 16 produced HEIC codec warnings during preview generation.

| Scenario | Action |
|---|---|
| Imports and previews work | Mark HEIC supported in local test. |
| Imports but preview fails | Keep original and create derivative JPG copy only. |
| Import fails | List in failed import report. |
| Conversion needed | Convert copied file only; never mutate original. |

MVP decision: keep original HEIC files, but create derivative JPG copies for preview/use if the asset is selected for the demo or approved library.

## Audit Fields

Record:

- source count by extension
- imported count by extension
- failed files
- preview success count
- preview failed count
- HEIC behavior notes

## Safety Rules

- Do not rename, move, or delete source files.
- Keep imported files in Pending Review until a human reviewer approves use.
- Do not treat preview success as rights approval.
- Keep failed preview formats in the audit trail.
- Demo approvals are prototype-only and are not final ministry/public release approvals.
