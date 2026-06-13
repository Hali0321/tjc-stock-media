# DAM UI Reference Audit

Date: 2026-06-08
Branch: `codex/dam-v2-enterprise-ui-system`

## Standard

Marketing pages are taste references only. TJC layout decisions must come from actual product UI evidence:

- `REAL_APP_UI`: actual logged-in app UI, support-doc screenshot, help-center screenshot, or product walkthrough showing the application.
- `DEMO_FRAME`: official demo/video frame showing product UI, but possibly staged.
- `MOCKUP`: product-looking image or illustration that may not be the real app.
- `SALES_PAGE`: landing page, hero, pricing, customer story, CTA, abstract product art.

Only `REAL_APP_UI` and strong `DEMO_FRAME` evidence can drive TJC structure. `MOCKUP` may inform tone only. `SALES_PAGE` cannot drive layout.

Capture manifests:

- `docs/screenshots/reference-dam-ui/strict-audit/strict-audit-captures.json`
- `docs/screenshots/reference-dam-ui/strict-audit/strict-audit-ui-captures.json`
- `docs/screenshots/reference-dam-ui/strict-audit/bynder-clean-captures.json`

## Rejected As Structure

The following are not allowed to drive TJC layout:

- Vendor homepages and product landing pages.
- YouTube channel pages.
- Pricing pages, demo CTA pages, customer-logo sections.
- Abstract product illustrations.
- Decorative product mockups unless no real UI exists, and then only as tone.

Examples captured earlier under `docs/screenshots/reference-dam-ui/*-top.png` and `docs/screenshots/reference-dam-ui/official-product-pages.json` are sales/product pages. They are useful only for broad tone: Brandfolder bold self-service, Bynder clean governance, Acquia portal/package model, Aprimo content-ops gravity.

## Local Stitch Baseline

Source: `/Users/halim4pro/Downloads/stitch.zip`, unpacked to `docs/reference/stitch/stitch/`.

Classification: `MOCKUP` / internal visual baseline. Stitch is not vendor evidence and does not override TJC product safety. It can drive visual-system direction because the user provided it as the approved internal baseline, but real product structure still maps back to `REAL_APP_UI` / `DEMO_FRAME` references above.

Usable Stitch artifacts:

- `asset_library_modernized/screen.png`: tighter asset-bank layout, search/filter/results hierarchy.
- `asset_detail_modernized/screen.png`: media preview plus verdict/inspector and dense metadata panels.
- `reviewer_approval_inbox_modernized/screen.png`: queue and selected approval workbench density.
- `ministry_packages_modernized/screen.png`: portal cards, generated covers, selected portal inspector.
- `governance_cockpit_modernized/screen.png`: command-center metrics, blocker tables, side modules.
- `evergreen_enterprise_dam/DESIGN.md`: neutral canvas, white panels, thin borders, restrained radius, evergreen action states, compact enterprise spacing.

Do not copy:

- Static HTML into the app.
- Any Stitch wording that weakens Viewer hiding or suggests package-level approval.
- Any admin/source-system detail into Viewer surfaces.

## Brandfolder / Smartsheet Help

Sources:

- https://help.smartsheet.com/articles/2483104-Search-in-Brandfolder
- https://help.smartsheet.com/articles/2482839-Download-Individual-Assets
- https://help.smartsheet.com/articles/2482958-Upload-Assets
- https://brandguides.brandfolder.com/how-to-use-brandfolder-1/searching

Evidence:

| Source | Class | Screenshot | Usable Pattern | Do Not Copy |
|---|---|---|---|---|
| Search in Brandfolder | `REAL_APP_UI` support-doc screenshot | `docs/screenshots/reference-dam-ui/strict-audit/brandfolder-smartsheet-search-ui.png` | Search bar within a collection, section filters, labels, pins, saved/shared search concepts, collection-local search. | Smartsheet help layout, purple/blue product chrome, screenshot annotations. |
| Download individual assets | `REAL_APP_UI` support-doc screenshot | `docs/screenshots/reference-dam-ui/strict-audit/brandfolder-smartsheet-download-ui.png` | Asset modal with preview, tabs, attachment list, download buttons, share/edit menu. | Admin edit/delete actions for normal Viewer. |
| Upload assets | `REAL_APP_UI` support-doc screenshot | `docs/screenshots/reference-dam-ui/strict-audit/brandfolder-smartsheet-upload-ui.png` | Upload modal with source options, drop area, required fields, asset grid after upload. | Direct-publish implication. TJC Send stays blocked until review. |
| Brandfolder guide | `REAL_APP_UI` guide with product GIFs, not layout source | `docs/screenshots/reference-dam-ui/actual-ui/brandfolder-searching-0.png` | Search, sections, labels, filters, pins as concepts. | Guide page structure and stock-like hero image. |

