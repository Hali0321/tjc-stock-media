# TJC DAM Deployment Plan

Last updated: 2026-06-10

## Current Beta Recommendation

Use a private full Next.js host for teammate testing, such as Vercel Hobby or AWS Amplify. Do not use S3-only hosting for this beta because the app depends on Next API routes under `frontend/app/api`.

Required beta environment:

- `RESOURCESPACE_ENABLE_WRITEBACK=0`
- `RESOURCESPACE_WRITEBACK_MODE=queued`
- No server secrets exposed through `NEXT_PUBLIC_*`
- ResourceSpace read mode must be read-only, safe fallback, or explicitly approved live read.
- Upload route must state beta storage/persistence limits.

## Launch Architecture

```text
Users
  |
  v
CloudFront
  |-----------------------> S3 static frontend assets
  |
  +-- /api/* ------------> API Gateway, App Runner, Lambda, or ECS
                              |
                              +--> ResourceSpace API
                              +--> durable DB for pending review writes and analytics
                              +--> S3/CloudWatch audit logs
```

## Environment Split

- Local: developer machine, beta role switch enabled, demo/fallback data allowed.
- Staging: private URL, writeback disabled or queued, no public media.
- Production: SSO enforced, writeback only after adapter verification, durable stores enabled.

## Secrets

- Store ResourceSpace credentials in the backend runtime secret store.
- Never place ResourceSpace credentials, Drive keys, S3 write keys, or SSO signing secrets in `NEXT_PUBLIC_*`.
- Search built output before release for secret-looking strings.

## Durable State

Boring default:

- DynamoDB for pending review writes, package drafts, saved views, and simple usage events.
- S3 object logs for audit export snapshots.
- CloudWatch logs for backend API runtime diagnostics.
- RDS only if relational reporting becomes necessary.

## Static/API Boundary

- Either route `/api/*` through CloudFront to backend compute, or configure a public API base URL per environment.
- Keep download gates server-side.
- Keep server-only ResourceSpace code outside client bundles.
- Treat browser role switch as beta-only; production role comes from trusted identity claims.

## Rollback And Update

1. Keep staging and production as separate deployments.
2. Promote only after typecheck, build, frontend-check, API smoke, browser QA, and manual role safety checks pass.
3. Roll back by switching CloudFront origin/version or redeploying prior backend image.
4. Keep writeback disabled during rollback unless backend adapter state has been audited.

## Open Decisions

- Temporary beta host: Vercel vs AWS Amplify.
- Private access control: invite-only project, password gate, or Cloudflare Access.
- Production backend compute: App Runner, Lambda/API Gateway, or ECS.
- Durable database owner and retention policy.
