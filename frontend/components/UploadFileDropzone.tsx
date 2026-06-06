"use client";

import { useEffect, useState, type DragEvent, type RefObject } from "react";
import { FileCheck2, ShieldAlert, Trash2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/ui";
import { LARGE_MEDIA_BYTES, uploadDefaultState } from "@/lib/workflow-policy";

type UploadFileDropzoneProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  selectedFiles: File[];
  onInputFiles: (files: FileList | null) => void;
  onDropFiles: (files: File[]) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
};

function formatBytes(value: number) {
  if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(value / 1024)).toLocaleString()} KB`;
}

function useImageUpload(files: File[]) {
  const [previews, setPreviews] = useState<Array<{ index: number; url: string }>>([]);

  useEffect(() => {
    const nextPreviews = files
      .map((file, index) => file.type.startsWith("image/") ? { index, url: URL.createObjectURL(file) } : null)
      .filter((item): item is { index: number; url: string } => Boolean(item));
    setPreviews(nextPreviews);
    return () => nextPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [files]);

  return previews;
}

export function UploadFileDropzone({
  inputRef,
  selectedFiles,
  onInputFiles,
  onDropFiles,
  onRemove,
  onClear
}: UploadFileDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const imagePreviews = useImageUpload(selectedFiles);
  const imagePreviewByIndex = new Map(imagePreviews.map((preview) => [preview.index, preview.url]));

  function handleDrag(event: DragEvent<HTMLElement>, active: boolean) {
    event.preventDefault();
    setDragging(active);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    const dropped = Array.from(event.dataTransfer.files || []);
    if (dropped.length) onDropFiles(dropped);
  }

  return (
    <section
      className="grid gap-3"
      aria-label="File upload and preview"
      onDragEnter={(event) => handleDrag(event, true)}
      onDragOver={(event) => handleDrag(event, true)}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
      }}
    >
      <label
        className={cn(
          "grid min-h-64 cursor-pointer place-items-center rounded-lg border border-dashed border-[#85a898] bg-[#f7faf7] p-6 text-center text-tjc-ink transition focus-within:border-[#0b4b42] focus-within:ring-2 focus-within:ring-[#9bc5b5]",
          dragging && "scale-[1.01] border-[#0b4b42] bg-[#eef7f1]"
        )}
        onDragEnter={(event) => handleDrag(event, true)}
        onDragOver={(event) => handleDrag(event, true)}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <span className="grid justify-items-center gap-2">
          <span className="grid h-16 w-16 place-items-center rounded-lg border border-[#c4d5ca] bg-white text-tjc-evergreen">
            <UploadCloud size={25} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="text-lg font-black text-tjc-ink">{dragging ? "Release to add files" : "Drop files here or browse"}</span>
          <span id="upload-file-help" className="max-w-[28rem] text-sm font-semibold leading-relaxed text-tjc-muted">
            Photos, graphics, documents, video, and audio still enter Needs Review / Do Not Publish. Large media uses Shared Drive Incoming.
          </span>
        </span>
        <input
          ref={inputRef}
          aria-label="Files"
          aria-describedby="upload-file-help"
          className="sr-only"
          name="files"
          type="file"
          multiple
          onChange={(event) => onInputFiles(event.currentTarget.files)}
        />
      </label>

      {selectedFiles.length ? (
        <section className="rounded-lg border border-[#b8c8bf] bg-white p-3" aria-label="Selected file preview">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-tjc-ink">{selectedFiles.length} selected file{selectedFiles.length === 1 ? "" : "s"}</h3>
            <button className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-tjc-line bg-white px-2.5 text-xs font-semibold text-tjc-evergreen transition hover:bg-[#f3f6f2]" type="button" onClick={onClear}>
              <Trash2 size={13} strokeWidth={1.8} aria-hidden="true" />
              Clear files
            </button>
          </div>
          <div className="mt-2 grid gap-2">
            {selectedFiles.map((file, index) => {
              const tooLarge = file.size > LARGE_MEDIA_BYTES;
              return (
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-[#d6dfd8] px-1 py-3 last:border-b-0" key={`${file.name}-${file.size}-${index}`}>
                  {imagePreviewByIndex.has(index) ? (
                    <img className="h-12 w-12 rounded-md border border-[#d6dfd8] object-cover" src={imagePreviewByIndex.get(index)} alt="" />
                  ) : tooLarge ? (
                    <ShieldAlert size={16} strokeWidth={1.8} className="text-[#725216]" aria-hidden="true" />
                  ) : (
                    <FileCheck2 size={16} strokeWidth={1.8} className="text-tjc-evergreen" aria-hidden="true" />
                  )}
                  <span className="min-w-0">
                    <strong className="block truncate text-xs font-semibold text-tjc-ink">{file.name}</strong>
                    <span className="mt-0.5 block text-[11px] font-medium text-tjc-muted">{file.type || "unknown type"} / {formatBytes(file.size)}{tooLarge ? " / use Shared Drive Incoming" : ""}</span>
                  </span>
                  <button className="grid h-8 w-8 place-items-center rounded-lg text-tjc-muted transition hover:bg-[#f3f6f2] hover:text-tjc-red" type="button" onClick={() => onRemove(index)} aria-label={`Remove ${file.name}`}>
                    <Trash2 size={14} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {selectedFiles.some((file) => file.size > LARGE_MEDIA_BYTES) ? (
        <div className="rounded-xl border border-[#ead6a8] bg-[#fff8e8] p-3 text-sm font-semibold text-[#725216]">{uploadDefaultState.largeMediaMessage}</div>
      ) : null}
    </section>
  );
}
