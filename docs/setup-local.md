# Local ResourceSpace Setup

## Goal

Run ResourceSpace locally so TJC can prove the DAM workflow with real copied media before production hosting.

## Setup

```bash
cp .env.example .env
make up
make smoke
```

Open:

`http://localhost:8088`

Current local prototype login:

- URL: `http://localhost:8088`
- Credentials file: `.runtime/local-admin-credentials.txt` (ignored by Git)

If you rebuild from scratch and see the browser setup page:

- Database host: `mariadb`
- Database name: value of `MYSQL_DATABASE`
- Database user: value of `MYSQL_USER`
- Database password: value of `MYSQL_PASSWORD`

## Runtime Files

All local runtime files live under `.runtime/` and are ignored by Git.

- `.runtime/resourcespace-docker`: official ResourceSpace Docker repo
- `.runtime/filestore`: ResourceSpace asset filestore
- `.runtime/mariadb`: MariaDB data
- `.runtime/resourcespace-config.php`: ResourceSpace config
- `.runtime/audits`: source manifests and import audits
- `.runtime/backups`: local backups
- `.runtime/exports`: metadata exports

## Production Boundary

This setup is local only. It does not prove:

- 24/7 uptime
- remote user access
- production security
- production backups
- Google Drive sync

Those belong to Phase 2 after workflow proof.

For the controlled internal launch path, use `docs/launch-plan.md` and `docs/production-runbook.md`. The launch machine should be a fresh church PC/NAS install restored from a verified backup, not a direct copy of any developer's local `.runtime` folder.
