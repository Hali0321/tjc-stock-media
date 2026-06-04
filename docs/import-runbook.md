# Import Runbook

## Current MVP 2024 Import

- Source: `/Users/halim4pro/Desktop/MVP/ResourceSpace/MVP 2024`
- ResourceSpace collection: `MVP 2024 - First Batch`
- Imported active resources: 181
- Stored binaries: 181
- Review state: 181 approved and published for MVP 2024 prototype batch after reviewer signoff
- Import audit: `.runtime/audits/resourcespace-import-audit-20260603-171816.csv`
- Approval audit: `.runtime/audits/approval-audit-20260604-165722.csv`
- UI polish audit: `.runtime/audits/ui-polish-audit-20260604-171229.csv`
- HEIC derivative audit: `.runtime/heic-derivatives/20260603-184347/resourcespace-heic-attach-audit.csv`
- Demo metadata: 77 resources seeded with visible/TJC tags
- Metadata export: `.runtime/exports/resourcespace-metadata-20260604-171242.csv`

## Commands

Generate a source manifest before import:

```bash
make import-audit
```

Import the first batch:

```bash
make import-mvp-batch
```

Approve the reviewed MVP 2024 batch:

```bash
make approve-mvp-batch
```

Feature the MVP collection and promote HEIC JPG previews to the front:

```bash
make polish-mvp-ui
```

Verify local runtime:

```bash
make smoke
make heic-derivatives
make backup
make restore-test
```

## LM Photos Completion Run

Inventory the remaining Google Photos album ZIPs:

```bash
make lm-photos-zip-inventory
```

Preview the one-ZIP-at-a-time order without extracting/importing:

```bash
DRY_RUN=1 make lm-photos-stream-run
```

Run the streaming import only after confirming enough free space and ResourceSpace health:

```bash
make smoke
DRY_RUN=0 DELETE_VERIFIED_ZIPS=1 PROCESS_LIMIT=1 make lm-photos-stream-run
```

When disk is tight, use manifest-only staging. This still records planned Shared Drive master paths in the manifest and ResourceSpace metadata, but does not keep a second local file copy:

```bash
STAGE_MODE=manifest-only DRY_RUN=0 DELETE_VERIFIED_ZIPS=1 PROCESS_LIMIT=1 make lm-photos-stream-run
```

Safety gates:

- Process one ZIP album at a time.
- Keep original filenames.
- Create a source manifest and Shared Drive-style staging path before import.
- Link exact duplicates by checksum instead of importing duplicate binaries.
- Preserve every duplicate album membership and source path.
- Delete a ZIP only after source count equals audit count for that album.
- Keep `Open Album` last because it is largest.
- Do not edit Google Photos source.

Generate a decision-ready run report:

```bash
make lm-photos-run-report
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
- Keep newly imported files in Pending Review until a human reviewer approves use.
- Treat `01_Photos` staging as master originals. Treat `04_Approved_Public` and `05_Approved_Internal` as curated delivery outputs only.
- After reviewer signoff for a batch, run `make approve-mvp-batch` to update approval metadata, publish resources, and write an approval audit CSV.
- Do not treat preview success as rights approval.
- Keep failed preview formats in the audit trail.
- MVP 2024 first batch was approved by Hali for public/internal prototype use on 2026-06-04. Future batches still require reviewer signoff before approval.
