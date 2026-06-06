# Stakeholder Demo

## Demo Goal

Show that a ministry user can find a rights-safe approved media asset in under 60 seconds.

## Open

```text
http://localhost:3008
```

Use the production Next server for screenshots or stakeholder walkthroughs after `npm run build && npm run start -- --hostname 0.0.0.0 --port 3008`.

## Script

1. Start on Library.
2. Search `Bible`.
3. Show the Tubelight-inspired workflow nav, compact command search, `Cmd/Ctrl+K` command palette, use-case shortcuts, clear result count, saved DAM views, filters, sort controls, contact-sheet results, and collection entry points.
4. Open one asset.
5. Point to the normalized display title, raw ResourceSpace status, portal reuse state, blocker reasons, usage scope, reviewer/date, tags, source/provenance, and confidence record.
6. Show blocked download copy for a non-portal-ready asset and explain `Approved Public` is not enough for portal reuse.
7. Show `Original/master restricted`.
8. Switch role to Reviewer.
9. Open Review.
10. Open first asset marked `Please review before public sharing` from the demo path.
11. Show it is not downloadable.
12. Return to Review and show the workbench: queue tabs, selected-asset inspector, and approval actions: `Approve for church-wide use`, `Approve for internal ministry use`, `Archive only`, and `Do not publish externally`.
13. Try an action without evidence to show `400` validation, then submit valid checklist/note and explain it queues a `Pending Review Write` until ResourceSpace API write mapping is configured.
14. Open Upload as Contributor.
15. Select a sample file to show file preview, type/size, remove/clear controls, and large-media guidance.
16. Show new media defaults to `Needs Review / Do Not Publish`, shown to users as review-required.
17. Show large-media rule for files over 100 MB.
18. Mention the Guide is available from the help/footer area, with Do/Avoid guidance and download decision rules, while primary navigation stays focused on Library, Collections, Upload, and Review.

## Main Message

ResourceSpace remains the backend/source of truth. The new portal is the friendly church-facing layer for search, upload intake, and review safety.

The UI is now operational and ministry-warm: compact navigation, Tailwind v4/Geist visual system, DAM command search, operational saved views, album-style collections, contact-sheet asset records, guided upload, reviewer workbench, and usage guidance at the point of download.

If the export lacks a preview derivative, the portal labels it as `Preview pending` or `Preview unavailable`; this is honest ResourceSpace/export readiness, not fake media.

Theme toggle is deferred. Light mode remains the designed, verified experience until dark-mode safety labels and contrast get a full pass.

## Decision Ask

Approve next phase:

- connect ResourceSpace API write mapping
- polish first 50-100 approved assets
- run church PC/NAS deployment rehearsal
- keep Google Shared Drive as master warehouse

## Safety Points

Viewer cannot approve.

Viewer cannot download unsafe assets.

Original/master files are restricted.

Please review before public sharing is not publishable.

Possible Minors requires review.

The frontend does not create a second DAM or store secret API keys in the browser.

## Latest Evidence

- Screenshots refreshed under `docs/screenshots/`.
- 1440, 1280, 1024, 768, 390, and 320 px checks have no horizontal page overflow.
- Viewer unsafe download and review actions are blocked by server routes.
- Review action without note/checklist fails with `400`.
- Valid reviewer evidence creates a local pending-write record and returns `202`; ResourceSpace is not updated until write mapping is configured.
- Asset Detail and Review inspector tabs are keyboard-accessible and browser QA checks tab `aria-controls` targets.
- Request original access opens a safety dialog first; it creates only an email draft and does not grant access or write to ResourceSpace.
- Review queue initially renders 24 loaded rows with an explicit `Show more review items` action so mobile reviewers reach the inspector/action area sooner.
- Browser QA finished with zero failures, zero warnings, and zero console errors. Expected denied requests are 400/403 safety checks.
