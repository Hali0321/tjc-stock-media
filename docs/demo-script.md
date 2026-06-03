# Stakeholder Demo Script

## Product Story

This is not a DAM setup demo. It is a proof that a TJC user can find, review, and safely reuse media.

North Star: a TJC user can find a rights-safe asset for a real communication need in under 60 seconds.

## Demo Steps

1. State the problem.

   Media is scattered across Google Photos, old Drive folders, IA DME folders, and local machines. People cannot easily tell what exists, what is safe to use, or where the approved version lives.

2. State the system.

   Google Shared Drive is the master library. ResourceSpace is the searchable review layer. Originals are not moved or deleted during MVP.

3. State the safety rule.

   Every imported asset starts as `Needs Review` and `Do Not Publish`.

4. Search real terms.

   - `Bible`
   - `Plant`
   - `Fountain`
   - `MVP 2024`
   - `Needs Review`
   - `Approved Public`
   - `Approved Internal`

   Current seeded search checks:

   - `Bible` in Pending Review: 23 resources
   - `Plant` in Pending Review: 34 resources
   - `Fountain` in Pending Review: 6 resources
   - `Needs Review` in Pending Review: 179 resources
   - `Approved Public`: demo-approved sample results
   - `Approved Internal`: 1 demo-approved sample

5. Open one unreviewed asset.

   Show source path, tags, review status, and `Do Not Publish`.

6. Show HEIC handling.

   Open a HEIC that failed native preview. Show that the original HEIC remains preserved, while a JPG derivative alternative is attached for preview/use. Explain: normal users use the JPG; admins/designers can still access the HEIC when needed.

7. Approve two example assets.

   - One `Approved Public`
   - One `Approved Internal`

   Current demo samples:

   - Resource `368`: `Approved Public`, demo only
   - Resource `441`: `Approved Internal`, demo only

8. Export metadata CSV.

   Show that the system can leave with its metadata. Current export: `.runtime/exports/resourcespace-metadata-20260603-184435.csv`.

9. Copy approved sample back to Shared Drive.

   Show approved output, not source mutation.

10. Show original untouched.

   The source folder still exists and files are not renamed or deleted.

## Final Ask

Should we continue from 181 assets to the next 500 assets using the same workflow?
