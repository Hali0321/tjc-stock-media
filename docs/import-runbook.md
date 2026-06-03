# Import Runbook

## Current MVP 2024 Import

- Source: `/Users/halim4pro/Desktop/MVP/ResourceSpace/MVP 2024`
- ResourceSpace collection: `MVP 2024 - First Batch`
- Imported active resources: 181
- Stored binaries: 181
- Review state: 179 Pending Review, 2 active demo-approved samples
- Import audit: `.runtime/audits/resourcespace-import-audit-20260603-171816.csv`
- HEIC derivative audit: `.runtime/heic-derivatives/20260603-184347/resourcespace-heic-attach-audit.csv`
- Demo metadata: 77 resources seeded with visible/TJC tags
- Metadata export: `.runtime/exports/resourcespace-metadata-20260603-184435.csv`

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
make heic-derivatives
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

18 HEIC files imported. 2 generated previews natively. 16 produced HEIC codec warnings during preview generation and now have attached JPG derivative alternatives.

| Scenario | Action |
|---|---|
| Imports and previews work | Mark HEIC supported in local test. |
| Imports but preview fails | Keep original and attach derivative JPG to the same ResourceSpace asset. |
| Import fails | List in failed import report. |
| Conversion needed | Convert copied file only; never mutate original. |

MVP decision: keep original HEIC files as master assets. Use attached metadata-stripped JPG derivatives for preview and normal user downloads. Admins/designers can still access the original HEIC if Apple-format originals are needed.

Run:

```bash
make heic-derivatives
```

The workflow converts local source copies with macOS `sips`, strips derivative metadata with `jpegtran -copy none`, attaches JPG alternatives in ResourceSpace, records `derivative_status`, and leaves the primary HEIC file unchanged.

## Audit Fields

Record:

- source count by extension
- imported count by extension
- failed files
- preview success count
- preview failed count
- HEIC behavior notes
- derivative status and alternative file count

## Safety Rules

- Do not rename, move, or delete source files.
- Keep imported files in Pending Review until a human reviewer approves use.
- Do not treat preview success as rights approval.
- Keep failed preview formats in the audit trail.
- Demo approvals are prototype-only and are not final ministry/public release approvals.
