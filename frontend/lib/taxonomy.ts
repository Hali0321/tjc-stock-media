export const filterChips = [
  "Church-wide use",
  "Internal ministry",
  "Photo",
  "Video",
  "Graphic",
  "No people",
  "Adults only",
  "Children/youth",
  "Worship",
  "Teaching",
  "Fellowship",
  "Seasonal",
  "2026"
];

export const featuredCollections = [
  {
    name: "Sabbath",
    description: "Worship, service, and church life",
    searchQuery: "Bible worship fellowship",
    terms: ["sabbath", "worship", "bible", "scripture", "church", "service", "sermon", "fellowship"]
  },
  {
    name: "Teaching & Study",
    description: "Bible study, lessons, and teaching details",
    searchQuery: "Bible teaching study",
    terms: ["teaching", "study", "bible", "scripture", "lesson"]
  },
  {
    name: "Seasonal Details",
    description: "Flowers, plants, and ministry textures",
    searchQuery: "flowers seasonal plant",
    terms: ["seasonal", "flower", "flowers", "plant", "detail"]
  },
  {
    name: "Welcome Team",
    description: "Hospitality and gathering details",
    searchQuery: "welcome fellowship church",
    terms: ["welcome", "fellowship", "church", "people", "hospitality"]
  },
  {
    name: "Fellowship",
    description: "Church life and ministry gathering",
    searchQuery: "fellowship church life",
    terms: ["fellowship", "church life", "gathering", "people"]
  },
  {
    name: "Website Graphics",
    description: "Graphics, slides, and web-ready assets",
    searchQuery: "graphic slide website",
    terms: ["graphic", "graphics", "slide", "website", "stage"]
  },
  {
    name: "Approved Public",
    description: "Cleared for church-wide use",
    searchQuery: "Approved Public",
    terms: ["approved public", "public"]
  },
  {
    name: "Recently Approved",
    description: "Freshly reviewed assets",
    searchQuery: "",
    terms: ["recently approved", "approved"]
  }
];

export const canonicalTags = {
  visibleTags: ["Bible", "book", "flower", "plant", "fountain", "water", "stage", "people", "landscape", "choir", "classroom", "warm", "welcoming"],
  tjcTerms: ["Sabbath Service", "Religious Education", "Evangelical Service", "Testimony", "Hymns of Praise", "worship", "Bible study", "fellowship", "teaching", "welcome", "baptism", "prayer", "hymn"]
};

export type TaxonomyAliasGroup = {
  canonical: string;
  aliases: string[];
  searchBoosts?: string[];
  filters?: string[];
};

export const taxonomyAliasGroups: TaxonomyAliasGroup[] = [
  {
    canonical: "Bible",
    aliases: ["scripture", "open bible", "word of god", "word", "book"],
    searchBoosts: ["teaching", "study", "sermon", "slide"]
  },
  {
    canonical: "worship",
    aliases: ["service", "sabbath", "sabbath service", "church service", "praise", "sanctuary"],
    searchBoosts: ["stage", "sermon", "hymn", "prayer"]
  },
  {
    canonical: "Sabbath Service",
    aliases: ["sabbath", "sabbath worship", "service", "church service"],
    searchBoosts: ["worship", "Bible", "fellowship", "sermon"],
    filters: ["worship"]
  },
  {
    canonical: "Bible study",
    aliases: ["study", "lesson", "class", "teaching", "religious education", "re"],
    searchBoosts: ["Bible", "scripture", "sermon", "slide"]
  },
  {
    canonical: "Religious Education",
    aliases: ["re", "religious ed", "religious education", "children class", "lesson"],
    searchBoosts: ["Bible study", "teaching", "children/youth", "classroom"],
    filters: ["teaching"]
  },
  {
    canonical: "fellowship",
    aliases: ["church life", "gathering", "meal", "potluck", "community"],
    searchBoosts: ["welcome", "hospitality", "people"]
  },
  {
    canonical: "welcome",
    aliases: ["hospitality", "greeter", "visitors", "entrance", "front desk"],
    searchBoosts: ["fellowship", "church life", "people"]
  },
  {
    canonical: "baptism",
    aliases: ["water baptism", "sacrament", "testimony"],
    searchBoosts: ["water", "worship", "review"]
  },
  {
    canonical: "Evangelical Service",
    aliases: ["evangelical", "evangelism", "gospel service", "outreach", "evangelical service"],
    searchBoosts: ["worship", "testimony", "welcome"],
    filters: ["worship"]
  },
  {
    canonical: "Testimony",
    aliases: ["testimony", "personal testimony", "healing", "illness", "vision", "spiritual battle", "family conversion"],
    searchBoosts: ["review", "context-safe", "sensitive"],
    filters: ["needs review"]
  },
  {
    canonical: "prayer",
    aliases: ["pray", "kneeling", "altar", "spiritual practice"],
    searchBoosts: ["worship", "service", "review"]
  },
  {
    canonical: "hymn",
    aliases: ["hymnal", "music", "singing", "choir", "song", "hymns of praise"],
    searchBoosts: ["worship", "service", "stage"]
  },
  {
    canonical: "Hymns of Praise",
    aliases: ["hymn", "hymnal", "music", "singing", "choir", "song"],
    searchBoosts: ["worship", "service", "stage", "rights review"],
    filters: ["needs review"]
  },
  {
    canonical: "stock-safe",
    aliases: ["portal ready", "public approved", "broad reuse", "ready to use", "reusable library media"],
    searchBoosts: ["Approved Public", "Public", "website", "newsletter"],
    filters: ["approved public", "portal ready"]
  },
  {
    canonical: "context-safe",
    aliases: ["original context", "limited channel", "internal use", "review before reuse"],
    searchBoosts: ["Needs Review", "Internal", "sensitive"],
    filters: ["needs review"]
  },
  {
    canonical: "archive-only",
    aliases: ["archive", "historical record", "preservation", "reference only", "archive only"],
    searchBoosts: ["Searchable Archive", "Archive Only"],
    filters: ["archive only"]
  },
  {
    canonical: "children/youth",
    aliases: ["children", "kids", "youth", "teen", "teens", "minor", "minors", "student", "students"],
    searchBoosts: ["people", "possible minors", "review"],
    filters: ["children/youth", "needs review"]
  },
  {
    canonical: "landscape",
    aliases: ["wide", "horizontal", "banner", "hero", "header", "background"],
    searchBoosts: ["website", "slide", "no people"],
    filters: ["landscape", "no people"]
  },
  {
    canonical: "stage",
    aliases: ["platform", "pulpit", "podium", "sanctuary front"],
    searchBoosts: ["worship", "sermon", "slide"]
  },
  {
    canonical: "flower",
    aliases: ["flowers", "floral", "arrangement", "seasonal detail", "decoration"],
    searchBoosts: ["plant", "detail", "newsletter", "background"]
  }
];
