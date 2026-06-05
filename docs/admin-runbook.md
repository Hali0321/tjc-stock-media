# Admin Runbook

## Local Mac Reference

Start ResourceSpace and frontend:

```bash
make up
make frontend-dev
```

ResourceSpace:

```text
http://localhost:8088
```

Frontend:

```text
http://localhost:3008
```

## Admin Boundary

Use ResourceSpace for:

- metadata field definitions
- user groups
- permissions
- workflow configuration
- plugins
- storage
- backup/restore
- bulk imports
- delete/purge
- API secrets

Use TJC Stock Media frontend for:

- searching approved media
- viewing safety/usage details
- contributor upload intake
- reviewer queue demo
- approved-copy download path

## Secrets

Never commit `.env`, `.runtime`, database files, filestore files, API keys, or media.
