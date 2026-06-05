# Video And Audio Launch Policy

## Launch Scope

Photos are launch-ready first. Videos and audio are included in the launch architecture, but each has its own gate before broad import.

## Video Gate

Before importing a full video batch, test 1-2 MP4 files.

Required checks:

- source manifest created
- SHA-256 checksum generated
- master path recorded
- ResourceSpace import or index record created
- preview/playback behavior checked
- download behavior checked
- file size and storage impact recorded
- Cloudflare browser upload path tested for small video only
- large-media admin intake path tested for large video
- reviewer can approve or keep `Needs Review`

Current Samuel Kuo source:

- Path: `/Users/halim4pro/Desktop/MVP/Stock Media/01_Source Exports/Videos/Incoming/Samuel Kuo/Samuel Kuo`
- Files: 11 MP4 and 7 JPG
- Size: about 9.9 GiB extracted
- Status: create manifest first; do not bulk-import until 1-2 MP4 pilot passes.

## Audio Gate

Only import church-owned usable audio when source and rights are clear.

Audio metadata must include:

```text
audio_source_owner
audio_rights_status
contains_copyrighted_music
usage_scope
approved_by
approval_notes
```

Until rights are clear:

```text
publish_status = Needs Review
usage_scope = Do Not Publish
```

## Approval Rule

Video/audio preview success is not rights approval. Music, hymns, sermons, worship, backing tracks, or third-party recordings stay under reviewer control.