Extracted patterns:

- Viewer browsing should feel like a library, not documentation.
- Search and collection context belong near the top.
- Cards can stay visual, but actions should be sparse.
- Download/share lives in asset detail or a compact card action, governed by permission.

TJC mapping:

- Find: large search, use-case shortcuts, simple filters, visual grid.
- Media Record: one preview area, one download/request action, attachment/source access separated.
- Send: upload source choices and required context before submit.

## Bynder Support

Sources:

- https://support.bynder.com/hc/en-us/sections/15693232568210-Digital-Asset-Management-DAM
- https://support.bynder.com/hc/en-us/sections/18409247082258-Exploring-your-Assets
- https://support.bynder.com/hc/en-us/sections/18409243584786-Manage-Assets
- https://support.bynder.com/hc/en-us/sections/17242631377426-Upload
- https://support.bynder.com/hc/en-us/sections/18409442219282-Share
- https://support.bynder.com/hc/en-us/articles/360016051239-View-Assets-in-the-Asset-Bank
- https://support.bynder.com/hc/en-us/articles/21745299220882-Exploring-the-Asset-Detail-View
- https://support.bynder.com/hc/en-us/articles/360013931719-Select-Assets-in-the-Asset-Bank
- https://support.bynder.com/hc/en-us/articles/360013932879-Asset-Workflow-Assets

Evidence:

| Source | Class | Screenshot | Usable Pattern | Do Not Copy |
|---|---|---|---|---|
| View Assets in the Asset Bank | `REAL_APP_UI` support-doc screenshot | `docs/screenshots/reference-dam-ui/strict-audit/bynder-asset-bank-ui-clean.png` | Asset Bank concept, related assets, larger preview path, permission-dependent visibility. | Support article chrome, cookie overlay, exact Bynder styling. |
| Exploring the Asset Detail View | `REAL_APP_UI` support-doc screenshot | `docs/screenshots/reference-dam-ui/strict-audit/bynder-asset-detail-ui-clean.png` | Dark preview workspace, right metadata/action rail, usage rights, permissions, download options, versions/history, related files. | Dark viewer surface for TJC Viewer; TJC uses neutral light UI. |
| Select and download assets | `REAL_APP_UI` support-doc screenshot | `docs/screenshots/reference-dam-ui/strict-audit/bynder-download-assets-ui-clean.png` | Asset grid with multi-select checkmarks, bulk controls, sort, saved filters, upload button, compact thumbnails. | Bulk download for unsafe Viewer assets. |
| Earlier Bynder support captures | Blocked/replaced | `docs/screenshots/reference-dam-ui/actual-ui/bynder-asset-bank-0.png` | No layout evidence; screenshot showed security/cookie overlays. | Do not cite blocked captures as UI structure. |

Extracted patterns:

- Asset Bank is a real browsing model: top navigation, filters, search, asset cards, selected-state controls.
- Asset detail needs a large preview and a side rail for metadata, usage rights, permissions, downloads, sharing, versions, history, and related assets.
- Permissions affect visible buttons and download options.

TJC mapping:

- Find: media grid and optional filter drawer, no table for Viewer.
- Media Record: preview plus a single verdict/action panel; admin details stay expandable.
- Review/Admin: metadata, rights, versions/history, and permission facts belong in dense panels.

## Acquia DAM / Widen Docs

Sources:

- https://docs.acquia.com/acquia-dam
- https://docs.acquia.com/acquia-dam/how-do-i-search-assets
- https://docs.acquia.com/acquia-dam/what-are-collections
- https://docs.acquia.com/acquia-dam/How-do-I-see-collection-details
- https://docs.acquia.com/acquia-dam/how-do-i-add-collections-portal
- https://docs.acquia.com/acquia-dam/how-do-i-upload-files
- https://docs.acquia.com/acquia-dam/How-do-I-share-assets

Evidence:

