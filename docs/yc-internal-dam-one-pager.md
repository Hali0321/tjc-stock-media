# YC Internal DAM One-Pager

Date: 2026-06-11
Scope: church-internal beta narrative only

## PM Verdict

TJC Stock Media has a YC-clear wedge if it stays narrow: **a private, trust-aware media operations layer for church media reuse**.

The product should not be pitched as public SaaS, a stock marketplace, or a finished production DAM. The honest pitch is stronger: communities with sensitive people, rights, worship context, and distributed archives do not fail because they lack files. They fail because nobody can tell, in the moment of reuse, whether a media asset is safe, approved, current, and scoped for the intended ministry channel.

TJC is the beachhead because the pain is unusually sharp: church media includes minors, worship, sacraments, testimonies, hymns, sermons, local/private events, third-party design, and decades of source files. Generic DAMs organize assets. This needs to answer: **Can I use this, where, why, and who approved it?**

## Problem

Church media teams accumulate photos, videos, sermons, graphics, publications, and event archives across Google Drive, Google Photos, ResourceSpace, local folders, and personal contributor workflows.

The acute problem is not storage. It is reuse trust:

- A coordinator needs one image or clip now, but cannot tell if it is safe for slides, newsletter, social, livestream, or public web.
- A contributor can upload media without knowing whether children, private context, music, or third-party rights make it unsafe.
- A reviewer must make rights/context decisions from scattered evidence.
- An admin needs to know whether the system is beta-safe, production-ready, or still only a prototype.

When trust is unclear, teams either reuse risky media or stop using their own archive.

## Sharp Wedge

Start with **TJC-only internal media reuse**, not generic stock media.

The first workflow:

1. Viewer searches for approved ministry media and understands use scope in under 60 seconds.
2. Contributor submits harmless intake that defaults to `Needs Review / Do Not Publish`.
3. Reviewer tries to approve without evidence and gets blocked.
4. Reviewer completes evidence and queues an honest pending-write decision.
5. DAM Admin sees beta readiness, private-source redaction, writeback status, browser proof, and launch blockers.

This wedge is small enough to test with a tiny internal team, but rich enough to prove the larger insight: **media operations for trust-sensitive communities require policy, evidence, and workflow around the archive.**

## Why Now

The underlying archive is large and multi-format, while ministry communication has become faster and more distributed. Teams need media for slides, websites, social posts, livestreams, printed flyers, teaching, local events, and internal updates.

AI makes the timing sharper but not because AI should approve rights. AI can suggest tags and help search. The real value is a system that refuses unsafe shortcuts: source files stay protected, humans approve rights, and every approved use has scope and evidence.

## Secret Insight

The reusable unit is not the file. The reusable unit is:

```text
asset + context + rights + people/privacy + reviewer + allowed channel + derivative
```

Most DAMs optimize for finding assets. TJC Stock Media optimizes for **making reuse decisions legible**.

That is why ResourceSpace remains the DAM/search/review truth, Google Shared Drive remains the master-original warehouse, and the portal becomes the role-aware policy workbench.

## Beachhead User

Primary beachhead user: **internal church media coordinator handling recurring ministry reuse**.

Adjacent users:

- Viewer: needs safe approved media quickly.
- Contributor: needs to submit media without accidentally publishing.
- Reviewer: needs evidence gates for rights, people, doctrine, music, sensitivity, and usage scope.
- DAM Admin: needs operational proof before inviting more users or claiming production readiness.

This is a better beachhead than generic "church stock media" because pain is concentrated around privacy, rights, and workflow, not aesthetics.

## Current Traction / Evidence

Internal beta evidence exists, but it should be described as beta evidence only:

- Stable unlisted beta URL exists: `https://tjc-stock-media.vercel.app`.
- Hosted smoke passes against the stable URL.
- Local beta rehearsal passes for Viewer, Reviewer, and DAM Admin flows.
- Browser QA passed 17 pages across six viewport widths with 23 screenshots, zero failures, zero warnings, zero console errors, and zero network failures.
- Viewer unsafe downloads stay blocked.
- Viewer source payloads stay redacted.
- Reviewer approval without evidence returns blockers.
- Complete reviewer evidence returns honest queued/pending-write state.
- Admin readiness exposes SSO, writeback, delivery, feedback, and storage truth.
- `prd.json` shows the recent beta-readiness, identity, delivery privacy, writeback guard, feedback, package, saved-search, and hosted-smoke stories passing.

Remaining invite gates are still real:

