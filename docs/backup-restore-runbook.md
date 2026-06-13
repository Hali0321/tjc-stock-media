# Backup Restore Runbook

## Local Commands

Create backup:

```bash
make backup
```

Test restore:

```bash
make restore-test
```

## Rule

A backup only counts after restore has been tested on a clean target.

## Production Requirement

Before church launch:

- backup target must be separate from primary storage
- restore test must pass on church PC/NAS
- backup schedule must be owned by church IT/admin
- local prototype machine must be optional, not production dependency
