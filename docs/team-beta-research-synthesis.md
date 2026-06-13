# Team Beta Research Synthesis

Last updated: 2026-06-11

Purpose: make `/Users/halim4pro/Downloads/deep-research-report.md` shape Team Beta as a TJC-only governed media library, not a generic stock gallery. This is a docs-only integration artifact for demo, QA, rights, taxonomy, and roadmap coordination.

## Sources Read

- `AGENTS.md`
- `/Users/halim4pro/Downloads/deep-research-report.md`
- `docs/beta-readiness-command-center.md`
- `tasks/prd-enterprise-tjc-media-library.md`
- `docs/team-beta-demo-script.md`
- `docs/team-beta-rights-playbook.md`
- `docs/team-beta-qa-matrix.md`
- `docs/teammate-test-guide.md`
- `docs/metadata-schema.md`
- `docs/tag-taxonomy.md`
- `frontend/lib/taxonomy.ts`
- `frontend/lib/types.ts`
- `frontend/lib/asset-governance.ts`
- `frontend/lib/portal-reuse-decision.ts`
- `frontend/lib/review-evidence.ts`
- `frontend/lib/workflow-policy.ts`

## PM/CTO Verdict

Team Beta can demo the governed workbench, but the demo must make the research-derived TJC risks explicit. The current docs already cover source truth, blocked downloads, queued writeback honesty, preview-only seed, people/youth caution, and master-original protection. The weak spot is not safety posture. The weak spot is whether viewers hear "TJC-only DAM" strongly enough: doctrine/sacrament review, hymn channel clearance, RE/minors consent, testimony pastoral sensitivity, native TJC taxonomy, and stock-safe/context-safe/archive-only tiers.

Internal beta demo must include:

- TJC-only narrative: this is not a generic Christian stock bucket.
- Three reuse tiers: `Stock-safe`, `Context-safe`, `Archive-only`.
- Domain review examples: doctrine/sacrament, hymn/music, minors/RE, testimony/pastoral sensitivity.
- Search smoke terms beyond `Bible`: `RE`, `Religious Education`, `Sabbath Service`, `Hymns of Praise`, `baptism`, `footwashing`, `Holy Communion`, `Holy Spirit`, `testimony`, `children/youth`, `archive-only`.
- Preservation line: ordinary users receive approved derivatives only; masters remain in Google Shared Drive or archive custody.

Internal beta demo must not claim:

- Any visible seed media is reusable or downloadable.
- Raw `Approved Public` equals stock-safe.
- ResourceSpace writeback is live.
- Production SSO is live.
- AI, collection membership, or package membership approves rights.
- The portal owns or replaces Google Shared Drive, ResourceSpace, or the archive.
- Full archive launch means every file is approved.

## Research-Derived Product Requirements

| Requirement | Beta meaning |
|---|---|
| Three-tier reuse | Every asset eventually needs one of `Stock-safe`, `Context-safe`, or `Archive-only`. Beta must at least explain the tiers. |
| Doctrine/sacrament review | Baptism, Holy Spirit, footwashing, Holy Communion, Sabbath, prayer-in-Spirit, and church-identity assets cannot become public-safe without explicit review. |
| Hymn rights/channel clearance | Hymn assets need hymn number/title, rights basis, territory, approved channels, required notice, and music-rights steward review. Public livestream/social use is channel-specific. |
| Minors/RE consent | Religious Education, youth, children, students, class settings, and identifiable minors default restricted until consent/release basis or documented exception exists. |
| Testimony/pastoral sensitivity | Healing, illness, visions, family conversion, spiritual battle, grief, prayer, and pastoral/private testimony assets need sensitivity review; most are context-safe or archive-only by default. |
| TJC-native taxonomy/search | Use `Sabbath Service`, `Evangelical Service`, `Religious Education`/`RE`, `Student Spiritual Convocation`, `Hymns of Praise`, `House of Prayer`, `Publicity Department`, `testimony`, and doctrine terms. Avoid generic "weekend service" or "song library" vocabulary. |
| Preservation masters vs derivatives | Masters/originals stay protected. Users see previews and approved derivatives. Derivative records must preserve parent/master provenance. |
| Resource-level permissions | Collections, packages, brand hubs, and public shelves cannot override item-level rights, sensitivity, or reuse tier. |