- Rights/media reviewer must confirm beta seed media excludes sensitive, private, unreleased, youth-identifiable, and copyrighted-risk media.
- Tech owner must confirm hosted ResourceSpace writeback is disabled or queued.
- Beta owner must confirm private URL sharing policy and seed-data ownership for the first tester batch.

## Product Demo Arc

Demo the product as a trust machine, not a gallery.

1. Start as Viewer. Search `Bible`. Open an asset. Point to the clear use decision: what is usable, what is blocked, what action is allowed.
2. Attempt unsafe download on blocked/non-ready media. Show the block. Say this is the product doing its job.
3. Switch to Contributor. Submit harmless intake. Show that upload never publishes and defaults to review.
4. Switch to Reviewer. Try approval without evidence. Show the blocker. Complete evidence and show queued pending-write truth.
5. Switch to DAM Admin. Show readiness cockpit: beta-safe checks, production blockers, writeback truth, feedback inbox, and stop-test policy.
6. Close with the archive model: Shared Drive keeps masters, ResourceSpace remains source of truth, portal computes safe reuse.

## Trust / Safety Moat

The current moat is not public distribution or proprietary AI. It is the operating model:

- Source-of-truth discipline: ResourceSpace for DAM records, Google Shared Drive for masters, portal for role-aware policy.
- Default-safe lifecycle: every import starts `Needs Review / Do Not Publish`.
- Human approval gates: AI may suggest tags, but humans approve rights, doctrine, minors, sensitivity, and public reuse.
- Server-side role and payload controls: Viewer/Contributor responses hide source paths, originals, checksums, private URLs, and ResourceSpace internals.
- Evidence-backed review: approval requires reviewer, date, scope, note, and conditional rights/context proof.
- Honest integration posture: no fake ResourceSpace writeback, fake SSO, fake S3, fake public approval, or fake production launch.
- Executable readiness: smoke tests and browser QA turn trust into proof, not slideware.

## What Beta Must Learn

The beta should answer these questions before broader internal rollout:

1. Can a normal Viewer decide safe use in under 60 seconds without staff explanation?
2. Do blocked downloads feel reassuring instead of frustrating?
3. Does Contributor intake make "upload does not publish" unmistakable?
4. Can Reviewers understand and trust the evidence checklist?
5. Does Admin readiness help Hali decide invite/no-invite without reading multiple docs?
6. Are TJC-native categories, search terms, and blocker labels understandable to actual church users?
7. Does feedback identify workflow confusion, or mostly polish?
8. Do testers ever confuse beta role switching, queued writes, or local storage with production truth?

Beta success means trust clarity, not volume.

## What Not To Claim

Do not claim:

- Public SaaS launch.
- Production internal launch.
- Public stock marketplace.
- Real production SSO.
- Live ResourceSpace writeback unless explicitly enabled and verified.
- Production signed S3 delivery.
- Full archive import complete.
- Every asset approved for public use.
- AI-approved rights or AI-approved public safety.
- That collections, packages, or brand kits override item-level policy.
- That beta seed media is safe until human seed scrub is signed off.

## Coordinator Demo Talking Points

Use these lines in sequence:

1. "This is not a public stock site. It is our internal trust layer for church media."
2. "The question we answer is not only 'Can I find a file?' It is 'Can I use this file for this ministry channel, and who approved that?'"
3. "ResourceSpace remains the DAM source of truth. Google Shared Drive keeps the masters. This portal makes reuse decisions visible and role-safe."
4. "As a Viewer, I search `Bible`, open an asset, and see whether it is ready, internal-only, or blocked."
5. "A blocked download is a feature, not a failure. It prevents accidental public use when rights, people, source, or derivative proof is incomplete."
6. "As a Contributor, upload is intake only. Every submission starts `Needs Review / Do Not Publish`."
7. "As a Reviewer, the system refuses approval without evidence. That protects minors, worship context, music rights, testimony sensitivity, and usage scope."
8. "A completed decision is still honest: it queues pending ResourceSpace writeback unless live writeback is configured and verified."
9. "As DAM Admin, I can see whether we are beta-safe, what is still production-blocked, and whether testers have found critical issues."
10. "The beta is successful if teammates can trust the decision in under 60 seconds and nobody confuses beta affordances with production."

## One-Line Positioning

TJC Stock Media is a private, trust-aware media operations portal that helps church teams find and reuse approved ministry media without bypassing rights, privacy, doctrine, source custody, or reviewer evidence.
