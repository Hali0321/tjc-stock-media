# Stakeholder Demo Script

## Product Story

This is not a DAM setup demo. It is a proof that a TJC user can find, review, and safely reuse media.

North Star: a TJC user can find a rights-safe asset for a real communication need in under 60 seconds.

## Demo Steps

1. State the problem.

   Media is scattered across Google Photos, old Drive folders, IA DME folders, and local machines. People cannot easily tell what exists, what is safe to use, or where the approved version lives.

2. State the system.

   Google Shared Drive is the master library. ResourceSpace is the searchable review layer. Originals are not moved or deleted during MVP.
   Use the featured `MVP 2024 - First Batch` collection as the demo album/folder.

3. State the safety rule.

   Every new imported asset starts as `Needs Review` and `Do Not Publish`.
   For the current MVP 2024 prototype batch, Hali approved the reviewed photos for public/internal prototype use, so they are now marked `Approved Public` and published in ResourceSpace.

4. Search real terms.

   - `Bible`
   - `Plant`
   - `Fountain`
   - `MVP 2024`
   - `Approved Public`

   Current seeded search checks:

   - `Bible`: searchable approved resources
   - `Plant`: searchable approved resources
   - `Fountain`: searchable approved resources
   - `Approved Public`: MVP 2024 approved batch results

5. Open one approved asset.

   Show source path, tags, review status, reviewed by, review date, and `Public and Internal` usage scope.

6. Show HEIC handling.

   Open a HEIC asset. Show that the card/preview displays a JPG derivative so normal users are not confused. Then show the original HEIC remains preserved and downloadable as the master file, with the JPG derivative also listed under alternative files.

7. Show approval metadata.

   - `Approved Public`
   - `Public and Internal`
   - `ResourceSpace admin`

   Current approval state: 181 MVP 2024 assets are approved for public/internal prototype use.

8. Export metadata CSV.

   Show that the system can leave with its metadata. Current export: `.runtime/exports/resourcespace-metadata-20260604-171242.csv`.

9. Copy approved sample back to Shared Drive.

   Show approved output, not source mutation.

10. Show original untouched.

   The source folder still exists and files are not renamed or deleted.

## Final Ask

Should we continue from 181 assets to the next 500 assets using the same workflow?
