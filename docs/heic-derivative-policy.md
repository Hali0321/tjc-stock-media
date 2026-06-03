# HEIC Derivative Policy

## Decision

Preserve HEIC originals as master files. When ResourceSpace cannot preview a HEIC, attach a metadata-stripped JPG derivative to the same ResourceSpace asset.

## User Behavior

- Normal users use/download the metadata-stripped JPG derivative for common communications work.
- Admins/designers can download the original HEIC when Apple-format originals are needed.
- Nobody should manually create separate unmanaged duplicate assets for the JPG.

## Why

HEIC is efficient and may preserve Apple photo behavior, but web/DAM preview support can be inconsistent. JPG derivatives keep the library usable without losing the original source file. Stripping metadata from the JPG derivative reduces accidental location/device metadata exposure for normal downloads.

## Implementation

Run:

```bash
make heic-derivatives
```

The script:

- finds imported HEIC resources with failed native previews
- converts local source copies to JPG using macOS `sips`
- strips derivative metadata using `jpegtran -copy none`
- attaches each JPG as a ResourceSpace alternative file
- records `derivative_status`
- leaves the primary HEIC resource untouched

Current MVP 2024 result: 16 attached JPG derivatives, 0 attach failures.
