# Production Runbook

## Purpose

Move from a local prototype to a church-owned PC/NAS launch without copying hidden local state blindly.

## Launch Migration

Use:

```text
Fresh install + restore verified backup
```

Do not use:

```text
Copy local runtime directly
```

Why:

- Proves the local prototype machine is not required.
- Proves backup and restore work.
- Avoids carrying prototype passwords and local paths into launch.
- Creates a repeatable recovery path.

## Clean Host Setup

1. Install Docker and Docker Compose.
2. Clone repo.
3. Create production `.env` from `.env.production.example`.
4. Change all `change-me` values.
5. Start ResourceSpace with official Docker path.
6. Restore database, filestore, config, metadata exports, manifests, and run reports.
7. Run launch readiness checks.
8. Configure Cloudflare Tunnel and Cloudflare Access.
9. Verify ResourceSpace over HTTPS.
10. Turn off the local prototype machine and verify church host still works.

## Backup Must Include

```text
MariaDB database dump
ResourceSpace filestore volume
ResourceSpace config.php / config files
custom metadata field configuration
plugin configuration
docker-compose.yml
production .env template without secrets
metadata CSV exports
batch manifests
checksum manifests
run reports
Cloudflare tunnel setup notes
Google Vision/API setup notes
```

Local command:

```bash
make backup
make restore-test
```

Current backup outputs:

```text
database.sql
filestore-config.tgz
launch-artifacts.tgz
```

`launch-artifacts.tgz` includes docs, scripts, Docker Compose file, production env template without secrets, audits, manifests, run reports, and metadata exports.

Never commit:

```text
database passwords
Cloudflare tunnel token
Google API keys
ResourceSpace admin password
SMTP credentials
```

## Restore Acceptance

A backup is valid only if a clean host can be restored and:

- admin login works
- user login works
- sample approved asset is searchable
- sample approved asset downloads
- `Needs Review` asset is still not approved
- metadata fields exist
- collections exist
- filestore assets display
- backup timestamp and restore date are documented

## Operating Owners

| Responsibility | Owner |
|---|---|
| Host uptime, OS updates, Docker updates | Church IT/admin |
| ResourceSpace fields, groups, exports | DAM admin |
| Public/internal approval | Appointed ministry reviewers |
| Contributor support | DAM admin or trained media lead |
| Backup review and restore test | Church IT/admin plus one backup admin |
