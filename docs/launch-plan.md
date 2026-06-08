# TJC Stock Media Launch Plan

## Verdict

Approved as the target launch architecture, but not launch-ready until the blockers in this document pass.

Launch means:

```text
4-6 weeks to launch full-archive-capable infrastructure,
with tiered archive import and partial human review.
```

Launch does not mean the entire archive is perfectly reviewed, tagged, approved, and cleaned.

## Architecture

```text
Users / Contributors
        |
        v
Controlled ResourceSpace intake
        |
        v
Needs Review / Do Not Publish
        |
        v
AI suggestions for images only, capped under $25/month
        |
        v
Human reviewer approval
        |
        +--> Approved Public
        +--> Approved Internal
        +--> Searchable Archive
        +--> Cold Archive / Do Not Use
        |
        v
Users search/download approved use copies in ResourceSpace

Google Shared Drive
        |
        v
Master originals / warehouse

ResourceSpace
        |
        v
DAM catalog + review + search + approved downloads

Approved folders
        |
        v
Curated copies/exports, not the only master archive
```

## Launch Target

- Controlled internal church PC/NAS deployment.
- Under 50 users.
- Cloudflare Tunnel with Cloudflare Access or Google Workspace allowlist.
- No open public login page.
- Google Shared Drive remains master warehouse for originals.
- ResourceSpace is the DAM/search/review/download layer.
- Church IT/admin owns the live system.
- Appointed ministry reviewers approve public/internal use.
- Prototype build owners prepare setup and handoff, but are not long-term production owners.

## Launch Blockers

Launch is blocked until all items pass:

1. Church PC/NAS fresh install works.
2. ResourceSpace restore from backup works on a clean host.
3. Cloudflare Access protects the site.
4. The local prototype machine can be turned off.
5. Backup job runs automatically.
6. Restore test is documented.
7. Contributor upload goes to `Needs Review / Do Not Publish`.
8. Viewer cannot access unapproved media.
9. Reviewer can approve with reviewer/date/notes.
10. Large video/audio upload path is tested outside Cloudflare browser upload limits.
11. AI cost kill switch is tested.
12. One-page user guide and 5-minute demo exist.

## Storage Requirement

```text
Minimum:
4 TB usable only if launch archive is mostly photos and video is limited/piloted.

Recommended:
8 TB usable for photo + video launch.

Backup:
Backup storage must be separate from the main NAS volume.
RAID is not a backup.
```

Sizing formula:

```text
Required usable storage =
ResourceSpace filestore
+ previews/derivatives
+ import staging
+ 20-30% free headroom
+ separate backup target
```

## Archive Tiers

Use tiers so launch does not depend on perfect review of every file:

| Tier | Meaning | User behavior |
|---|---|---|
| Tier 1: Approved Stock | Deeply reviewed, tagged, approved public/internal assets. | Normal users can search/download. |
| Tier 2: Searchable Archive | Lightly indexed assets, source-traceable, not fully approved. | Searchable to reviewers/admins; not publishable. |
| Tier 3: Cold Archive / Do Not Use | Duplicate, low-value, restricted, risky, or unreviewed assets. | Preserved or tracked, but not usable. |

## User Groups

| Group | Can upload | Can approve | Can download originals | Can download approved copies | Can edit taxonomy |
|---|---:|---:|---:|---:|---:|
| Viewer | No | No | No | Yes | No |
| Contributor | Yes | No | No | Own uploads only / approved copies | No |
| Reviewer | Yes | Yes | No by default | Yes | No |
| Designer/Admin | Yes | Maybe | Yes | Yes | No |
| DAM Admin | Yes | Yes | Yes | Yes | Yes |

Rule:

```text
Many people can upload.
Few people can approve.
Very few people can change fields, taxonomy, or system settings.
```

## Intake Policy

Default:

- Photos and normal-size media upload through ResourceSpace.
- Every upload defaults to `Needs Review / Do Not Publish`.

Exception:

- Large video/audio files use Shared Drive Incoming or local church network admin intake.
- DAM Owner/Admin imports/indexes large media into ResourceSpace.
- ResourceSpace records checksum, source path, master path, and review state.

Never:

