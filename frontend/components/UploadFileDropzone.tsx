"use client";

import { useState, type DragEvent, type RefObject } from "react";
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

export function UploadFileDropzone({
  inputRef,
  selectedFiles,
  onInputFiles,
  onDropFiles,
  onRemove,
  onClear
}: UploadFileDropzoneProps) {
  const [dragging, setDragging] = useState(false);

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
          "grid min-h-36 cursor-pointer place-items-center rounded-md border border-dashed border-tjc-line bg-[#fbfcfa] p-4 text-center transition focus-within:border-[#0f4f45] focus-within:ring-2 focus-within:ring-[#9bc5b5]",
          dragging && "border-[#9bc5b5] bg-[#eef7f1] shadow-[inset_0_0_0_1px_rgba(18,63,58,.18)]"
        )}
        onDragEnter={(event) => handleDrag(event, true)}
        onDragOver={(event) => handleDrag(event, true)}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <span className="grid justify-items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-md border border-tjc-line bg-white text-tjc-evergreen">
            <UploadCloud size={20} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold text-tjc-ink">{dragging ? "Release to add files" : "Drop files here or browse"}</span>
          <span id="upload-file-help" className="max-w-[28rem] text-xs leading-relaxed text-tjc-muted">
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
        <section className="rounded-md border border-tjc-line bg-[#fbfcfa] p-3" aria-label="Selected file preview">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-tjc-ink">{selectedFiles.length} selected file{selectedFiles.length === 1 ? "" : "s"}</h3>
            <button className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-tjc-line bg-white px-2.5 text-xs font-semibold text-tjc-evergreen transition hover:bg-[#f3f6f2]" type="button" onClick={onClear}>
              <Trash2 size={13} strokeWidth={1.8} aria-hidden="true" />
              Clear files
            </button>
          </div>
          <div className="mt-2 grid gap-2">
            {selectedFiles.map((file, index) => {
              const tooLarge = file.size > LARGE_MEDIA_BYTES;
              return (
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-md border border-tjc-line bg-white px-2.5 py-2" key={`${file.name}-${file.size}-${index}`}>
                  {tooLarge ? <ShieldAlert size={16} strokeWidth={1.8} className="text-[#725216]" aria-hidden="true" /> : <FileCheck2 size={16} strokeWidth={1.8} className="text-tjc-evergreen" aria-hidden="true" />}
                  <span className="min-w-0">
                    <strong className="block truncate text-xs font-semibold text-tjc-ink">{file.name}</strong>
                    <span className="mt-0.5 block text-[11px] font-medium text-tjc-muted">{file.type || "unknown type"} / {formatBytes(file.size)}{tooLarge ? " / use Shared Drive Incoming" : ""}</span>
                  </span>
                  <button className="grid h-8 w-8 place-items-center rounded-md text-tjc-muted transition hover:bg-[#f3f6f2] hover:text-tjc-red" type="button" onClick={() => onRemove(index)} aria-label={`Remove ${file.name}`}>
                    <Trash2 size={14} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {selectedFiles.some((file) => file.size > LARGE_MEDIA_BYTES) ? (
        <div className="rounded-lg border border-[#ead6a8] bg-[#fff8e8] p-3 text-sm font-semibold text-[#725216]">{uploadDefaultState.largeMediaMessage}</div>
      ) : null}
    </section>
  );
}
