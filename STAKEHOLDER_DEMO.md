# Stakeholder Demo

## Demo Goal

Show that a ministry user can find a rights-safe approved media asset in under 60 seconds.

## Open

```text
http://localhost:3008
```

## Script

1. Start on Library.
2. Search `Bible`.
3. Show approved assets first.
4. Open one asset.
5. Point to status, usage scope, reviewer, reviewed date, tags, and source path.
6. Show `Download approved copy`.
7. Show `Original/master restricted`.
8. Switch role to Reviewer.
9. Open Review.
10. Open first Needs Review asset from the demo path.
11. Show it is not downloadable.
12. Return to Review and show approval actions.
13. Click one action and explain the current Mac reference refuses fake backend writes until ResourceSpace API write mapping is configured.
14. Open Upload as Contributor.
15. Show new media defaults to `Needs Review / Do Not Publish`.
16. Show large-media rule for files over 100 MB.

## Main Message

ResourceSpace remains the backend/source of truth. The new portal is the friendly church-facing layer for search, upload intake, and review safety.

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

Needs Review is not publishable.

Possible Minors requires review.

The frontend does not create a second DAM or store secret API keys in the browser.