| Source | Class | Screenshot | Usable Pattern | Do Not Copy |
|---|---|---|---|---|
| Search assets | `REAL_APP_UI` docs screenshot | `docs/screenshots/reference-dam-ui/strict-audit/acquia-search-results-ui.png` | Results page with filter rail, card grid, result count, sort, page size, share/download actions, list/grid switch. | Acquia documentation sidebar and exact demo content. |
| Add collections to portal | `REAL_APP_UI` docs screenshot | `docs/screenshots/reference-dam-ui/strict-audit/acquia-portal-settings-ui.png` | Portal collection cards, global/my collections split, featured collection preview, search for assets to add, portal sections. | Package-level permission implication. |
| Upload files | `REAL_APP_UI` docs screenshot | `docs/screenshots/reference-dam-ui/strict-audit/acquia-upload-ui.png` | Choose details, select categories, file upload sequence. | Upload as publish. TJC Send never publishes. |
| Share assets | `REAL_APP_UI` docs screenshot | `docs/screenshots/reference-dam-ui/strict-audit/acquia-share-assets.png` | Sharing/download settings, direct links, controlled portal behavior. | Public sharing as default. |
| Collections overview | `REAL_APP_UI` docs screenshot | `docs/screenshots/reference-dam-ui/strict-audit/acquia-collections.png` | Collections as groups of assets with share pages and details. | Collection state as permission truth. |

Extracted patterns:

- Portals/packages are curated delivery surfaces, often with featured collections and controlled download/share toggles.
- Search should make filter categories visible without over-explaining.
- Collection cards use preview mosaics and counts.

TJC mapping:

- Packages: ministry kits with cover previews, purpose, best use, ready/review counts, and item-level reminder.
- Find: filter drawer/rail, asset grid, result count, sort, simple card actions.
- Send: step sequence: details, people/rights/categories, files/source, reviewer packet.

## Adobe Experience Manager Assets / Assets Essentials

Sources:

- https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/assets-view/navigate-assets-view
- https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/manage/search-assets
- https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/assets-view/renditions
- https://experienceleague.adobe.com/en/docs/experience-manager-assets-essentials/help/manage-organize
- https://experienceleague.adobe.com/docs/experience-manager-cloud-service/content/assets/manage/aem-assets-adobe-stock.html?lang=en

Evidence:

| Source | Class | Screenshot | Usable Pattern | Do Not Copy |
|---|---|---|---|---|
| Assets view UI | `REAL_APP_UI` docs screenshot | `docs/screenshots/reference-dam-ui/strict-audit/adobe-assets-view-ui.png` | Left app rail, assets workspace, search, filters, upload/add asset, create folder, sort, view switch. | Adobe doc shell, exact iconography, complex Viewer admin rail. |
| Search assets | `REAL_APP_UI` docs page with app screenshots/structure | `docs/screenshots/reference-dam-ui/strict-audit/adobe-search-assets-ui.png` | Search facets, suggestions, ranking, sort results, metadata checks, download, smart collections. | Documentation table layout as product UI. |
| Renditions | `REAL_APP_UI` docs screenshot | `docs/screenshots/reference-dam-ui/strict-audit/adobe-aem-renditions.png` | Rendition management and preview/derivative distinction. | Exposing rendition internals to Viewer. |
| Adobe Stock metadata | `REAL_APP_UI` docs screenshot | `docs/screenshots/reference-dam-ui/actual-ui/adobe-stock-metadata-1.png` | Asset properties, licensing/permissions, metadata panel. | Adobe Stock workflow specifics. |

Extracted patterns:

- Review/Admin can tolerate enterprise density: rails, facets, properties, renditions, metadata schemas, permissions, and workflow screens.
- Viewer should get none of this complexity unless it answers “Can I use this?”
- Preview and rendition/source access should be separate.

TJC mapping:

- Review: Linear-like queue plus AEM-like evidence lanes, selected inspector, metadata tabs, locked decisions.
- Governance: compact cockpit for field mapping, sync readiness, pending writes, audit, permissions, and launch blockers.
- Media Record: approved-copy versus source-file split.

## Aprimo

Sources:

- https://www.aprimo.com/platform/digital-asset-management
- https://developers.aprimo.com/docs/tutorials/dam-developer-tutorial
- https://developers.aprimo.com/docs/webhooks-and-rules/dam-rules

Evidence:

| Source | Class | Screenshot | Usable Pattern | Do Not Copy |
|---|---|---|---|---|
| Aprimo DAM page | `SALES_PAGE` with product-like mockups | `docs/screenshots/reference-dam-ui/strict-audit/aprimo-dam-page.png` | Tone only: content-ops, review/approve, AI enrichment, governance/compliance seriousness. | Hero layout, AI orbit diagram, promo mockups, dark marketing graphics. |
| Aprimo DAM developer tutorial | `MOCKUP`/developer doc | `docs/screenshots/reference-dam-ui/actual-ui/aprimo-dam-api-0.png` | API/admin concepts only: search assets, metadata/files, upload, record creation. | Developer console as UI structure. |
| Aprimo DAM rules | `MOCKUP`/developer doc, no app screenshot | `docs/screenshots/reference-dam-ui/actual-ui/aprimo-dam-rules-0.png` | Rules/governance concepts only. | No layout evidence. |

Finding: no strong public official `REAL_APP_UI` Aprimo workspace evidence was captured in this pass. Aprimo may inform Review/Governance tone and content-ops vocabulary, but not TJC layout.

## TJC Structure Decisions From Evidence

## Strict Evidence Matrix

This matrix is the working rule for UI edits. If a pattern is not backed by `REAL_APP_UI` or a strong `DEMO_FRAME`, it can influence tone only.

### Brandfolder / Smartsheet

| Target | Evidence Class | Evidence Source | Pattern That Can Drive TJC | Limits |
|---|---|---|---|---|
| Product navigation | `REAL_APP_UI` | Smartsheet Brandfolder help screenshots | Collection-local browsing with search, section/label concepts, and compact item actions. | Do not copy help-site chrome or Brandfolder visual identity. |
| Search/home | `REAL_APP_UI` | Search in Brandfolder | Search first, scoped to assets/collections, with filters close to the result grid. | Do not turn Find into a marketing hero. |
| Asset grid/card | `REAL_APP_UI` | Search in Brandfolder, Brandfolder guide GIFs | Visual thumbnails first, sparse metadata, direct open/download path. | Viewer cards must hide backend fields and unsafe download affordances. |
| Asset detail/preview | `REAL_APP_UI` | Download individual assets | Preview modal/detail with tabs, attachment list, and governed download. | Admin edit/delete controls stay hidden from Viewer. |
| Collections/packages | `REAL_APP_UI` | Collection/search help and guide GIFs | Collections are browsing contexts, not permission truth. | Package approval must never imply item approval. |
| Upload/intake | `REAL_APP_UI` | Upload assets | Source choice, drop area, required context before completing. | TJC Send submits for review only. No direct publish. |
| Review/governance | `MOCKUP`/insufficient public evidence in captured set | None strong enough | Brandfolder contributes simplicity, not review/admin structure. | Do not derive workbench or governance layout from Brandfolder. |
| Empty state | `REAL_APP_UI` but sparse | Help screenshots and product GIF context | Empty states should be calm and action-oriented. | Do not copy help-page explanatory format. |
| Visual system | `SALES_PAGE` taste only, plus help screenshots | Product/help materials | Bold media-first confidence, fewer labels, clear actions. | No Brandfolder colors, logos, trade dress, or exact modal layout. |

### Bynder

| Target | Evidence Class | Evidence Source | Pattern That Can Drive TJC | Limits |
|---|---|---|---|---|
| Product navigation | `REAL_APP_UI` | Asset Bank and Asset Detail support screenshots | App workspace with Asset Bank, detail view, permissions, versions, usage, and download paths. | Do not expose full DAM workspace to Viewer. |
| Search/home | `REAL_APP_UI` | View Assets in the Asset Bank, Select and Download Assets | Asset Bank model: search, filter, sort, select, view details. | TJC Viewer defaults to safe portal-ready copies only. |
| Asset grid/card | `REAL_APP_UI` | Select and Download Assets | Compact grid, selected checkmark, bulk toolbar, sort and filters. | Bulk actions remain reviewer/admin only unless safe. |
| Asset detail/preview | `REAL_APP_UI` | Exploring the Asset Detail View | Large preview, side/detail metadata, usage rights, permissions, download options, versions/history, related files. | Viewer sees one verdict/action, not raw metadata panels. |
| Collections/packages | `REAL_APP_UI` via support topics, limited screenshot evidence | Collections/share support topics | Collections as curated asset groups and share contexts. | Use Acquia/Widen as stronger package/portal evidence. |
| Upload/intake | `REAL_APP_UI` in Upload support section, not all captures clean | Upload support topics | Upload can include permissions, metadata, and workflow context. | TJC uses guided wizard and review packet, not direct DAM upload publish. |
| Review/governance | `REAL_APP_UI` | Asset Workflow Assets support article | Status-filtered workflow assets, detail view, approve/reject actions. | Approval stays evidence-locked in TJC. |
| Empty state | `REAL_APP_UI` sparse | Asset Bank docs | Empty or no-preview states should name permission/preview reality. | Avoid support-doc note blocks in Viewer UI. |
| Visual system | `REAL_APP_UI` | Clean Bynder captures | Dense enough for work, clean enough for browsing, neutral chrome, permission-aware actions. | Do not copy exact dark detail styling or Bynder components. |

