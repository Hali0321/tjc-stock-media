# Tag Taxonomy

## Rule

Keep visual tags separate from church-context terms.

Visual tags describe what is visible:

- Bible
- book
- flower
- plant
- fountain
- water
- stage
- people
- landscape

TJC terms describe ministry meaning:

- worship
- Bible study
- fellowship
- teaching
- welcome
- baptism
- prayer
- hymn

## Search Policy

Use one canonical label for the stored tag, then support common aliases in deterministic search.

Example:

```text
Canonical: Bible
Search aliases: scripture, open Bible, word of God
```

This keeps metadata clean while still allowing natural search. Do not store every spelling variation as a separate final tag.

Alias source of truth lives in `frontend/lib/taxonomy.ts` as `taxonomyAliasGroups`. `frontend/lib/catalog-discovery.ts` consumes that list for search expansion, suggested filters, and no-result recovery help. Add ministry-language aliases there first; do not mutate asset metadata to improve recall.

Initial deterministic alias coverage:

- Bible: scripture, open Bible, word of God
- worship: service, Sabbath service, church service, sanctuary
- Bible study: study, lesson, class, teaching, Religious Education, RE
- fellowship: church life, gathering, meal, community
- welcome: hospitality, greeter, visitors, entrance
- baptism: water baptism, sacrament, testimony
- footwashing: sacrament, washing of feet
- Holy Communion: communion, sacrament, Lord's supper
- Holy Spirit: speaking in tongues, prayer in the Spirit
- prayer: pray, kneeling, altar
- Evangelical Service: evangelism, gospel service, outreach
- testimony: personal testimony, healing, illness, vision, spiritual battle, family conversion
- hymn: hymnal, music, singing, choir, Hymns of Praise
- children/youth: children, kids, youth, teens, minors, students
- archive-only: archive, historical record, preservation, reference only
- stock-safe: portal ready, broad reuse, reusable library media
- context-safe: original context, limited channel, internal use
- landscape: wide, horizontal, banner, hero, header, background
- stage: platform, pulpit, podium, sanctuary front
- flower: flowers, floral, arrangement, seasonal detail, decoration

## Review Policy

AI may suggest tags. Humans approve final tags.

Rights status and usage scope are not tags. Keep them as controlled review fields.