- Random uploads directly into master folders.
- Equal upload paths that create split-brain state between Drive and ResourceSpace.

## Launch Data Model

Required for every asset:

```text
asset_id
batch_id
media_type
source_system
source_album_or_event
original_filename
master_drive_path
checksum_sha256
file_size
captured_date_if_available
upload_date
uploaded_by
publish_status
usage_scope
people_visible
minors_visible
```

Required for approved assets:

```text
title
visible_tags
TJC_terms
quality_status
rights_status
reviewed_by
reviewed_date
approval_notes
approved_use_copy_path
```

## AI V1

Allowed:

- Image label/tag suggestions.
- Optional OCR for graphics/documents after image labels prove useful.
- Cost log per batch.
- Monthly cap under `$25`.
- Kill switch before bulk runs.

Not allowed:

- AI approval.
- AI rights decisions.
- Face identity matching.
- Automatic public/internal publishing.
- AI overwrite of human-approved metadata.

## Launch Timeline

### Week 1 - Host And Repo Readiness

- Church PC/NAS selected.
- Storage checked.
- Docker installed.
- Official ResourceSpace Docker path tested.
- Production `.env` template created.
- Secrets excluded from repo.
- Backup target selected.

### Week 2 - Fresh Install And Restore

- Fresh install on church host.
- Restore DB/filestore/config from prototype backup.
- Admin login works.
- Sample assets display.
- Local prototype machine off test passes.

### Week 3 - Access And Permissions

- Cloudflare Tunnel configured.
- Cloudflare Access / Google Workspace allowlist configured.
- No open public login page.
- User groups configured.
- Viewer/contributor/reviewer/admin permissions tested.

### Week 4 - Workflow And Training

- Upload defaults to `Needs Review / Do Not Publish`.
- Reviewer approval works.
- Metadata fields configured.
- Featured collections created.
- One-page user guide done.
- Five-minute demo recorded or rehearsed.

### Week 5 - Archive Import And Video/Audio Pilot

- Photo import batch.
- Checksum manifest.
- Google Shared Drive master path recorded.
- 1-2 MP4 video pilot.
- 1-2 audio pilot only if rights clear.
- AI tagging pilot.
- AI cost log.

### Week 6 - Go/No-Go

- Restore test repeated.
- 10 search tasks pass.
- Large upload policy tested.
- Backup run confirmed.
- Training delivered.
- Church admin handoff completed.
- Launch report written.

## Go/No-Go Checklist

Infrastructure:

- [ ] Church PC/NAS runs without the local prototype machine.
- [ ] Docker services auto-start after reboot.
- [ ] Storage has enough free headroom.
- [ ] Backup target is separate from main storage.
- [ ] UPS or shutdown plan exists.

Security:

- [ ] HTTPS works.
- [ ] Cloudflare Access required.
- [ ] No open public login page.
- [ ] Admin passwords changed.
- [ ] API keys/secrets not in GitHub.
- [ ] Reviewer/admin users are separate from normal users.

ResourceSpace:

- [ ] Official Docker path used.
- [ ] Metadata fields configured.
- [ ] User groups configured.
- [ ] Upload defaults to `Needs Review / Do Not Publish`.
- [ ] Viewer sees approved assets only.
- [ ] Contributor can upload but not approve.
- [ ] Reviewer can approve with reviewer/date/notes.

Storage:

- [ ] Google Shared Drive master path recorded.
- [ ] Checksum generated.
- [ ] Approved copies are curated outputs.
- [ ] Originals are not randomly renamed or moved.

Backup:

- [ ] DB backup works.
- [ ] Filestore backup works.
- [ ] Config backup works.
- [ ] Metadata export works.
- [ ] Clean-host restore test passes.

Media:

- [ ] Photos import correctly.
- [ ] HEIC policy documented.
- [ ] Video pilot passes.
- [ ] Audio rights policy documented.
- [ ] Large upload path tested.

AI:

- [ ] AI suggestions only.
- [ ] No AI approval.
- [ ] Cost log works.
- [ ] Kill switch works.
- [ ] Monthly cap under `$25`.

Training:

- [ ] One-page user guide done.
- [ ] Five-minute demo done.
- [ ] Reviewer guide done.
- [ ] Admin runbook done.
