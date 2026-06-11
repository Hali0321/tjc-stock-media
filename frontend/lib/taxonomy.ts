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
  visibleTags: ["Bible", "book", "flower", "plant", "fountain", "water", "stage", "people", "landscape"],
  tjcTerms: ["worship", "Bible study", "fellowship", "teaching", "welcome", "baptism", "prayer", "hymn"]
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
    aliases: ["service", "sabbath service", "church service", "praise", "sanctuary"],
    searchBoosts: ["stage", "sermon", "hymn", "prayer"]
  },
  {
    canonical: "Bible study",
    aliases: ["study", "lesson", "class", "teaching", "religious education"],
    searchBoosts: ["Bible", "scripture", "sermon", "slide"]
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
    canonical: "prayer",
    aliases: ["pray", "kneeling", "altar", "spiritual practice"],
    searchBoosts: ["worship", "service", "review"]
  },
  {
    canonical: "hymn",
    aliases: ["hymnal", "music", "singing", "choir", "song"],
    searchBoosts: ["worship", "service", "stage"]
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