## Intended Vs Current Coverage

| Research requirement | Already represented | Missing or weak in demo script | Missing or weak in QA/test guide | Post-beta roadmap |
|---|---|---|---|---|
| Stock-safe/context-safe/archive-only | PRD has US-005. Rights playbook has archive states and raw approval caution. Demo opening mentions public-safe/internal/archive-only. | Demo now says exact tier names and defines each in one sentence. | Manual QA now asks testers to distinguish the three tiers. | Implement explicit `reuse_tier` field and policy checks. |
| Doctrine/sacrament review | PRD has US-006. Rights playbook has sensitive ministry context with baptism, footwashing, Holy Communion, sermon, music, prayer. App has generic sensitive-context blocker. | Demo now names baptism, Holy Spirit, footwashing, Holy Communion, and Sabbath as TJC-specific review examples. | QA guide now includes doctrine/sacrament search and review probes. | Add doctrine fields and doctrine review queue/status. |
| Hymn rights/channel clearance | PRD has US-007. Taxonomy has `hymn` aliases. Rights playbook mentions music. | Demo now explains hymn rights are channel-specific and references Hymns of Praise. | QA guide now includes hymn/music rights probes. | Add hymn number, rights basis, territory, approved channels, required notice, music steward queue. |
| Minors/RE consent | Strongly represented in command center, rights playbook, QA matrix, app blockers, upload, review queues. | Demo now connects this to Religious Education/RE. | QA guide now includes RE/minors probes. | Split minors/consent fields from generic people risk and add release scope. |
| Testimony/pastoral sensitivity | PRD has US-008; demo says pastoral/testimony; rights playbook has pastoral/private and illness/grief. | Demo now includes explicit testimony sensitivity examples. | Manual QA now includes testimony/pastoral sensitivity probe. | Add testimony theme, sensitivity class, pastoral review status, redaction level. |
| TJC-native taxonomy/search | PRD has US-026. `docs/tag-taxonomy.md` and `frontend/lib/taxonomy.ts` support some aliases: Bible, worship/Sabbath service, Bible study/Religious Education, baptism, hymn, children/youth. | Demo now says the search vocabulary is TJC-native. | QA/test guide now includes TJC-native search probes beyond `Bible`. | Expand aliases and facets for `RE`, `Student Spiritual Convocation`, `Hymns of Praise`, `Holy Spirit`, `footwashing`, `Holy Communion`, `Evangelical Service`, `House of Prayer`. |
| Preservation masters vs derivatives | Strongly represented in command center, demo script, rights playbook, PRD, guide, app copy. | Demo now ties this to preservation, not only privacy. | QA now covers master-vs-derivative download and derivative provenance. | Derivative manifest and archive custody audit. |

## No-Go Criteria

Demo no-go:

- Presenter cannot explain why this is TJC-only rather than generic stock media.
- Demo skips the three-tier reuse model.
- Demo claims any current seed asset is reusable/downloadable without reviewer signoff.
- Demo does not mention doctrine/sacrament, hymn/music, minors/RE, testimony/pastoral, and archive/master risks.
- Demo shows `Approved Public` as equivalent to `Portal Ready`.
- Demo implies ResourceSpace live writeback, production SSO, production S3 delivery, or master/original access.

Invite no-go:

- Rights/media reviewer has not signed off preview-only visibility or scrubbed seed.
- Private URL sharing owner is missing.
- Hosted writeback mode is not confirmed disabled/queued.
- Stop-test incident owner is missing.
- Any Viewer/Contributor sees source path, master path, checksum, private URL, ResourceSpace admin internals, or source custody detail.
- Any blocked, needs-review, possible-minors, archive-only, or do-not-use asset downloads.

Production no-go:

- No explicit `reuse_tier`.
- No ResourceSpace field-map verifier for research-derived fields.
- No production identity/SSO.
- No durable pending write/audit storage.
- No live writeback proof on staging record.
- No derivative manifest or approved-copy delivery architecture.
- No clean-host restore proof.
- No named doctrine, music rights, minors/consent, testimony/pastoral, and archive reviewer roster.
