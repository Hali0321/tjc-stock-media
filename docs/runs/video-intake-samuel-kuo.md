# Samuel Kuo Video Intake

## Status

Extracted locally for inspection. The ZIP and extracted folder currently both exist, so do not duplicate more video data. This batch has not been imported into ResourceSpace.

## Source

- ZIP: `/Users/halim4pro/Desktop/MVP/Stock Media/01_Source Exports/Videos/Incoming/Samuel Kuo/Samuel Kuo-3-001.zip`
- Extracted folder: `/Users/halim4pro/Desktop/MVP/Stock Media/01_Source Exports/Videos/Incoming/Samuel Kuo/Samuel Kuo`
- Root folder inside ZIP: `Samuel Kuo`
- ZIP size: 10,626,352,881 bytes, about 9.9 GiB
- Uncompressed size: 10,624,852,997 bytes, about 9.9 GiB
- Entries: 18 files
- Media mix: 11 MP4, 7 JPG

## Largest Video Files

| File | Size |
|---|---:|
| `Samuel Kuo/SanPedro.mp4` | 1.73 GB |
| `Samuel Kuo/dji_fly_20220926_065750_218_1664193340333_video_d_cinelike.mp4` | 1.62 GB |
| `Samuel Kuo/indonesiarawcut.mp4` | 1.49 GB |
| `Samuel Kuo/DJI_0094.MP4` | 1.17 GB |
| `Samuel Kuo/brooklynbroll.mp4` | 951 MB |

## Next Step

Create a video manifest first:

```bash
make video-manifest
```

Then test one or two MP4 imports into ResourceSpace to confirm preview generation, playback, file size behavior, and metadata fields before importing everything.

Do not delete the ZIP until the manifest/checksum audit is verified. Do not bulk-import this full batch until the video pilot passes.
