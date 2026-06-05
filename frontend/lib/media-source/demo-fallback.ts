import type { MediaSourceStatus, StockMediaAsset } from "@/lib/types";

export const demoFallbackStatus: MediaSourceStatus = {
  adapter: "demo-fallback",
  label: "Temporary fallback data",
  detail: "ResourceSpace export not found. These records are safe placeholders behind the real server route contract.",
  readOnly: true
};

export const demoFallbackAssets: StockMediaAsset[] = [
  {
    id: "demo-bible",
    title: "Bible Study Table",
    thumbnail: "",
    thumbnailAlt: "Bible on a study table placeholder",
    mediaType: "photo",
    collection: "Teaching & Study",
    status: "Approved Public",
    usageScope: "Public",
    peopleRisk: "No people",
    reviewer: "ResourceSpace admin",
    reviewedDate: "2026-06-04",
    rightsNotes: "Fallback placeholder used only when ResourceSpace export is unavailable.",
    usageGuidance: "Approved copy available.",
    downloadPolicy: "approved-copy-allowed",
    tags: ["Bible", "book", "study"],
    tjcTerms: ["Teaching", "Bible study"]
  },
  {
    id: "demo-review",
    title: "Fellowship Upload Pending",
    thumbnail: "",
    thumbnailAlt: "Pending fellowship placeholder",
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