### Acquia DAM / Widen

| Target | Evidence Class | Evidence Source | Pattern That Can Drive TJC | Limits |
|---|---|---|---|---|
| Product navigation | `REAL_APP_UI` | Acquia DAM docs screenshots | Library, portals, collections, upload, share, metadata/admin areas as separate tasks. | Do not copy documentation shell. |
| Search/home | `REAL_APP_UI` | Search assets | Filter rail, result count, sort, page size, grid/list switch, card actions. | Viewer still gets simplified filters and no backend chips. |
| Asset grid/card | `REAL_APP_UI` | Search results screenshot | Asset cards can carry preview, title, type, and governed actions. | No unsafe assets labeled ready. |
| Asset detail/preview | `REAL_APP_UI` across search/share/metadata docs | Asset details and share docs | Metadata and controlled sharing belong near detail/share tasks. | Viewer metadata stays minimal. |
| Collections/packages | `REAL_APP_UI` | Collections, collection details, portals | Portals and collections support curated delivery, featured previews, counts, and controlled access. | Package membership is never permission truth. |
| Upload/intake | `REAL_APP_UI` | Upload files | Multi-step uploader: choose details, categories, metadata, files, review/edit. | TJC Send is intake only and keeps media blocked. |
| Review/governance | `REAL_APP_UI` | Metadata/admin docs | Metadata fields, required fields, security settings, asset groups, release/expiration. | Admin-only. Do not expose to Viewer. |
| Empty state | `REAL_APP_UI` sparse | Portal/search docs | Empty states should offer next action and explain missing access/readiness briefly. | No long educational panels. |
| Visual system | `REAL_APP_UI` | Acquia docs screenshots | Practical, form-forward, portal/package oriented, controlled sharing. | No sales-page hero or public portal marketing layout. |

### Adobe AEM Assets / Assets Essentials

| Target | Evidence Class | Evidence Source | Pattern That Can Drive TJC | Limits |
|---|---|---|---|---|
| Product navigation | `REAL_APP_UI` | Assets view UI, manage-organize docs | Left rail/toolbar, assets workspace, create/upload, sort, view switch, filters. | Viewer does not need enterprise rail. |
| Search/home | `REAL_APP_UI` | Search assets | Omnisearch, facets, filter panel, list/grid result handling, server-side sort. | Keep Viewer simple; reserve dense facets for Review/Admin. |
| Asset grid/card | `REAL_APP_UI` | Assets view/search docs | Workspace grid/list with toolbar actions and selected-state controls. | No table-first Viewer. |
| Asset detail/preview | `REAL_APP_UI` | Search assets, renditions, metadata/property docs | Properties, renditions, comments, versions, location, metadata checks. | Viewer sees approved copy/source split without internal field names. |
| Collections/packages | `REAL_APP_UI` | Search assets smart collections, manage-organize docs | Static/smart collections and saved results as references to assets. | Collections cannot override item-level approval. |
| Upload/intake | `REAL_APP_UI` | Asset microservices/upload docs | Upload processing, extracted text, renditions, processing profiles. | TJC contributor Send avoids processing internals. |
| Review/governance | `REAL_APP_UI` | Workflow, search, metadata schema docs | Start workflow from selected assets, mandatory metadata, facet customization, permissions, renditions. | Use only in Reviewer/Admin shell. |
| Empty state | `REAL_APP_UI` sparse | Accessibility/search docs | Search and filter states need accessible labels, focus order, and informative page titles. | Do not copy documentation page layout. |
| Visual system | `REAL_APP_UI` | Experience League screenshots | Enterprise density, toolbars, rows, properties, tabs, audit-like side panels. | No Adobe trade dress or Viewer complexity. |

