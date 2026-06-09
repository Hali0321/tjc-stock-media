import type { MediaSourceStatus, StockMediaAsset } from "@/lib/types";

export const demoFallbackStatus: MediaSourceStatus = {
  adapter: "demo-fallback",
  label: "Read-only media index",
  detail: "Media export not found. These records are read-only fallback entries behind the server route contract.",
  readOnly: true
};

export const demoFallbackAssets: StockMediaAsset[] = [
  {
    id: "media-bible-study-001",
    title: "Bible Study Table",
    thumbnail: "",
    thumbnailAlt: "Bible on a study table",
    mediaType: "photo",
    collection: "Teaching & Study",
    status: "Approved Public",
    usageScope: "Public",
    peopleRisk: "No people",
    reviewer: "ResourceSpace admin",
    reviewedDate: "2026-06-04",
    rightsNotes: "Fallback entry used only when the media export is unavailable.",
    usageGuidance: "Approved copy available.",
    downloadPolicy: "approved-copy-allowed",
    tags: ["Bible", "book", "study"],
    tjcTerms: ["Teaching", "Bible study"]
  },
  {
    id: "media-intake-review-001",
    title: "Fellowship Upload Pending",
    thumbnail: "",
    thumbnailAlt: "Pending fellowship review",
    mediaType: "photo",
    collection: "Incoming",
    status: "Needs Review",
    usageScope: "Do Not Publish",
    peopleRisk: "Adults visible",
    rightsNotes: "Needs reviewer approval before use.",
    usageGuidance: "Reviewer approval required before use.",
    downloadPolicy: "not-downloadable",
    tags: ["people", "table"],
    tjcTerms: ["Fellowship"]
  }
];
