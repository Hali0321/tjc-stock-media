# DAM 10/10 CEO / PM / CTO Audit

Date: 2026-06-11
Scope: TJC Stock Media teammate-test and enterprise-DAM readiness

## Executive Call

TJC Stock Media is already past generic MVP shape. It has a real product thesis, role model, source-of-truth policy, route guards, beta smokes, and ResourceSpace/Shared Drive custody story.

The 10/10 gap is not "more screens." The gap is confidence orchestration: every role should immediately see what is safe, what is blocked, what proof exists, and what the next operating move is.

## 10/10 Definition

- Viewer finds a rights-safe media asset in under 60 seconds and understands use scope without asking staff.
- Contributor can submit safe intake without accidentally publishing, exposing sensitive media, or thinking uploads are approved.
- Reviewer sees a workbench that turns uncertain media into evidence-backed decisions.
- DAM Admin sees one launch cockpit with proof, blockers, audit, and next action.
- Every download, preview, package, saved view, and brand kit obeys portal reuse policy.
- Product copy never claims ResourceSpace writeback, S3 delivery, SSO, or public approval before proof exists.
- Browser QA covers desktop/mobile and role paths before teammate invite.

## What Is Strong

- Product intent is explicit in `PRODUCT.md` and `DESIGN.md`.
- Source-of-truth rules are clear: ResourceSpace metadata, Google Shared Drive masters, portal policy overlay.
- Server-side role seams exist through `requestIdentity`, `permissions`, `portal-reuse-decision`, and API routes.
- Viewer redaction is centralized through `source-redaction` and role-safe route sessions.
- Safety smokes cover blocked downloads, SSO headers, usage analytics, delivery privacy, package governance, saved searches, beta feedback, and browser QA.
- Review evidence has concrete checklist gates and refuses approval without required proof.
- Launch readiness checks docs, scripts, guards, browser coverage, audit evidence, disk, AI default-off, upload threshold, and beta stop-test policy.

## Main 10/10 Gaps

1. Operator story is scattered.
   - Proof exists across README, readiness docs, smoke scripts, QA JSON, and route guards.
   - Need one live-feeling command layer per role so testers do not have to read docs to trust the product.

2. Library needs executive signal.
   - Search/discovery works, but current result set needs board-level readiness framing.
   - Added `DAM Mission Control` to convert search results into Portal Ready supply, review debt, metadata health, search fit, recommended actions, and spotlight record.

3. Review workbench must feel like decision operations.
   - Evidence gates are real.
   - Next lift: queue intelligence, blocked reason priority, reviewer next-best-action, pending sync clarity.

4. Admin readiness must be the invite gate.
   - Current `launch-readiness` is strong.
   - Next lift: surface same proof in Admin as a plain go/no-go cockpit for Hali and teammates.

5. Package and Brand Hub must avoid "fake DAM" traps.
   - Current governance modules exist.
   - Next lift: readiness score, blockers, and share/download disabled-state clarity that feels premium, not apologetic.

6. Production blockers remain real.
   - SSO, ResourceSpace writeback, staging S3 delivery, durable package/saved-view storage, and final media pipeline proof are not production-complete.
   - For teammate beta, this is acceptable only if copy stays explicit.

## Intended vs Implemented Checks

| Intent | Evidence | Current Read |
|---|---|---|
| Viewer unsafe downloads stay blocked | `portal-reuse-decision`, `/api/download`, portal smokes | Strong |
| Frontend hiding is not permission enforcement | API routes use identity/permission seams | Strong, keep guard coverage |
| Source paths/originals hidden from normal roles | `source-redaction`, delivery/privacy smokes | Strong |
| ResourceSpace remains truth | docs plus pending-write copy and route responses | Strong, copy must stay honest |
| Collections/packages are not permission truth | package governance, package smoke | Strong but needs clearer UI |
| Upload never publishes | upload route/intake copy/smokes | Strong |
| Beta role switch is simulated | shell/docs/readiness checks | Strong |

## PM Test Scenarios

### Viewer Trust Path

Objective: prove safe reuse without staff explanation.
Steps: open Library as Viewer, search `Bible`, open Portal Ready asset, verify use scope and download CTA; open blocked asset, verify download gate blocks.
Expected: no source paths, no ResourceSpace internals, clear approved-copy language, blocked unsafe action.

### Contributor Intake Path

Objective: prove upload cannot become accidental approval.
Steps: open Upload as Contributor, add harmless sample, fill context/people/rights, submit.
Expected: receipt says Needs Review / Do Not Publish; no fake ResourceSpace write success.

### Reviewer Decision Path

Objective: prove evidence gates stop weak approval.
Steps: open Review as Reviewer, select pending asset, try Approve with missing checklist/note, then complete evidence and submit.
Expected: missing evidence blocks first action; completed decision queues or syncs with honest state.

### DAM Admin Launch Gate

Objective: prove invite readiness is evidence-backed.
Steps: open Admin as DAM Admin, inspect readiness, audit evidence, browser coverage, writeback status, and feedback inbox.
Expected: production blockers visible, beta-safe paths green, no launch claim without proof.

### Package / Brand Governance

Objective: prove curated delivery cannot bypass rights.
Steps: open Package Builder and Brand Hub, inspect blocked/internal/portal-ready refs, attempt share/download.
Expected: ready refs can preview; unsafe publish/share/download explains blockers; no fake ZIP/source mutation.

## CTO Priorities

1. Preserve server-owned policy seams.
2. Keep route smoke coverage ahead of UI polish.
3. Turn readiness proof into first-class UI, not buried docs.
4. Avoid feature sprawl until teammate beta gives evidence.
5. Merge subagent work by file ownership, then run full verification matrix.

## Verification Matrix

- `npm --prefix frontend run typecheck`
- `make frontend-check`
- `make launch-readiness`
- `BASE_URL=http://127.0.0.1:<port> make portal-api-smoke`
- `BASE_URL=http://127.0.0.1:<port> make portal-browser-qa`
- Targeted smokes when touched: `portal-package-smoke`, `portal-feedback-smoke`, `portal-sso-smoke`, `portal-usage-smoke`, `portal-delivery-smoke`
- `git diff --check`

## Merge Guidance

Merge order should protect safety first:

1. Security/guardrail fixes.
2. API-hardening commits already in active thread.
3. Search/taxonomy helper improvements.
4. Library Mission Control.
5. Review, Package, Brand, Detail UI slices.
6. Admin readiness UI.
7. Accessibility/responsive CSS pass.
8. Import/docs/demo polish.
9. Integration scout report last, then full QA.

Do not merge any slice that weakens source redaction, claims live writeback without proof, exposes private storage/source paths to Viewer/Contributor, or creates public-use approval without reviewer/date/scope/notes.