### Aprimo

| Target | Evidence Class | Evidence Source | Pattern That Can Drive TJC | Limits |
|---|---|---|---|---|
| Product navigation | `SALES_PAGE`/`MOCKUP` only captured | Aprimo DAM page, developer docs | Tone only: content operations, governance, review/approve seriousness. | No layout decisions. |
| Search/home | `MOCKUP`/insufficient | Developer tutorial | API concepts only. | Do not copy developer console or promo mockups. |
| Asset grid/card | `MOCKUP`/insufficient | Sales/developer screenshots | None strong enough. | Use Bynder/Brandfolder/Acquia instead. |
| Asset detail/preview | `MOCKUP`/insufficient | Sales/developer screenshots | Metadata enrichment concept only. | No structural use. |
| Collections/packages | `MOCKUP`/insufficient | Sales/developer screenshots | None strong enough. | Use Acquia/Widen instead. |
| Upload/intake | `MOCKUP`/insufficient | Developer docs | Record creation/upload concepts only. | No UI structure. |
| Review/governance | `SALES_PAGE`/`MOCKUP` | Aprimo DAM and rules docs | Content-ops vocabulary, compliance tone, automation/rules concept. | Governance layout must come from Adobe/Acquia evidence. |
| Empty state | `SALES_PAGE` | None | No structural evidence. | Do not use. |
| Visual system | `SALES_PAGE` taste only | Aprimo DAM page | Darker enterprise gravity and compliance tone. | No marketing hero, orbit graphics, or sales CTA structure. |

### Evidence To Screen Mapping

| TJC screen | Structural Evidence | Required UI Consequence |
|---|---|---|
| Viewer Find | Brandfolder search, Bynder Asset Bank, Acquia search results | Search first, asset-grid first, compact filters/shortcuts, no Viewer table, no backend chips. |
| Media Record | Brandfolder asset modal, Bynder asset detail, Adobe properties/renditions | Large preview, one verdict, one action, plain reason, progressive technical disclosure for ops roles. |
| Packages | Acquia collections/portals, Brandfolder collections | Portal/kit cards with preview mosaics, purpose, best use, ready/review counts, item-level approval reminder. |
| Send | Brandfolder upload, Acquia upload | Guided intake steps, required context before actions, review packet, submit for DAM review only. |
| Review Inbox | Adobe workflow/search density, Bynder workflow/detail permissions | Queue plus selected inspector, decision lanes, evidence checklist, locked approval, sticky/reset behavior. |
| Governance | Adobe metadata/search/admin, Acquia metadata/security, Aprimo tone only | Compact cockpit rows for blockers, metadata, rights/youth risk, sync, pending writes, package readiness, audit. |
| Help | No vendor product home evidence | Secondary searchable help, not a landing page or product center. |

Viewer Find:

- Based on Brandfolder search, Bynder Asset Bank, and Acquia search results.
- Use search-first home, compact use-case shortcuts, media grid, one verdict, one action.
- Viewer table mode and ops metadata stay hidden.

Media Record:

- Based on Brandfolder asset modal, Bynder asset detail view, and Adobe properties/renditions.
- Use large preview plus one verdict/action panel above the fold.
- Below fold: use guidance, credit, people/youth note, tags, related media/packages.
- Reviewer/Admin truth expands below, not visible to Viewer.

Packages:

- Based on Acquia collections/portals and Brandfolder collection search.
- Use cover mosaics, purpose, best use, ready/review counts, and “open media.”
- Always remind that item-level media record approval controls reuse.

Send:

- Based on Brandfolder upload and Acquia upload.
- Use guided wizard: type, source context, people/rights, files/link/notes, reviewer packet.
- Submit remains review-only and blocked until safety checks pass.

Review:

- Based on AEM Assets density plus Bynder asset detail rights/permissions concepts.
- Use queue tabs, selected asset inspector, evidence checklist, decision lanes, metadata tabs, and locked actions.

Governance:

- Based on AEM metadata/admin density and Aprimo governance tone.
- Use cockpit rows for readiness, blockers, metadata quality, rights/youth risk, source sync, pending writes, package readiness, and audit.

Help:

- Help is secondary. It can be searchable and concise, but it must not become product home.
