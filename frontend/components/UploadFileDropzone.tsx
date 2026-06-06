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
          "grid min-h-64 cursor-pointer place-items-center rounded-[1.15rem] border border-dashed border-[#85a898] bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,.18),transparent_32%),linear-gradient(180deg,#17211d,#111a17)] p-6 text-center text-white shadow-[0_26px_72px_rgba(7,16,13,.18),inset_0_1px_0_rgba(255,255,255,.12)] transition focus-within:border-[#9bd2b3] focus-within:ring-2 focus-within:ring-[#9bc5b5]",
          dragging && "scale-[1.01] border-[#9bd2b3] bg-[#102d28] shadow-[0_30px_78px_rgba(6,63,57,.22),inset_0_0_0_1px_rgba(155,210,179,.25)]"
        )}
        onDragEnter={(event) => handleDrag(event, true)}
        onDragOver={(event) => handleDrag(event, true)}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <span className="grid justify-items-center gap-2">
          <span className="grid h-16 w-16 place-items-center rounded-2xl border border-white/16 bg-white/10 text-white shadow-[0_14px_30px_rgba(0,0,0,.18)]">
            <UploadCloud size={25} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="text-lg font-black text-white">{dragging ? "Release to add files" : "Drop files here or browse"}</span>
          <span id="upload-file-help" className="max-w-[28rem] text-sm font-semibold leading-relaxed text-white/62">
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
        <section className="rounded-2xl border border-[#b8c8bf] bg-white p-3 shadow-[0_1px_0_rgba(255,255,255,.9)_inset,0_18px_48px_rgba(25,34,29,.1)]" aria-label="Selected file preview">
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
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-xl border border-[#c9d5cd] bg-[#fbfcfa] px-3 py-3 shadow-[0_1px_0_rgba(255,255,255,.9)_inset]" key={`${file.name}-${file.size}-${index}`}>
                  {tooLarge ? <ShieldAlert size={16} strokeWidth={1.8} className="text-[#725216]" aria-hidden="true" /> : <FileCheck2 size={16} strokeWidth={1.8} className="text-tjc-evergreen" aria-hidden="true" />}
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
