"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock3, FileCheck2, FolderInput, ShieldCheck, UploadCloud } from "lucide-react";
import { InputWithTags } from "@/components/InputWithTags";
import { useDemoRole } from "@/components/RoleProvider";
import { UploadFileDropzone } from "@/components/UploadFileDropzone";
import { UploadIntakePacket } from "@/components/UploadIntakePacket";
import { canUpload } from "@/lib/permissions";
import { uploadTagSuggestions } from "@/lib/upload-tags";
import { LARGE_MEDIA_BYTES, uploadDefaultState } from "@/lib/workflow-policy";

type UploadReceipt = {
  status?: string;
  defaultReviewState?: string;
  message?: string;
  eventName?: string;
  fileCount?: number;
  sourceLink?: string | null;
  reviewWarnings?: string[];
};

const inputClass = "min-h-10 w-full min-w-0 rounded-xl border border-tjc-line bg-white px-3 text-sm font-medium text-tjc-ink placeholder:text-[#858f87]";
const labelClass = "grid gap-2 text-sm font-semibold text-tjc-ink";
const requiredHint = <span className="text-xs font-semibold text-[#7a5a19]">Required</span>;

export function UploadPage() {
  const { role, ready } = useDemoRole();
  const [message, setMessage] = useState("");
  const [largeWarning, setLargeWarning] = useState("");
  const [receipt, setReceipt] = useState<UploadReceipt | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [suggestedTags, setSuggestedTags] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allowed = ready && canUpload(role);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setReceipt(null);
    const form = new FormData(event.currentTarget);
    form.delete("files");
    selectedFiles.forEach((file) => form.append("files", file));
    form.set("role", role);
    const response = await fetch("/api/upload", { method: "POST", body: form });
    const body = await response.json();
    setMessage(body.message || body.error || "Upload intake checked.");
    if (response.ok) setReceipt(body);
  }

  function checkFiles(files: FileList | null) {
    const nextFiles = Array.from(files || []);
    setSelectedFiles(nextFiles);
    const hasLarge = nextFiles.some((file) => file.size > LARGE_MEDIA_BYTES);
    setLargeWarning(hasLarge ? uploadDefaultState.largeMediaMessage : "");
  }

  function syncFileInput(nextFiles: File[]) {
    if (fileInputRef.current && typeof DataTransfer !== "undefined") {
      try {
        const transfer = new DataTransfer();
        nextFiles.forEach((file) => transfer.items.add(file));
        fileInputRef.current.files = transfer.files;
      } catch {
        fileInputRef.current.value = "";
      }
    }
    setSelectedFiles(nextFiles);
    const hasLarge = nextFiles.some((file) => file.size > LARGE_MEDIA_BYTES);
    setLargeWarning(hasLarge ? uploadDefaultState.largeMediaMessage : "");
  }

  function addDroppedFiles(files: File[]) {
    syncFileInput([...selectedFiles, ...files]);
  }

  function removeFile(index: number) {
    syncFileInput(selectedFiles.filter((_, fileIndex) => fileIndex !== index));
  }

  function clearFiles() {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSelectedFiles([]);
    setLargeWarning("");
  }

  if (!ready) {
    return <div className="px-3 py-5 md:px-5"><div className="skeleton h-[70dvh] rounded-lg" /></div>;
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-5xl px-3 py-5 md:px-5">
        <section className="min-w-0 dam-card p-5">
          <span className="text-sm font-semibold text-tjc-evergreen">Contributor intake</span>
          <h1 className="mt-2 dam-page-title">Upload is for Contributors</h1>
          <p className="mt-2 max-w-[64ch] text-base leading-relaxed text-tjc-muted">Contributors provide context, people and rights information, files, tags, and notes. New media starts blocked until reviewer approval.</p>
        </section>
        <section className="mt-4 grid grid-cols-[auto_1fr] gap-4 dam-card p-5">
          <UploadCloud size={30} strokeWidth={1.8} aria-hidden="true" className="text-tjc-evergreen" />
          <div>
            <h2 className="text-xl font-semibold">Contribution flow</h2>
            <p className="mt-1 text-tjc-muted">Context first, then people and rights, then files and tags. Reviewers approve before anyone can reuse media.</p>
            <span className="mt-3 block rounded-md bg-[#eef7f1] px-3 py-2 text-sm font-semibold text-tjc-evergreen">Use role switch to Contributor, Reviewer, or DAM Admin to open intake.</span>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="dam-shell max-w-[1600px]">
      <section className="dam-studio grid gap-5 p-4 md:p-5 lg:grid-cols-[minmax(0,1fr)_38rem]">
        <div>
          <span className="text-sm font-semibold text-tjc-evergreen">Contributor intake</span>
          <h1 className="mt-2 dam-page-title">Upload for review</h1>
          <p className="mt-2 max-w-[64ch] text-base font-semibold leading-relaxed text-tjc-muted">{uploadDefaultState.message}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3" aria-label="Upload workflow">
          {[
            { icon: UploadCloud, title: "Context", body: "Event, date, ministry, source." },
            { icon: ShieldCheck, title: "People and rights", body: "Visibility, consent, restrictions." },
            { icon: FileCheck2, title: "Files and tags", body: "Upload, tag, receive review state." }
          ].map((step) => {
            const Icon = step.icon;
            return (
              <div className="dam-inspector p-3" key={step.title}>
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" className="text-tjc-evergreen" />
                <strong className="mt-2 block font-black">{step.title}</strong>
                <span className="mt-1 block text-sm font-semibold text-tjc-muted">{step.body}</span>
              </div>
            );
          })}
        </div>
      </section>

      <form className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_27rem]" onSubmit={submit}>
        <section className="dam-inspector min-w-0 self-start p-4">
          <div className="mb-4">
            <h2 className="text-lg font-black">1. Context</h2>
            <p className="text-sm font-semibold text-tjc-muted">Help reviewers understand where this media came from.</p>
          </div>
          <label className={labelClass}>
            <span className="flex items-center justify-between gap-2">Title {requiredHint}</span>
            <input className={inputClass} name="title" placeholder="Bible study fellowship photos" required />
          </label>
          <label className={`${labelClass} mt-4`}>
            <span className="flex items-center justify-between gap-2">Event name {requiredHint}</span>
            <input className={inputClass} name="eventName" placeholder="MVP worship workshop" required />
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className="flex items-center justify-between gap-2">Event date {requiredHint}</span>
              <input className={inputClass} name="eventDate" type="date" defaultValue={today} required />
            </label>
            <label className={labelClass}>
              <span className="flex items-center justify-between gap-2">Ministry/team {requiredHint}</span>
              <input className={inputClass} name="ministry" placeholder="Internet Ministry" required />
            </label>
          </div>
          <label className={`${labelClass} mt-4`}>
            <span className="flex items-center justify-between gap-2">Source / photographer {requiredHint}</span>
            <input className={inputClass} name="source" placeholder="lm.photo@tjc.org, volunteer name, or Shared Drive folder" required />
          </label>
        </section>

        <section className="dam-inspector self-start p-4">
          <div className="mb-4">
            <h2 className="text-lg font-black">2. People and rights</h2>
            <p className="text-sm font-semibold text-tjc-muted">Anything uncertain stays blocked until reviewed.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className="flex items-center justify-between gap-2">People visible {requiredHint}</span>
              <select className={inputClass} name="peopleVisible" defaultValue="Unknown" required>
                <option>Unknown</option>
                <option>No</option>
                <option>Yes</option>
              </select>
            </label>
            <label className={labelClass}>
              <span className="flex items-center justify-between gap-2">Children/youth visible {requiredHint}</span>
              <select className={inputClass} name="minorsVisible" defaultValue="Unknown" required>
                <option>Unknown</option>
                <option>No</option>
                <option>Yes</option>
              </select>
            </label>
          </div>
          <label className={`${labelClass} mt-4`}>
            <span className="flex items-center justify-between gap-2">Usage rights {requiredHint}</span>
            <select className={inputClass} name="usageRights" defaultValue="Unknown - needs review" required>
              <option>Unknown - needs review</option>
              <option>TJC-owned / permission confirmed</option>
              <option>Internal ministry use only</option>
              <option>Do not publish externally</option>
            </select>
          </label>
          <label className={`${labelClass} mt-4`}>
            Suggested approval direction
            <select className={inputClass} name="approvalSuggestion" defaultValue="Reviewer decides">
              <option>Reviewer decides</option>
              <option>Likely church-wide use</option>
              <option>Likely internal ministry use only</option>
              <option>Archive only</option>
              <option>Do not publish externally</option>
            </select>
          </label>
          <label className={`${labelClass} mt-4`}>
            <span className="flex items-center justify-between gap-2">Consent/restrictions {requiredHint}</span>
            <textarea className="min-h-28 w-full min-w-0 dam-card p-3 font-medium text-tjc-ink placeholder:text-[#858f87]" name="notes" placeholder="Known permissions, event context, internal-only notes..." rows={4} required />
          </label>
        </section>

        <section className="dam-inspector min-w-0 self-start p-4">
          <div className="mb-4">
            <h2 className="text-lg font-black">3. Files and tags</h2>
            <p className="text-sm font-semibold text-tjc-muted">Submissions enter {uploadDefaultState.status}.</p>
          </div>
          <UploadFileDropzone
            inputRef={fileInputRef}
            selectedFiles={selectedFiles}
            onInputFiles={checkFiles}
            onDropFiles={addDroppedFiles}
            onRemove={removeFile}
            onClear={clearFiles}
          />
          <label className={`${labelClass} mt-4`}>
            Existing Google / ResourceSpace link
            <input className={inputClass} name="sourceLink" placeholder="https://drive.google.com/... or ResourceSpace ref" />
          </label>
          <div className="mt-4">
            <InputWithTags
              name="tags"
              label="Suggested tags"
              value={suggestedTags}
              onChange={setSuggestedTags}
              required
              placeholder="Bible, fellowship, welcome, youth..."
              suggestions={uploadTagSuggestions}
              helperText="Use existing visible-content or TJC terms. Reviewers approve final taxonomy before ResourceSpace updates."
            />
          </div>
          <label className={`${labelClass} mt-4`}>
            <span className="flex items-center justify-between gap-2">Intake notes {requiredHint}</span>
            <textarea className="min-h-24 w-full min-w-0 dam-card p-3 font-medium text-tjc-ink placeholder:text-[#858f87]" name="intakeNotes" placeholder="Anything the reviewer should know before approval..." rows={3} required />
          </label>
          {largeWarning ? <div className="sr-only" role="status">{largeWarning}</div> : null}
          <div className="mt-4 grid grid-cols-[auto_1fr] gap-3 rounded-2xl border border-[#c9d6ce] bg-[#f6faf7] p-3">
            <FolderInput size={18} strokeWidth={1.8} aria-hidden="true" className="text-tjc-evergreen" />
            <div>
              <strong className="block font-semibold">Large media intake</strong>
              <span className="mt-1 block text-sm leading-snug text-tjc-muted">{uploadDefaultState.largeMediaMessage}</span>
            </div>
          </div>
          <div className="mt-4 rounded-md border border-[#cbd8e4] bg-[#f2f7fb] p-3 text-sm leading-snug text-[#52677a]">
            AI tag suggestions may help later, but a person still reviews titles, tags, people visibility, and rights before publishing.
          </div>
        </section>

        <div className="xl:col-span-3">
          <UploadIntakePacket selectedFiles={selectedFiles} suggestedTags={suggestedTags} largeWarning={largeWarning} />
        </div>

        <button className="inline-flex min-h-11 w-full min-w-0 items-center justify-center gap-2 dam-button-primary px-5 text-base font-semibold transition active:translate-y-px xl:col-span-3" type="submit">
          <UploadCloud size={16} strokeWidth={1.8} aria-hidden="true" />
          Submit intake
        </button>
        {message ? <div className="rounded-xl border border-tjc-line bg-white p-4 text-sm font-semibold text-tjc-evergreen xl:col-span-3">{message}</div> : null}

        {receipt ? (
          <section className="grid gap-4 rounded-md border border-[#b9d9c6] bg-[#eef8f2] p-5 text-[#24583d] sm:grid-cols-[auto_1fr_auto] xl:col-span-3" aria-label="Upload receipt">
            <CheckCircle2 size={22} strokeWidth={1.8} aria-hidden="true" />
            <div>
              <h2 className="text-xl font-semibold">Intake received</h2>
              <p className="mt-1 text-sm font-semibold">This media is blocked until a reviewer approves reuse.</p>
              <dl className="mt-3 grid gap-3 sm:grid-cols-4">
                <div><dt className="text-xs font-semibold">Status</dt><dd>{receipt.defaultReviewState || uploadDefaultState.status}</dd></div>
                <div><dt className="text-xs font-semibold">Event</dt><dd>{receipt.eventName || "Not provided"}</dd></div>
                <div><dt className="text-xs font-semibold">Files</dt><dd>{receipt.fileCount ?? 0}</dd></div>
                <div><dt className="text-xs font-semibold">Source link</dt><dd>{receipt.sourceLink ? "Captured" : "Not provided"}</dd></div>
              </dl>
              <p className="mt-3 text-sm">Persistence mode: server-routed demo/export intake. ResourceSpace API write mapping must be configured for production writes.</p>
              {receipt.reviewWarnings?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {receipt.reviewWarnings.map((warning) => (
                    <span className="rounded-md border border-[#ead6a8] bg-[#fff8e8] px-2.5 py-1 text-xs font-semibold text-[#725216]" key={warning}>{warning}</span>
                  ))}
                </div>
              ) : null}
            </div>
            <Clock3 size={20} strokeWidth={1.8} aria-hidden="true" />
          </section>
        ) : null}
      </form>
    </div>
  );
}
