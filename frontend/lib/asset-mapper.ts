import type { StockMediaAsset } from "@/lib/types";

type Row = Record<string, string>;

function splitList(value?: string) {
  return (value || "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function titleCase(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function cleanDisplayTitle(row: Row, fallback: string) {
  const original = row.original_filename || fallback;
  const tags = splitList(row.visible_content_tags || row.human_tags_final);
  const tjcTerms = splitList(row.tjc_terms);
  let base = fallback
    .replace(/^copy of\s+/i, "")
    .replace(/\.(jpe?g|png|heic|heif|gif|tif|tiff|mp4|mov|m4v|mp3|wav|m4a|aac|flac)$/i, "")
    .replace(/已增强-降噪-\d+$/i, "")
    .replace(/[a-f0-9]{8}-[a-f0-9-]{20,}/gi, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const longNumericSuffix = base.match(/^(.*?)\s+\d{8,}\s*o?$/i);
  if (longNumericSuffix) {
    base = longNumericSuffix[1].replace(/^\d+\s+/, "").trim() || base;
  }
  const letters = (base.match(/[a-z]/gi) || []).length;
  const digits = (base.match(/\d/g) || []).length;
  const archiveContext = row.source_album || row.import_batch || row.event_or_topic || "Archive";

  if (/^_?DSC0*\d+/i.test(base)) {
    const serial = base.match(/\d+/)?.[0]?.replace(/^0+/, "") || "";
    return `MVP 2024 Photo${serial ? ` ${serial}` : ""}`;
  }

  if (/^(?:[a-f0-9]{8,}|[a-f0-9]{6,}\s+version\s+\d+|[a-f0-9]{6,}\s+\d{8,})/i.test(base)) {
    return `${archiveContext} Photo ${row.resource_id || row.resourcespace_ref || ""}`.trim();
  }

  if ((digits >= 1 && letters <= 2) || (digits >= 8 && letters < 6)) {
    return `${archiveContext} Photo ${row.resource_id || row.resourcespace_ref || ""}`.trim();
  }

  if (/^\d?[a-z0-9]{5,}$/i.test(base) && !/[aeiou].*[aeiou]/i.test(base)) {
    return `${archiveContext} Photo ${row.resource_id || row.resourcespace_ref || ""}`.trim();
  }

  if (/^[A-Z0-9-]{12,}$/i.test(base) || base.length < 3) {
    const context = [...tjcTerms, ...tags].find((item) => !/stock media candidate|mvp 2024/i.test(item));
    return context ? `MVP 2024 ${titleCase(context)}` : `MVP 2024 Asset ${row.resource_id || row.resourcespace_ref || ""}`.trim();
  }

  if (/^bible\s+\d+/i.test(base)) return titleCase(base);
  if (/^beach\s+\d+/i.test(base)) return titleCase(base);
  if (/bench bible/i.test(original)) return "Bench Bible";

  return titleCase(base);
}

function inferStatus(row: Row): StockMediaAsset["status"] {
  const raw = row.publish_status?.trim();
  if (raw === "Approved Public" || raw === "Approved Internal" || raw === "Needs Review" || raw === "Do Not Use") {
    return raw;
  }
  if (raw === "Archive - Not Promoted") return "Searchable Archive";
  if (row.minors_visible === "Yes" || row.children_visible === "Yes") return "Possible Minors";
  if ((row.public_safe || "").toLowerCase() === "yes" && /public/i.test(row.usage_scope || "")) {
    return "Approved Public";
  }
  if ((row.public_safe || "").toLowerCase() === "yes" && /internal/i.test(row.usage_scope || "")) {
    return "Approved Internal";
  }
  return "Needs Review";
}

function inferUsageScope(row: Row): StockMediaAsset["usageScope"] {
  const raw = row.usage_scope?.trim();
  if (raw === "Public" || raw === "Internal" || raw === "Public and Internal" || raw === "Archive Only" || raw === "Do Not Use") {
    return raw;
  }
  if (/public.*internal/i.test(raw || "")) return "Public and Internal";
  if (/internal/i.test(raw || "")) return "Internal";
  if (/archive/i.test(raw || "")) return "Archive Only";
  return "Do Not Publish";
}

function inferMediaType(row: Row): StockMediaAsset["mediaType"] {
  const raw = (row.media_type || "").toLowerCase();
  const ext = (row.file_extension || row.original_extension || "").toLowerCase();
  if (raw.includes("video") || ["mp4", "mov", "m4v"].includes(ext)) return "video";
  if (raw.includes("audio") || ["mp3", "wav", "m4a", "aac", "flac"].includes(ext)) return "audio";
  if (raw.includes("graphic") || ["pdf", "psd", "ai", "svg"].includes(ext)) return "graphic";
  if (["doc", "docx", "txt"].includes(ext)) return "document";
  return "photo";
}

function inferPeopleRisk(row: Row): StockMediaAsset["peopleRisk"] {
  if (row.minors_visible === "Yes" || row.children_visible === "Yes") return "Possible minors";
  if (row.people_visible === "Yes") return "Adults visible";
  if (row.people_visible === "No") return "No people";
  return "Unknown";
}

function inferDownloadPolicy(status: StockMediaAsset["status"]): StockMediaAsset["downloadPolicy"] {
  if (status === "Approved Public") return "approved-copy-allowed";
  if (status === "Approved Internal") return "internal-approved-copy-allowed";
  return "not-downloadable";
}

export function mapMetadataRowToAsset(row: Row): StockMediaAsset {
  const id = row.resource_id || row.resourcespace_ref || row.canonical_asset_id;
  const status = inferStatus(row);
  const rawTitle = row.human_title_final || row.title || row.original_filename || `Resource ${id}`;
  const title = cleanDisplayTitle(row, rawTitle);
  const collection = row.source_album || row.import_batch || row.event_or_topic || "ResourceSpace export";
  const fileSizeBytes = Number(row.file_size || row.original_file_size_bytes || 0) || undefined;

  return {
    id,
    title,
    thumbnail: `/api/assets/thumbnail/${id}?variant=thumb`,
    thumbnailAlt: `${title} thumbnail`,
    preview: `/api/assets/thumbnail/${id}?variant=preview`,
    mediaType: inferMediaType(row),
    collection,
    status,
    usageScope: inferUsageScope(row),
    visibility: status === "Approved Public" ? "public" : status === "Approved Internal" ? "internal" : "reviewer",
    peopleRisk: inferPeopleRisk(row),
    reviewer: row.reviewed_by || undefined,
    reviewedDate: row.reviewed_date || undefined,
    rightsNotes: row.approval_notes || row.notes || undefined,
    usageGuidance:
      status === "Approved Public"
        ? "Approved copy available for public and internal ministry use."
        : status === "Approved Internal"
          ? "Approved for internal ministry use only."
          : "Reviewer approval required before use.",
    downloadPolicy: inferDownloadPolicy(status),
    resourceSpaceId: row.resource_id || row.resourcespace_ref || undefined,
    sourcePath: row.source_path || undefined,
    masterDrivePath: row.master_drive_path || undefined,
    originalFilename: row.original_filename || undefined,
    fileExtension: row.file_extension || row.original_extension || undefined,
    fileSizeBytes,
    tags: splitList(row.visible_content_tags || row.human_tags_final),
    tjcTerms: splitList(row.tjc_terms)
  };
}
