# Oracle Always Free ResourceSpace Runbook

Status: pending user Oracle account/login/free-capacity step.

Goal: host one private ResourceSpace backend for TJC DAM admins only, using free-tier infrastructure only. This is not public launch and not full archive migration.

## Free-Only Guardrails

Stop before continuing if Oracle asks for:

- credit card verification the user has not approved
- paid upgrade
- non-Always Free compute
- paid database
- paid object storage
- region/home-region decision
- DNS/domain decision
- secret/password entry

Do not create paid resources. Do not attach billable cloud storage. Do not migrate the full archive.

## Target Shape

| Area | Decision |
|---|---|
| Cloud | Oracle Cloud Always Free |
| Compute | One Always Free Ubuntu VM |
| Preferred VM | Ampere A1 if available |
| Size | Up to Always Free allowance; prefer 2 OCPU / 12 GB RAM only if marked Always Free |
| Database | Local MariaDB/MySQL on same VM |
| Storage | Boot/block volume within Always Free limit |
| Web | Nginx or Apache |
| App | Official ResourceSpace install |
| Access | DAM admins only |
| Normal teammates | Portal only, no direct ResourceSpace login |
| Media batch | 50-200 approved beta sample records/previews |
| Originals | Stay in Google Shared Drive master archive |

## Account Setup Stop Point

User must provide or complete:

1. Oracle Cloud login using dedicated TJC/beta account.
2. Home region selection.
3. Confirmation Always Free VM capacity exists.
4. SSH public key or approval to generate a new keypair for this beta VM.
5. Optional domain/subdomain decision if Cloudflare Tunnel/Access will be used.

If Oracle requires card verification or any paid upgrade, stop.

## VM Creation Checklist

In Oracle Console:

1. Create one compute instance.
2. Choose Ubuntu LTS image.
3. Choose shape marked Always Free.
4. Prefer Ampere A1 if available.
5. Keep boot volume within Always Free limit.
6. Add SSH public key.
7. Do not add paid block volumes.
8. Do not create managed paid database.
9. Open only required ingress:
   - `22/tcp` for SSH, ideally restricted to admin IPs.
   - `80/tcp` and `443/tcp` only if direct web access is needed.
10. Prefer Cloudflare Tunnel/Access later so ResourceSpace admin is not broadly exposed.

## Server Install Outline

Run after SSH access exists:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y nginx mariadb-server php-fpm php-cli php-mysql php-curl php-gd php-intl php-mbstring php-xml php-zip php-apcu imagemagick ffmpeg ghostscript exiftool unzip git cron
```

Add optional packages only if ResourceSpace install checks require them:

```bash
sudo apt install -y php-ldap php-imap inkscape
```

Secure MariaDB:

```bash
sudo mysql_secure_installation
```

Create ResourceSpace database and app user with a generated password. Store credentials only on the server and in a private password manager, never in Git.

## ResourceSpace Install

Use official ResourceSpace install instructions for the current version. General sequence:

1. Download official ResourceSpace release.
2. Place app under web root, for example `/var/www/resourcespace`.
3. Configure Nginx/PHP-FPM.
4. Create local filestore outside public web root.
5. Complete web installer.
6. Remove or lock installer if official docs require it.
7. Create named DAM admin users.
8. Remove or disable default admin password.
9. Disable anonymous/public access unless explicitly required for admin testing.
10. Configure preview generation tools.
11. Configure cron.

## ResourceSpace Groups

Use minimal access:

| Group | Direct ResourceSpace Login |
|---|---:|
| DAM Admin | Yes, 2-3 people max |
| Reviewer | Optional later, default no |
| Contributor/Submitter | Optional later, default no |
| Viewer/Internal | No; use Vercel portal |

## Beta Metadata Fields

Minimum fields:

- title
- description
- ministry/event/category
- date
- location
- usage scope
- rights status
- release status
- approval state
- source/archive pointer
- preview available
- original protected flag
- ResourceSpace ID
- portal-safe reference ID

## Beta Import Rules

- Import only 50-200 approved sample records/previews.
- Do not import full 8GB+ archive.
- Do not import sensitive production originals.
- Do not create public collections.
- Every imported asset defaults to `Needs Review / Do Not Publish` unless a human reviewer has recorded approval evidence.

## Portal Integration Boundary

Allowed from ResourceSpace/export into portal:

- approved preview URL or local fixture preview
- title
- description
- safe metadata
- rights status
- usage scope
- approval status
- ResourceSpace reference ID
- derivative availability

Never expose to Viewer or Contributor:

- ResourceSpace admin URL
- source path
- original file path
- original URL
- internal server path
- writeback endpoint
- private token
- storage bucket path
- Google Drive original link
- copied original reference

If live API integration is not ready, keep export/snapshot integration and label it:

```txt
ResourceSpace export / approved metadata snapshot
```

## Cloudflare Free Optional

Preferred if user has domain/account access:

1. Use Cloudflare Tunnel or Access on free plan.
2. Restrict ResourceSpace admin to DAM admin emails.
3. Keep normal teammates on the Vercel portal only.
4. Do not enable paid Cloudflare features.

If Cloudflare/domain is unavailable:

- Keep direct IP temporary.
- Use strong admin passwords.
- Restrict firewall where possible.
- Document Cloudflare protection as pending.

## Backup Minimum

For beta, document:

- daily database dump command
- filestore backup path
- restore rehearsal command
- admin owner
- retention period

Do not rely on backup until one restore test has succeeded.

## Definition Of Done For ResourceSpace

ResourceSpace backend is done only when:

- one Always Free VM exists without paid resources
- web app loads privately
- HTTPS or Cloudflare protection is configured or pending with direct-IP risk documented
- named DAM admin users exist
- default admin password is gone
- anonymous/public access is disabled
- local MariaDB works
- preview generation works
- cron is configured
- small beta batch exists or import path is documented
- no full archive migration happened
- no secrets are committed
- Vercel portal still hides ResourceSpace/source/original internals from Viewer and Contributor

Current blocker: user must log into Oracle and confirm Always Free VM capacity/region before any cloud resources can be created.
